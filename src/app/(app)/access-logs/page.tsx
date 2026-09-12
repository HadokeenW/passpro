"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/business/Card";
import { SearchInput } from "@/components/business/SearchInput";
import { FilterPills } from "@/components/business/FilterPills";
import { StatusPill } from "@/components/business/StatusPill";
import { EmptyState } from "@/components/business/EmptyState";
import { formatDateTime } from "@/lib/dates";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { getCachedData, setCachedData } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function AccessLogsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const initialCacheKey = "/api/access/logs?page=1&pageSize=25&decision=all&q=";
  const initialData = getCachedData<any>(initialCacheKey);

  const [logs, setLogs] = useState<any[]>(() => initialData?.items || []);
  const [total, setTotal] = useState(() => initialData?.total || 0);
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(() => !initialData);

  const fetchLogs = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "25",
      decision,
      q: search,
    });
    const url = `/api/access/logs?${params.toString()}`;
    const cached = getCachedData<any>(url);

    if (cached) {
      setLogs(cached.items || []);
      setTotal(cached.total || 0);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setLogs(data.items);
          setTotal(data.total);
          setCachedData(url, data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();

    const onInvalidate = (e: Event) => {
      const customEvent = e as CustomEvent<{ prefixes?: string[] }>;
      const prefixes = customEvent.detail?.prefixes;
      if (!prefixes || prefixes.length === 0 || prefixes.some((p) => p.includes("access"))) {
        fetchLogs();
      }
    };

    window.addEventListener("passpro:cache-invalidate", onInvalidate);
    return () => window.removeEventListener("passpro:cache-invalidate", onInvalidate);
  }, [page, decision, search]);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).electronAPI?.onManagementRfidScan) return;

    const cleanup = (window as any).electronAPI.onManagementRfidScan((data: { uid: string }) => {
      const activeEl = typeof document !== "undefined" ? document.activeElement : null;
      // If top search bar is focused, leave it to top search bar!
      if (activeEl && (activeEl.id === "global-search-bar" || activeEl.getAttribute("data-global-search") === "true")) {
        return;
      }
      // If a dialog is open, let dialog handle it
      if (typeof document !== "undefined" && document.querySelector('[role="dialog"]')) {
        return;
      }

      if (data?.uid) {
        setSearch(data.uid.trim());
        setPage(1);
      }
    });

    return () => cleanup?.();
  }, []);

  const { language } = useTranslation();

  const translateReason = (reason: string) => {
    const map: Record<string, { fr: string; en: string; ar: string }> = {
      CARD_NOT_FOUND: { fr: "Badge non reconnu", en: "Card not recognized", ar: "بطاقة غير معروفة" },
      CARD_BLOCKED: { fr: "Badge bloqué", en: "Card blocked", ar: "بطاقة محظورة" },
      CARD_UNASSIGNED: { fr: "Badge non assigné", en: "Card unassigned", ar: "بطاقة غير مخصصة" },
      NO_ACTIVE_SUBSCRIPTION: { fr: "Aucun abonnement actif", en: "No active subscription", ar: "لا يوجد اشتراك نشط" },
      SUBSCRIPTION_EXPIRED: { fr: "Abonnement expiré", en: "Subscription expired", ar: "اشتراك منتهي الصلاحية" },
      SUBSCRIPTION_SUSPENDED: { fr: "Abonnement suspendu", en: "Subscription suspended", ar: "اشتراك موقوف مؤقتاً" },
      SESSIONS_EXHAUSTED: { fr: "Séances épuisées (0 restante)", en: "Sessions exhausted (0 remaining)", ar: "استنفدت الحصص (0 متبقية)" },
      OUTSIDE_TIME_WINDOW: { fr: "Hors créneau horaire autorisé", en: "Outside permitted time slot", ar: "خارج الفترة الزمنية المسموح بها" },
      ANTI_PASSBACK: { fr: "Anti-passback : badge déjà utilisé", en: "Anti-passback: card already used", ar: "منع تمرير البطاقة: استخدمت مؤخراً" },
      OK: { fr: "Accès autorisé", en: "Access granted", ar: "تم السماح بالدخول" },
      "Badge non reconnu": { fr: "Badge non reconnu", en: "Card not recognized", ar: "بطاقة غير معروفة" },
      "Badge bloqué": { fr: "Badge bloqué", en: "Card blocked", ar: "بطاقة محظورة" },
      "Badge non assigné": { fr: "Badge non assigné", en: "Card unassigned", ar: "بطاقة غير مخصصة" },
      "Aucun abonnement actif": { fr: "Aucun abonnement actif", en: "No active subscription", ar: "لا يوجد اشتراك نشط" },
      "Abonnement expiré": { fr: "Abonnement expiré", en: "Subscription expired", ar: "اشتراك منتهي الصلاحية" },
      "Abonnement suspendu": { fr: "Abonnement suspendu", en: "Subscription suspended", ar: "اشتراك موقوف مؤقتاً" },
      "Séances épuisées (0 restante)": { fr: "Séances épuisées (0 restante)", en: "Sessions exhausted (0 remaining)", ar: "استنفدت الحصص (0 متبقية)" },
      "Hors créneau horaire autorisé": { fr: "Hors créneau horaire autorisé", en: "Outside permitted time slot", ar: "خارج الفترة الزمنية المسموح بها" },
      "Accès autorisé": { fr: "Accès autorisé", en: "Access granted", ar: "تم السماح بالدخول" },
    };
    return map[reason]?.[language] || reason;
  };

  const decisionOptions = [
    { label: t("accessLogs.allPassages"), value: "all" },
    { label: t("accessLogs.granted"), value: "granted" },
    { label: t("accessLogs.denied"), value: "denied" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
          {t("accessLogs.title")}
        </h1>
        <p className="text-[14px] text-[#64748B] mt-0.5">
          {t("accessLogs.subtitle")}
        </p>
      </div>

      {/* 2. Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
        <SearchInput
          placeholder={t("accessLogs.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.keyCode === 13) {
              e.preventDefault();
            }
          }}
          className="w-full sm:w-[320px]"
        />
        <FilterPills
          options={decisionOptions}
          value={decision}
          onChange={(val) => {
            setDecision(val);
            setPage(1);
          }}
        />
      </div>

      {/* 3. Table in Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
            {t("accessLogs.loading")}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8" />}
            title={t("accessLogs.emptyTitle")}
            description={t("accessLogs.emptyDesc")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">{t("accessLogs.table.dateTime")}</th>
                  <th className="px-4">{t("accessLogs.table.member")}</th>
                  <th className="px-4">{t("accessLogs.table.badgeUid")}</th>
                  <th className="px-4">{t("accessLogs.table.kiosk")}</th>
                  <th className="px-4">{t("accessLogs.table.source")}</th>
                  <th className="px-4">{t("accessLogs.table.reasonStatus")}</th>
                  <th className="px-5 text-right">{t("accessLogs.table.decision")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {logs.map((log) => {
                  return (
                    <tr
                      key={log.id}
                      onClick={() => {
                        if (log.member?.id) {
                          router.push(`/members/${log.member.id}`);
                        }
                      }}
                      className={cn(
                        "h-12 hover:bg-[#F8FAFC] transition-colors",
                        log.member?.id && "cursor-pointer"
                      )}
                    >
                      <td className="px-5 font-medium text-[#0F172A] nums">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 font-semibold text-[#0F172A]">
                        {log.member ? (
                          <Link
                            href={`/members/${log.member.id}`}
                            className="hover:text-[#2563EB] hover:underline"
                          >
                            {log.member.firstName} {log.member.lastName}
                          </Link>
                        ) : (
                          <span className="text-[#94A3B8] font-normal">{t("accessLogs.unassignedCard")}</span>
                        )}
                      </td>
                      <td className="px-4 font-mono-code text-[#475569] font-medium">
                        {log.cardUid}
                      </td>
                      <td className="px-4 text-[#64748B]">{log.kioskName}</td>
                      <td className="px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono-code bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                          {log.source}
                        </span>
                      </td>
                      <td className="px-4 text-[#64748B]">{translateReason(log.reason)}</td>
                      <td className="px-5 text-right">
                        <StatusPill status={log.decision} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="h-12 px-5 border-t border-[#F1F5F9] flex items-center justify-between text-[13px] text-[#64748B]">
          <div>
            {t("accessLogs.pagination")
              .replace("{count}", String(logs.length))
              .replace("{total}", String(total))}
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium nums">{page}</span>
            <button
              disabled={page * 25 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
