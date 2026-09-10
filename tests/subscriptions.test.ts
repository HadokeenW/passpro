import { describe, it, expect } from "vitest";
import {
  deriveStatus,
  calculateRenewalDates,
} from "@/server/services/subscriptions";

describe("Subscription Status Derivation (pure function)", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  it("returns ACTIVE when current date is well within range and > 7 days remaining", () => {
    const sub = {
      status: "ACTIVE" as const,
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-09-30T00:00:00.000Z"), // 20 days remaining
    };
    expect(deriveStatus(sub, now)).toBe("ACTIVE");
  });

  it("returns EXPIRING_SOON when remaining days <= 7", () => {
    const sub = {
      status: "ACTIVE" as const,
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-09-15T00:00:00.000Z"), // 5 days remaining
    };
    expect(deriveStatus(sub, now)).toBe("EXPIRING_SOON");
  });

  it("returns EXPIRED when endDate < now", () => {
    const sub = {
      status: "ACTIVE" as const,
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-09-01T00:00:00.000Z"), // expired 9 days ago
    };
    expect(deriveStatus(sub, now)).toBe("EXPIRED");
  });

  it("preserves manual SUSPENDED status even if temporal dates are valid", () => {
    const sub = {
      status: "SUSPENDED" as const,
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-09-30T00:00:00.000Z"),
    };
    expect(deriveStatus(sub, now)).toBe("SUSPENDED");
  });

  it("preserves manual CANCELLED status", () => {
    const sub = {
      status: "CANCELLED" as const,
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-09-30T00:00:00.000Z"),
    };
    expect(deriveStatus(sub, now)).toBe("CANCELLED");
  });
});

describe("Renewal Date Calculation", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");
  const dayMs = 24 * 60 * 60 * 1000;

  it("in EXTEND mode on active sub, preserves remaining days", () => {
    const sub = {
      status: "ACTIVE" as const,
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-09-13T12:00:00.000Z"), // 3 days remaining
    };

    // Renew with 30-day plan
    const { startDate, endDate } = calculateRenewalDates(sub, 30, "EXTEND", now);
    expect(startDate.getTime()).toBe(sub.startDate.getTime());
    // endDate should be current endDate + 30 days
    expect(endDate.getTime()).toBe(sub.endDate.getTime() + 30 * dayMs);
  });

  it("in EXTEND mode on expired sub, base resets to now", () => {
    const sub = {
      status: "EXPIRED" as const,
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T00:00:00.000Z"), // expired 10 days ago
    };

    const { endDate } = calculateRenewalDates(sub, 30, "EXTEND", now);
    expect(endDate.getTime()).toBe(now.getTime() + 30 * dayMs);
  });

  it("in RESTART mode, starts strictly today", () => {
    const sub = {
      status: "ACTIVE" as const,
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-09-30T00:00:00.000Z"),
    };

    const { startDate, endDate } = calculateRenewalDates(sub, 30, "RESTART", now);
    expect(startDate.getTime()).toBe(now.getTime());
    expect(endDate.getTime()).toBe(now.getTime() + 30 * dayMs);
  });

  it("throws ApiError if current subscription is suspended or cancelled", () => {
    const sub = {
      status: "SUSPENDED" as const,
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-09-30T00:00:00.000Z"),
    };

    expect(() => calculateRenewalDates(sub, 30, "EXTEND", now)).toThrow();
  });
});
