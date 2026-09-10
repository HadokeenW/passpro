"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Printer, Calendar, User, CreditCard, Banknote, Landmark } from "lucide-react";

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
  const now = new Date();

  const handlePrint = () => {
    window.print();
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
      title="Clôture de caisse · Rapport Z"
      description={`Bilan des encaissements pour : ${periodLabel}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="primary"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Imprimer le rapport Z
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
            RAPPORT DE CLÔTURE DE CAISSE
          </h2>
          <div className="text-[12px] text-[#64748B] mt-1 flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Édité le {formatDateTime(now)}</span>
          </div>
        </div>

        {/* Big Total Box */}
        <div className="p-4 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] text-center">
          <div className="text-[12px] uppercase tracking-wider font-semibold text-[#1E40AF]">
            Total Recettes Encaissées
          </div>
          <div className="text-[32px] font-extrabold text-[#2563EB] nums mt-0.5">
            {formatMoney(summary.totalAmount)}
          </div>
          <div className="text-[12px] text-[#1E40AF] mt-1 font-medium">
            {summary.count} transaction{summary.count > 1 ? "s" : ""} validée{summary.count > 1 ? "s" : ""}
          </div>
        </div>

        {/* Breakdown by Payment Mode */}
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-wide text-[#64748B] mb-2">
            Ventilation par mode de règlement
          </h4>
          <div className="space-y-2">
            {/* Espèces */}
            <div className="p-2.5 rounded-[6px] border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold">Espèces (Cash)</div>
                  <div className="text-[11px] text-[#64748B]">{cash.count} règlement(s)</div>
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
                  <div className="text-[13px] font-semibold">Carte bancaire (TPE)</div>
                  <div className="text-[11px] text-[#64748B]">{card.count} règlement(s)</div>
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
                    <div className="text-[13px] font-semibold">Virement / Autre</div>
                    <div className="text-[11px] text-[#64748B]">{transfer.count} règlement(s)</div>
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
              Recettes par opérateur
            </h4>
            <div className="border border-[#E2E8F0] rounded-[6px] divide-y divide-[#F1F5F9] overflow-hidden">
              {operators.map(([opName, data]) => (
                <div key={opName} className="p-2.5 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#64748B]" />
                    <span className="font-semibold">{opName}</span>
                    <span className="text-[11px] text-[#64748B]">({data.count} ventes)</span>
                  </div>
                  <div className="font-bold nums text-[#2563EB]">{formatMoney(data.total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-2.5 bg-[#F8FAFC] rounded-[6px] text-center text-[11px] text-[#94A3B8] font-mono-code">
          PASSPro · CLÔTURE DE CAISSE CERTIFIÉE
        </div>
      </div>
    </Modal>
  );
};
