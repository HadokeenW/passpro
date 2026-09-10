import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";

export async function POST() {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);

    await prisma.alert.updateMany({
      where: { read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
