import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: { payments: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireRole(["ADMIN"]);
    const body = await req.json();
    const { username, name, password, role } = body;

    if (!username || !name || !password || !role) {
      throw new ApiError("VALIDATION_ERROR", "Tous les champs sont requis", 400);
    }

    if (password.length < 8) {
      throw new ApiError("VALIDATION_ERROR", "Le mot de passe doit comporter au moins 8 caractères", 400);
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing) {
      throw new ApiError("CONFLICT", "Cet identifiant est déjà utilisé", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        name: name.trim(),
        passwordHash,
        role: role as Role,
        active: true,
      },
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
      action: "user.create",
      entityType: "User",
      entityId: user.id,
      after: { username: user.username, role: user.role, name: user.name },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
