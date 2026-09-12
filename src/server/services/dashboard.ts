import { prisma } from "@/lib/db";
import { deriveStatus } from "./subscriptions";

let cachedMetrics: { data: any; expiresAt: number } | null = null;
let cachedHeatmap: { data: any; expiresAt: number } | null = null;

export function invalidateDashboardCache() {
  cachedMetrics = null;
  cachedHeatmap = null;
}

export async function getDashboardMetrics() {
  const now = new Date();
  if (cachedMetrics && cachedMetrics.expiresAt > now.getTime()) {
    return cachedMetrics.data;
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Run queries concurrently with database indexing
  const [
    activeMembers,
    expiringSoon,
    expired,
    passagesToday,
    revenueTodayAgg,
    revenueMonthAgg,
    blockedCards,
    plans,
  ] = await Promise.all([
    // Active members: have at least one active subscription valid today
    prisma.member.count({
      where: {
        deletedAt: null,
        subscriptions: {
          some: {
            status: "ACTIVE",
            endDate: { gte: now },
          },
        },
      },
    }),
    // Expiring soon: valid today but expiring within 7 days
    prisma.member.count({
      where: {
        deletedAt: null,
        subscriptions: {
          some: {
            status: "ACTIVE",
            endDate: { gte: now, lte: in7Days },
          },
        },
      },
    }),
    // Expired: has subscription but latest is expired, and no active subscription
    prisma.member.count({
      where: {
        deletedAt: null,
        subscriptions: {
          some: {
            endDate: { lt: now },
          },
          none: {
            status: "ACTIVE",
            endDate: { gte: now },
          },
        },
      },
    }),
    prisma.accessLog.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.card.count({
      where: { status: "BLOCKED" },
    }),
    prisma.plan.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { subscriptions: { _count: "desc" } },
    }),
  ]);

  const revenueToday = revenueTodayAgg._sum.amount || 0;
  const revenueMonth = revenueMonthAgg._sum.amount || 0;

  const planColors = ["#2563EB", "#0EA5E9", "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B"];
  const planBreakdown = plans
    .filter((p) => p._count.subscriptions > 0)
    .map((p, idx) => ({
      label: p.name,
      count: p._count.subscriptions,
      color: planColors[idx % planColors.length],
    }));

  const statusBreakdown = [
    { label: "Actifs", count: Math.max(0, activeMembers - expiringSoon), color: "#2563EB" },
    { label: "Expirent sous 7j", count: expiringSoon, color: "#F59E0B" },
    { label: "Expirés", count: expired, color: "#EF4444" },
  ];

  const result = {
    activeMembers,
    expiringSoon,
    expired,
    passagesToday,
    revenueToday,
    revenueMonth,
    blockedCards,
    statusBreakdown,
    planBreakdown,
  };

  cachedMetrics = { data: result, expiresAt: now.getTime() + 15000 };
  return result;
}

export interface HeatmapBucket {
  dayIndex: number; // 0 = Lundi, 1 = Mardi ... 6 = Dimanche
  slotIndex: number; // 0 (06h-08h) to 11 (22h-24h)
  dayLabel: string;
  slotLabel: string;
  count: number;
}

export async function getHeatmapData(days: number = 28) {
  const nowMs = Date.now();
  if (cachedHeatmap && cachedHeatmap.expiresAt > nowMs) {
    return cachedHeatmap.data;
  }

  const since = new Date(nowMs - days * 24 * 60 * 60 * 1000);
  const logs = await prisma.accessLog.findMany({
    where: {
      createdAt: { gte: since },
    },
    select: {
      createdAt: true,
    },
  });

  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const slotLabels = [
    "06–08", "08–10", "10–12", "12–14", "14–16", "16–18",
    "18–20", "20–22", "22–24", "00–02", "02–04", "04–06"
  ];

  // Initialize matrix 7 x 12
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(12).fill(0));

  for (const log of logs) {
    const d = new Date(log.createdAt);
    const jsDay = d.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

    const hour = d.getHours();
    let slotIndex = 0;
    if (hour >= 6 && hour < 24) {
      slotIndex = Math.floor((hour - 6) / 2);
    } else {
      slotIndex = Math.floor(hour / 2) + 9;
    }

    if (dayIndex >= 0 && dayIndex < 7 && slotIndex >= 0 && slotIndex < 12) {
      matrix[dayIndex][slotIndex]++;
    }
  }

  const buckets: HeatmapBucket[] = [];
  let peak = 0;

  for (let day = 0; day < 7; day++) {
    for (let slot = 0; slot < 12; slot++) {
      const count = matrix[day][slot];
      if (count > peak) peak = count;
      buckets.push({
        dayIndex: day,
        slotIndex: slot,
        dayLabel: dayLabels[day],
        slotLabel: slotLabels[slot],
        count,
      });
    }
  }

  const result = {
    buckets,
    peak,
    totalPassages: logs.length,
    daysCovered: days,
  };

  cachedHeatmap = { data: result, expiresAt: nowMs + 60000 };
  return result;
}

export async function getRecentActivity(limit: number = 20) {
  return await prisma.accessLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}
