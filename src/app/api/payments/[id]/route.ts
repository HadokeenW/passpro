import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";
import { getReceiptDetails } from "@/server/services/payments";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const details = await getReceiptDetails(id);
    return NextResponse.json(details);
  } catch (err) {
    return errorResponse(err);
  }
}
