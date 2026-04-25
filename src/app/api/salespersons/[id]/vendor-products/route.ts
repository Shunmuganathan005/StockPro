import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import * as salespersonService from "@/services/salesperson.service";

export const GET = withPermission("collections.view", async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-3)!;

  try {
    const result = await salespersonService.getSalespersonVendorProducts(id, user.organizationId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});
