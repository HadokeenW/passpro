import { describe, it, expect } from "vitest";
import { processPayment, processPosSale } from "@/server/services/payments";
import { prisma } from "@/lib/db";

describe("Cashier and Payment Transaction", () => {
  it("processes payment atomically and issues formatted sequential receipt number", async () => {
    // Get member and plan
    const member = await prisma.member.findFirst({
      where: { firstName: "Amine" },
    });
    const plan = await prisma.plan.findFirst({
      where: { name: "Pass Journée" },
    });

    expect(member).not.toBeNull();
    expect(plan).not.toBeNull();

    const payment = await processPayment({
      memberId: member!.id,
      planId: plan!.id,
      mode: "EXTEND",
      method: "CASH",
    });

    const currentYear = new Date().getFullYear();
    expect(payment.receiptNumber).toMatch(new RegExp(`^REC-${currentYear}-\\d{4}$`));
    expect(payment.amount).toBe(plan!.price);
    expect(payment.planName).toBe(plan!.name);

    // Verify counter
    const counter = await prisma.counter.findUnique({
      where: { key: `receipt-${currentYear}` },
    });
    expect(counter).not.toBeNull();
    expect(counter!.value).toBeGreaterThan(0);
  });

  it("processes partial payment (credit) and calculates remaining balance correctly", async () => {
    const member = await prisma.member.create({
      data: {
        firstName: "TestCredit",
        lastName: "Member",
        phone: "0555999001",
      },
    });

    const plan = await prisma.plan.findFirst({
      where: { name: "Mensuel" },
    });
    expect(plan).not.toBeNull();

    // Plan costs 5500 DA, member pays 3000 DA
    const totalPrice = plan!.price;
    const paidAmount = 3000;

    const payment = await processPayment({
      memberId: member.id,
      planId: plan!.id,
      mode: "RESTART",
      method: "CASH",
      customAmount: paidAmount,
      totalPrice: totalPrice,
    });

    expect(payment.amount).toBe(3000);
    expect(payment.totalAmount).toBe(5500);
    expect(payment.remainingBalance).toBe(2500);
    expect(payment.paymentType).toBe("SUBSCRIPTION");

    // Verify member's subscription state in DB
    const sub = await prisma.subscription.findFirst({
      where: { memberId: member.id },
    });
    expect(sub).not.toBeNull();
    expect(sub!.price).toBe(5500);
    expect(sub!.paidAmount).toBe(3000);
    expect(sub!.balanceDue).toBe(2500);
  });

  it("settles remaining debt (debt settlement mode) and clears balance due", async () => {
    const member = await prisma.member.findFirst({
      where: { firstName: "TestCredit", lastName: "Member" },
      include: { subscriptions: true },
    });
    expect(member).not.toBeNull();
    const sub = member!.subscriptions[0];
    expect(sub.balanceDue).toBe(2500);

    // Settle 1500 of the 2500 debt first
    const partialSettlement = await processPayment({
      memberId: member!.id,
      subscriptionId: sub.id,
      isDebtSettlement: true,
      customAmount: 1500,
      method: "CASH",
    });

    expect(partialSettlement.amount).toBe(1500);
    expect(partialSettlement.remainingBalance).toBe(1000);
    expect(partialSettlement.paymentType).toBe("DEBT_PAYMENT");

    // Settle remaining 1000 debt
    const finalSettlement = await processPayment({
      memberId: member!.id,
      subscriptionId: sub.id,
      isDebtSettlement: true,
      customAmount: 1000,
      method: "CARD",
    });

    expect(finalSettlement.amount).toBe(1000);
    expect(finalSettlement.remainingBalance).toBe(0);

    // Verify sub is now completely settled
    const updatedSub = await prisma.subscription.findUnique({
      where: { id: sub.id },
    });
    expect(updatedSub!.balanceDue).toBe(0);
    expect(updatedSub!.paidAmount).toBe(5500);

    // Clean up test member and records
    await prisma.payment.deleteMany({ where: { memberId: member!.id } });
    await prisma.subscription.deleteMany({ where: { memberId: member!.id } });
    await prisma.member.delete({ where: { id: member!.id } });
  });

  it("processes POS sale for walk-in customer, creates items and decrements stock", async () => {
    // 1. Create a test product
    const product = await prisma.product.create({
      data: {
        name: "Test Protein Bar",
        category: "PROTEINES",
        price: 250,
        stock: 20,
        minStockAlert: 5,
        active: true,
      },
    });

    // 2. Perform POS sale of 3 units without member (client comptoir)
    const sale = await processPosSale({
      items: [
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 3,
        },
      ],
      method: "CASH",
      memberId: null,
    });

    expect(sale.paymentType).toBe("POS_SALE");
    expect(sale.amount).toBe(750);
    expect(sale.memberId).toBeNull();
    expect(sale.items).toHaveLength(1);
    expect(sale.items[0].quantity).toBe(3);
    expect(sale.items[0].totalPrice).toBe(750);

    // 3. Verify product stock was decremented from 20 to 17
    const updatedProd = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProd!.stock).toBe(17);

    // Clean up
    await prisma.paymentItem.deleteMany({ where: { paymentId: sale.id } });
    await prisma.payment.delete({ where: { id: sale.id } });
    await prisma.product.delete({ where: { id: product.id } });
  });

  it("prevents POS sale when requested quantity exceeds available stock", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Test Energy Drink",
        category: "BOISSONS",
        price: 200,
        stock: 2,
        active: true,
      },
    });

    // Try to buy 5 when only 2 are in stock
    await expect(
      processPosSale({
        items: [
          {
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            quantity: 5,
          },
        ],
        method: "CASH",
      })
    ).rejects.toThrow(/Stock insuffisant/);

    // Clean up
    await prisma.product.delete({ where: { id: product.id } });
  });
});
