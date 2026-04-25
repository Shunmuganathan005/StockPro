import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import * as vendorService from "@/services/vendor.service";

export const GET = withPermission("collections.view", async (request, user) => {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId") ?? undefined;

  const result = await vendorService.listVendors({ placeId }, user.organizationId);
  return NextResponse.json({ success: true, data: result });
});

const createSchema = z.object({
  name: z.string().min(1),
  placeId: z.string().min(1),
});

export const POST = withPermission("collections.manage", async (request, user) => {
  const body = await request.json();
  const data = createSchema.parse(body);

  const vendor = await vendorService.createVendor(
    { name: data.name, placeId: data.placeId },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: vendor }, { status: 201 });
});
