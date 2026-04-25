import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import * as salespersonService from "@/services/salesperson.service";

export const GET = withPermission("collections.view", async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-3)!;

  try {
    const salesperson = await salespersonService.getSalesperson(id, user.organizationId);
    return NextResponse.json({ success: true, data: salesperson.places });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});

const setPlacesSchema = z.object({
  placeIds: z.array(z.string()),
});

export const PUT = withPermission("collections.manage", async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-3)!;
  const body = await request.json();
  const { placeIds } = setPlacesSchema.parse(body);

  try {
    const result = await salespersonService.setSalespersonPlaces(id, placeIds, user.organizationId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});
