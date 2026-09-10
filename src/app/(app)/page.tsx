"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/business/KpiCard";
import { Card } from "@/components/business/Card";
import { Heatmap } from "@/components/business/Heatmap";
import { QuickScanWidget } from "@/components/business/QuickScanWidget";
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

interface Metrics {
  activeMembers: number;
  expiringSoon: number;
  expired: number;
  passagesToday: number;
  revenueToday: number;
  revenueMonth: number;
  blockedCards: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/metrics").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/dashboard/heatmap").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/dashboard/activity?limit=15").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([m, h, a]) => {
        if (m && !m.error) setMetrics(m);
        if (h && !h.error && Array.isArray(h.buckets)) setHeatmapData(h);
        if (Array.isArray(a)) setRecentLogs(a);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Activité du club et passages RFID en direct
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/payments">
            <Button variant="primary">Encaisser un abonnement</Button>
          </Link>
        </div>
      </div>

      {/* 1. 6 KPI Cards Grid (3 x 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Adhérents actifs"
          value={metrics ? metrics.activeMembers : "—"}
          context="À jour de cotisation"
          icon={<Users className="w-5 h-5" />}
          href="/members?filter=active"
        />
        <KpiCard
          label="Expirent bientôt"
          value={metrics ? metrics.expiringSoon : "—"}
          context="Dans les 7 prochains jours"
          variant="alert"
          icon={<AlertCircle className="w-5 h-5" />}
          href="/subscriptions?status=expiring"
        />
        <KpiCard
          label="Abonnements expirés"
          value={metrics ? metrics.expired : "—"}
          context="À renouveler en caisse"
          variant="alert"
          icon={<CalendarX className="w-5 h-5" />}
          href="/subscriptions?status=expired"
        />
        <KpiCard
          label="Passages aujourd'hui"
          value={metrics ? metrics.passagesToday : "—"}
          context="Badges validés ou refusés"
          icon={<ScanLine className="w-5 h-5" />}
          href="/access-logs"
        />
        <KpiCard
          label="Recettes du jour"
          value={metrics ? formatMoney(metrics.revenueToday) : "—"}
          context="Total encaissé aujourd'hui"
          icon={<Coins className="w-5 h-5" />}
          href="/payments?period=today"
        />
        <KpiCard
          label="Recettes du mois"
          value={metrics ? formatMoney(metrics.revenueMonth) : "—"}
          context="Cumul du mois en cours"
          icon={<TrendingUp className="w-5 h-5" />}
          href="/payments?period=month"
        />
      </div>

      {/* 2. Two Columns (2fr / 1fr): Heatmap & Quick Scan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Affluence — 28 derniers jours"
            subtitle="Distribution des passages par créneau de 2 heures"
          >
            {heatmapData?.buckets ? (
              <Heatmap buckets={heatmapData.buckets} />
            ) : (
              <div className="h-44 flex items-center justify-center text-[#64748B] text-[13px]">
                Chargement de la cartographie...
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <QuickScanWidget />
        </div>
      </div>

      {/* 3. Recent Activity Feed (Full width) */}
      <Card
        title="Derniers passages à la borne"
        subtitle="Flux temps réel des scans et décisions d'accès"
        action={
          <Link href="/access-logs">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Tout le journal
            </Button>
          </Link>
        }
      >
        <div className="divide-y divide-[#F1F5F9] -mx-5 -my-2">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-[#64748B] text-[13px]">
              Aucun passage récent enregistré
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
                          : "Badge non assigné"}
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
