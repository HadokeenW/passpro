import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";
import { normalizeUid } from "@/server/services/access-engine";
import { CardStatus } from "@prisma/client";

interface Params {
  params: Promise<{ uid: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { uid: rawParamUid } = await params;
    const decoded = decodeURIComponent(rawParamUid).trim();
    const uid = normalizeUid(decoded);

    let card = await prisma.card.findUnique({
      where: { uid },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            photoUrl: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!card && decoded) {
      card = await prisma.card.findFirst({
        where: {
          OR: [
            { uid: decoded },
            { uid: decoded.toUpperCase() },
            { uid: decoded.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() },
          ],
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              photoUrl: true,
              deletedAt: true,
            },
          },
        },
      });
    }

    if (!card) {
      return NextResponse.json({ error: { message: "Carte introuvable" } }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { uid: rawParamUid } = await params;
    // Handle URL-encoded colons
    const uid = normalizeUid(decodeURIComponent(rawParamUid));

    const existing = await prisma.card.findUnique({
      where: { uid },
      include: { member: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Carte introuvable", 404);
    }

    const body = await req.json();
    const { action, memberId } = body;

    let newStatus = existing.status;
    let newMemberId = existing.memberId;

    if (action === "BLOCK") {
      newStatus = CardStatus.BLOCKED;
    } else if (action === "UNBLOCK") {
      newStatus = existing.memberId ? CardStatus.ACTIVE : CardStatus.UNASSIGNED;
    } else if (action === "ASSIGN") {
      if (!memberId) {
        throw new ApiError("VALIDATION_ERROR", "Un identifiant adhérent est requis pour l'attribution", 400);
      }
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) throw new ApiError("NOT_FOUND", "Adhérent introuvable", 404);

      newMemberId = memberId;
      newStatus = CardStatus.ACTIVE;
    } else if (action === "UNASSIGN") {
      newMemberId = null;
      newStatus = CardStatus.UNASSIGNED;
    } else {
      throw new ApiError("VALIDATION_ERROR", `Action '${action}' non reconnue`, 400);
    }

    const updated = await prisma.card.update({
      where: { uid },
      data: {
        status: newStatus,
        memberId: newMemberId,
      },
      include: { member: true },
    });

    await withAudit({
      userId: user.id,
      action: `card.${action.toLowerCase()}`,
      entityType: "Card",
      entityId: uid,
      before: { status: existing.status, memberId: existing.memberId },
      after: { status: updated.status, memberId: updated.memberId },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { uid: rawParamUid } = await params;
    const uid = normalizeUid(decodeURIComponent(rawParamUid));

    const existing = await prisma.card.findUnique({ where: { uid } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Carte introuvable", 404);
    }

    await prisma.card.delete({ where: { uid } });

    await withAudit({
      userId: user.id,
      action: "card.delete",
      entityType: "Card",
      entityId: uid,
      before: { uid, memberId: existing.memberId, status: existing.status },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
