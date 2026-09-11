import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Printer } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDateTime, formatDate } from "@/lib/dates";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    payment: {
      id: string;
      receiptNumber: string;
      amount: number;
      totalAmount?: number | null;
      remainingBalance?: number | null;
      paymentType?: string | null;
      method: string;
      planName: string;
      createdAt: string;
      member: {
        firstName: string;
        lastName: string;
        phone?: string | null;
      };
      operator?: {
        name: string;
      } | null;
      subscription?: {
        startDate: string;
        endDate: string;
      } | null;
    };
    setting?: {
      gymName: string;
      gymAddress: string;
      gymPhone: string;
      gymEmail: string;
      currency: string;
      receiptFooter: string;
    } | null;
    isDuplicate?: boolean;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  if (!receiptData) return null;

  const { payment, setting, isDuplicate } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  const methodLabels: Record<string, string> = {
    CASH: "Espèces",
    CARD: "Carte bancaire",
    OTHER: "Autre",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reçu d'encaissement"
      size="md"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Imprimer le reçu (80 mm)
          </Button>
        </div>
      }
    >
      <div className="bg-[#F8FAFC] p-6 rounded-[8px] flex justify-center border border-[#E2E8F0]">
        {/* Receipt Ticket 72mm display */}
        <div
          id="thermal-receipt"
          className="w-[280px] bg-white p-5 rounded-[4px] shadow-sm border border-[#CBD5E1] text-[#0F172A] font-sans text-[12px] flex flex-col gap-3 leading-relaxed"
        >


          {/* Gym Header */}
          <div className="text-center">
            <h3 className="text-[14px] font-bold tracking-tight">
              {setting?.gymName || "PASSPro Fitness Club"}
            </h3>
            {setting?.gymAddress && (
              <p className="text-[11px] text-[#64748B] mt-0.5">{setting.gymAddress}</p>
            )}
            {setting?.gymPhone && (
              <p className="text-[11px] text-[#64748B]">Tél : {setting.gymPhone}</p>
            )}
          </div>

          <div className="border-t border-dashed border-[#CBD5E1] my-1" />

          {/* Receipt Info */}
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#64748B]">N° REÇU :</span>
            <span className="font-mono-code font-bold text-[#0F172A]">
              {payment.receiptNumber}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#64748B]">DATE :</span>
            <span className="font-medium text-[#0F172A]">
              {formatDateTime(payment.createdAt)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#64748B]">ADHÉRENT :</span>
            <span className="font-semibold text-[#0F172A] truncate max-w-[170px]">
              {payment.member.firstName} {payment.member.lastName}
            </span>
          </div>

          <div className="border-t border-dashed border-[#CBD5E1] my-1" />

          {/* Subscription details */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center font-semibold text-[13px]">
              <span>{payment.planName}</span>
              <span className="nums font-bold">
                {formatMoney(payment.amount, setting?.currency || "DA")}
              </span>
            </div>

            {payment.subscription && (
              <div className="text-[11px] text-[#64748B] flex justify-between">
                <span>Période :</span>
                <span>
                  {formatDate(payment.subscription.startDate)} au{" "}
                  {formatDate(payment.subscription.endDate)}
                </span>
              </div>
            )}
          </div>

          <div className="border-t-2 border-[#0F172A] my-1" />

          {/* Total & Payment Method */}
          {payment.totalAmount && payment.totalAmount !== payment.amount && (
            <div className="flex justify-between items-center text-[11px] text-[#64748B]">
              <span>Prix formule :</span>
              <span className="nums font-semibold text-[#0F172A]">
                {formatMoney(payment.totalAmount, setting?.currency || "DA")}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-[14px] font-bold">
            <span>TOTAL RÉGLÉ</span>
            <span className="nums text-[15px]">
              {formatMoney(payment.amount, setting?.currency || "DA")}
            </span>
          </div>

          {payment.remainingBalance !== undefined && payment.remainingBalance !== null && payment.remainingBalance > 0 && (
            <div className="p-2 bg-[#FEF2F2] border border-dashed border-[#FECACA] rounded text-[12px] font-bold text-[#DC2626] flex justify-between items-center">
              <span>RESTE À PAYER :</span>
              <span className="nums text-[13px]">
                {formatMoney(payment.remainingBalance, setting?.currency || "DA")}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] text-[#64748B]">
            <span>Mode de règlement :</span>
            <span className="font-medium text-[#0F172A]">
              {methodLabels[payment.method] || payment.method}
            </span>
          </div>

          {payment.operator && (
            <div className="flex justify-between items-center text-[11px] text-[#64748B]">
              <span>Opérateur caisse :</span>
              <span className="font-medium text-[#0F172A]">{payment.operator.name}</span>
            </div>
          )}

          <div className="border-t border-dashed border-[#CBD5E1] my-1" />

          {/* Footer message */}
          <div className="text-center text-[11px] text-[#64748B] italic pt-1">
            {setting?.receiptFooter || "Merci de votre fidélité et à bientôt !"}
          </div>
        </div>
      </div>
    </Modal>
  );
};
