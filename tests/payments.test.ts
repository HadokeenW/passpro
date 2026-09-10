import { describe, it, expect } from "vitest";
import { processPayment } from "@/server/services/payments";
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
});
