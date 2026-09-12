import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";
import { AccessDecision } from "@prisma/client";
import { normalizeUid } from "@/server/services/access-engine";

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
      const normQ = q.length >= 4 ? normalizeUid(q) : "";
      const words = q.split(/\s+/).filter(Boolean);
      const memberOrList: any[] = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
      ];
      if (words.length > 1) {
        memberOrList.push(
          {
            AND: [
              { firstName: { contains: words[0] } },
              { lastName: { contains: words.slice(1).join(" ") } },
            ],
          },
          {
            AND: [
              { lastName: { contains: words[0] } },
              { firstName: { contains: words.slice(1).join(" ") } },
            ],
          }
        );
      }

      const orList: any[] = [
        { cardUid: { contains: q.toUpperCase() } },
        { kioskName: { contains: q } },
        {
          member: {
            OR: memberOrList,
          },
        },
      ];
      const strippedQ = q.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (normQ && normQ !== q.toUpperCase()) {
        orList.push({ cardUid: { contains: normQ } });
      }
      if (strippedQ && strippedQ !== q.toUpperCase() && strippedQ !== normQ) {
        orList.push({ cardUid: { contains: strippedQ } });
      }

      where.OR = orList;
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
