import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER"]);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Formule introuvable", 404);
    }

    const { name, price, durationDays, description, active, sortOrder, planType, sessionCount, startTime, endTime } = body;

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        price: price !== undefined ? parseInt(price, 10) : undefined,
        durationDays: durationDays !== undefined ? parseInt(durationDays, 10) : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : undefined,
        planType: planType !== undefined ? planType : undefined,
        sessionCount: sessionCount !== undefined ? (sessionCount ? parseInt(sessionCount, 10) : null) : undefined,
        startTime: startTime !== undefined ? (startTime ? startTime.trim() : null) : undefined,
        endTime: endTime !== undefined ? (endTime ? endTime.trim() : null) : undefined,
      },
    });

    await withAudit({
      userId: user.id,
      action: "plan.update",
      entityType: "Plan",
      entityId: id,
      before: { name: existing.name, price: existing.price, active: existing.active },
      after: { name: updated.name, price: updated.price, active: updated.active, planType: updated.planType },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER"]);
    const { id } = await params;

    const existing = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Formule introuvable", 404);
    }

    if (existing._count.subscriptions > 0) {
      throw new ApiError(
        "PLAN_IN_USE",
        "Cette formule est liée à des abonnements existants. Vous devez la désactiver au lieu de la supprimer.",
        409
      );
    }

    await prisma.plan.delete({ where: { id } });

    await withAudit({
      userId: user.id,
      action: "plan.delete",
      entityType: "Plan",
      entityId: id,
      before: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
