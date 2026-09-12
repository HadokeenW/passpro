"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { formatMoney } from "@/lib/money";
import { invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";
import { Ticket, Clock, Calendar, AlertTriangle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  planType?: "TEMPORAL" | "SESSIONS" | "TIME_SLOT";
  sessionCount?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  currentSubscription?: {
    id: string;
    planName: string;
    balanceDue?: number;
    price?: number;
    paidAmount?: number;
  } | null;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
  preselectedMember?: Member | null;
  initialDebtSettlement?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  preselectedMember,
  initialDebtSettlement = false,
}) => {
  const toast = useToast();
  const { language } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [mode, setMode] = useState<"EXTEND" | "RESTART">("EXTEND");
  const [method, setMethod] = useState<"CASH" | "CARD" | "OTHER">("CASH");

  // Payment type: "FULL" (intégral) | "CREDIT" (acompte / partiel) | "DEBT" (règlement dette)
  const [paymentAction, setPaymentAction] = useState<"SUBSCRIPTION" | "DEBT">("SUBSCRIPTION");
  const [isCreditMode, setIsCreditMode] = useState(false);
  const [customPaidAmount, setCustomPaidAmount] = useState<string>("");
  const [debtPaymentAmount, setDebtPaymentAmount] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const activeMember = preselectedMember || members.find((m) => m.id === selectedMemberId);
  const memberDebt = activeMember?.currentSubscription?.balanceDue || 0;

  const tLabels = {
    title: {
      fr: "Caisse — Encaissement & Reçus",
      en: "Cash Register — Checkout & Receipts",
      ar: "الصندوق — التحصيل والإيصالات",
    },
    desc: {
      fr: "Émission d'un abonnement, encaissement partiel à crédit ou règlement de dette",
      en: "Issue subscription, partial credit payment, or settle member debt",
      ar: "إصدار اشتراك أو دفع بالتقسيط أو تسديد دين",
    },
    cancel: { fr: "Annuler", en: "Cancel", ar: "إلغاء" },
    subscribeRenew: { fr: "Souscrire / Renouveler", en: "Subscribe / Renew", ar: "اشتراك / تجديد" },
    settleDebt: { fr: "Régler la dette", en: "Settle Debt", ar: "تسديد الدين" },
    debt: { fr: "Dette :", en: "Debt:", ar: "دين:" },
    member: { fr: "Adhérent *", en: "Member *", ar: "المشترك *" },
    selectMember: { fr: "Sélectionner un adhérent...", en: "Select a member...", ar: "اختر مشتركاً..." },
    debtSettlementTitle: { fr: "Règlement de la dette adhérent", en: "Member Debt Settlement", ar: "تسديد دين المشترك" },
    associatedPlan: { fr: "Formule associée :", en: "Associated Plan:", ar: "الاشتراك المرتبط:" },
    currentDebtDue: { fr: "Solde actuel dû", en: "Current Balance Due", ar: "الرصيد المستحق حالياً" },
    amountPaidToday: { fr: "Montant versé aujourd'hui (DA) *", en: "Amount Paid Today (DZD) *", ar: "المبلغ المدفوع اليوم (دج) *" },
    settleAll: { fr: "Tout solder", en: "Pay in Full", ar: "تسديد بالكامل" },
    remainingAfterPayment: { fr: "Reste à payer après versement :", en: "Remaining Balance after Payment:", ar: "المتبقي بعد الدفع:" },
    fullyCleared: { fr: "0 DA (Dette totalement soldée)", en: "0 DZD (Debt fully cleared)", ar: "0 دج (تم تسديد الدين بالكامل)" },
    subscriptionPlan: { fr: "Formule d'abonnement *", en: "Subscription Plan *", ar: "نوع الاشتراك *" },
    sessions: { fr: "séances", en: "sessions", ar: "حصص" },
    days: { fr: "jour", en: "day", ar: "يوم" },
    daysPlural: { fr: "jours", en: "days", ar: "أيام" },
    paymentTerms: { fr: "Modalité de règlement", en: "Payment Terms", ar: "طريقة السداد" },
    paymentTermsDesc: {
      fr: "Encaissement intégral ou paiement à crédit (acompte + reste à payer)",
      en: "Full payment or credit installment (down payment + remaining balance)",
      ar: "دفع كامل أو بالتقسيط (دفعة أولى + الرصيد المتبقي)",
    },
    full: { fr: "Intégral", en: "Full", ar: "دفع كامل" },
    credit: { fr: "Crédit / Acompte", en: "Credit / Down Payment", ar: "بالتقسيط / عربون" },
    totalPrice: { fr: "Tarif total formule :", en: "Total Plan Price:", ar: "السعر الإجمالي للاشتراك:" },
    paidToday: { fr: "Versé ce jour :", en: "Paid Today:", ar: "المدفوع اليوم:" },
    balanceDueDebt: { fr: "Reste à payer (Dette) :", en: "Remaining Balance (Debt):", ar: "المتبقي (دين):" },
    renewalMode: { fr: "Mode de renouvellement", en: "Renewal Mode", ar: "نمط التجديد" },
    extendTitle: { fr: "Prolongation (EXTEND)", en: "Extension (EXTEND)", ar: "تمديد (EXTEND)" },
    extendDesc: { fr: "Conserve les jours restants", en: "Keeps remaining days", ar: "الاحتفاظ بالأيام المتبقية" },
    restartTitle: { fr: "Nouveau départ (RESTART)", en: "Restart (RESTART)", ar: "بداية جديدة (RESTART)" },
    restartDesc: { fr: "Démarre aujourd'hui", en: "Starts from today", ar: "يبدأ من اليوم" },
    paymentMethod: { fr: "Mode de règlement", en: "Payment Method", ar: "وسيلة الدفع" },
    cash: { fr: "Espèces", en: "Cash", ar: "نقداً" },
    card: { fr: "Carte bancaire", en: "Bank Card", ar: "بطاقة بنكية" },
    other: { fr: "Autre", en: "Other", ar: "أخرى" },
    errSelectMember: { fr: "Veuillez sélectionner un adhérent", en: "Please select a member", ar: "يرجى تحديد مشترك" },
    errDebtGreaterZero: { fr: "Le montant versé pour solder la dette doit être supérieur à 0", en: "Amount paid to settle debt must be greater than 0", ar: "يجب أن يكون المبلغ المدفوع أكبر من 0" },
    errSelectPlan: { fr: "Veuillez sélectionner une formule", en: "Please select a plan", ar: "يرجى تحديد نوع الاشتراك" },
    errPaidGreaterZero: { fr: "Le montant versé ce jour doit être supérieur à 0", en: "Amount paid today must be greater than 0", ar: "يجب أن يكون المبلغ المدفوع اليوم أكبر من 0" },
    errGeneric: { fr: "Une erreur est survenue", en: "An error occurred", ar: "حدث خطأ ما" },
    collectBalanceBtn: (amt: string) => ({
      fr: `Encaisser solde : ${amt}`,
      en: `Collect Balance: ${amt}`,
      ar: `تحصيل الرصيد: ${amt}`,
    }),
    collectDownPaymentBtn: (amt: string) => ({
      fr: `Encaisser l'acompte : ${amt}`,
      en: `Collect Down Payment: ${amt}`,
      ar: `تحصيل الدفعة: ${amt}`,
    }),
    collectFullBtn: (amt: string) => ({
      fr: `Encaisser ${amt}`,
      en: `Collect ${amt}`,
      ar: `تحصيل ${amt}`,
    }),
    debtNotice: (bal: string) => ({
      fr: `Ce montant restant (${bal}) sera consigné sur le ticket et rappelé lors des prochains passages de l'adhérent.`,
      en: `This remaining balance (${bal}) will appear on the receipt and be recalled on future entries.`,
      ar: `سيتم تسجيل هذا الرصيد المتبقي (${bal}) على الوصل وتذكير المشترك به عند الدخول.`,
    }),
    toastDebtSuccess: { fr: "Solde encaissé", en: "Balance Collected", ar: "تم تحصيل الرصيد" },
    toastSubSuccess: { fr: "Règlement enregistré", en: "Payment Recorded", ar: "تم تسجيل الدفع" },
    toastReceiptSuccess: (num: string) => ({
      fr: `Reçu N° ${num} émis avec succès`,
      en: `Receipt #${num} issued successfully`,
      ar: `تم إصدار الوصل رقم ${num} بنجاح`,
    }),
  };

  useEffect(() => {
    if (isOpen) {
      setError("");
      setPaymentAction(initialDebtSettlement && memberDebt > 0 ? "DEBT" : "SUBSCRIPTION");
      setIsCreditMode(false);
      setCustomPaidAmount("");

      // Fetch active plans
      fetch("/api/plans")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPlans(data);
            if (data.length > 0 && !selectedPlanId) {
              const mensuel = data.find((p) => p.name.toLowerCase().includes("mensuel"));
              setSelectedPlanId(mensuel ? mensuel.id : data[0].id);
            }
          }
        })
        .catch(console.error);

      if (preselectedMember) {
        setSelectedMemberId(preselectedMember.id);
        if (preselectedMember.currentSubscription?.balanceDue) {
          setDebtPaymentAmount(preselectedMember.currentSubscription.balanceDue.toString());
        }
      } else {
        fetch("/api/members?pageSize=100")
          .then((r) => r.json())
          .then((data) => {
            if (data.items) {
              setMembers(data.items);
              if (data.items.length > 0 && !selectedMemberId) {
                setSelectedMemberId(data.items[0].id);
              }
            }
          })
          .catch(console.error);
      }
    }
  }, [isOpen, preselectedMember, initialDebtSettlement]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Calculate prices for subscription mode
  const formulaPrice = selectedPlan?.price || 0;
  const actualPaid = isCreditMode
    ? customPaidAmount !== ""
      ? Math.max(0, parseInt(customPaidAmount, 10) || 0)
      : formulaPrice
    : formulaPrice;
  const balanceDue = Math.max(0, formulaPrice - actualPaid);

  // Calculate prices for debt mode
  const parsedDebtPayment = parseInt(debtPaymentAmount, 10) || 0;
  const remainingDebtAfterPay = Math.max(0, memberDebt - parsedDebtPayment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError(tLabels.errSelectMember[language]);
      return;
    }

    if (paymentAction === "DEBT") {
      if (parsedDebtPayment <= 0) {
        setError(tLabels.errDebtGreaterZero[language]);
        return;
      }
    } else {
      if (!selectedPlanId) {
        setError(tLabels.errSelectPlan[language]);
        return;
      }
      if (isCreditMode && actualPaid <= 0) {
        setError(tLabels.errPaidGreaterZero[language]);
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      const payload: any = {
        memberId: selectedMemberId,
        method,
      };

      if (paymentAction === "DEBT") {
        payload.isDebtSettlement = true;
        payload.subscriptionId = activeMember?.currentSubscription?.id;
        payload.customAmount = parsedDebtPayment;
      } else {
        payload.planId = selectedPlanId;
        payload.mode = mode;
        payload.totalPrice = formulaPrice;
        payload.customAmount = actualPaid;
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || tLabels.errGeneric[language]);
      }

      invalidateCache(["/api/payments", "/api/dashboard", "/api/subscriptions", "/api/members"]);
      toast.success(
        paymentAction === "DEBT" ? tLabels.toastDebtSuccess[language] : tLabels.toastSubSuccess[language],
        tLabels.toastReceiptSuccess(data.receiptNumber)[language]
      );
      onPaymentSuccess(data.id);
      onClose();
    } catch (err: any) {
      setError(err.message || tLabels.errGeneric[language]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tLabels.title[language]}
      description={tLabels.desc[language]}
      size="md"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {tLabels.cancel[language]}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {paymentAction === "DEBT"
              ? tLabels.collectBalanceBtn(formatMoney(parsedDebtPayment))[language]
              : isCreditMode && balanceDue > 0
              ? tLabels.collectDownPaymentBtn(formatMoney(actualPaid))[language]
              : tLabels.collectFullBtn(formatMoney(formulaPrice))[language]}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] text-[13px] text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Action Toggle if Member has Debt */}
        {memberDebt > 0 && (
          <div className="p-1 bg-[#F1F5F9] rounded-[8px] flex text-[13px] font-semibold">
            <button
              type="button"
              onClick={() => setPaymentAction("SUBSCRIPTION")}
              className={`flex-1 py-1.5 rounded-[6px] transition-all cursor-pointer text-center ${
                paymentAction === "SUBSCRIPTION"
                  ? "bg-white text-[#0F172A] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {tLabels.subscribeRenew[language]}
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentAction("DEBT");
                setDebtPaymentAmount(memberDebt.toString());
              }}
              className={`flex-1 py-1.5 rounded-[6px] transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                paymentAction === "DEBT"
                  ? "bg-[#DC2626] text-white shadow-sm"
                  : "text-[#DC2626] hover:bg-[#FEE2E2]"
              }`}
            >
              <span>{tLabels.settleDebt[language]}</span>
              <span className="nums text-[11px] px-1.5 py-0.2 rounded bg-white/20">
                {formatMoney(memberDebt)}
              </span>
            </button>
          </div>
        )}

        {/* Member selector or display */}
        <div>
          <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">
            {tLabels.member[language]}
          </label>
          {preselectedMember ? (
            <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] flex items-center justify-between">
              <div>
                <span className="text-[14px] font-semibold text-[#0F172A]">
                  {preselectedMember.firstName} {preselectedMember.lastName}
                </span>
              </div>
              {memberDebt > 0 && (
                <span className="text-[12px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA] nums">
                  {tLabels.debt[language]} {formatMoney(memberDebt)}
                </span>
              )}
            </div>
          ) : (
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-9 px-3 text-[14px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:border-[#2563EB]"
            >
              <option value="">{tLabels.selectMember[language]}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ================= MODE: REGLER LA DETTE ================= */}
        {paymentAction === "DEBT" ? (
          <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-[#991B1B]">
                  {tLabels.debtSettlementTitle[language]}
                </div>
                <div className="text-[12px] text-[#7F1D1D] mt-0.5">
                  {tLabels.associatedPlan[language]} {activeMember?.currentSubscription?.planName || "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#991B1B] font-medium">{tLabels.currentDebtDue[language]}</div>
                <div className="text-[18px] font-bold text-[#DC2626] nums">
                  {formatMoney(memberDebt)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#FECACA]">
              <label className="text-[13px] font-semibold text-[#0F172A] block mb-1">
                {tLabels.amountPaidToday[language]}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={memberDebt}
                  value={debtPaymentAmount}
                  onChange={(e) => setDebtPaymentAmount(e.target.value)}
                  className="flex-1 h-9 px-3 text-[14px] font-bold nums bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => setDebtPaymentAmount(memberDebt.toString())}
                  className="px-3 py-1.5 text-[12px] font-bold bg-[#DC2626] text-white rounded-[6px] hover:bg-[#B91C1C]"
                >
                  {tLabels.settleAll[language]}
                </button>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[12px] bg-white p-2.5 rounded border border-[#FECACA]">
                <span className="text-[#64748B]">{tLabels.remainingAfterPayment[language]}</span>
                <span className={`font-bold nums ${remainingDebtAfterPay === 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
                  {remainingDebtAfterPay === 0 ? tLabels.fullyCleared[language] : formatMoney(remainingDebtAfterPay)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ================= MODE: NOUVELLE SOUSCRIPTION / RENOUVELLEMENT ================= */
          <>
            {/* Plans Grid Selection */}
            <div>
              <label className="text-[13px] font-semibold text-[#0F172A] mb-2 block">
                {tLabels.subscriptionPlan[language]}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                {plans.map((p) => {
                  const isSelected = p.id === selectedPlanId;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setSelectedPlanId(p.id);
                        if (!isCreditMode) setCustomPaidAmount(p.price.toString());
                      }}
                      className={`p-2.5 rounded-[8px] border text-left flex flex-col justify-between transition-all select-none cursor-pointer ${
                        isSelected
                          ? "bg-[#EFF6FF] border-[#2563EB] ring-2 ring-[#93C5FD]"
                          : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-[13px] font-semibold text-[#0F172A] leading-tight">
                            {p.name}
                          </div>
                          <span className="shrink-0">
                            {p.planType === "SESSIONS" ? (
                              <Ticket className="w-3.5 h-3.5 text-[#4F46E5]" />
                            ) : p.planType === "TIME_SLOT" ? (
                              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                            ) : (
                              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          {p.planType === "SESSIONS"
                            ? `${p.sessionCount || 10} ${tLabels.sessions[language]}`
                            : p.planType === "TIME_SLOT"
                            ? `${p.startTime || "13:00"} - ${p.endTime || "16:00"}`
                            : `${p.durationDays} ${p.durationDays > 1 ? tLabels.daysPlural[language] : tLabels.days[language]}`}
                        </div>
                      </div>
                      <div className="text-[14px] font-bold text-[#2563EB] mt-1.5 nums">
                        {formatMoney(p.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Credit / Partial Payment Toggle & Input */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-[#0F172A]">
                    {tLabels.paymentTerms[language]}
                  </span>
                  <p className="text-[11px] text-[#64748B]">
                    {tLabels.paymentTermsDesc[language]}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#E2E8F0] p-0.5 rounded-[6px] text-[12px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreditMode(false);
                      setCustomPaidAmount("");
                    }}
                    className={`px-2.5 py-1 rounded-[5px] font-medium transition-all ${
                      !isCreditMode
                        ? "bg-white text-[#0F172A] shadow-sm font-semibold"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {tLabels.full[language]}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreditMode(true);
                      if (customPaidAmount === "") {
                        // Default to half or plan price
                        setCustomPaidAmount(Math.round(formulaPrice / 2).toString());
                      }
                    }}
                    className={`px-2.5 py-1 rounded-[5px] font-medium transition-all flex items-center gap-1 ${
                      isCreditMode
                        ? "bg-[#D97706] text-white shadow-sm font-semibold"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <span>{tLabels.credit[language]}</span>
                  </button>
                </div>
              </div>

              {isCreditMode && (
                <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[12px] font-semibold text-[#0F172A] block mb-1">
                        {tLabels.amountPaidToday[language]}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formulaPrice}
                        value={customPaidAmount}
                        onChange={(e) => setCustomPaidAmount(e.target.value)}
                        placeholder="Ex: 3000"
                        className="w-full h-9 px-3 text-[14px] font-bold nums bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:border-[#2563EB]"
                      />
                    </div>
                    {/* Quick percentage shortcuts */}
                    <div className="flex items-center gap-1 mt-5">
                      {[
                        { label: "25%", val: 0.25 },
                        { label: "50%", val: 0.5 },
                        { label: "75%", val: 0.75 },
                      ].map((pct) => (
                        <button
                          type="button"
                          key={pct.label}
                          onClick={() => setCustomPaidAmount(Math.round(formulaPrice * pct.val).toString())}
                          className="px-2 py-1 text-[11px] font-medium bg-white text-[#475569] border border-[#CBD5E1] rounded hover:bg-[#F1F5F9]"
                        >
                          {pct.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Breakdown Callout */}
                  <div className={`p-3 rounded-[6px] border text-[12px] ${
                    balanceDue > 0
                      ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                      : "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                  }`}>
                    <div className="flex justify-between items-center">
                      <span>{tLabels.totalPrice[language]}</span>
                      <span className="font-bold nums">{formatMoney(formulaPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>{tLabels.paidToday[language]}</span>
                      <span className="font-bold nums">{formatMoney(actualPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-current/20 font-bold text-[13px]">
                      <span>{tLabels.balanceDueDebt[language]}</span>
                      <span className="nums">{formatMoney(balanceDue)}</span>
                    </div>
                    {balanceDue > 0 && (
                      <div className="flex items-start gap-1.5 text-[11px] mt-2 opacity-90 leading-tight">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                        <p>{tLabels.debtNotice(formatMoney(balanceDue))[language]}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Renewal Mode: EXTEND vs RESTART */}
            <div>
              <label className="text-[12px] font-semibold text-[#475569] mb-1.5 block">
                {tLabels.renewalMode[language]}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <label
                  className={`p-2.5 rounded-[8px] border cursor-pointer flex flex-col gap-0.5 ${
                    mode === "EXTEND"
                      ? "bg-[#EFF6FF] border-[#2563EB]"
                      : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "EXTEND"}
                      onChange={() => setMode("EXTEND")}
                      className="accent-[#2563EB]"
                    />
                    <span className="text-[12px] font-semibold text-[#0F172A]">
                      {tLabels.extendTitle[language]}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] pl-5">
                    {tLabels.extendDesc[language]}
                  </span>
                </label>

                <label
                  className={`p-2.5 rounded-[8px] border cursor-pointer flex flex-col gap-0.5 ${
                    mode === "RESTART"
                      ? "bg-[#EFF6FF] border-[#2563EB]"
                      : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "RESTART"}
                      onChange={() => setMode("RESTART")}
                      className="accent-[#2563EB]"
                    />
                    <span className="text-[12px] font-semibold text-[#0F172A]">
                      {tLabels.restartTitle[language]}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] pl-5">
                    {tLabels.restartDesc[language]}
                  </span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* Payment Method */}
        <div>
          <label className="text-[12px] font-semibold text-[#475569] mb-1.5 block">
            {tLabels.paymentMethod[language]}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "CASH", label: tLabels.cash[language] },
              { id: "CARD", label: tLabels.card[language] },
              { id: "OTHER", label: tLabels.other[language] },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMethod(m.id as any)}
                className={`py-2 px-3 rounded-[6px] border text-[13px] font-medium transition-all ${
                  method === m.id
                    ? "bg-[#0F172A] text-white border-[#0F172A]"
                    : "bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F8FAFC]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
