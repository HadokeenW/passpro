import { Subscription, SubscriptionStatus, Plan, PlanType } from "@prisma/client";
import { daysBetween } from "@/lib/dates";
import { ApiError } from "@/lib/errors";

export interface DerivedSubscriptionStatus {
  status: SubscriptionStatus;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  hasDebt?: boolean;
  balanceDue?: number;
  remainingSessions?: number | null;
  totalSessions?: number | null;
  planType?: PlanType;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Pure function to derive subscription status at any point in time.
 * Manual statuses (SUSPENDED, CANCELLED) take precedence.
 */
export function deriveStatus(
  subscription: Pick<Subscription, "status" | "startDate" | "endDate"> &
    Partial<Pick<Subscription, "remainingSessions">>,
  now: Date = new Date()
): SubscriptionStatus {
  // Manual decisions override temporal calculations
  if (subscription.status === "SUSPENDED") return "SUSPENDED";
  if (subscription.status === "CANCELLED") return "CANCELLED";

  // If session-based and 0 sessions remaining -> EXPIRED
  if (
    subscription.remainingSessions !== undefined &&
    subscription.remainingSessions !== null &&
    subscription.remainingSessions <= 0
  ) {
    return "EXPIRED";
  }

  const currentTime = now.getTime();
  const startTime = new Date(subscription.startDate).getTime();
  const endTime = new Date(subscription.endDate).getTime();

  if (currentTime < startTime) {
    return "ACTIVE";
  }

  if (currentTime >= endTime) {
    return "EXPIRED";
  }

  // Active - check if expiring soon (<= 7 days)
  const msPerDay = 1000 * 60 * 60 * 24;
  const remainingDays = (endTime - currentTime) / msPerDay;

  if (remainingDays <= 7) {
    return "EXPIRING_SOON";
  }

  return "ACTIVE";
}

/**
 * Calculates full derived information including days remaining, debt and session state
 */
export function getSubscriptionDetails(
  subscription: Pick<Subscription, "status" | "startDate" | "endDate"> &
    Partial<Pick<Subscription, "remainingSessions" | "totalSessions" | "planType" | "balanceDue" | "startTime" | "endTime">>,
  now: Date = new Date()
): DerivedSubscriptionStatus {
  const derived = deriveStatus(subscription, now);
  const daysRemaining = daysBetween(now, new Date(subscription.endDate));
  const balanceDue = subscription.balanceDue || 0;

  return {
    status: derived,
    daysRemaining,
    isExpiringSoon: derived === "EXPIRING_SOON",
    isExpired: derived === "EXPIRED",
    hasDebt: balanceDue > 0,
    balanceDue,
    remainingSessions: subscription.remainingSessions ?? null,
    totalSessions: subscription.totalSessions ?? null,
    planType: subscription.planType,
    startTime: subscription.startTime ?? null,
    endTime: subscription.endTime ?? null,
  };
}

export type RenewalMode = "EXTEND" | "RESTART";

export interface RenewalDates {
  startDate: Date;
  endDate: Date;
}

/**
 * Calculates new start and end dates for a renewal.
 * EXTEND: base = max(now, current.endDate) then newEnd = base + durationDays
 * RESTART: startDate = now, endDate = now + durationDays
 */
export function calculateRenewalDates(
  currentSubscription: Pick<Subscription, "status" | "startDate" | "endDate"> | null,
  planDurationDays: number,
  mode: RenewalMode = "EXTEND",
  now: Date = new Date()
): RenewalDates {
  if (
    currentSubscription &&
    (currentSubscription.status === "SUSPENDED" || currentSubscription.status === "CANCELLED")
  ) {
    throw new ApiError(
      "SUBSCRIPTION_NOT_RENEWABLE",
      "Un abonnement suspendu ou résilié doit être réactivé avant renouvellement",
      409
    );
  }

  const msInDay = 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();

  if (!currentSubscription || mode === "RESTART") {
    const startDate = new Date(nowMs);
    const endDate = new Date(nowMs + planDurationDays * msInDay);
    return { startDate, endDate };
  }

  // Mode EXTEND
  const currentEndMs = new Date(currentSubscription.endDate).getTime();
  const baseMs = Math.max(nowMs, currentEndMs);
  const startDate = new Date(currentSubscription.startDate);
  const endDate = new Date(baseMs + planDurationDays * msInDay);

  return { startDate, endDate };
}
