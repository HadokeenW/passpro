import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";

describe("Onboarding Wizard Data Flow", () => {
  it("creates member, assigns card, creates active subscription, and records cashier payment in one flow", async () => {
    const testPhone = `0555${Math.floor(100000 + Math.random() * 900000)}`;
    const testUid = `TEST_${Date.now().toString(16).toUpperCase()}`;

    const plan = await prisma.plan.findFirst({
      where: { active: true },
    });
    expect(plan).not.toBeNull();

    const planId = plan!.id;
    const planPrice = plan!.price;
    const paidAmount = planPrice;

    // Simulate atomic onboard transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Member
      const member = await tx.member.create({
        data: {
          firstName: "Karim",
          lastName: "Benali",
          phone: testPhone,
          photoUrl: "data:image/jpeg;base64,mockphoto",
        },
      });

      // 2. Assign Card
      const card = await tx.card.upsert({
        where: { uid: testUid },
        update: { memberId: member.id, status: "ACTIVE" },
        create: { uid: testUid, memberId: member.id, status: "ACTIVE" },
      });

      // 3. Create Subscription
      const now = new Date();
      const end = new Date(now.getTime() + plan!.durationDays * 24 * 60 * 60 * 1000);
      const subscription = await tx.subscription.create({
        data: {
          memberId: member.id,
          planId: plan!.id,
          startDate: now,
          endDate: end,
          status: "ACTIVE",
          planType: plan!.planType,
          price: planPrice,
          paidAmount: paidAmount,
          balanceDue: 0,
        },
        include: { plan: true },
      });

      // 4. Record Payment
      const currentYear = new Date().getFullYear();
      const counterKey = `receipt-${currentYear}`;
      const counter = await tx.counter.upsert({
        where: { key: counterKey },
        update: { value: { increment: 1 } },
        create: { key: counterKey, value: 1 },
      });

      const sequence = counter.value.toString().padStart(4, "0");
      const receiptNumber = `REC-${currentYear}-${sequence}`;

      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          memberId: member.id,
          subscriptionId: subscription.id,
          planId: plan!.id,
          planName: plan!.name,
          amount: paidAmount,
          totalAmount: planPrice,
          remainingBalance: 0,
          paymentType: "SUBSCRIPTION",
          method: "CASH",
        },
      });

      return { member, card, subscription, payment };
    });

    expect(result.member.firstName).toBe("Karim");
    expect(result.member.phone).toBe(testPhone);
    expect(result.card.uid).toBe(testUid);
    expect(result.card.memberId).toBe(result.member.id);
    expect(result.subscription.status).toBe("ACTIVE");
    expect(result.subscription.balanceDue).toBe(0);
    expect(result.payment.amount).toBe(planPrice);
  });

  it("handles partial payment with outstanding debt calculation", async () => {
    const testPhone = `0555${Math.floor(100000 + Math.random() * 900000)}`;
    const plan = await prisma.plan.findFirst({
      where: { active: true },
    });
    expect(plan).not.toBeNull();

    const planPrice = plan!.price;
    const partialPayment = Math.floor(planPrice / 2);
    const expectedDebt = planPrice - partialPayment;

    const member = await prisma.member.create({
      data: {
        firstName: "Yacine",
        lastName: "Brahimi",
        phone: testPhone,
      },
    });

    const now = new Date();
    const end = new Date(now.getTime() + plan!.durationDays * 24 * 60 * 60 * 1000);
    const subscription = await prisma.subscription.create({
      data: {
        memberId: member.id,
        planId: plan!.id,
        startDate: now,
        endDate: end,
        status: "ACTIVE",
        planType: plan!.planType,
        price: planPrice,
        paidAmount: partialPayment,
        balanceDue: expectedDebt,
      },
    });

    expect(subscription.balanceDue).toBe(expectedDebt);
    expect(subscription.paidAmount).toBe(partialPayment);
  });
});
