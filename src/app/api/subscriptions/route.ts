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

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (statusFilter === "active") {
      where.status = "ACTIVE";
      where.endDate = { gte: now };
    } else if (statusFilter === "expiring") {
      where.status = "ACTIVE";
      where.endDate = { gte: now, lte: in7Days };
    } else if (statusFilter === "expired") {
      where.OR = [
        { status: "EXPIRED" },
        { endDate: { lt: now } },
      ];
    } else if (statusFilter === "suspended") {
      where.status = "SUSPENDED";
    } else if (statusFilter === "debt") {
      where.balanceDue = { gt: 0 };
    }

    const [total, subscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        include: {
          member: true,
          plan: true,
        },
        orderBy: { endDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const paginated = subscriptions.map((sub) => {
      const details = getSubscriptionDetails(sub, now);
      const balanceDue = sub.balanceDue || 0;
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
          planType: sub.planType,
          price: sub.price || sub.plan.price,
          durationDays: sub.plan.durationDays,
        },
        planType: sub.planType,
        price: sub.price || sub.plan.price,
        paidAmount: sub.paidAmount,
        balanceDue,
        hasDebt: balanceDue > 0,
        remainingSessions: sub.remainingSessions,
        totalSessions: sub.totalSessions,
        startTime: sub.startTime,
        endTime: sub.endTime,
        startDate: sub.startDate,
        endDate: sub.endDate,
        storedStatus: sub.status,
        status: details.status,
        daysRemaining: details.daysRemaining,
        suspendedAt: sub.suspendedAt,
        createdAt: sub.createdAt,
      };
    });

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
