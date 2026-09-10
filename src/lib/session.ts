import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { ApiError } from "./errors";

export interface SessionData {
  user?: {
    id: string;
    username: string;
    name: string;
    role: Role;
  };
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "passpro-super-secret-key-at-least-32-chars-long-2026",
  cookieName: "passpro_session",
  cookieOptions: {
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 12 * 60 * 60, // 12h default
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Checks that the current request has an authenticated user with an authorized role.
 * Throws ApiError 401 or 403 if unauthorized.
 */
export async function requireRole(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session.user) {
    throw new ApiError("UNAUTHORIZED", "Authentification requise", 401);
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.user.role)) {
      throw new ApiError(
        "FORBIDDEN",
        "Vous n'avez pas les autorisations nécessaires pour cette action",
        403
      );
    }
  }

  return session.user;
}
