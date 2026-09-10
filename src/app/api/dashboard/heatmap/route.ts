import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getHeatmapData } from "@/server/services/dashboard";
import { errorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "28", 10);
    const data = await getHeatmapData(days);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
