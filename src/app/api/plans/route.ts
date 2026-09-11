import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const plans = await prisma.plan.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    return NextResponse.json(plans);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER"]);
    const body = await req.json();
    const { name, price, durationDays, description, sortOrder, planType, sessionCount, startTime, endTime } = body;

    if (!name || price === undefined || !durationDays) {
      throw new ApiError("VALIDATION_ERROR", "Le nom, le prix et la durée sont requis", 400);
    }

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        price: parseInt(price, 10),
        durationDays: parseInt(durationDays, 10),
        description: description ? description.trim() : null,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
        planType: planType || "TEMPORAL",
        sessionCount: sessionCount ? parseInt(sessionCount, 10) : null,
        startTime: startTime ? startTime.trim() : null,
        endTime: endTime ? endTime.trim() : null,
        active: true,
      },
    });

    await withAudit({
      userId: user.id,
      action: "plan.create",
      entityType: "Plan",
      entityId: plan.id,
      after: {
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        planType: plan.planType,
        sessionCount: plan.sessionCount,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
