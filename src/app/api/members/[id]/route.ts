import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";
import { getSubscriptionDetails } from "@/server/services/subscriptions";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        cards: true,
        subscriptions: {
          orderBy: { endDate: "desc" },
          include: { plan: true },
        },
        accessLogs: {
          take: 8,
          orderBy: { createdAt: "desc" },
        },
        payments: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { operator: true },
        },
      },
    });

    if (!member || member.deletedAt) {
      throw new ApiError("NOT_FOUND", "Adhérent introuvable", 404);
    }

    const now = new Date();
    const currentSub = member.subscriptions[0] || null;
    const subDetails = currentSub ? getSubscriptionDetails(currentSub, now) : null;

    // Aggregated stats
    const totalPassages = await prisma.accessLog.count({
      where: { memberId: id },
    });

    const totalSpent = member.payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        email: member.email,
        photoUrl: member.photoUrl,
        notes: member.notes,
        createdAt: member.createdAt,
      },
      cards: member.cards,
      currentSubscription: currentSub
        ? {
            id: currentSub.id,
            planId: currentSub.planId,
            planName: currentSub.plan.name,
            planPrice: currentSub.plan.price,
            durationDays: currentSub.plan.durationDays,
            startDate: currentSub.startDate,
            endDate: currentSub.endDate,
            storedStatus: currentSub.status,
            status: subDetails?.status,
            daysRemaining: subDetails?.daysRemaining,
            suspendedAt: currentSub.suspendedAt,
          }
        : null,
      recentAccessLogs: member.accessLogs,
      recentPayments: member.payments,
      stats: {
        totalPassages,
        totalSpent,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new ApiError("NOT_FOUND", "Adhérent introuvable", 404);
    }

    const { firstName, lastName, phone, email, notes, photoUrl } = body;

    const updated = await prisma.member.update({
      where: { id },
      data: {
        firstName: firstName !== undefined ? firstName.trim() : undefined,
        lastName: lastName !== undefined ? lastName.trim() : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined,
        photoUrl: photoUrl !== undefined ? photoUrl : undefined,
      },
    });

    await withAudit({
      userId: user.id,
      action: "member.update",
      entityType: "Member",
      entityId: id,
      before: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        phone: existing.phone,
        email: existing.email,
      },
      after: {
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        email: updated.email,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new ApiError("NOT_FOUND", "Adhérent introuvable", 404);
    }

    // Soft delete
    const updated = await prisma.member.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await withAudit({
      userId: user.id,
      action: "member.delete",
      entityType: "Member",
      entityId: id,
      before: { firstName: existing.firstName, lastName: existing.lastName },
      after: { deletedAt: updated.deletedAt },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
