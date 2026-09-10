import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getDashboardMetrics } from "@/server/services/dashboard";
import { errorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    return errorResponse(err);
  }
}
