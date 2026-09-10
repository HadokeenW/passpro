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
    expect(result.member?.firstName).toBe("Amine");
  });

  it("Scenario 2: Expiring soon subscription -> GRANTED (OK with days remaining <= 7)", async () => {
    // Khaled Zitouni's card
    const result = await evaluateScan("04:F8:70:E6", "SIMULATION");
    expect(result.decision).toBe("GRANTED");
    expect(result.reason).toBe("OK");
    expect(result.member).not.toBeNull();
    expect(result.member?.daysRemaining).toBeLessThanOrEqual(7);
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
});
