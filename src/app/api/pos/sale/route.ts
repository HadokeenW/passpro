import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";
import { processPosSale } from "@/server/services/payments";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const body = await req.json();
    const { items, method, memberId, receivedAmount } = body;

    const payment = await processPosSale({
      items,
      method,
      memberId: memberId || null,
      operatorId: user.id,
      receivedAmount,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
