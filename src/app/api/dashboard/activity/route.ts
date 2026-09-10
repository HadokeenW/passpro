import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getRecentActivity } from "@/server/services/dashboard";
import { errorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const activity = await getRecentActivity(limit);
    return NextResponse.json(activity);
  } catch (err) {
    return errorResponse(err);
  }
}
