import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { normalizeUid, evaluateScan } from "@/server/services/access-engine";
import { prisma } from "@/lib/db";

describe("Access Engine Normalization", () => {
  it("normalizes mixed case and unformatted hex into standard colon-separated uppercase", () => {
    expect(normalizeUid("04a32bf1")).toBe("04:A3:2B:F1");
    expect(normalizeUid("04:a3:2b:f1")).toBe("04:A3:2B:F1");
    expect(normalizeUid("  04 A3 2B F1  ")).toBe("04:A3:2B:F1");
    expect(normalizeUid("deadbeef")).toBe("DE:AD:BE:EF");
  });
});

describe("Access Engine Evaluation Matrix", () => {
  it("Scenario 1: Active card with active subscription -> GRANTED (OK)", async () => {
    const result = await evaluateScan("04:A3:2B:F1", "SIMULATION");
    expect(result.decision).toBe("GRANTED");
    expect(result.reason).toBe("OK");
    expect(result.member).not.toBeNull();
    expect(result.member?.firstName).toBeTruthy();
  });

  it("Scenario 2: Expiring soon subscription -> GRANTED (OK with days remaining <= 7)", async () => {
    // Khaled Zitouni's card
    const result = await evaluateScan("04:F8:70:E6", "SIMULATION");
    expect(result.decision).toBe("GRANTED");
    expect(result.reason).toBe("OK");
    expect(result.member).not.toBeNull();
    expect(result.member?.daysRemaining).toBeLessThanOrEqual(7);
    expect(result.member?.isExpiringSoon).toBe(true);
  });

  it("Scenario 3: Expired subscription -> DENIED (SUBSCRIPTION_EXPIRED)", async () => {
    // Bilel Taleb's card
    const result = await evaluateScan("04:2B:A3:19", "SIMULATION");
    expect(result.decision).toBe("DENIED");
    expect(result.reason).toBe("SUBSCRIPTION_EXPIRED");
  });

  it("Scenario 4: Suspended subscription -> DENIED (SUBSCRIPTION_SUSPENDED)", async () => {
    // Mourad Brahimi's card
    const result = await evaluateScan("04:5E:D6:4C", "SIMULATION");
    expect(result.decision).toBe("DENIED");
    expect(result.reason).toBe("SUBSCRIPTION_SUSPENDED");
  });

  it("Scenario 5: Blocked card -> DENIED (CARD_BLOCKED)", async () => {
    const result = await evaluateScan("04:EE:11:22", "SIMULATION");
    expect(result.decision).toBe("DENIED");
    expect(result.reason).toBe("CARD_BLOCKED");
  });

  it("Scenario 6: Stock unassigned card -> DENIED (CARD_UNASSIGNED)", async () => {
    const result = await evaluateScan("04:00:AA:11", "SIMULATION");
    expect(result.decision).toBe("DENIED");
    expect(result.reason).toBe("CARD_UNASSIGNED");
  });

  it("Scenario 7: Unknown card not in database -> DENIED (CARD_NOT_FOUND)", async () => {
    const result = await evaluateScan("04:99:99:99", "SIMULATION");
    expect(result.decision).toBe("DENIED");
    expect(result.reason).toBe("CARD_NOT_FOUND");
  });

  it("Anti-bounce: second scan of same card within 1.5s returns cached decision", async () => {
    const first = await evaluateScan("04:A3:2B:F1", "SIMULATION");
    const second = await evaluateScan("04:A3:2B:F1", "SIMULATION");
    expect(first.loggedAt).toBe(second.loggedAt);
  });

  it("Scenario 8: Session-based subscription decrements session on entry", async () => {
    const plan = await prisma.plan.findFirst({ where: { name: "Pass Journée" } });
    const member = await prisma.member.create({
      data: {
        firstName: "TestSession",
        lastName: "User",
        phone: "0550000001",
        subscriptions: {
          create: {
            planId: plan!.id,
            planType: "SESSIONS",
            totalSessions: 10,
            remainingSessions: 5,
            startDate: new Date(Date.now() - 3600 * 1000),
            endDate: new Date(Date.now() + 30 * 86400 * 1000),
            status: "ACTIVE",
          },
        },
        cards: {
          create: {
            uid: "04:88:00:01",
            status: "ACTIVE",
          },
        },
      },
      include: { subscriptions: true },
    });

    const result = await evaluateScan("04:88:00:01", "SIMULATION");
    expect(result.decision).toBe("GRANTED");
    expect(result.reason).toBe("OK");
    expect(result.member?.remainingSessions).toBe(4);
    expect(result.member?.totalSessions).toBe(10);

    // Verify DB updated
    const updatedSub = await prisma.subscription.findUnique({
      where: { id: member.subscriptions[0].id },
    });
    expect(updatedSub?.remainingSessions).toBe(4);

    // Clean up
    await prisma.accessLog.deleteMany({ where: { cardUid: "04:88:00:01" } });
    await prisma.card.deleteMany({ where: { uid: "04:88:00:01" } });
    await prisma.subscription.deleteMany({ where: { memberId: member.id } });
    await prisma.member.delete({ where: { id: member.id } });
  });

  it("Scenario 9: Session-based subscription with 0 sessions -> DENIED (SESSIONS_EXHAUSTED)", async () => {
    const plan = await prisma.plan.findFirst({ where: { name: "Pass Journée" } });
    const member = await prisma.member.create({
      data: {
        firstName: "TestZeroSession",
        lastName: "User",
        phone: "0550000002",
        subscriptions: {
          create: {
            planId: plan!.id,
            planType: "SESSIONS",
            totalSessions: 10,
            remainingSessions: 0,
            startDate: new Date(Date.now() - 3600 * 1000),
            endDate: new Date(Date.now() + 30 * 86400 * 1000),
            status: "ACTIVE",
          },
        },
        cards: {
          create: {
            uid: "04:88:00:02",
            status: "ACTIVE",
          },
        },
      },
    });

    const result = await evaluateScan("04:88:00:02", "SIMULATION");
    expect(result.decision).toBe("DENIED");
    expect(result.reason).toBe("SESSIONS_EXHAUSTED");

    // Clean up
    await prisma.accessLog.deleteMany({ where: { cardUid: "04:88:00:02" } });
    await prisma.card.deleteMany({ where: { uid: "04:88:00:02" } });
    await prisma.subscription.deleteMany({ where: { memberId: member.id } });
    await prisma.member.delete({ where: { id: member.id } });
  });

  it("Scenario 10: Time-slot subscription outside permitted window -> DENIED (OUTSIDE_TIME_WINDOW)", async () => {
    const plan = await prisma.plan.findFirst({ where: { name: "Pass Journée" } });
    // Define a window that is definitely not now (e.g. 02:00 to 03:00 am)
    const member = await prisma.member.create({
      data: {
        firstName: "TestSlotOutside",
        lastName: "User",
        phone: "0550000003",
        subscriptions: {
          create: {
            planId: plan!.id,
            planType: "TIME_SLOT",
            startTime: "02:00",
            endTime: "03:00",
            startDate: new Date(Date.now() - 3600 * 1000),
            endDate: new Date(Date.now() + 30 * 86400 * 1000),
            status: "ACTIVE",
          },
        },
        cards: {
          create: {
            uid: "04:88:00:03",
            status: "ACTIVE",
          },
        },
      },
    });

    const result = await evaluateScan("04:88:00:03", "SIMULATION");
    expect(result.decision).toBe("DENIED");
    expect(result.reason).toBe("OUTSIDE_TIME_WINDOW");

    // Clean up
    await prisma.accessLog.deleteMany({ where: { cardUid: "04:88:00:03" } });
    await prisma.card.deleteMany({ where: { uid: "04:88:00:03" } });
    await prisma.subscription.deleteMany({ where: { memberId: member.id } });
    await prisma.member.delete({ where: { id: member.id } });
  });

  it("Scenario 11: Member with remaining debt is GRANTED access but flagged with hasDebt", async () => {
    const plan = await prisma.plan.findFirst({ where: { name: "Pass Journée" } });
    const member = await prisma.member.create({
      data: {
        firstName: "TestDebtMember",
        lastName: "User",
        phone: "0550000004",
        subscriptions: {
          create: {
            planId: plan!.id,
            planType: "TEMPORAL",
            price: 5000,
            paidAmount: 3000,
            balanceDue: 2000,
            startDate: new Date(Date.now() - 3600 * 1000),
            endDate: new Date(Date.now() + 30 * 86400 * 1000),
            status: "ACTIVE",
          },
        },
        cards: {
          create: {
            uid: "04:88:00:04",
            status: "ACTIVE",
          },
        },
      },
    });

    const result = await evaluateScan("04:88:00:04", "SIMULATION");
    expect(result.decision).toBe("GRANTED");
    expect(result.reason).toBe("OK");
    expect(result.member?.hasDebt).toBe(true);
    expect(result.member?.balanceDue).toBe(2000);

    // Clean up
    await prisma.accessLog.deleteMany({ where: { cardUid: "04:88:00:04" } });
    await prisma.card.deleteMany({ where: { uid: "04:88:00:04" } });
    await prisma.subscription.deleteMany({ where: { memberId: member.id } });
    await prisma.member.delete({ where: { id: member.id } });
  });
});
