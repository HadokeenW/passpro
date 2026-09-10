import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, getSession } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      throw new ApiError("VALIDATION_ERROR", "Nom d'utilisateur et mot de passe requis", 400);
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (!user || !user.active) {
      throw new ApiError("UNAUTHORIZED", "Identifiants invalides ou compte désactivé", 401);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new ApiError("UNAUTHORIZED", "Identifiants invalides", 401);
    }

    const session = await getSession();
    session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    // 30 days for ACCESS_GUARD, otherwise 12 hours
    if (user.role === "ACCESS_GUARD") {
      // @ts-ignore
      session.cookieOptions = {
        maxAge: 30 * 24 * 60 * 60,
      };
    }

    await session.save();

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
