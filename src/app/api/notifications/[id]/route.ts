import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing) throw new ApiError("NOT_FOUND", "Notification introuvable", 404);

    await prisma.alert.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
