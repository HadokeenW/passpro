import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";
import { Role } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const adminUser = await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError("NOT_FOUND", "Utilisateur introuvable", 404);

    const { name, role, active, password } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (role !== undefined) dataToUpdate.role = role as Role;
    if (active !== undefined) dataToUpdate.active = Boolean(active);
    if (password) {
      if (password.length < 8) {
        throw new ApiError("VALIDATION_ERROR", "Le mot de passe doit comporter au moins 8 caractères", 400);
      }
      dataToUpdate.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    await withAudit({
      userId: adminUser.id,
      action: "user.update",
      entityType: "User",
      entityId: id,
      before: { name: existing.name, role: existing.role, active: existing.active },
      after: { name: updated.name, role: updated.role, active: updated.active },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const adminUser = await requireRole(["ADMIN"]);
    const { id } = await params;

    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { payments: true } },
      },
    });

    if (!existing) throw new ApiError("NOT_FOUND", "Utilisateur introuvable", 404);

    if (existing.id === adminUser.id) {
      throw new ApiError("BAD_REQUEST", "Vous ne pouvez pas supprimer votre propre compte", 400);
    }

    if (existing._count.payments > 0) {
      throw new ApiError(
        "CONFLICT",
        "Cet opérateur a déjà enregistré des paiements en caisse. Désactivez son compte plutôt que de le supprimer.",
        409
      );
    }

    await prisma.user.delete({ where: { id } });

    await withAudit({
      userId: adminUser.id,
      action: "user.delete",
      entityType: "User",
      entityId: id,
      before: { username: existing.username, name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
