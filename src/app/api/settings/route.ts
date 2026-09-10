import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";

export async function GET() {
  try {
    let setting = await prisma.setting.findFirst();
    if (!setting) {
      setting = await prisma.setting.create({
        data: { id: 1 },
      });
    }
    return NextResponse.json(setting);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER"]);
    const body = await req.json();

    const existing = await prisma.setting.findFirst();
    const updated = await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        gymName: body.gymName !== undefined ? body.gymName.trim() : undefined,
        gymPhone: body.gymPhone !== undefined ? body.gymPhone.trim() : undefined,
        gymEmail: body.gymEmail !== undefined ? body.gymEmail.trim() : undefined,
        gymAddress: body.gymAddress !== undefined ? body.gymAddress.trim() : undefined,
        currency: body.currency !== undefined ? body.currency.trim() : undefined,
        timezone: body.timezone !== undefined ? body.timezone.trim() : undefined,
        dateFormat: body.dateFormat !== undefined ? body.dateFormat.trim() : undefined,
        kioskName: body.kioskName !== undefined ? body.kioskName.trim() : undefined,
        simulationMode: body.simulationMode !== undefined ? Boolean(body.simulationMode) : undefined,
        receiptFooter: body.receiptFooter !== undefined ? body.receiptFooter.trim() : undefined,
      },
      create: {
        id: 1,
        gymName: body.gymName || "PASSPro",
        gymPhone: body.gymPhone || "",
        gymEmail: body.gymEmail || "",
        gymAddress: body.gymAddress || "",
        currency: body.currency || "DA",
        timezone: body.timezone || "Africa/Algiers",
        dateFormat: body.dateFormat || "dd/MM/yyyy",
        kioskName: body.kioskName || "BORNE-01",
        simulationMode: body.simulationMode !== undefined ? Boolean(body.simulationMode) : true,
        receiptFooter: body.receiptFooter || "Merci de votre fidélité",
      },
    });

    await withAudit({
      userId: user.id,
      action: "settings.update",
      entityType: "Setting",
      entityId: "1",
      before: existing ? (existing as any) : null,
      after: updated as any,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
