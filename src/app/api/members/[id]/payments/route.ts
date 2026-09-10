import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const payments = await prisma.payment.findMany({
      where: { memberId: id },
      orderBy: { createdAt: "desc" },
      include: { operator: true, subscription: true },
    });

    return NextResponse.json(payments);
  } catch (err) {
    return errorResponse(err);
  }
}
