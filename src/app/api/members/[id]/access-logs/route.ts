import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST", "ACCESS_GUARD"]);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await prisma.accessLog.findMany({
      where: { memberId: id },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (err) {
    return errorResponse(err);
  }
}
