"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/business/KpiCard";
import { Card } from "@/components/business/Card";
import { Heatmap } from "@/components/business/Heatmap";
import { DistributionDonutChart } from "@/components/business/DistributionDonutChart";
import { StatusPill } from "@/components/business/StatusPill";
import { Button } from "@/components/business/Button";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/dates";
import {
  Users,
  AlertCircle,
  CalendarX,
  ScanLine,
  Coins,
  TrendingUp,
  Check,
  X,
  ArrowRight,
} from "lucide-react";

import { getCachedData, setCachedData } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

interface Metrics {
  activeMembers: number;
  expiringSoon: number;
  expired: number;
  passagesToday: number;
  revenueToday: number;
  revenueMonth: number;
  blockedCards: number;
  statusBreakdown?: { label: string; count: number; color: string }[];
  planBreakdown?: { label: string; count: number; color: string }[];
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<Metrics | null>(() => getCachedData("/api/dashboard/metrics"));
  const [heatmapData, setHeatmapData] = useState<any>(() => getCachedData("/api/dashboard/heatmap"));
  const [recentLogs, setRecentLogs] = useState<any[]>(() => getCachedData("/api/dashboard/activity?limit=15") || []);
  const [isLoading, setIsLoading] = useState(() => !metrics);

  const fetchDashboardData = () => {
    Promise.all([
      fetch("/api/dashboard/metrics").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/dashboard/heatmap").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/dashboard/activity?limit=15").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([m, h, a]) => {
        if (m && !m.error) {
          setMetrics(m);
          setCachedData("/api/dashboard/metrics", m);
        }
        if (h && !h.error && Array.isArray(h.buckets)) {
          setHeatmapData(h);
          setCachedData("/api/dashboard/heatmap", h);
        }
        if (Array.isArray(a)) {
          setRecentLogs(a);
          setCachedData("/api/dashboard/activity?limit=15", a);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();

    const onInvalidate = (e: Event) => {
      const customEvent = e as CustomEvent<{ prefixes?: string[] }>;
      const prefixes = customEvent.detail?.prefixes;
      if (!prefixes || prefixes.length === 0 || prefixes.some((p) => p.includes("dashboard"))) {
        fetchDashboardData();
      }
    };

    window.addEventListener("passpro:cache-invalidate", onInvalidate);
    return () => window.removeEventListener("passpro:cache-invalidate", onInvalidate);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/payments">
            <Button variant="primary">{t("dashboard.newSubscription")}</Button>
          </Link>
        </div>
      </div>

      {/* 1. Asymmetric Dynamic KPI Section: 1 Grand Hero + 5 Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4.5 items-stretch">
        {/* Grand Hero KPI Card (Left: 5 cols on desktop) */}
        <div className="lg:col-span-5 flex">
          <KpiCard
            size="hero"
            label={t("dashboard.activeSubs")}
            value={metrics ? metrics.activeMembers : "—"}
            context={t("dashboard.activeSubsContext")}
            icon={<Users className="w-5 h-5" />}
            href="/members?filter=active"
            className="w-full h-full"
          />
        </div>

        {/* 5 Compact Cards (Right: 7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3.5">
          {/* Row 1: Daily Activity & Revenue (3 compact cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1">
            <KpiCard
              size="compact"
              label={t("dashboard.todayEntries")}
              value={metrics ? metrics.passagesToday : "—"}
              context={t("dashboard.todayEntriesContext")}
              icon={<ScanLine className="w-4 h-4" />}
              href="/access-logs"
            />
            <KpiCard
              size="compact"
              label={t("dashboard.todayRevenue")}
              value={metrics ? formatMoney(metrics.revenueToday) : "—"}
              context={t("dashboard.todayRevenueContext")}
              icon={<Coins className="w-4 h-4" />}
              href="/payments?period=today"
            />
            <KpiCard
              size="compact"
              label={t("dashboard.monthRevenue")}
              value={metrics ? formatMoney(metrics.revenueMonth) : "—"}
              context={t("dashboard.monthRevenueContext")}
              icon={<TrendingUp className="w-4 h-4" />}
              href="/payments?period=month"
            />
          </div>

          {/* Row 2: Renewal Alerts (2 compact cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
            <KpiCard
              size="compact"
              label={t("dashboard.expiringSoon")}
              value={metrics ? metrics.expiringSoon : "—"}
              context={t("dashboard.expiringSoonContext")}
              variant="alert"
              icon={<AlertCircle className="w-4 h-4" />}
              href="/members?filter=expiring_soon"
            />
            <KpiCard
              size="compact"
              label={t("dashboard.expired")}
              value={metrics ? metrics.expired : "—"}
              context={t("dashboard.expiredContext")}
              variant="alert"
              icon={<CalendarX className="w-4 h-4" />}
              href="/members?filter=expired"
            />
          </div>
        </div>
      </div>

      {/* 2. Two Columns (2fr / 1fr): Heatmap & Distribution Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex">
          <Card
            title={t("dashboard.hourlyHeatmap")}
            subtitle={t("dashboard.hourlyHeatmapSubtitle")}
            className="w-full flex flex-col justify-between"
          >
            {heatmapData?.buckets ? (
              <Heatmap buckets={heatmapData.buckets} />
            ) : (
              <div className="h-44 flex items-center justify-center text-[#64748B] text-[13px]">
                {t("dashboard.loadingMap")}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 flex">
          <Card
            title={t("dashboard.subscriptionBreakdown")}
            subtitle={t("dashboard.subscriptionBreakdownSubtitle")}
            noPadding
            className="w-full flex flex-col justify-between"
          >
            <DistributionDonutChart
              statusData={metrics?.statusBreakdown || []}
              planData={metrics?.planBreakdown || []}
            />
          </Card>
        </div>
      </div>

      {/* 3. Recent Activity Feed (Full width) */}
      <Card
        title={t("dashboard.recentActivity")}
        subtitle={t("dashboard.recentActivitySubtitle")}
        action={
          <Link href="/access-logs">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              {t("dashboard.viewAllLogs")}
            </Button>
          </Link>
        }
      >
        <div className="divide-y divide-[#F1F5F9] -mx-5 -my-2">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-[#64748B] text-[13px]">
              {t("dashboard.noRecentActivity")}
            </div>
          ) : (
            recentLogs.map((log) => {
              const isGranted = log.decision === "GRANTED";
              return (
                <div
                  key={log.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isGranted
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : "bg-[#FEF2F2] text-[#DC2626]"
                      }`}
                    >
                      {isGranted ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <X className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-[#0F172A] truncate">
                        {log.member
                          ? `${log.member.firstName} ${log.member.lastName}`
                          : t("dashboard.unassignedBadge")}
                      </div>
                      <div className="text-[12px] text-[#64748B] flex items-center gap-2 mt-0.5">
                        <span className="font-mono-code font-medium">{log.cardUid}</span>
                        <span>·</span>
                        <span>{log.kioskName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <StatusPill status={log.decision} />
                    <span className="text-[12px] text-[#64748B] min-w-[70px] text-right">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
