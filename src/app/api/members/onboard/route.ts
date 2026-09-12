import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";
import { normalizeUid } from "@/server/services/access-engine";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      photoUrl,
      notes,
      planId,
      startDate,
      endDate,
      cardUid,
      paidAmount,
      paymentMethod = "CASH",
    } = body;

    // Step 1 validations
    if (!firstName?.trim() || !lastName?.trim()) {
      throw new ApiError("VALIDATION_ERROR", "Le nom et le prénom sont obligatoires", 400);
    }
    if (!phone?.trim()) {
      throw new ApiError("VALIDATION_ERROR", "Le numéro de téléphone est obligatoire", 400);
    }

    // Step 2 validations
    if (!planId) {
      throw new ApiError("VALIDATION_ERROR", "Une formule d'abonnement doit être sélectionnée", 400);
    }

    const cleanUid = cardUid?.trim() ? normalizeUid(cardUid.trim()) : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify Card availability if UID provided
      if (cleanUid) {
        const existingCard = await tx.card.findUnique({
          where: { uid: cleanUid },
          include: { member: true },
        });

        if (existingCard?.member && !existingCard.member.deletedAt) {
          throw new ApiError(
            "CONFLICT",
            `Cette carte est déjà assignée à l'adhérent ${existingCard.member.firstName} ${existingCard.member.lastName}`,
            409
          );
        }
      }

      // 2. Fetch Plan
      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new ApiError("NOT_FOUND", "Formule introuvable", 404);
      }

      // 3. Create Member
      const member = await tx.member.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          photoUrl: photoUrl || null,
          notes: notes?.trim() || null,
        },
      });

      // 4. Assign Card (if provided)
      let card = null;
      if (cleanUid) {
        card = await tx.card.upsert({
          where: { uid: cleanUid },
          update: {
            memberId: member.id,
            status: "ACTIVE",
          },
          create: {
            uid: cleanUid,
            memberId: member.id,
            status: "ACTIVE",
          },
        });
      }

      // 5. Calculate Subscription Dates & Sessions
      const start = startDate ? new Date(startDate) : new Date();
      let end: Date;
      if (endDate) {
        end = new Date(endDate);
      } else {
        end = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      }

      const sessionCount = plan.planType === "SESSIONS" ? (plan.sessionCount || 10) : null;
      const startTime = plan.planType === "TIME_SLOT" ? plan.startTime : null;
      const endTime = plan.planType === "TIME_SLOT" ? plan.endTime : null;

      const finalPrice = plan.price;
      const paid = Number(paidAmount) >= 0 ? Number(paidAmount) : finalPrice;
      const balanceDue = Math.max(0, finalPrice - paid);

      const subscription = await tx.subscription.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          startDate: start,
          endDate: end,
          status: "ACTIVE",
          planType: plan.planType,
          totalSessions: sessionCount,
          remainingSessions: sessionCount,
          startTime,
          endTime,
          price: finalPrice,
          paidAmount: paid,
          balanceDue,
        },
        include: { plan: true },
      });

      // 6. Record Payment & Receipt (if paid > 0)
      let payment = null;
      if (paid > 0) {
        const currentYear = new Date().getFullYear();
        const counterKey = `receipt-${currentYear}`;
        const counter = await tx.counter.upsert({
          where: { key: counterKey },
          update: { value: { increment: 1 } },
          create: { key: counterKey, value: 1 },
        });

        const sequence = counter.value.toString().padStart(4, "0");
        const receiptNumber = `REC-${currentYear}-${sequence}`;

        payment = await tx.payment.create({
          data: {
            receiptNumber,
            memberId: member.id,
            subscriptionId: subscription.id,
            planId: plan.id,
            planName: plan.name,
            amount: paid,
            totalAmount: finalPrice,
            remainingBalance: balanceDue,
            paymentType: "SUBSCRIPTION",
            method: paymentMethod,
            operatorId: user.id || null,
          },
        });
      }

      return { member, subscription, card, payment };
    });

    // 7. Audit Log
    await withAudit({
      userId: user.id,
      action: "member.onboard_wizard",
      entityType: "Member",
      entityId: result.member.id,
      after: {
        member: `${result.member.firstName} ${result.member.lastName}`,
        plan: result.subscription.plan.name,
        cardUid: cleanUid,
        paid: result.subscription.paidAmount,
        balanceDue: result.subscription.balanceDue,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
