import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";
import { deriveStatus } from "@/server/services/subscriptions";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase() || "";
    const filter = searchParams.get("filter") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const where: any = {
      deletedAt: null,
    };

    if (q) {
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { cards: { some: { uid: { contains: q.toUpperCase() } } } },
      ];
    }

    // Fetch members matching query
    const totalMatching = await prisma.member.count({ where });

    const members = await prisma.member.findMany({
      where,
      include: {
        subscriptions: {
          orderBy: { endDate: "desc" },
          take: 1,
          include: { plan: true },
        },
        cards: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    // Map and calculate derived status for each
    const enriched = members.map((m) => {
      const latestSub = m.subscriptions[0] || null;
      const status = latestSub ? deriveStatus(latestSub, now) : "NO_SUBSCRIPTION";
      const activeCard = m.cards.find((c) => c.status === "ACTIVE");
      const blockedCard = m.cards.find((c) => c.status === "BLOCKED");

      return {
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.phone,
        email: m.email,
        notes: m.notes,
        createdAt: m.createdAt,
        subscription: latestSub
          ? {
              id: latestSub.id,
              planName: latestSub.plan.name,
              status,
              startDate: latestSub.startDate,
              endDate: latestSub.endDate,
            }
          : null,
        card: activeCard
          ? { uid: activeCard.uid, status: activeCard.status }
          : blockedCard
          ? { uid: blockedCard.uid, status: blockedCard.status }
          : null,
      };
    });

    // Apply status filter if specified
    let filtered = enriched;
    if (filter === "active") {
      filtered = enriched.filter(
        (m) => m.subscription?.status === "ACTIVE" || m.subscription?.status === "EXPIRING_SOON"
      );
    } else if (filter === "inactive") {
      filtered = enriched.filter(
        (m) =>
          !m.subscription ||
          m.subscription.status === "EXPIRED" ||
          m.subscription.status === "CANCELLED" ||
          m.subscription.status === "NO_SUBSCRIPTION"
      );
    } else if (filter === "blocked") {
      filtered = enriched.filter((m) => m.card?.status === "BLOCKED");
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
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const body = await req.json();
    const { firstName, lastName, phone, email, notes } = body;

    if (!firstName || !lastName) {
      throw new ApiError("VALIDATION_ERROR", "Le prénom et le nom sont requis", 400);
    }

    const member = await prisma.member.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    await withAudit({
      userId: user.id,
      action: "member.create",
      entityType: "Member",
      entityId: member.id,
      after: {
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
