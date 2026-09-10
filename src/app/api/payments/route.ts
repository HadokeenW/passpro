import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { processPayment } from "@/server/services/payments";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "today";
    const memberId = searchParams.get("memberId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const now = new Date();
    const where: Prisma.PaymentWhereInput = {};

    if (memberId) {
      where.memberId = memberId;
    }

    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      where.createdAt = { gte: startOfDay };
    } else if (period === "week") {
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: startOfWeek };
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      where.createdAt = { gte: startOfMonth };
    }

    // Execute summary calculation and paginated payments concurrently
    const [allMatching, payments] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          amount: true,
          method: true,
          operator: { select: { name: true } },
        },
      }),
      prisma.payment.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          subscription: {
            select: {
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const count = allMatching.length;
    let totalAmount = 0;

    const byMethod: Record<string, { total: number; count: number }> = {
      CASH: { total: 0, count: 0 },
      CARD: { total: 0, count: 0 },
      OTHER: { total: 0, count: 0 },
    };
    const byOperator: Record<string, { total: number; count: number }> = {};

    for (const p of allMatching) {
      totalAmount += p.amount;
      if (!byMethod[p.method]) byMethod[p.method] = { total: 0, count: 0 };
      byMethod[p.method].total += p.amount;
      byMethod[p.method].count += 1;

      const opName = p.operator?.name || "Inconnu";
      if (!byOperator[opName]) byOperator[opName] = { total: 0, count: 0 };
      byOperator[opName].total += p.amount;
      byOperator[opName].count += 1;
    }

    return NextResponse.json({
      items: payments,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
      summary: {
        totalAmount,
        count,
        byMethod,
        byOperator,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const body = await req.json();
    const { memberId, planId, subscriptionId, mode, method, customAmount } = body;

    if (!memberId || !planId) {
      throw new ApiError("VALIDATION_ERROR", "Adhérent et formule requis", 400);
    }

    const payment = await processPayment({
      memberId,
      planId,
      subscriptionId,
      mode,
      method,
      operatorId: user.id,
      customAmount,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
