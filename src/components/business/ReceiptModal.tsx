import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Printer } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDateTime, formatDate } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";

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
      member?: {
        firstName: string;
        lastName: string;
        phone?: string | null;
      } | null;
      operator?: {
        name: string;
      } | null;
      subscription?: {
        startDate: string;
        endDate: string;
      } | null;
      items?: {
        id: string;
        name: string;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
      }[];
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
  const { language } = useTranslation();
  if (!receiptData) return null;

  const { payment, setting } = receiptData;

  const handlePrint = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.printReceipt) {
      const receiptEl = document.getElementById("thermal-receipt");
      if (receiptEl) {
        const receiptHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Ticket de caisse</title>
    <style>
      @page { margin: 0; size: 80mm auto; }
      body {
        margin: 0;
        padding: 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 12px;
        color: #000;
        width: 74mm;
        background: #fff;
      }
      * { box-sizing: border-box; }
      .border-dashed { border-style: dashed; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
    </style>
  </head>
  <body>
    ${receiptEl.innerHTML}
  </body>
</html>`;
        (window as any).electronAPI.printReceipt(receiptHtml);
        return;
      }
    }
    window.print();
  };

  const tLabels = {
    title: { fr: "Reçu d'encaissement", en: "Payment Receipt", ar: "وصل الدفع" },
    close: { fr: "Fermer", en: "Close", ar: "إغلاق" },
    print: { fr: "Imprimer le reçu (80 mm)", en: "Print Receipt (80 mm)", ar: "طباعة الوصل (80 مم)" },
    tel: { fr: "Tél :", en: "Tel:", ar: "هاتف:" },
    receiptNo: { fr: "N° REÇU :", en: "RECEIPT #:", ar: "رقم الوصل:" },
    date: { fr: "DATE :", en: "DATE:", ar: "التاريخ:" },
    member: { fr: "CLIENT :", en: "CUSTOMER:", ar: "الزبون:" },
    walkIn: { fr: "Client comptoir", en: "Walk-in Customer", ar: "زبون عابر" },
    period: { fr: "Période :", en: "Period:", ar: "الفترة:" },
    to: { fr: "au", en: "to", ar: "إلى" },
    qtyCol: { fr: "Qté", en: "Qty", ar: "الكمية" },
    itemCol: { fr: "Désignation", en: "Item", ar: "البيان" },
    puCol: { fr: "P.U", en: "U.P", ar: "الوحدة" },
    totalCol: { fr: "Total", en: "Total", ar: "الإجمالي" },
    planPrice: { fr: "Prix formule :", en: "Plan Price:", ar: "سعر الاشتراك:" },
    totalPaid: { fr: "TOTAL RÉGLÉ", en: "TOTAL PAID", ar: "المجموع المدفوع" },
    remainingDue: { fr: "RESTE À PAYER :", en: "BALANCE DUE:", ar: "المتبقي للدفع:" },
    paymentMethod: { fr: "Mode de règlement :", en: "Payment Method:", ar: "طريقة الدفع:" },
    cashier: { fr: "Opérateur caisse :", en: "Cashier:", ar: "مسؤول الصندوق:" },
    methods: {
      CASH: { fr: "Espèces", en: "Cash", ar: "نقداً" },
      CARD: { fr: "Carte bancaire", en: "Bank Card", ar: "بطاقة بنكية" },
      OTHER: { fr: "Autre", en: "Other", ar: "أخرى" },
    },
    defaultFooter: {
      fr: "Merci de votre fidélité et à bientôt !",
      en: "Thank you for your business, see you soon!",
      ar: "شكراً لوفائكم وإلى اللقاء قريباً!",
    },
  };

  const methodLabel = tLabels.methods[payment.method as keyof typeof tLabels.methods]?.[language] || payment.method;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tLabels.title[language]}
      size="md"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose}>
            {tLabels.close[language]}
          </Button>
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            {tLabels.print[language]}
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
              <p className="text-[11px] text-[#64748B]">{tLabels.tel[language]} {setting.gymPhone}</p>
            )}
          </div>

          <div className="border-t border-dashed border-[#CBD5E1] my-1" />

          {/* Receipt Info */}
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#64748B]">{tLabels.receiptNo[language]}</span>
            <span className="font-mono-code font-bold text-[#0F172A]">
              {payment.receiptNumber}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#64748B]">{tLabels.date[language]}</span>
            <span className="font-medium text-[#0F172A]">
              {formatDateTime(payment.createdAt)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#64748B]">{tLabels.member[language]}</span>
            <span className="font-semibold text-[#0F172A] truncate max-w-[170px]">
              {payment.member ? `${payment.member.firstName} ${payment.member.lastName}` : tLabels.walkIn[language]}
            </span>
          </div>

          <div className="border-t border-dashed border-[#CBD5E1] my-1" />

          {/* Product Items or Subscription details */}
          {payment.items && payment.items.length > 0 ? (
            <div className="flex flex-col gap-1.5 text-[11px]">
              <div className="flex justify-between font-bold text-[#64748B] border-b border-[#E2E8F0] pb-1">
                <span className="w-8">{tLabels.qtyCol[language]}</span>
                <span className="flex-1 text-left rtl:text-right px-1">{tLabels.itemCol[language]}</span>
                <span className="w-12 text-right">{tLabels.puCol[language]}</span>
                <span className="w-14 text-right">{tLabels.totalCol[language]}</span>
              </div>
              {payment.items.map((it) => (
                <div key={it.id} className="flex justify-between items-center text-[#0F172A]">
                  <span className="w-8 font-semibold text-[#64748B] nums">{it.quantity}x</span>
                  <span className="flex-1 text-left rtl:text-right px-1 truncate font-medium">{it.name}</span>
                  <span className="w-12 text-right nums text-[#64748B]">{it.unitPrice}</span>
                  <span className="w-14 text-right nums font-semibold">{it.totalPrice}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center font-semibold text-[13px]">
                <span>{payment.planName}</span>
                <span className="nums font-bold">
                  {formatMoney(payment.amount, setting?.currency || "DA")}
                </span>
              </div>

              {payment.subscription && (
                <div className="text-[11px] text-[#64748B] flex justify-between">
                  <span>{tLabels.period[language]}</span>
                  <span>
                    {formatDate(payment.subscription.startDate)} {tLabels.to[language]}{" "}
                    {formatDate(payment.subscription.endDate)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="border-t-2 border-[#0F172A] my-1" />

          {/* Total & Payment Method */}
          {payment.totalAmount && payment.totalAmount !== payment.amount && (
            <div className="flex justify-between items-center text-[11px] text-[#64748B]">
              <span>{tLabels.planPrice[language]}</span>
              <span className="nums font-semibold text-[#0F172A]">
                {formatMoney(payment.totalAmount, setting?.currency || "DA")}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-[14px] font-bold">
            <span>{tLabels.totalPaid[language]}</span>
            <span className="nums text-[15px]">
              {formatMoney(payment.amount, setting?.currency || "DA")}
            </span>
          </div>

          {payment.remainingBalance !== undefined && payment.remainingBalance !== null && payment.remainingBalance > 0 && (
            <div className="p-2 bg-[#FEF2F2] border border-dashed border-[#FECACA] rounded text-[12px] font-bold text-[#DC2626] flex justify-between items-center">
              <span>{tLabels.remainingDue[language]}</span>
              <span className="nums text-[13px]">
                {formatMoney(payment.remainingBalance, setting?.currency || "DA")}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] text-[#64748B]">
            <span>{tLabels.paymentMethod[language]}</span>
            <span className="font-medium text-[#0F172A]">
              {methodLabel}
            </span>
          </div>

          {payment.operator && (
            <div className="flex justify-between items-center text-[11px] text-[#64748B]">
              <span>{tLabels.cashier[language]}</span>
              <span className="font-medium text-[#0F172A]">{payment.operator.name}</span>
            </div>
          )}

          <div className="border-t border-dashed border-[#CBD5E1] my-1" />

          {/* Footer message */}
          <div className="text-center text-[11px] text-[#64748B] italic pt-1">
            {setting?.receiptFooter || tLabels.defaultFooter[language]}
          </div>
        </div>
      </div>
    </Modal>
  );
};
