import { prisma } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
import { calculateRenewalDates, RenewalMode } from "./subscriptions";
import { ApiError } from "@/lib/errors";
import { withAudit } from "./audit";

export interface CreatePaymentParams {
  memberId: string;
  planId: string;
  subscriptionId?: string;
  mode?: RenewalMode;
  method?: PaymentMethod;
  operatorId?: string;
  customAmount?: number;
}

export async function processPayment({
  memberId,
  planId,
  subscriptionId,
  mode = "EXTEND",
  method = "CASH",
  operatorId,
  customAmount,
}: CreatePaymentParams) {
  const currentYear = new Date().getFullYear();
  const counterKey = `receipt-${currentYear}`;

  const payment = await prisma.$transaction(async (tx) => {
    // 1. Verify Member
    const member = await tx.member.findUnique({
      where: { id: memberId },
      include: {
        subscriptions: {
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new ApiError("NOT_FOUND", "Adhérent introuvable", 404);
    }

    // 2. Verify Plan
    const plan = await tx.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new ApiError("NOT_FOUND", "Formule introuvable", 404);
    }

    // 3. Determine target subscription
    let targetSub = subscriptionId
      ? await tx.subscription.findUnique({ where: { id: subscriptionId } })
      : member.subscriptions[0] || null;

    let finalSubId: string;
    const now = new Date();

    if (targetSub) {
      // Calculate renewal dates
      const { startDate, endDate } = calculateRenewalDates(
        targetSub,
        plan.durationDays,
        mode,
        now
      );

      const updatedSub = await tx.subscription.update({
        where: { id: targetSub.id },
        data: {
          planId: plan.id,
          startDate,
          endDate,
          status: "ACTIVE",
          suspendedAt: null,
        },
      });
      finalSubId = updatedSub.id;
    } else {
      // First subscription for this member
      const { startDate, endDate } = calculateRenewalDates(null, plan.durationDays, "RESTART", now);
      const createdSub = await tx.subscription.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          startDate,
          endDate,
          status: "ACTIVE",
        },
      });
      finalSubId = createdSub.id;
    }

    // 4. Increment Receipt Counter
    const counter = await tx.counter.upsert({
      where: { key: counterKey },
      update: { value: { increment: 1 } },
      create: { key: counterKey, value: 1 },
    });

    const sequence = counter.value.toString().padStart(4, "0");
    const receiptNumber = `REC-${currentYear}-${sequence}`;

    // 5. Create Payment record
    const amount = customAmount !== undefined ? customAmount : plan.price;
    const payment = await tx.payment.create({
      data: {
        receiptNumber,
        memberId: member.id,
        subscriptionId: finalSubId,
        planId: plan.id,
        planName: plan.name, // Denormalized for receipt permanence
        amount,
        method,
        operatorId: operatorId || null,
      },
      include: {
        member: true,
        operator: true,
        subscription: true,
      },
    });

    return payment;
  });

  // 6. Audit after commit
  await withAudit({
    userId: operatorId,
    action: "payment.create",
    entityType: "Payment",
    entityId: payment.id,
    after: {
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      planName: payment.planName,
      memberId: payment.memberId,
      method: payment.method,
    },
  });

  return payment;
}

export async function getReceiptDetails(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      member: true,
      operator: true,
      subscription: {
        include: { plan: true },
      },
    },
  });

  if (!payment) {
    throw new ApiError("NOT_FOUND", "Règlement introuvable", 404);
  }

  const setting = await prisma.setting.findFirst();

  return {
    payment,
    setting,
  };
}

export async function reprintReceipt(paymentId: string, operatorId?: string) {
  const details = await getReceiptDetails(paymentId);

  await withAudit({
    userId: operatorId,
    action: "payment.reprint",
    entityType: "Payment",
    entityId: paymentId,
    after: { receiptNumber: details.payment.receiptNumber },
  });

  return {
    ...details,
    isDuplicate: true,
  };
}
