import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import * as vendorService from "@/services/vendor.service";

export const GET = withPermission("collections.view", async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-3)!;

  try {
    const vendor = await vendorService.getVendor(id, user.organizationId);
    return NextResponse.json({ success: true, data: vendor.products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});

const setProductsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      rate: z.number().positive(),
    })
  ),
});

export const PUT = withPermission("collections.manage", async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-3)!;
  const body = await request.json();
  const { items } = setProductsSchema.parse(body);

  try {
    const result = await vendorService.setVendorProducts(id, items, user.organizationId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});
