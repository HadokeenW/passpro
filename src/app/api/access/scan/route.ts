import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { evaluateScan } from "@/server/services/access-engine";
import { AccessSource } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Accessible by all authenticated roles (ADMIN, MANAGER, RECEPTIONIST, ACCESS_GUARD)
    // or by internal kiosk caller
    const isInternalKiosk = req.headers.get("x-internal-kiosk") === "passpro-internal";
    if (!isInternalKiosk) {
      await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST", "ACCESS_GUARD"]);
    }
    const body = await req.json();
    const { uid, source = "SIMULATION", kioskName } = body;

    if (!uid) {
      throw new ApiError("VALIDATION_ERROR", "Le numéro UID de la carte est requis", 400);
    }

    const result = await evaluateScan(
      uid,
      source === "HARDWARE" ? AccessSource.HARDWARE : AccessSource.SIMULATION,
      kioskName
    );

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
