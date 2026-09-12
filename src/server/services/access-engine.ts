import { prisma } from "@/lib/db";
import {
  AccessDecision,
  AccessReason,
  AccessSource,
  AlertLevel,
  AlertType,
  PlanType,
} from "@prisma/client";
import { deriveStatus } from "./subscriptions";
import { daysBetween } from "@/lib/dates";

export interface ScanResult {
  decision: AccessDecision;
  reason: AccessReason;
  cardUid: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    planName: string;
    planType?: PlanType;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    isExpiringSoon?: boolean;
    hasDebt?: boolean;
    balanceDue?: number;
    remainingSessions?: number | null;
    totalSessions?: number | null;
    startTime?: string | null;
    endTime?: string | null;
  } | null;
  kioskName: string;
  loggedAt: string;
}

/**
 * Normalizes raw UID into standard uppercase hex pairs separated by colons.
 * E.g. "04a32bf1" -> "04:A3:2B:F1"
 */
export function normalizeUid(rawUid: string): string {
  if (!rawUid) return "";
  const cleaned = rawUid.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  const pairs: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    pairs.push(cleaned.slice(i, i + 2));
  }
  return pairs.join(":");
}

// In-memory anti-bounce cache: uid -> { timestamp, result }
const recentScans = new Map<string, { timestamp: number; result: ScanResult }>();
let cachedKioskName: { name: string; expiresAt: number } | null = null;

/**
 * Creates deduplicated alerts within a 60-minute window
 */
async function createDeduplicatedAlert({
  type,
  level,
  title,
  message,
  cardUid,
  memberId,
}: {
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  cardUid?: string;
  memberId?: string;
}) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await prisma.alert.findFirst({
      where: {
        type,
        cardUid: cardUid || undefined,
        memberId: memberId || undefined,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (!existing) {
      await prisma.alert.create({
        data: {
          type,
          level,
          title,
          message,
          cardUid,
          memberId,
        },
      });
    }
  } catch (err) {
    console.error("Failed to record access alert:", err);
  }
}

export async function evaluateScan(
  rawUid: string,
  source: AccessSource = "SIMULATION",
  kioskNameOverride?: string
): Promise<ScanResult> {
  const uid = normalizeUid(rawUid);
  const now = new Date();
  const nowMs = now.getTime();

  // 1. Anti-bounce check (1.5 seconds)
  const cached = recentScans.get(uid);
  if (cached && nowMs - cached.timestamp < 1500) {
    return cached.result;
  }

  // Get kiosk name from settings if not provided (cached in memory)
  let kioskName = kioskNameOverride;
  if (!kioskName) {
    const nowMs = Date.now();
    if (cachedKioskName && cachedKioskName.expiresAt > nowMs) {
      kioskName = cachedKioskName.name;
    } else {
      const setting = await prisma.setting.findFirst({ select: { kioskName: true } });
      kioskName = setting?.kioskName || "BORNE-01";
      cachedKioskName = { name: kioskName, expiresAt: nowMs + 60000 };
    }
  }

  // 2. Fetch card with member & latest subscription
  const card = await prisma.card.findUnique({
    where: { uid },
    include: {
      member: {
        include: {
          subscriptions: {
            orderBy: { endDate: "desc" },
            take: 1,
            include: { plan: true },
          },
        },
      },
    },
  });

  let decision: AccessDecision = "DENIED";
  let reason: AccessReason = "OK";
  let alertLevel: AlertLevel | null = null;
  let alertType: AlertType | null = null;
  let alertTitle = "";
  let alertMsg = "";

  let memberPayload: ScanResult["member"] = null;

  if (!card) {
    decision = "DENIED";
    reason = "CARD_NOT_FOUND";
    alertLevel = "DANGER";
    alertType = "UNKNOWN_CARD";
    alertTitle = "Badge non reconnu";
    alertMsg = `Tentative de passage avec un badge inconnu (UID: ${uid})`;
  } else if (card.status === "BLOCKED") {
    decision = "DENIED";
    reason = "CARD_BLOCKED";
    alertLevel = "DANGER";
    alertType = "BLOCKED_CARD";
    alertTitle = "Badge bloqué";
    alertMsg = `Badge bloqué présenté à la borne (UID: ${uid})${
      card.member ? ` - ${card.member.firstName} ${card.member.lastName}` : ""
    }`;
  } else if (!card.memberId || !card.member || card.status === "UNASSIGNED") {
    decision = "DENIED";
    reason = "CARD_UNASSIGNED";
    alertLevel = "WARNING";
    alertType = "UNKNOWN_CARD";
    alertTitle = "Badge non assigné";
    alertMsg = `Badge en stock présenté à la borne sans adhérent associé (UID: ${uid})`;
  } else {
    // Card is assigned to a member
    const member = card.member;
    const sub = member.subscriptions[0];

    if (!sub) {
      decision = "DENIED";
      reason = "NO_ACTIVE_SUBSCRIPTION";
      alertLevel = "INFO";
      alertType = "EXPIRED_SUBSCRIPTION";
      alertTitle = "Aucun abonnement";
      alertMsg = `L'adhérent ${member.firstName} ${member.lastName} n'a aucun abonnement`;
    } else {
      const derived = deriveStatus(sub, now);
      const effectivePlanType = sub.planType || sub.plan.planType;
      const startTime = sub.startTime || sub.plan.startTime;
      const endTime = sub.endTime || sub.plan.endTime;

      if (sub.status === "SUSPENDED") {
        decision = "DENIED";
        reason = "SUBSCRIPTION_SUSPENDED";
        alertLevel = "WARNING";
        alertType = "EXPIRED_SUBSCRIPTION";
        alertTitle = "Abonnement suspendu";
        alertMsg = `Abonnement suspendu pour ${member.firstName} ${member.lastName}`;
      } else if (derived === "EXPIRED") {
        if (effectivePlanType === "SESSIONS" && sub.remainingSessions !== null && sub.remainingSessions <= 0) {
          decision = "DENIED";
          reason = "SESSIONS_EXHAUSTED";
          alertLevel = "WARNING";
          alertType = "EXPIRED_SUBSCRIPTION";
          alertTitle = "Séances épuisées";
          alertMsg = `Toutes les séances de l'adhérent ${member.firstName} ${member.lastName} ont été consommées`;
        } else {
          decision = "DENIED";
          reason = "SUBSCRIPTION_EXPIRED";
          alertLevel = "WARNING";
          alertType = "EXPIRED_SUBSCRIPTION";
          alertTitle = "Abonnement expiré";
          alertMsg = `Abonnement expiré pour ${member.firstName} ${member.lastName} depuis le ${sub.endDate.toLocaleDateString("fr-FR")}`;
        }
      } else if (effectivePlanType === "TIME_SLOT" && startTime && endTime) {
        // Time slot verification (HH:mm format)
        const currentHours = now.getHours().toString().padStart(2, "0");
        const currentMinutes = now.getMinutes().toString().padStart(2, "0");
        const currentTimeStr = `${currentHours}:${currentMinutes}`;

        if (currentTimeStr < startTime || currentTimeStr > endTime) {
          decision = "DENIED";
          reason = "OUTSIDE_TIME_WINDOW";
          alertLevel = "WARNING";
          alertType = "EXPIRED_SUBSCRIPTION";
          alertTitle = "Hors créneau horaire";
          alertMsg = `Accès refusé : la formule de ${member.firstName} ${member.lastName} est autorisée de ${startTime} à ${endTime} (actuellement ${currentTimeStr})`;
        } else {
          decision = "GRANTED";
          reason = "OK";
        }
      } else {
        // ACTIVE or EXPIRING_SOON -> Access GRANTED
        decision = "GRANTED";
        reason = "OK";

        if (derived === "EXPIRING_SOON") {
          const daysLeft = daysBetween(now, sub.endDate);
          alertLevel = "INFO";
          alertType = "EXPIRING_SUBSCRIPTION";
          alertTitle = "Échéance proche";
          alertMsg = `L'abonnement de ${member.firstName} ${member.lastName} expire dans ${daysLeft} jour(s)`;
        }
      }

      // Anti-Passback check for physical access terminals:
      // If card was already granted entry within 5 minutes, deny access to stop card sharing.
      if (decision === "GRANTED" && source === "HARDWARE") {
        const fiveMinutesAgo = new Date(nowMs - 5 * 60 * 1000);
        const recentPassage = await prisma.accessLog.findFirst({
          where: {
            cardUid: uid,
            decision: "GRANTED",
            createdAt: { gte: fiveMinutesAgo },
          },
          orderBy: { createdAt: "desc" },
        });

        if (recentPassage) {
          decision = "DENIED";
          reason = "ANTI_PASSBACK";
          alertLevel = "WARNING";
          alertType = "ANTI_PASSBACK";
          alertTitle = "Anti-passback actif";
          alertMsg = `Badge déjà utilisé récemment (${member.firstName} ${member.lastName}). Échange ou prêt de carte suspecté.`;
        }
      }

      // If granted and SESSIONS plan, decrement remainingSessions by 1
      let updatedRemainingSessions = sub.remainingSessions;
      if (decision === "GRANTED" && effectivePlanType === "SESSIONS" && sub.remainingSessions !== null && sub.remainingSessions > 0) {
        updatedRemainingSessions = sub.remainingSessions - 1;
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { remainingSessions: { decrement: 1 } },
        });
      }

      const daysRemaining = daysBetween(now, sub.endDate);
      const balanceDue = sub.balanceDue || 0;

      memberPayload = {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        photoUrl: member.photoUrl,
        planName: sub.plan.name,
        planType: effectivePlanType,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
        daysRemaining,
        isExpiringSoon: derived === "EXPIRING_SOON" || (daysRemaining <= 7 && daysRemaining >= 0),
        hasDebt: balanceDue > 0,
        balanceDue,
        remainingSessions: updatedRemainingSessions,
        totalSessions: sub.totalSessions ?? sub.plan.sessionCount ?? null,
        startTime,
        endTime,
      };
    }
  }

  // 3, 4, 5. Persist card update, access log and alert in parallel
  await Promise.all([
    card
      ? prisma.card.update({
          where: { uid },
          data: { lastSeenAt: now },
        })
      : Promise.resolve(),
    prisma.accessLog.create({
      data: {
        cardUid: uid,
        memberId: card?.memberId || null,
        decision,
        reason,
        kioskName,
        source,
        createdAt: now,
      },
    }),
    alertLevel && alertType
      ? createDeduplicatedAlert({
          type: alertType,
          level: alertLevel,
          title: alertTitle,
          message: alertMsg,
          cardUid: uid,
          memberId: card?.memberId || undefined,
        })
      : Promise.resolve(),
  ]);

  const result: ScanResult = {
    decision,
    reason,
    cardUid: uid,
    member: memberPayload,
    kioskName,
    loggedAt: now.toISOString(),
  };

  // Cache for anti-bounce
  recentScans.set(uid, { timestamp: nowMs, result });

  return result;
}
