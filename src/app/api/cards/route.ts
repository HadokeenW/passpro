import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";
import { normalizeUid } from "@/server/services/access-engine";
import { CardStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const q = searchParams.get("q")?.trim().toLowerCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    // Summary counts
    const [activeCount, blockedCount, unassignedCount, totalCards] = await Promise.all([
      prisma.card.count({ where: { status: CardStatus.ACTIVE } }),
      prisma.card.count({ where: { status: CardStatus.BLOCKED } }),
      prisma.card.count({ where: { status: CardStatus.UNASSIGNED } }),
      prisma.card.count(),
    ]);

    const where: any = {};

    if (status !== "all") {
      where.status = status.toUpperCase() as CardStatus;
    }

    if (q) {
      where.OR = [
        { uid: { contains: q.toUpperCase() } },
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

    const total = await prisma.card.count({ where });

    const cards = await prisma.card.findMany({
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
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      items: cards,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      counts: {
        active: activeCount,
        blocked: blockedCount,
        unassigned: unassignedCount,
        total: totalCards,
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
    const { uid: rawUid, memberId } = body;

    if (!rawUid) {
      throw new ApiError("VALIDATION_ERROR", "L'identifiant UID est requis", 400);
    }

    const uid = normalizeUid(rawUid);

    const existing = await prisma.card.findUnique({ where: { uid } });
    if (existing) {
      throw new ApiError("CARD_ALREADY_EXISTS", `La carte avec l'UID ${uid} existe déjà dans le parc`, 409);
    }

    let status: CardStatus = CardStatus.UNASSIGNED;
    if (memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) throw new ApiError("NOT_FOUND", "Adhérent introuvable", 404);
      status = CardStatus.ACTIVE;
    }

    const card = await prisma.card.create({
      data: {
        uid,
        memberId: memberId || null,
        status,
      },
      include: { member: true },
    });

    await withAudit({
      userId: user.id,
      action: "card.create",
      entityType: "Card",
      entityId: uid,
      after: { uid, memberId, status },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
