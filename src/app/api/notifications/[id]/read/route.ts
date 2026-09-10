import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new ApiError("NOT_FOUND", "Alerte introuvable", 404);

    const updated = await prisma.alert.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
