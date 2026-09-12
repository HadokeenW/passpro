"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/business/Card";
import { FilterPills } from "@/components/business/FilterPills";
import { StatusPill } from "@/components/business/StatusPill";
import { Button } from "@/components/business/Button";
import { EmptyState } from "@/components/business/EmptyState";
import { PaymentModal } from "@/components/business/PaymentModal";
import { ReceiptModal } from "@/components/business/ReceiptModal";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/components/business/Toast";

import { getCachedData, setCachedData, invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

export default function SubscriptionsPage() {
  const toast = useToast();
  const { t, language } = useTranslation();
  const initialCacheKey = "/api/subscriptions?page=1&pageSize=15&status=all";
  const initialData = getCachedData<any>(initialCacheKey);

  const [subscriptions, setSubscriptions] = useState<any[]>(() => initialData?.items || []);
  const [total, setTotal] = useState(() => initialData?.total || 0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(() => !initialData);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const fetchSubscriptions = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "15",
      status: statusFilter,
    });
    const url = `/api/subscriptions?${params.toString()}`;
    const cached = getCachedData<any>(url);

    if (cached) {
      setSubscriptions(cached.items || []);
      setTotal(cached.total || 0);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setSubscriptions(data.items);
          setTotal(data.total);
          setCachedData(url, data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSubscriptions();

    const onInvalidate = (e: Event) => {
      const customEvent = e as CustomEvent<{ prefixes?: string[] }>;
      const prefixes = customEvent.detail?.prefixes;
      if (!prefixes || prefixes.length === 0 || prefixes.some((p) => p.includes("subscription"))) {
        fetchSubscriptions();
      }
    };

    window.addEventListener("passpro:cache-invalidate", onInvalidate);
    return () => window.removeEventListener("passpro:cache-invalidate", onInvalidate);
  }, [page, statusFilter]);

  const handleToggleSuspend = async (sub: any) => {
    const isSuspended = sub.status === "SUSPENDED";
    const action = isSuspended ? "reactivate" : "suspend";
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}/${action}`, { method: "POST" });
      if (res.ok) {
        invalidateCache(["/api/subscriptions", "/api/dashboard", "/api/members"]);
        toast.success(
          isSuspended
            ? language === "ar" ? "تمت إعادة تفعيل الاشتراك" : language === "en" ? "Subscription reactivated" : "Abonnement réactivé"
            : language === "ar" ? "تم إيقاف الاشتراك مؤقتاً" : language === "en" ? "Subscription suspended" : "Abonnement suspendu",
          `${sub.member.firstName} ${sub.member.lastName}`
        );
        fetchSubscriptions();
      } else {
        const d = await res.json();
        toast.error(
          language === "ar" ? "تعذر تنفيذ الإجراء" : language === "en" ? "Action failed" : "Action impossible",
          d.error?.message || (language === "ar" ? "خطأ في التحديث" : language === "en" ? "Update error" : "Erreur de mise à jour")
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        language === "ar" ? "خطأ في الشبكة" : language === "en" ? "Network error" : "Erreur réseau",
        language === "ar" ? "تعذر الاتصال بالخادم" : language === "en" ? "Unable to reach server" : "Impossible de contacter le serveur"
      );
    }
  };

  const [gymName, setGymName] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.gymName) setGymName(d.gymName);
      })
      .catch(() => {});
  }, []);

  const getWhatsAppUrl = (sub: any) => {
    const rawPhone = (sub.member?.phone || "").replace(/[^0-9]/g, "");
    if (!rawPhone) return null;
    const cleanPhone = rawPhone.startsWith("0") ? `213${rawPhone.slice(1)}` : rawPhone;
    const isExpiring = sub.status === "EXPIRING_SOON";
    const club = gymName || (language === "ar" ? "النادي" : language === "en" ? "the gym" : "de la salle");

    let msg = "";
    if (language === "ar") {
      msg = isExpiring
        ? `مرحباً ${sub.member.firstName}، ينتهي اشتراكك في ${club} (${sub.plan.name}) بتاريخ ${formatDate(sub.endDate)} (${sub.daysRemaining} يوم متبقي). يرجى التجديد لدى الاستقبال لمواصلة تدريباتك بدون انقطاع!`
        : `مرحباً ${sub.member.firstName}، انتهت صلاحية اشتراكك في ${club} (${sub.plan.name}) بتاريخ ${formatDate(sub.endDate)}. تفضل بالتجديد لإعادة تفعيل بطاقتك فوراً!`;
    } else if (language === "en") {
      msg = isExpiring
        ? `Hello ${sub.member.firstName}, your membership at ${club} (${sub.plan.name}) expires on ${formatDate(sub.endDate)} (${sub.daysRemaining} day(s) remaining). Remember to renew at front desk!`
        : `Hello ${sub.member.firstName}, your membership at ${club} (${sub.plan.name}) expired on ${formatDate(sub.endDate)}. Please renew to reactivate your access badge!`;
    } else {
      msg = isExpiring
        ? `Bonjour ${sub.member.firstName}, votre abonnement ${club} (${sub.plan.name}) arrive à échéance le ${formatDate(sub.endDate)} (${sub.daysRemaining} jour${sub.daysRemaining > 1 ? "s" : ""} restant${sub.daysRemaining > 1 ? "s" : ""}). Pensez à le renouveler à l'accueil pour continuer vos entraînements sans interruption !`
        : `Bonjour ${sub.member.firstName}, votre abonnement ${club} (${sub.plan.name}) a expiré le ${formatDate(sub.endDate)}. Venez le renouveler à la salle pour réactiver immédiatement votre badge !`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const filterOptions = [
    { label: t("subscriptions.filters.all"), value: "all" },
    { label: t("subscriptions.filters.active"), value: "active" },
    { label: t("subscriptions.filters.expiring"), value: "expiring" },
    { label: t("subscriptions.filters.expired"), value: "expired" },
    { label: t("subscriptions.filters.suspended"), value: "suspended" },
    { label: t("subscriptions.filters.debt"), value: "debt" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            {t("subscriptions.title")}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {t("subscriptions.subtitle")}
          </p>
        </div>
      </div>

      {/* Toolbar: FilterPills */}
      <div className="flex items-center justify-between bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
        <FilterPills
          options={filterOptions}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        />
        <div className="text-[13px] text-[#64748B]">
          {language === "ar" ? "الإجمالي :" : language === "en" ? "Total:" : "Total :"} <span className="font-semibold text-[#0F172A] nums">{total}</span>
        </div>
      </div>

      {/* Table */}
      <Card noPadding>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
            {t("subscriptions.loading")}
          </div>
        ) : subscriptions.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="w-8 h-8" />}
            title={t("subscriptions.emptyTitle")}
            description={t("subscriptions.emptyDesc")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">{t("subscriptions.table.member")}</th>
                  <th className="px-4">{t("subscriptions.table.planPrice")}</th>
                  <th className="px-4">{t("subscriptions.table.period")}</th>
                  <th className="px-4">{t("subscriptions.table.balanceDue")}</th>
                  <th className="px-4 text-center">{t("subscriptions.table.status")}</th>
                  <th className="px-5 text-right">{t("subscriptions.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="h-12 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 font-semibold text-[#0F172A]">
                      <Link
                        href={`/members/${s.member.id}`}
                        className="hover:text-[#2563EB] hover:underline"
                      >
                        {s.member.firstName} {s.member.lastName}
                      </Link>
                    </td>
                    <td className="px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                          <span>{s.plan.name}</span>
                          {s.planType === "SESSIONS" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                              🎟️ {s.remainingSessions ?? 0} {language === "ar" ? "حصص" : language === "en" ? "sess." : "séanc."}
                            </span>
                          )}
                          {s.planType === "TIME_SLOT" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                              🕒 {s.startTime || "13h"}-{s.endTime || "16h"}
                            </span>
                          )}
                        </div>
                        {s.balanceDue > 0 && (
                          <div>
                            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] nums">
                              {language === "ar" ? "متبقي :" : language === "en" ? "Due:" : "Reste :"} {formatMoney(s.balanceDue)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 text-[#64748B] nums">
                      {formatDate(s.startDate)} — {formatDate(s.endDate)}
                    </td>
                    <td className="px-4 font-semibold nums">
                      {s.balanceDue > 0 ? (
                        <span className="text-[#DC2626]">{formatMoney(s.balanceDue)}</span>
                      ) : (
                        <span className="text-[#059669]">0 DZD</span>
                      )}
                    </td>
                    <td className="px-4 text-center">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleSuspend(s)}
                          title={s.status === "SUSPENDED" ? t("subscriptions.actions.reactivate") : t("subscriptions.actions.suspend")}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                        >
                          {s.status === "SUSPENDED" ? (
                            <PlayCircle className="w-4 h-4 text-[#059669]" />
                          ) : (
                            <PauseCircle className="w-4 h-4 text-[#D97706]" />
                          )}
                        </button>

                        {getWhatsAppUrl(s) && (s.status === "EXPIRING_SOON" || s.status === "EXPIRED") && (
                          <a
                            href={getWhatsAppUrl(s)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t("subscriptions.actions.whatsapp")}
                            className="w-7 h-7 flex items-center justify-center rounded text-[#059669] hover:text-[#047857] hover:bg-[#ECFDF5] transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<RefreshCw className="w-3 h-3" />}
                          onClick={() => {
                            setSelectedMember(s.member);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          {language === "ar" ? "تجديد" : language === "en" ? "Renew" : "Renouveler"}
                        </Button>
                      </div>
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
            {language === "ar" ? (
              <>
                عرض <span className="font-semibold text-[#0F172A] nums">{subscriptions.length}</span> من أصل{" "}
                <span className="font-semibold text-[#0F172A] nums">{total}</span>
              </>
            ) : language === "en" ? (
              <>
                Showing <span className="font-semibold text-[#0F172A] nums">{subscriptions.length}</span> of{" "}
                <span className="font-semibold text-[#0F172A] nums">{total}</span>
              </>
            ) : (
              <>
                Affichage de <span className="font-semibold text-[#0F172A] nums">{subscriptions.length}</span> sur{" "}
                <span className="font-semibold text-[#0F172A] nums">{total}</span>
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

      {/* Renewal Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedMember={selectedMember}
        onPaymentSuccess={(payId) => {
          fetchSubscriptions();
          fetch(`/api/payments/${payId}`)
            .then((r) => r.json())
            .then((d) => setReceiptData(d));
        }}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        receiptData={receiptData}
      />
    </div>
  );
}
