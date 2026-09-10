import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) throw new ApiError("NOT_FOUND", "Abonnement introuvable", 404);

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: "SUSPENDED",
        suspendedAt: new Date(),
      },
    });

    await withAudit({
      userId: user.id,
      action: "subscription.suspend",
      entityType: "Subscription",
      entityId: id,
      before: { status: existing.status },
      after: { status: "SUSPENDED", suspendedAt: updated.suspendedAt },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
