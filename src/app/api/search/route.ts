import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";
import { normalizeUid } from "@/server/services/access-engine";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 1) {
      return NextResponse.json({ members: [], cards: [], plans: [] });
    }

    const normQ = q.length >= 4 ? normalizeUid(q) : "";
    const words = q.split(/\s+/).filter(Boolean);
    const memberOr: any[] = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
      { cards: { some: { uid: { contains: q.toUpperCase() } } } },
    ];
    if (words.length > 1) {
      memberOr.push(
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
    if (normQ && normQ !== q.toUpperCase()) {
      memberOr.push({ cards: { some: { uid: { contains: normQ } } } });
    }

    const cardOr: any[] = [{ uid: { contains: q.toUpperCase() } }];
    if (normQ && normQ !== q.toUpperCase()) {
      cardOr.push({ uid: { contains: normQ } });
    }

    const [members, cards, plans] = await Promise.all([
      prisma.member.findMany({
        where: {
          deletedAt: null,
          OR: memberOr,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          cards: {
            where: { status: "ACTIVE" },
            select: { uid: true },
            take: 1,
          },
          subscriptions: {
            orderBy: { endDate: "desc" },
            take: 1,
            select: { status: true, endDate: true, plan: { select: { name: true } } },
          },
        },
        take: 6,
      }),
      prisma.card.findMany({
        where: {
          OR: cardOr,
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 5,
      }),
      prisma.plan.findMany({
        where: {
          active: true,
          name: { contains: q },
        },
        select: {
          id: true,
          name: true,
          price: true,
          durationDays: true,
        },
        take: 4,
      }),
    ]);

    return NextResponse.json({ members, cards, plans });
  } catch (err) {
    return errorResponse(err);
  }
}
