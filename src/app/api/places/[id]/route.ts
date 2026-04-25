import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import * as placeService from "@/services/place.service";

export const GET = withPermission("collections.view", async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-1)!;

  try {
    const place = await placeService.getPlace(id, user.organizationId);
    return NextResponse.json({ success: true, data: place });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = withPermission("collections.manage", async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-1)!;
  const body = await request.json();
  const data = updateSchema.parse(body);

  try {
    const place = await placeService.updatePlace(id, data, user.organizationId);
    return NextResponse.json({ success: true, data: place });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});

export const DELETE = withPermission("collections.manage", async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-1)!;

  try {
    await placeService.deletePlace(id, user.organizationId);
    return NextResponse.json({ success: true, message: "Place deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    throw error;
  }
});
