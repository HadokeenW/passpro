"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { KpiCard } from "@/components/business/KpiCard";
import { FilterPills } from "@/components/business/FilterPills";
import { EmptyState } from "@/components/business/EmptyState";
import { PaymentModal } from "@/components/business/PaymentModal";
import { ReceiptModal } from "@/components/business/ReceiptModal";
import { DailyReportModal } from "@/components/business/DailyReportModal";
import { PosTerminal } from "@/components/business/PosTerminal";
import { ProductsCatalogView } from "@/components/business/ProductsCatalogView";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { downloadCsv } from "@/lib/csv";
import {
  Receipt,
  Plus,
  Printer,
  ChevronLeft,
  ChevronRight,
  Coins,
  Download,
  ClipboardCheck,
  ShoppingCart,
  Package,
} from "lucide-react";

import { getCachedData, setCachedData } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

export default function PaymentsPage() {
  const { t, language } = useTranslation();
  const initialCacheKey = "/api/payments?page=1&pageSize=15&period=today";
  const initialData = getCachedData<any>(initialCacheKey);

  // Active view tab: "pos" (default) | "journal" | "products"
  const [activeTab, setActiveTab] = useState<"pos" | "journal" | "products">("pos");

  const [payments, setPayments] = useState<any[]>(() => initialData?.items || []);
  const [summary, setSummary] = useState<any>(() => initialData?.summary || { totalAmount: 0, count: 0 });
  const [total, setTotal] = useState(() => initialData?.total || 0);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState("today");
  const [isLoading, setIsLoading] = useState(() => !initialData);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const fetchPayments = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "15",
      period,
    });
    const url = `/api/payments?${params.toString()}`;
    const cached = getCachedData<any>(url);

    if (cached) {
      setPayments(cached.items || []);
      setTotal(cached.total || 0);
      if (cached.summary) setSummary(cached.summary);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setPayments(data.items);
          setTotal(data.total);
          if (data.summary) setSummary(data.summary);
          setCachedData(url, data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPayments();

    const onInvalidate = (e: Event) => {
      const customEvent = e as CustomEvent<{ prefixes?: string[] }>;
      const prefixes = customEvent.detail?.prefixes;
      if (!prefixes || prefixes.length === 0 || prefixes.some((p) => p.includes("payment"))) {
        fetchPayments();
      }
    };

    window.addEventListener("passpro:cache-invalidate", onInvalidate);
    return () => window.removeEventListener("passpro:cache-invalidate", onInvalidate);
  }, [page, period]);

  const handleReprint = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/reprint`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReceiptData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const periodOptions = [
    { label: t("payments.periods.today"), value: "today" },
    { label: t("payments.periods.week"), value: "week" },
    { label: t("payments.periods.month"), value: "month" },
    { label: t("payments.periods.all"), value: "all" },
  ];

  const methodLabels: Record<string, string> = {
    CASH: t("payments.methods.CASH"),
    CARD: t("payments.methods.CARD"),
    OTHER: t("payments.methods.OTHER"),
  };

  const tLabels = {
    kpiPeriodPrefix: { fr: "Période :", en: "Period:", ar: "الفترة:" },
    kpiTransTitle: { fr: "Transactions enregistrées", en: "Processed Transactions", ar: "العمليات المسجلة" },
    kpiTransCtx: { fr: "Nombre de reçus émis", en: "Issued receipts count", ar: "عدد الإيصالات الصادرة" },
    totalLabel: { fr: "Total :", en: "Total:", ar: "الإجمالي:" },
    systemOperator: { fr: "Système", en: "System", ar: "النظام" },
    walkInCustomer: { fr: "Client comptoir", en: "Walk-in Customer", ar: "زبون عابر" },
    subscribePlan: { fr: "+ Encaisser un abonnement", en: "+ Subscribe / Renew", ar: "+ تحصيل اشتراك" },
    csvHeaders: {
      fr: ["Numéro Reçu", "Date & Heure", "Client / Adhérent", "Téléphone", "Détail / Formule", "Mode de règlement", "Montant (DA)", "Opérateur"],
      en: ["Receipt Number", "Date & Time", "Customer / Member", "Phone", "Detail / Plan", "Payment Method", "Amount (DZD)", "Operator"],
      ar: ["رقم الوصل", "التاريخ والوقت", "الزبون / المشترك", "الهاتف", "البيان / الاشتراك", "وسيلة الدفع", "المبلغ (دج)", "المستخدم"],
    },
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`/api/payments?period=${period}&pageSize=1000`);
      const data = await res.json();
      const items = data.items || payments;
      const headers = tLabels.csvHeaders[language];
      const rows = items.map((p: any) => [
        p.receiptNumber,
        formatDateTime(p.createdAt),
        p.member ? `${p.member.firstName || ""} ${p.member.lastName || ""}`.trim() : tLabels.walkInCustomer[language],
        p.member?.phone || "",
        p.planName || p.subscription?.plan?.name || (language === "ar" ? "اشتراك" : "Abonnement"),
        methodLabels[p.method] || p.method,
        p.amount,
        p.operator?.name || tLabels.systemOperator[language],
      ]);
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      downloadCsv(`caisse-${period}-${dateStr}`, headers, rows);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with dynamic title and action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            {activeTab === "pos"
              ? (t("pos.title") || "Caisse & Mini POS")
              : activeTab === "products"
              ? (t("pos.tabs.products") || "Stocks & Produits")
              : t("payments.title")}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {activeTab === "pos"
              ? (t("pos.subtitle") || "Encaissement rapide de boissons, barres protéinées et consommables")
              : activeTab === "products"
              ? "Gestion du catalogue de consommables, prix et réassort"
              : t("payments.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === "journal" && (
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCsv}
            >
              {t("payments.exportCsv")}
            </Button>
          )}

          <Button
            variant="secondary"
            leftIcon={<ClipboardCheck className="w-4 h-4 text-[#2563EB]" />}
            onClick={() => setIsDailyReportOpen(true)}
          >
            {t("payments.closeZReport")}
          </Button>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            {tLabels.subscribePlan[language]}
          </Button>
        </div>
      </div>

      {/* 2. Top Segmented View Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#E2E8F0]/70 rounded-[18px] border border-[#E2E8F0] w-fit shadow-xs">
        <button
          onClick={() => setActiveTab("pos")}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-[13px] text-[13px] font-bold transition-all cursor-pointer ${
            activeTab === "pos"
              ? "bg-white text-[#2563EB] shadow-xs"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t("pos.tabs.pos") || "Terminal Mini POS"}</span>
        </button>

        <button
          onClick={() => setActiveTab("journal")}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-[13px] text-[13px] font-bold transition-all cursor-pointer ${
            activeTab === "journal"
              ? "bg-white text-[#0F172A] shadow-xs"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{t("pos.tabs.journal") || "Journal des Règlements"}</span>
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-[13px] text-[13px] font-bold transition-all cursor-pointer ${
            activeTab === "products"
              ? "bg-white text-[#0F172A] shadow-xs"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t("pos.tabs.products") || "Stocks & Produits"}</span>
        </button>
      </div>

      {/* ─── TAB 1: MINI POS (DEFAULT) ─── */}
      {activeTab === "pos" && (
        <PosTerminal onSaleSuccess={fetchPayments} />
      )}

      {/* ─── TAB 2: JOURNAL DES RÈGLEMENTS (HISTORIQUE) ─── */}
      {activeTab === "journal" && (
        <div className="space-y-6">
          {/* Summary KPI Cards for the period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              label={t("payments.kpiTotal")}
              value={formatMoney(summary.totalAmount)}
              context={`${tLabels.kpiPeriodPrefix[language]} ${periodOptions.find((p) => p.value === period)?.label}`}
              icon={<Coins className="w-5 h-5" />}
            />
            <KpiCard
              label={tLabels.kpiTransTitle[language]}
              value={summary.count}
              context={tLabels.kpiTransCtx[language]}
              icon={<Receipt className="w-5 h-5" />}
            />
          </div>

          {/* Period Filter Toolbar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
            <FilterPills
              options={periodOptions}
              value={period}
              onChange={(val) => {
                setPeriod(val);
                setPage(1);
              }}
            />
            <div className="text-[13px] text-[#64748B]">
              {tLabels.totalLabel[language]} <span className="font-semibold text-[#0F172A] nums">{total}</span>
            </div>
          </div>

          {/* Table in Card */}
          <Card noPadding>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
                {t("payments.loading")}
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                icon={<Receipt className="w-8 h-8" />}
                title={t("payments.emptyTitle")}
                description={t("payments.emptyDesc")}
                action={
                  <Button variant="primary" onClick={() => setIsPaymentModalOpen(true)}>
                    {tLabels.subscribePlan[language]}
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right border-collapse text-[13px]">
                  <thead>
                    <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                      <th className="px-5">{t("payments.table.receiptNumber")}</th>
                      <th className="px-4">{t("payments.table.dateTime")}</th>
                      <th className="px-4">{t("payments.table.member")}</th>
                      <th className="px-4">{t("payments.table.plan")}</th>
                      <th className="px-4">{t("payments.table.method")}</th>
                      <th className="px-4">{t("payments.table.operator")}</th>
                      <th className="px-4 text-right rtl:text-left">{t("payments.table.amount")}</th>
                      <th className="px-5 text-right rtl:text-left">{t("payments.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {payments.map((p) => (
                      <tr key={p.id} className="h-12 hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 font-mono-code font-bold text-[#0F172A]">
                          {p.receiptNumber}
                        </td>
                        <td className="px-4 text-[#64748B] nums">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="px-4 font-semibold text-[#0F172A]">
                          {p.member ? (
                            <Link
                              href={`/members/${p.member.id}`}
                              className="hover:text-[#2563EB] hover:underline"
                            >
                              {p.member.firstName} {p.member.lastName}
                            </Link>
                          ) : (
                            <span className="text-[#64748B] italic text-[12px]">
                              {tLabels.walkInCustomer[language]}
                            </span>
                          )}
                        </td>
                        <td className="px-4 font-medium text-[#0F172A] truncate max-w-[200px]">
                          {p.planName}
                        </td>
                        <td className="px-4 text-[#64748B]">
                          {methodLabels[p.method] || p.method}
                        </td>
                        <td className="px-4 text-[#64748B]">
                          {p.operator?.name || tLabels.systemOperator[language]}
                        </td>
                        <td className="px-4 text-right rtl:text-left font-bold text-[#0F172A] nums">
                          {formatMoney(p.amount)}
                        </td>
                        <td className="px-5 text-right rtl:text-left">
                          <button
                            onClick={() => handleReprint(p.id)}
                            title={t("payments.actions.reprint")}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-[6px] text-[#2563EB] hover:bg-[#EFF6FF] border border-transparent hover:border-[#BFDBFE] transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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
                    عرض <span className="font-semibold text-[#0F172A] nums">{payments.length}</span> من أصل{" "}
                    <span className="font-semibold text-[#0F172A] nums">{total}</span> عملية دفع
                  </>
                ) : language === "en" ? (
                  <>
                    Showing <span className="font-semibold text-[#0F172A] nums">{payments.length}</span> of{" "}
                    <span className="font-semibold text-[#0F172A] nums">{total}</span> payments
                  </>
                ) : (
                  <>
                    Affichage de <span className="font-semibold text-[#0F172A] nums">{payments.length}</span> sur{" "}
                    <span className="font-semibold text-[#0F172A] nums">{total}</span> règlements
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
      )}

      {/* ─── TAB 3: STOCKS & PRODUITS ─── */}
      {activeTab === "products" && (
        <ProductsCatalogView />
      )}

      {/* Payment Modal (Subscription / Renew / Debt) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={(payId) => {
          fetchPayments();
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

      {/* Daily Report Modal (Rapport Z) */}
      <DailyReportModal
        isOpen={isDailyReportOpen}
        onClose={() => setIsDailyReportOpen(false)}
        summary={summary}
        periodLabel={periodOptions.find((p) => p.value === period)?.label}
      />
    </div>
  );
}
