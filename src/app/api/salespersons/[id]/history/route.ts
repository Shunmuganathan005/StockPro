import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import * as salespersonService from "@/services/salesperson.service";

export const GET = withPermission("collections.view", async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").at(-3)!;

  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");

  if (!startDateParam || !endDateParam) {
    return NextResponse.json(
      { success: false, error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);

  try {
    const result = await salespersonService.getSalespersonHistory(id, user.organizationId, {
      startDate,
      endDate,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});
