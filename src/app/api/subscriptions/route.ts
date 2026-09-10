import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";
import { getSubscriptionDetails } from "@/server/services/subscriptions";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "all";
    const memberId = searchParams.get("memberId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const where: any = {
      member: { deletedAt: null },
    };

    if (memberId) {
      where.memberId = memberId;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        member: true,
        plan: true,
      },
      orderBy: { endDate: "desc" },
    });

    const now = new Date();

    const mapped = subscriptions.map((sub) => {
      const details = getSubscriptionDetails(sub, now);
      return {
        id: sub.id,
        memberId: sub.memberId,
        member: {
          id: sub.member.id,
          firstName: sub.member.firstName,
          lastName: sub.member.lastName,
          phone: sub.member.phone,
        },
        planId: sub.planId,
        plan: {
          id: sub.plan.id,
          name: sub.plan.name,
          price: sub.plan.price,
          durationDays: sub.plan.durationDays,
        },
        startDate: sub.startDate,
        endDate: sub.endDate,
        storedStatus: sub.status,
        status: details.status,
        daysRemaining: details.daysRemaining,
        suspendedAt: sub.suspendedAt,
        createdAt: sub.createdAt,
      };
    });

    let filtered = mapped;
    if (statusFilter === "active") {
      filtered = mapped.filter((s) => s.status === "ACTIVE");
    } else if (statusFilter === "expiring") {
      filtered = mapped.filter((s) => s.status === "EXPIRING_SOON");
    } else if (statusFilter === "expired") {
      filtered = mapped.filter((s) => s.status === "EXPIRED");
    } else if (statusFilter === "suspended") {
      filtered = mapped.filter((s) => s.status === "SUSPENDED");
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      items: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER"]);
    const body = await req.json();
    const { memberId, planId, startDate, endDate } = body;

    if (!memberId || !planId) {
      throw new ApiError("VALIDATION_ERROR", "Adhérent et formule requis", 400);
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new ApiError("NOT_FOUND", "Formule introuvable", 404);

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        memberId,
        planId,
        startDate: start,
        endDate: end,
        status: "ACTIVE",
      },
      include: { plan: true, member: true },
    });

    await withAudit({
      userId: user.id,
      action: "subscription.create_admin",
      entityType: "Subscription",
      entityId: subscription.id,
      after: { memberId, planName: plan.name, startDate: start, endDate: end },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
