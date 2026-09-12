"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { Printer, Calendar, User, CreditCard, Banknote, Landmark } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: {
    totalAmount: number;
    count: number;
    byMethod?: Record<string, { total: number; count: number }>;
    byOperator?: Record<string, { total: number; count: number }>;
  } | null;
  periodLabel?: string;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  summary,
  periodLabel = "Aujourd'hui",
}) => {
  const { language } = useTranslation();
  const now = new Date();

  const handlePrint = () => {
    window.print();
  };

  const tLabels = {
    title: { fr: "Clôture de caisse · Rapport Z", en: "End of Day Register · Z-Report", ar: "إغلاق الصندوق · تقرير Z" },
    desc: (p: string) => ({
      fr: `Bilan des encaissements pour : ${p}`,
      en: `Collection summary for: ${p}`,
      ar: `حصيلة التحصيلات لـ: ${p}`,
    }),
    close: { fr: "Fermer", en: "Close", ar: "إغلاق" },
    print: { fr: "Imprimer le rapport Z", en: "Print Z-Report", ar: "طباعة تقرير Z" },
    reportHeading: { fr: "RAPPORT DE CLÔTURE DE CAISSE", en: "DAILY CASH REGISTER REPORT", ar: "تقرير الإغلاق اليومي للصندوق" },
    editedOn: { fr: "Édité le", en: "Issued on", ar: "تم التحرير في" },
    totalReceipts: { fr: "Total Recettes Encaissées", en: "Total Collections", ar: "إجمالي المداخيل المحصلة" },
    validatedTransactions: (c: number) => ({
      fr: `${c} transaction${c > 1 ? "s" : ""} validée${c > 1 ? "s" : ""}`,
      en: `${c} transaction${c > 1 ? "s" : ""} processed`,
      ar: `${c} عملية مؤكدة`,
    }),
    methodBreakdown: { fr: "Ventilation par mode de règlement", en: "Breakdown by Payment Method", ar: "التوزيع حسب وسيلة الدفع" },
    cash: { fr: "Espèces (Cash)", en: "Cash", ar: "نقداً" },
    card: { fr: "Carte bancaire (TPE)", en: "Card (POS)", ar: "بطاقة بنكية (TPE)" },
    transfer: { fr: "Virement / Autre", en: "Bank Transfer / Other", ar: "تحويل / أخرى" },
    paymentsCount: (c: number) => ({
      fr: `${c} règlement(s)`,
      en: `${c} payment(s)`,
      ar: `${c} دفعة`,
    }),
    operatorBreakdown: { fr: "Recettes par opérateur", en: "Collections by Operator", ar: "المداخيل حسب المستخدم" },
    salesCount: (c: number) => ({
      fr: `(${c} ventes)`,
      en: `(${c} sales)`,
      ar: `(${c} مبيعات)`,
    }),
    certifiedFooter: { fr: "PASSPro · CLÔTURE DE CAISSE CERTIFIÉE", en: "PASSPro · CERTIFIED CASH REGISTER CLOSE", ar: "PASSPro · إغلاق صندوق معتمد" },
  };

  if (!summary) return null;

  const cash = summary.byMethod?.["CASH"] || { total: 0, count: 0 };
  const card = summary.byMethod?.["CARD"] || { total: 0, count: 0 };
  const transfer = summary.byMethod?.["TRANSFER"] || { total: 0, count: 0 };
  const operators = Object.entries(summary.byOperator || {});

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tLabels.title[language]}
      description={tLabels.desc(periodLabel)[language]}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose}>
            {tLabels.close[language]}
          </Button>
          <Button
            variant="primary"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            {tLabels.print[language]}
          </Button>
        </div>
      }
    >
      {/* Printable Z-Report Container */}
      <div id="daily-report-receipt" className="space-y-4 text-[#0F172A] print:p-0">
        {/* Printable Ticket Header */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-center print:border-none print:p-0">
          <div className="text-[11px] uppercase tracking-widest text-[#64748B] font-semibold">
            PASSPro Fitness Club
          </div>
          <h2 className="text-[18px] font-bold text-[#0F172A] mt-0.5">
            {tLabels.reportHeading[language]}
          </h2>
          <div className="text-[12px] text-[#64748B] mt-1 flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{tLabels.editedOn[language]} {formatDateTime(now)}</span>
          </div>
        </div>

        {/* Big Total Box */}
        <div className="p-4 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] text-center">
          <div className="text-[12px] uppercase tracking-wider font-semibold text-[#1E40AF]">
            {tLabels.totalReceipts[language]}
          </div>
          <div className="text-[32px] font-extrabold text-[#2563EB] nums mt-0.5">
            {formatMoney(summary.totalAmount)}
          </div>
          <div className="text-[12px] text-[#1E40AF] mt-1 font-medium">
            {tLabels.validatedTransactions(summary.count)[language]}
          </div>
        </div>

        {/* Breakdown by Payment Mode */}
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-wide text-[#64748B] mb-2">
            {tLabels.methodBreakdown[language]}
          </h4>
          <div className="space-y-2">
            {/* Espèces */}
            <div className="p-2.5 rounded-[6px] border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{tLabels.cash[language]}</div>
                  <div className="text-[11px] text-[#64748B]">{tLabels.paymentsCount(cash.count)[language]}</div>
                </div>
              </div>
              <div className="text-[15px] font-bold nums text-[#0F172A]">
                {formatMoney(cash.total)}
              </div>
            </div>

            {/* Carte bancaire */}
            <div className="p-2.5 rounded-[6px] border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{tLabels.card[language]}</div>
                  <div className="text-[11px] text-[#64748B]">{tLabels.paymentsCount(card.count)[language]}</div>
                </div>
              </div>
              <div className="text-[15px] font-bold nums text-[#0F172A]">
                {formatMoney(card.total)}
              </div>
            </div>

            {/* Virement */}
            {transfer.count > 0 && (
              <div className="p-2.5 rounded-[6px] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#F8FAFC] text-[#64748B] flex items-center justify-center">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{tLabels.transfer[language]}</div>
                    <div className="text-[11px] text-[#64748B]">{tLabels.paymentsCount(transfer.count)[language]}</div>
                  </div>
                </div>
                <div className="text-[15px] font-bold nums text-[#0F172A]">
                  {formatMoney(transfer.total)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown by Operator */}
        {operators.length > 0 && (
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-wide text-[#64748B] mb-2">
              {tLabels.operatorBreakdown[language]}
            </h4>
            <div className="border border-[#E2E8F0] rounded-[6px] divide-y divide-[#F1F5F9] overflow-hidden">
              {operators.map(([opName, data]) => (
                <div key={opName} className="p-2.5 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#64748B]" />
                    <span className="font-semibold">{opName}</span>
                    <span className="text-[11px] text-[#64748B]">{tLabels.salesCount(data.count)[language]}</span>
                  </div>
                  <div className="font-bold nums text-[#2563EB]">{formatMoney(data.total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-2.5 bg-[#F8FAFC] rounded-[6px] text-center text-[11px] text-[#94A3B8] font-mono-code">
          {tLabels.certifiedFooter[language]}
        </div>
      </div>
    </Modal>
  );
};
