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
  CreditCard,
  Download,
  ClipboardCheck,
} from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalAmount: 0, count: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState("today");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const fetchPayments = () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "15",
      period,
    });

    fetch(`/api/payments?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setPayments(data.items);
          setTotal(data.total);
          if (data.summary) setSummary(data.summary);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPayments();
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
    { label: "Aujourd'hui", value: "today" },
    { label: "Semaine", value: "week" },
    { label: "Mois", value: "month" },
    { label: "Tout", value: "all" },
  ];

  const methodLabels: Record<string, string> = {
    CASH: "Espèces",
    CARD: "Carte bancaire",
    OTHER: "Autre",
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`/api/payments?period=${period}&pageSize=1000`);
      const data = await res.json();
      const items = data.items || payments;
      const headers = [
        "Numéro Reçu",
        "Date & Heure",
        "Adhérent",
        "Téléphone",
        "Formule",
        "Mode de règlement",
        "Montant (DA)",
        "Opérateur",
      ];
      const rows = items.map((p: any) => [
        p.receiptNumber,
        formatDateTime(p.createdAt),
        `${p.member?.firstName || ""} ${p.member?.lastName || ""}`.trim(),
        p.member?.phone || "",
        p.subscription?.plan?.name || "Abonnement",
        methodLabels[p.method] || p.method,
        p.amount,
        p.operator?.name || "",
      ]);
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      downloadCsv(`paiements-${period}-${dateStr}`, headers, rows);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            Journal de caisse & Encaissements
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Historique des règlements, réimpression des tickets thermiques 80 mm
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Exporter CSV
          </Button>

          <Button
            variant="secondary"
            leftIcon={<ClipboardCheck className="w-4 h-4 text-[#2563EB]" />}
            onClick={() => setIsDailyReportOpen(true)}
          >
            Clôture du jour (Rapport Z)
          </Button>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            Nouvel encaissement
          </Button>
        </div>
      </div>

      {/* 2. Summary KPI Cards for the period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Total encaissé sur la période"
          value={formatMoney(summary.totalAmount)}
          context={`Période sélectionnée : ${periodOptions.find((p) => p.value === period)?.label}`}
          icon={<Coins className="w-5 h-5" />}
        />
        <KpiCard
          label="Transactions enregistrées"
          value={summary.count}
          context="Nombre de reçus émis"
          icon={<Receipt className="w-5 h-5" />}
        />
      </div>

      {/* 3. Toolbar */}
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
          Total : <span className="font-semibold text-[#0F172A] nums">{total}</span> règlements
        </div>
      </div>

      {/* 4. Table in Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
            Chargement des règlements...
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-8 h-8" />}
            title="Aucun règlement sur cette période"
            description="Effectuez un encaissement pour voir apparaître le reçu ici."
            action={
              <Button variant="primary" onClick={() => setIsPaymentModalOpen(true)}>
                Encaisser
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">N° Reçu</th>
                  <th className="px-4">Date & Heure</th>
                  <th className="px-4">Adhérent</th>
                  <th className="px-4">Formule</th>
                  <th className="px-4">Mode</th>
                  <th className="px-4">Opérateur</th>
                  <th className="px-4 text-right">Montant</th>
                  <th className="px-5 text-right">Reçu</th>
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
                      <Link
                        href={`/members/${p.member.id}`}
                        className="hover:text-[#2563EB] hover:underline"
                      >
                        {p.member.firstName} {p.member.lastName}
                      </Link>
                    </td>
                    <td className="px-4 font-medium text-[#0F172A]">{p.planName}</td>
                    <td className="px-4 text-[#64748B]">
                      {methodLabels[p.method] || p.method}
                    </td>
                    <td className="px-4 text-[#64748B]">{p.operator?.name || "Système"}</td>
                    <td className="px-4 text-right font-bold text-[#0F172A] nums">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="px-5 text-right">
                      <button
                        onClick={() => handleReprint(p.id)}
                        title="Réimprimer le ticket 80 mm"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-[6px] text-[#2563EB] hover:bg-[#EFF6FF] border border-transparent hover:border-[#BFDBFE] transition-colors"
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
            Affichage de <span className="font-semibold text-[#0F172A] nums">{payments.length}</span> sur{" "}
            <span className="font-semibold text-[#0F172A] nums">{total}</span> règlements
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
              disabled={page * 15 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Payment Modal */}
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
