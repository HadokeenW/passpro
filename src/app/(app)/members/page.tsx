"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { SearchInput } from "@/components/business/SearchInput";
import { FilterPills } from "@/components/business/FilterPills";
import { StatusPill } from "@/components/business/StatusPill";
import { EmptyState } from "@/components/business/EmptyState";
import { Users, UserPlus, ChevronLeft, ChevronRight, CreditCard, Download } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { downloadCsv } from "@/lib/csv";
import { getCachedData, setCachedData } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

export default function MembersPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const initialCacheKey = "/api/members?page=1&pageSize=15&filter=all&q=";
  const initialData = getCachedData<any>(initialCacheKey);

  const [members, setMembers] = useState<any[]>(() => initialData?.items || []);
  const [total, setTotal] = useState(() => initialData?.total || 0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(() => !initialData);

  const fetchMembers = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "15",
      filter,
      q: search,
    });
    const url = `/api/members?${params.toString()}`;
    const cached = getCachedData<any>(url);

    if (cached) {
      setMembers(cached.items || []);
      setTotal(cached.total || 0);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setMembers(data.items);
          setTotal(data.total);
          setCachedData(url, data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMembers();

    const onInvalidate = (e: Event) => {
      const customEvent = e as CustomEvent<{ prefixes?: string[] }>;
      const prefixes = customEvent.detail?.prefixes;
      if (!prefixes || prefixes.length === 0 || prefixes.some((p) => p.includes("member"))) {
        fetchMembers();
      }
    };

    window.addEventListener("passpro:cache-invalidate", onInvalidate);
    return () => window.removeEventListener("passpro:cache-invalidate", onInvalidate);
  }, [page, filter, search]);

  const filterOptions = [
    { label: t("members.filters.all"), value: "all" },
    { label: t("members.filters.active"), value: "active" },
    { label: t("members.filters.inactive"), value: "inactive" },
    { label: t("members.filters.debt"), value: "debt" },
    { label: t("members.filters.blocked"), value: "blocked" },
  ];

  const tLabels = {
    csvHeaders: {
      fr: ["Nom", "Prénom", "Téléphone", "Email", "Badge RFID", "Formule", "Statut Abonnement", "Échéance", "Date Inscription"],
      en: ["Last Name", "First Name", "Phone", "Email", "RFID Badge", "Plan", "Subscription Status", "Expiry Date", "Registration Date"],
      ar: ["اللقب", "الاسم", "الهاتف", "البريد الإلكتروني", "بطاقة RFID", "الاشتراك", "حالة الاشتراك", "تاريخ الانتهاء", "تاريخ التسجيل"],
    },
    expiryHeader: { fr: "Échéance", en: "Expiry Date", ar: "تاريخ الانتهاء" },
    dueLabel: { fr: "Reste :", en: "Due:", ar: "متبقي:" },
    sessionsUnit: { fr: "séanc.", en: "sess.", ar: "حصص" },
    noCard: { fr: "Aucun badge", en: "No card", ar: "بدون بطاقة" },
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`/api/members?pageSize=1000&filter=${filter}&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      const items = data.items || members;
      const headers = tLabels.csvHeaders[language];
      const rows = items.map((m: any) => {
        const sub = m.currentSubscription;
        return [
          m.lastName,
          m.firstName,
          m.phone || "",
          m.email || "",
          m.activeCard?.uid || "",
          sub?.planName || (language === "ar" ? "لا يوجد" : "Aucun"),
          sub?.status === "ACTIVE"
            ? (language === "ar" ? "نشط" : language === "en" ? "Active" : "Actif")
            : sub?.status === "EXPIRING_SOON"
            ? (language === "ar" ? "ينتهي قريباً" : language === "en" ? "Expiring soon" : "Expire bientôt")
            : sub?.status || (language === "ar" ? "غير نشط" : "Inactif"),
          sub?.endDate ? formatDate(sub.endDate) : "",
          formatDate(m.createdAt),
        ];
      });
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      downloadCsv(`adherents-${dateStr}`, headers, rows);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            {t("members.title")}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {t("members.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            {t("members.exportCsv")}
          </Button>
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("passpro:open-onboarding"));
              }
            }}
          >
            {t("members.newMember")}
          </Button>
        </div>
      </div>

      {/* 2. Toolbar: Search + FilterPills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
        <SearchInput
          placeholder={t("members.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-[320px]"
        />
        <FilterPills
          options={filterOptions}
          value={filter}
          onChange={(val) => {
            setFilter(val);
            setPage(1);
          }}
        />
      </div>

      {/* 3. Table in Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
            {t("members.loading")}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={t("members.emptyTitle")}
            description={t("members.emptyDesc")}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("passpro:open-onboarding"));
                  }
                }}
              >
                {t("members.newMember")}
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">{t("members.table.member")}</th>
                  <th className="px-4">{t("members.table.contact")}</th>
                  <th className="px-4">{t("members.table.planValidity")}</th>
                  <th className="px-4">{t("members.table.card")}</th>
                  <th className="px-4">{tLabels.expiryHeader[language]}</th>
                  <th className="px-5 text-right">{t("members.table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {members.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => router.push(`/members/${m.id}`)}
                    className="h-12 hover:bg-[#F8FAFC] transition-colors cursor-pointer group select-none text-[13px]"
                  >
                    <td className="px-5 font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="px-4 text-[#64748B]">
                      {m.phone || m.email || "—"}
                    </td>
                    <td className="px-4">
                      {m.subscription ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                            <span>{m.subscription.planName}</span>
                            {m.subscription.planType === "SESSIONS" && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                                {m.subscription.remainingSessions ?? 0} {tLabels.sessionsUnit[language]}
                              </span>
                            )}
                            {m.subscription.planType === "TIME_SLOT" && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                                {m.subscription.startTime || "13h"}-{m.subscription.endTime || "16h"}
                              </span>
                            )}
                          </div>
                          {m.subscription.balanceDue > 0 && (
                            <div>
                              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] nums">
                                {tLabels.dueLabel[language]} {formatMoney(m.subscription.balanceDue)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="px-4">
                      {m.card ? (
                        <div className="inline-flex items-center gap-1.5 font-mono-code text-[12px] font-medium text-[#475569]">
                          <CreditCard className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{m.card.uid}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#94A3B8]">{tLabels.noCard[language]}</span>
                      )}
                    </td>
                    <td className="px-4 text-[#64748B] nums">
                      {m.subscription ? formatDate(m.subscription.endDate) : "—"}
                    </td>
                    <td className="px-5 text-right">
                      <StatusPill
                        status={
                          m.card?.status === "BLOCKED"
                            ? "BLOCKED"
                            : m.subscription?.status || "NO_SUBSCRIPTION"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="h-12 px-5 border-t border-[#F1F5F9] flex items-center justify-between text-[13px] text-[#64748B]">
          <div>
            {total > 0 && (
              <>
                {t("members.pagination.showing")}{" "}
                <span className="font-medium text-[#0F172A] nums">
                  {(page - 1) * 15 + 1}
                </span>{" "}
                {t("members.pagination.to")}{" "}
                <span className="font-medium text-[#0F172A] nums">
                  {Math.min(page * 15, total)}
                </span>{" "}
                {t("members.pagination.of")}{" "}
                <span className="font-medium text-[#0F172A] nums">{total}</span>{" "}
                {t("members.pagination.members")}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="px-2 font-medium nums">{page}</span>
            <button
              disabled={page * 15 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
