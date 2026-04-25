import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function listCollections(
  params: {
    date?: Date;
    salespersonId?: string;
    page?: number;
    pageSize?: number;
  },
  orgId: string
) {
  const { date, salespersonId, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.CollectionWhereInput = { organizationId: orgId };

  if (date) {
    const dateOnly = new Date(date.toISOString().split("T")[0]);
    where.date = { equals: dateOnly };
  }

  if (salespersonId) {
    where.salespersonId = salespersonId;
  }

  const [items, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      include: {
        salesperson: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.collection.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCollection(id: string, orgId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      salesperson: true,
      items: {
        include: {
          vendor: { include: { place: true } },
          product: true,
        },
      },
    },
  });

  if (!collection || collection.organizationId !== orgId) {
    throw new Error("Collection not found");
  }

  return collection;
}

export async function createCollection(
  data: {
    date: Date;
    salespersonId: string;
    items: {
      vendorId: string;
      productId: string;
      quantity: number;
      rate: number;
    }[];
  },
  orgId: string
) {
  return prisma.$transaction(async (tx) => {
    // Verify salesperson
    const salesperson = await tx.salesperson.findUnique({
      where: { id: data.salespersonId },
    });
    if (!salesperson || salesperson.organizationId !== orgId) {
      throw new Error("Salesperson not found");
    }

    // Check for duplicate (date, salespersonId, orgId)
    const dateOnly = new Date(data.date.toISOString().split("T")[0]);
    const duplicate = await tx.collection.findUnique({
      where: {
        date_salespersonId_organizationId: {
          date: dateOnly,
          salespersonId: data.salespersonId,
          organizationId: orgId,
        },
      },
    });
    if (duplicate) {
      throw new Error(
        "A collection entry already exists for this salesperson on this date"
      );
    }

    // Validate items and compute totals
    const itemsData: Prisma.CollectionItemCreateManyCollectionInput[] = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of data.items) {
      const vendor = await tx.vendor.findUnique({ where: { id: item.vendorId } });
      if (!vendor || vendor.organizationId !== orgId) {
        throw new Error(`Vendor not found: ${item.vendorId}`);
      }

      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.organizationId !== orgId) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const amount = Math.round(item.quantity * item.rate * 100) / 100;
      totalQuantity += item.quantity;
      totalAmount += amount;

      itemsData.push({
        vendorId: item.vendorId,
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate,
        amount,
      });
    }

    totalQuantity = Math.round(totalQuantity * 100) / 100;
    totalAmount = Math.round(totalAmount * 100) / 100;

    return tx.collection.create({
      data: {
        date: dateOnly,
        salespersonId: data.salespersonId,
        totalQuantity,
        totalAmount,
        organizationId: orgId,
        items: { createMany: { data: itemsData } },
      },
      include: {
        salesperson: true,
        items: {
          include: {
            vendor: { include: { place: true } },
            product: true,
          },
        },
      },
    });
  });
}

export async function updateCollection(
  id: string,
  data: {
    items: {
      vendorId: string;
      productId: string;
      quantity: number;
      rate: number;
    }[];
  },
  orgId: string
) {
  return prisma.$transaction(async (tx) => {
    const collection = await tx.collection.findUnique({ where: { id } });
    if (!collection || collection.organizationId !== orgId) {
      throw new Error("Collection not found");
    }

    // Delete all existing items (cascade would handle it but we do it explicitly)
    await tx.collectionItem.deleteMany({ where: { collectionId: id } });

    // Validate and recompute
    const itemsData: Prisma.CollectionItemCreateManyCollectionInput[] = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of data.items) {
      const vendor = await tx.vendor.findUnique({ where: { id: item.vendorId } });
      if (!vendor || vendor.organizationId !== orgId) {
        throw new Error(`Vendor not found: ${item.vendorId}`);
      }

      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.organizationId !== orgId) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const amount = Math.round(item.quantity * item.rate * 100) / 100;
      totalQuantity += item.quantity;
      totalAmount += amount;

      itemsData.push({
        vendorId: item.vendorId,
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate,
        amount,
      });
    }

    totalQuantity = Math.round(totalQuantity * 100) / 100;
    totalAmount = Math.round(totalAmount * 100) / 100;

    await tx.collectionItem.createMany({
      data: itemsData.map((item) => ({ ...item, collectionId: id })),
    });

    return tx.collection.update({
      where: { id },
      data: { totalQuantity, totalAmount },
      include: {
        salesperson: true,
        items: {
          include: {
            vendor: { include: { place: true } },
            product: true,
          },
        },
      },
    });
  });
}

export async function deleteCollection(id: string, orgId: string) {
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection || collection.organizationId !== orgId) {
    throw new Error("Collection not found");
  }

  return prisma.collection.delete({ where: { id } });
}

export async function getSummary(date: Date, orgId: string) {
  return prisma.collection.findMany({
    where: { date: { equals: date }, organizationId: orgId },
    include: {
      salesperson: true,
      items: {
        include: {
          vendor: { include: { place: true } },
          product: true,
        },
      },
    },
  });
}

export async function getExportData(
  params: {
    startDate: Date;
    endDate: Date;
    salespersonId?: string;
    vendorId?: string;
  },
  orgId: string
) {
  return prisma.collectionItem.findMany({
    where: {
      collection: {
        organizationId: orgId,
        date: { gte: params.startDate, lte: params.endDate },
        ...(params.salespersonId
          ? { salespersonId: params.salespersonId }
          : {}),
      },
      ...(params.vendorId ? { vendorId: params.vendorId } : {}),
    },
    include: {
      collection: { include: { salesperson: true } },
      vendor: { include: { place: true } },
      product: true,
    },
    orderBy: [{ collection: { date: "asc" } }, { vendor: { name: "asc" } }],
  });
}
