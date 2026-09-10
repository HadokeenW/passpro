import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";
import { reprintReceipt } from "@/server/services/payments";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const result = await reprintReceipt(id, user.id);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
