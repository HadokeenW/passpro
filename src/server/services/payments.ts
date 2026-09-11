import { prisma } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
import { calculateRenewalDates, RenewalMode } from "./subscriptions";
import { ApiError } from "@/lib/errors";
import { withAudit } from "./audit";

export interface CreatePaymentParams {
  memberId: string;
  planId?: string;
  subscriptionId?: string;
  mode?: RenewalMode;
  method?: PaymentMethod;
  operatorId?: string;
  customAmount?: number;
  totalPrice?: number;
  isDebtSettlement?: boolean;
}

export async function processPayment({
  memberId,
  planId,
  subscriptionId,
  mode = "EXTEND",
  method = "CASH",
  operatorId,
  customAmount,
  totalPrice,
  isDebtSettlement = false,
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
          include: { plan: true },
        },
      },
    });

    if (!member) {
      throw new ApiError("NOT_FOUND", "Adhérent introuvable", 404);
    }

    const now = new Date();

    // 2. Handle Debt Settlement Mode
    if (isDebtSettlement) {
      let targetSub = subscriptionId
        ? await tx.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } })
        : member.subscriptions[0] || null;

      if (!targetSub) {
        throw new ApiError("NOT_FOUND", "Abonnement introuvable pour ce règlement de dette", 404);
      }

      if (targetSub.balanceDue <= 0) {
        throw new ApiError("BAD_REQUEST", "Cet abonnement n'a aucun solde restant dû", 400);
      }

      const amountToPay = customAmount !== undefined ? customAmount : targetSub.balanceDue;
      if (amountToPay <= 0) {
        throw new ApiError("VALIDATION_ERROR", "Le montant réglé doit être supérieur à 0", 400);
      }

      const newPaidAmount = targetSub.paidAmount + amountToPay;
      const newBalanceDue = Math.max(0, targetSub.balanceDue - amountToPay);

      const updatedSub = await tx.subscription.update({
        where: { id: targetSub.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
        },
      });

      // Increment Receipt Counter
      const counter = await tx.counter.upsert({
        where: { key: counterKey },
        update: { value: { increment: 1 } },
        create: { key: counterKey, value: 1 },
      });

      const sequence = counter.value.toString().padStart(4, "0");
      const receiptNumber = `REC-${currentYear}-${sequence}`;

      const createdPayment = await tx.payment.create({
        data: {
          receiptNumber,
          memberId: member.id,
          subscriptionId: updatedSub.id,
          planId: targetSub.planId,
          planName: `${targetSub.plan.name} (Règlement solde)`,
          amount: amountToPay,
          totalAmount: targetSub.price || targetSub.plan.price,
          remainingBalance: newBalanceDue,
          paymentType: "DEBT_PAYMENT",
          method,
          operatorId: operatorId || null,
        },
        include: {
          member: true,
          operator: true,
          subscription: true,
        },
      });

      return createdPayment;
    }

    // 3. Regular Subscription or Renewal Mode
    if (!planId) {
      throw new ApiError("VALIDATION_ERROR", "Formule requise pour une souscription", 400);
    }

    const plan = await tx.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new ApiError("NOT_FOUND", "Formule introuvable", 404);
    }

    // Calculate final prices and amounts
    const finalTotalPrice = totalPrice !== undefined ? totalPrice : plan.price;
    const paidAmountThisTime = customAmount !== undefined ? customAmount : finalTotalPrice;
    const balanceDue = Math.max(0, finalTotalPrice - paidAmountThisTime);

    // Determine target subscription
    let targetSub = subscriptionId
      ? await tx.subscription.findUnique({ where: { id: subscriptionId } })
      : member.subscriptions[0] || null;

    let finalSubId: string;

    // Attributes based on plan type
    const sessionCount = plan.planType === "SESSIONS" ? (plan.sessionCount || 10) : null;
    const startTime = plan.planType === "TIME_SLOT" ? (plan.startTime || null) : null;
    const endTime = plan.planType === "TIME_SLOT" ? (plan.endTime || null) : null;

    if (targetSub) {
      // Renewal
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
          planType: plan.planType,
          totalSessions: sessionCount,
          remainingSessions: sessionCount,
          startTime,
          endTime,
          price: finalTotalPrice,
          paidAmount: paidAmountThisTime,
          balanceDue,
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
          planType: plan.planType,
          totalSessions: sessionCount,
          remainingSessions: sessionCount,
          startTime,
          endTime,
          price: finalTotalPrice,
          paidAmount: paidAmountThisTime,
          balanceDue,
        },
      });
      finalSubId = createdSub.id;
    }

    // Increment Receipt Counter
    const counter = await tx.counter.upsert({
      where: { key: counterKey },
      update: { value: { increment: 1 } },
      create: { key: counterKey, value: 1 },
    });

    const sequence = counter.value.toString().padStart(4, "0");
    const receiptNumber = `REC-${currentYear}-${sequence}`;

    // Create Payment record
    const createdPayment = await tx.payment.create({
      data: {
        receiptNumber,
        memberId: member.id,
        subscriptionId: finalSubId,
        planId: plan.id,
        planName: plan.name,
        amount: paidAmountThisTime,
        totalAmount: finalTotalPrice,
        remainingBalance: balanceDue,
        paymentType: "SUBSCRIPTION",
        method,
        operatorId: operatorId || null,
      },
      include: {
        member: true,
        operator: true,
        subscription: true,
      },
    });

    return createdPayment;
  });

  // Audit after commit
  await withAudit({
    userId: operatorId,
    action: isDebtSettlement ? "payment.debt_settlement" : "payment.create",
    entityType: "Payment",
    entityId: payment.id,
    after: {
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      totalAmount: payment.totalAmount,
      remainingBalance: payment.remainingBalance,
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
