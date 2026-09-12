import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";
import { AccessDecision } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST", "ACCESS_GUARD"]);
    const { searchParams } = new URL(req.url);
    const decision = searchParams.get("decision") || "all";
    const q = searchParams.get("q")?.trim() || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)));

    const where: any = {};

    if (decision !== "all") {
      where.decision = decision.toUpperCase() as AccessDecision;
    }

    if (q) {
      where.OR = [
        { cardUid: { contains: q.toUpperCase() } },
        { kioskName: { contains: q } },
        {
          member: {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { phone: { contains: q } },
            ],
          },
        },
      ];
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [total, logs] = await Promise.all([
      prisma.accessLog.count({ where }),
      prisma.accessLog.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      items: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
