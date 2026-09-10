import { prisma } from "@/lib/db";
import { deriveStatus } from "./subscriptions";

export async function getDashboardMetrics() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  // 1. Members and their latest subscriptions
  const members = await prisma.member.findMany({
    where: { deletedAt: null },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });

  let activeMembers = 0;
  let expiringSoon = 0;
  let expired = 0;

  for (const m of members) {
    const sub = m.subscriptions[0];
    if (!sub) continue;
    const status = deriveStatus(sub, now);
    if (status === "ACTIVE") {
      activeMembers++;
    } else if (status === "EXPIRING_SOON") {
      activeMembers++;
      expiringSoon++;
    } else if (status === "EXPIRED") {
      expired++;
    }
  }

  // 2. Passages today
  const passagesToday = await prisma.accessLog.count({
    where: {
      createdAt: { gte: startOfToday },
    },
  });

  // 3. Revenue today
  const paymentsToday = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startOfToday },
    },
    select: { amount: true },
  });
  const revenueToday = paymentsToday.reduce((sum, p) => sum + p.amount, 0);

  // 4. Revenue this month
  const paymentsMonth = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startOfMonth },
    },
    select: { amount: true },
  });
  const revenueMonth = paymentsMonth.reduce((sum, p) => sum + p.amount, 0);

  // 5. Blocked cards
  const blockedCards = await prisma.card.count({
    where: { status: "BLOCKED" },
  });

  return {
    activeMembers,
    expiringSoon,
    expired,
    passagesToday,
    revenueToday,
    revenueMonth,
    blockedCards,
  };
}

export interface HeatmapBucket {
  dayIndex: number; // 0 = Lundi, 1 = Mardi ... 6 = Dimanche
  slotIndex: number; // 0 (06h-08h) to 11 (22h-24h)
  dayLabel: string;
  slotLabel: string;
  count: number;
}

export async function getHeatmapData(days: number = 28) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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
    // getDay: 0 is Sun, 1 is Mon... convert so 0 is Mon, 6 is Sun
    const jsDay = d.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

    const hour = d.getHours();
    // 06 to 24, then 00 to 06
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

  return {
    buckets,
    peak,
    totalPassages: logs.length,
    daysCovered: days,
  };
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
