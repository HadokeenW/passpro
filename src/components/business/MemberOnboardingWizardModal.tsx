"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { WebcamCaptureModal } from "./WebcamCaptureModal";
import { ReceiptModal } from "./ReceiptModal";
import { formatMoney } from "@/lib/money";
import { toLatinDigits } from "@/lib/dates";
import { invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";
import {
  Camera,
  Radio,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  AlertTriangle,
  Check,
} from "lucide-react";

interface PlanItem {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  planType: string;
  sessionCount?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface MemberOnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MemberOnboardingWizardModal: React.FC<MemberOnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const { language } = useTranslation();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Client Information
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  // Step 2: Plan & Dates
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 3: RFID & Payment
  const [cardUid, setCardUid] = useState("");
  const [isCheckingCard, setIsCheckingCard] = useState(false);
  const [cardStatus, setCardStatus] = useState<"IDLE" | "AVAILABLE" | "TAKEN">("IDLE");
  const [cardMessage, setCardMessage] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "OTHER">("CASH");
  const [printReceipt, setPrintReceipt] = useState(true);

  // General state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState("");

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // USB-HID RFID Reader Buffer
  const rfidBuffer = useRef("");
  const lastKeyTime = useRef(0);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [rfidInputValue, setRfidInputValue] = useState("");

  // Format today's date as YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calculate end date based on start date and plan duration
  const calculateEndDate = (startStr: string, durationDays: number) => {
    if (!startStr) return "";
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return "";
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, "0");
    const day = String(end.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Reset state on open & activate management mode to suppress kiosk popup
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined" && (window as any).electronAPI?.setManagementMode) {
        (window as any).electronAPI.setManagementMode(true);
      }
      setCurrentStep(1);
      setLastName("");
      setFirstName("");
      setPhone("");
      setPhotoUrl(null);
      setStepError("");
      setCardUid("");
      setRfidInputValue("");
      setCardStatus("IDLE");
      setCardMessage("");
      setPaymentMethod("CASH");
      setPrintReceipt(true);

      const today = getTodayStr();
      setStartDate(today);

      // Fetch active plans
      setIsLoadingPlans(true);
      fetch("/api/plans")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const activePlans = data.filter((p: any) => p.active !== false);
            setPlans(activePlans);
            if (activePlans.length > 0) {
              const defaultPlan = activePlans[0];
              setSelectedPlanId(defaultPlan.id);
              setEndDate(calculateEndDate(today, defaultPlan.durationDays));
              setPaidAmount(defaultPlan.price);
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingPlans(false));
    } else {
      if (typeof window !== "undefined" && (window as any).electronAPI?.setManagementMode) {
        (window as any).electronAPI.setManagementMode(false);
      }
    }

    return () => {
      if (typeof window !== "undefined" && (window as any).electronAPI?.setManagementMode) {
        (window as any).electronAPI.setManagementMode(false);
      }
    };
  }, [isOpen]);

  // When plan or start date changes, recalculate end date & price
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      const calculatedEnd = calculateEndDate(startDate, plan.durationDays);
      setEndDate(calculatedEnd);
      setPaidAmount(plan.price);
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (plan) {
      setEndDate(calculateEndDate(newStart, plan.durationDays));
    }
  };

  // Keyboard listener for USB-HID RFID readers on Step 3
  useEffect(() => {
    if (!isOpen || currentStep !== 3) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in other inputs
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" && target !== rfidInputRef.current) return;

      const now = Date.now();
      if (now - lastKeyTime.current > 300) {
        rfidBuffer.current = "";
      }
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        const val = (rfidBuffer.current || rfidInputValue).trim();
        if (val.length >= 4) {
          handleCardScanned(val);
        }
        rfidBuffer.current = "";
      } else if (e.key.length === 1) {
        rfidBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep, rfidInputValue]);

  // Listen for RFID scans from Electron background hook when in Step 3
  useEffect(() => {
    if (!isOpen || currentStep !== 3) return;
    if (typeof window === "undefined" || !(window as any).electronAPI?.onManagementRfidScan) return;

    const cleanup = (window as any).electronAPI.onManagementRfidScan((data: { uid: string }) => {
      if (data?.uid) {
        handleCardScanned(data.uid.trim());
      }
    });
    return () => cleanup?.();
  }, [isOpen, currentStep]);

  // Auto-focus RFID input field when arriving on Step 3
  useEffect(() => {
    if (isOpen && currentStep === 3) {
      const timer = setTimeout(() => {
        rfidInputRef.current?.focus();
        rfidInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep]);

  // Card verification logic
  const handleCardScanned = async (scannedUid: string) => {
    const clean = scannedUid.trim().toUpperCase();
    if (!clean || clean.length < 4) return;

    setCardUid(clean);
    setRfidInputValue(clean);
    setIsCheckingCard(true);
    setCardStatus("IDLE");
    setCardMessage("");

    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(clean)}`);
      if (res.status === 404) {
        // Card is completely new and available
        setCardStatus("AVAILABLE");
        setCardMessage(
          language === "ar"
            ? "بطاقة جديدة متاحة"
            : language === "en"
            ? "Card available"
            : "Carte disponible"
        );
      } else if (res.ok) {
        const cardData = await res.json();
        if (cardData?.uid) {
          setCardUid(cardData.uid);
          setRfidInputValue(cardData.uid);
        }
        if (cardData?.member && !cardData.member.deletedAt) {
          setCardStatus("TAKEN");
          setCardMessage(
            language === "ar"
              ? `هذه البطاقة مخصصة حالياً لـ ${cardData.member.firstName} ${cardData.member.lastName}`
              : language === "en"
              ? `Card already assigned to ${cardData.member.firstName} ${cardData.member.lastName}`
              : `Carte déjà attribuée à ${cardData.member.firstName} ${cardData.member.lastName}`
          );
        } else {
          setCardStatus("AVAILABLE");
          setCardMessage(
            language === "ar"
              ? "بطاقة متوفرة للتعيين"
              : language === "en"
              ? "Card available for assignment"
              : "Carte disponible"
          );
        }
      } else {
        setCardStatus("AVAILABLE");
        setCardMessage(
          language === "ar" ? "بطاقة جاهزة" : language === "en" ? "Card ready" : "Carte disponible"
        );
      }
    } catch {
      setCardStatus("AVAILABLE");
      setCardMessage("Carte disponible");
    } finally {
      setIsCheckingCard(false);
    }
  };

  // Step 1 Validation -> Next
  const handleStep1Next = () => {
    if (!lastName.trim()) {
      setStepError(
        language === "ar" ? "اللقب مطلوب" : language === "en" ? "Last name is required" : "Le nom est obligatoire"
      );
      return;
    }
    if (!firstName.trim()) {
      setStepError(
        language === "ar" ? "الاسم مطلوب" : language === "en" ? "First name is required" : "Le prénom est obligatoire"
      );
      return;
    }
    if (!phone.trim()) {
      setStepError(
        language === "ar"
          ? "رقم الهاتف مطلوب"
          : language === "en"
          ? "Phone number is required"
          : "Le numéro de téléphone est obligatoire"
      );
      return;
    }

    setStepError("");
    setCurrentStep(2);
  };

  // Step 2 Validation -> Next
  const handleStep2Next = () => {
    if (!selectedPlanId) {
      setStepError(
        language === "ar"
          ? "يرجى اختيار باقة اشتراك"
          : language === "en"
          ? "Please select a plan"
          : "Veuillez sélectionner un abonnement"
      );
      return;
    }

    setStepError("");
    setCurrentStep(3);
  };

  // Step 3 Final Submission
  const handleFinalSubmit = async () => {
    if (cardStatus === "TAKEN") {
      setStepError(
        language === "ar"
          ? "لا يمكن استخدام هذه البطاقة لأنها معينة لمشترك آخر"
          : language === "en"
          ? "Cannot use this card: already assigned to another member"
          : "Impossible d'utiliser cette carte car elle est déjà attribuée à un autre adhérent"
      );
      return;
    }

    setIsSubmitting(true);
    setStepError("");

    try {
      const res = await fetch("/api/members/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          photoUrl: photoUrl || null,
          planId: selectedPlanId,
          startDate,
          endDate,
          cardUid: cardUid.trim() || null,
          paidAmount: Number(paidAmount) || 0,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de l'enregistrement");
      }

      // Invalidate relevant caches
      invalidateCache("members");
      invalidateCache("subscriptions");
      invalidateCache("payments");
      invalidateCache("cards");
      invalidateCache("dashboard");

      toast.success(
        language === "ar" ? "تم تسجيل المشترك بنجاح" : language === "en" ? "Member registered successfully" : "Adhérent inscrit avec succès",
        language === "ar"
          ? `تم تفعيل اشتراك ${firstName} ${lastName}`
          : language === "en"
          ? `Subscription activated for ${firstName} ${lastName}`
          : `Abonnement activé pour ${firstName} ${lastName}`
      );

      onSuccess();
      onClose();

      // If receipt printing requested and payment exists, open receipt modal
      if (printReceipt && data.payment) {
        fetch(`/api/payments/${data.payment.id}/reprint`)
          .then((r) => r.json())
          .then((pData) => {
            if (pData?.payment) {
              setReceiptData(pData);
              setIsReceiptModalOpen(true);
            }
          })
          .catch(console.error);
      }
    } catch (err: any) {
      setStepError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const planPrice = selectedPlan?.price || 0;
  const balanceDue = Math.max(0, planPrice - (Number(paidAmount) || 0));

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          currentStep === 1
            ? language === "ar" ? "عميل جديد" : language === "en" ? "New Client" : "Nouveau client"
            : currentStep === 2
            ? language === "ar" ? "اشتراك جديد" : language === "en" ? "New Subscription" : "Nouvel abonnement"
            : language === "ar" ? "البطاقة والدفع" : language === "en" ? "Card & Payment" : "Carte & paiement"
        }
        description={
          currentStep === 1
            ? language === "ar" ? "المعلومات الشخصية" : language === "en" ? "Personal information" : "Informations personnelles"
            : currentStep === 2
            ? language === "ar" ? "اختيار الباقة والتواريخ" : language === "en" ? "Choose plan and dates" : "Type d'abonnement et période"
            : language === "ar" ? "ربط بطاقة RFID وتحصيل الدفع" : language === "en" ? "RFID Card & Payment settlement" : "Carte RFID et règlement caisse"
        }
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            {/* Step Counter Indicator */}
            <div className="text-[12px] font-medium text-[#64748B] nums">
              {currentStep === 1 ? "1 / 3" : currentStep === 2 ? "2 / 3" : "3 / 3"}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {currentStep === 1 && (
                <>
                  <Button variant="ghost" onClick={onClose}>
                    {language === "ar" ? "إلغاء" : language === "en" ? "Cancel" : "Annuler"}
                  </Button>
                  <Button variant="primary" onClick={handleStep1Next}>
                    {language === "ar" ? "التالي" : language === "en" ? "Next" : "Suivant"}
                  </Button>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                    {language === "ar" ? "رجوع" : language === "en" ? "Back" : "Retour"}
                  </Button>
                  <Button variant="primary" onClick={handleStep2Next}>
                    {language === "ar" ? "التالي" : language === "en" ? "Next" : "Suivant"}
                  </Button>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <Button variant="ghost" onClick={() => setCurrentStep(2)} disabled={isSubmitting}>
                    {language === "ar" ? "رجوع" : language === "en" ? "Back" : "Retour"}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleFinalSubmit}
                    isLoading={isSubmitting}
                  >
                    {language === "ar" ? "تأكيد" : language === "en" ? "Validate" : "Valider"}
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Progress Bar Header: ① Client ───── ② Abonnement ───── ③ RFID & Paiement */}
          <div className="relative py-2 px-1">
            <div className="flex items-center justify-between relative z-10 text-[12px] font-medium">
              {/* Step 1 */}
              <div
                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                  currentStep === 1
                    ? "text-[#2563EB] font-semibold"
                    : currentStep > 1
                    ? "text-emerald-600 font-semibold"
                    : "text-[#94A3B8]"
                }`}
                onClick={() => setCurrentStep(1)}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    currentStep === 1
                      ? "bg-[#2563EB] text-white ring-4 ring-blue-100"
                      : currentStep > 1
                      ? "bg-emerald-500 text-white"
                      : "bg-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
                </div>
                <span>{language === "ar" ? "العميل" : language === "en" ? "Client" : "Client"}</span>
              </div>

              {/* Connecting Line 1-2 */}
              <div
                className={`flex-1 h-[2px] mx-3 transition-colors ${
                  currentStep > 1 ? "bg-emerald-500" : "bg-[#E2E8F0]"
                }`}
              />

              {/* Step 2 */}
              <div
                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                  currentStep === 2
                    ? "text-[#2563EB] font-semibold"
                    : currentStep > 2
                    ? "text-emerald-600 font-semibold"
                    : "text-[#94A3B8]"
                }`}
                onClick={() => {
                  if (lastName.trim() && firstName.trim() && phone.trim()) {
                    setCurrentStep(2);
                  }
                }}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    currentStep === 2
                      ? "bg-[#2563EB] text-white ring-4 ring-blue-100"
                      : currentStep > 2
                      ? "bg-emerald-500 text-white"
                      : "bg-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
                </div>
                <span>{language === "ar" ? "الاشتراك" : language === "en" ? "Subscription" : "Abonnement"}</span>
              </div>

              {/* Connecting Line 2-3 */}
              <div
                className={`flex-1 h-[2px] mx-3 transition-colors ${
                  currentStep > 2 ? "bg-emerald-500" : "bg-[#E2E8F0]"
                }`}
              />

              {/* Step 3 */}
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  currentStep === 3 ? "text-[#2563EB] font-semibold" : "text-[#94A3B8]"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    currentStep === 3
                      ? "bg-[#2563EB] text-white ring-4 ring-blue-100"
                      : "bg-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  3
                </div>
                <span>{language === "ar" ? "البطاقة والدفع" : language === "en" ? "RFID & Payment" : "RFID & Paiement"}</span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {stepError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-[13px] text-[#DC2626] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{stepError}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: INFORMATIONS CLIENT
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* Nom & Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[13px] font-medium text-[#475569] select-none">
                    {language === "ar" ? "اللقب *" : language === "en" ? "Last Name *" : "Nom *"}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={language === "ar" ? "مثال: بن علي" : "ex: Benali"}
                    autoFocus
                    className="w-full h-9 px-3 text-[13px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[13px] font-medium text-[#475569] select-none">
                    {language === "ar" ? "الاسم *" : language === "en" ? "First Name *" : "Prénom *"}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={language === "ar" ? "مثال: كريم" : "ex: Karim"}
                    className="w-full h-9 px-3 text-[13px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[13px] font-medium text-[#475569] select-none">
                  {language === "ar" ? "رقم الهاتف *" : language === "en" ? "Phone number *" : "Téléphone *"}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550 12 34 56"
                  className="w-full h-9 px-3 text-[13px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2563EB] nums"
                />
              </div>

              {/* Photo de l'adhérent */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-[13px] font-medium text-[#475569] select-none">
                  {language === "ar" ? "الصورة الشخصية" : language === "en" ? "Member Photo" : "Photo"}
                </label>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px]">
                  {/* Photo Avatar Preview */}
                  <div className="w-14 h-14 rounded-full border border-[#CBD5E1] overflow-hidden bg-white shadow-xs flex items-center justify-center shrink-0">
                    {photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-[#94A3B8]" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    {photoUrl ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === "ar" ? "تمت إضافة الصورة" : language === "en" ? "Photo added" : "Photo enregistrée"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsWebcamOpen(true)}
                          className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                        >
                          {language === "ar" ? "تغيير" : language === "en" ? "Change" : "Modifier"}
                        </button>
                        <span className="text-gray-300">·</span>
                        <button
                          type="button"
                          onClick={() => setPhotoUrl(null)}
                          className="text-[11px] text-red-500 hover:underline cursor-pointer"
                        >
                          {language === "ar" ? "حذف" : language === "en" ? "Remove" : "Supprimer"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsWebcamOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#2563EB] text-[#0F172A] rounded-[6px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-[#2563EB]" />
                        <span>{language === "ar" ? "إضافة صورة" : language === "en" ? "Add photo" : "Ajouter une photo"}</span>
                      </button>
                    )}
                    <span className="text-[11px] text-[#64748B]">
                      {language === "ar"
                        ? "تظهر الصورة على شاشة البوابة عند مسح البطاقة لمنع تبادل البطاقات."
                        : language === "en"
                        ? "Photo appears on kiosk screen during access to prevent card sharing."
                        : "La photo s'affichera à la borne d'accès pour éviter les prêts de badge."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: CHOISIR L'ABONNEMENT
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* Type d'abonnement */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[13px] font-medium text-[#475569] select-none">
                  {language === "ar" ? "نوع الاشتراك *" : language === "en" ? "Subscription Type *" : "Type d'abonnement *"}
                </label>
                {isLoadingPlans ? (
                  <div className="h-9 bg-[#F1F5F9] rounded-[6px] animate-pulse" />
                ) : (
                  <select
                    value={selectedPlanId}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="w-full h-9 px-3 text-[13px] border border-[#CBD5E1] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2563EB] bg-white cursor-pointer font-medium"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatMoney(p.price)} ({p.durationDays} {language === "ar" ? "يوم" : "jours"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[13px] font-medium text-[#475569] select-none">
                    {language === "ar" ? "تاريخ البداية *" : language === "en" ? "Start Date *" : "Date de début *"}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full h-9 px-3 text-[13px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2563EB] nums"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[13px] font-medium text-[#475569] select-none">
                    {language === "ar" ? "تاريخ النهاية *" : language === "en" ? "End Date *" : "Date de fin *"}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-9 px-3 text-[13px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2563EB] nums"
                  />
                </div>
              </div>

              {/* Prix Badge Box */}
              <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]/40 border border-[#BFDBFE] rounded-[10px] flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[12px] font-medium text-[#1E40AF] block">
                    {language === "ar" ? "سعر الباقة" : language === "en" ? "Plan Price" : "Tarif de la formule"}
                  </span>
                  <span className="text-[20px] font-bold text-[#1E3A8A] nums">
                    {formatMoney(planPrice)}
                  </span>
                </div>
                <div className="text-[11px] text-[#3B82F6] font-medium bg-white/80 px-2.5 py-1 rounded-full border border-blue-200">
                  {selectedPlan?.durationDays} {language === "ar" ? "يوم صلاحية" : "jours de validité"}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: CARTE & PAIEMENT
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* RFID Card Box */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-[13px] font-bold text-[#0F172A]">
                      {language === "ar" ? "بطاقة RFID" : language === "en" ? "RFID Card" : "Carte RFID"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    {language === "ar" ? "قرّب البطاقة من القارئ" : language === "en" ? "Tap card on reader" : "Présentez la carte devant le lecteur"}
                  </span>
                </div>

                {/* RFID Reader Status View */}
                {cardUid ? (
                  <div
                    className={`p-3 rounded-[8px] border flex items-center justify-between transition-all ${
                      cardStatus === "TAKEN"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                    }`}
                  >
                    <div>
                      <div className="text-[13px] font-mono-code font-bold tracking-wider nums">
                        UID : {toLatinDigits(cardUid)}
                      </div>
                      <div className="text-[11px] font-medium mt-0.5 flex items-center gap-1">
                        {cardStatus !== "TAKEN" && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                        <span>{cardMessage || (cardStatus === "TAKEN" ? "Carte indisponible" : "Carte disponible")}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCardUid("");
                        setRfidInputValue("");
                        setCardStatus("IDLE");
                        setCardMessage("");
                        setTimeout(() => rfidInputRef.current?.focus(), 80);
                      }}
                      className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer font-medium"
                    >
                      {language === "ar" ? "مسح بطاقة أخرى" : language === "en" ? "Rescan" : "Changer de badge"}
                    </button>
                  </div>
                ) : (
                  <div className="py-2.5 px-3 bg-white border border-dashed border-[#93C5FD] rounded-[8px] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping shrink-0" />
                      <span className="text-[12.5px] font-medium text-[#1E40AF] truncate">
                        {language === "ar" ? "في الانتظار..." : language === "en" ? "Waiting for card..." : "En attente du badge..."}
                      </span>
                    </div>
                    <input
                      ref={rfidInputRef}
                      type="text"
                      value={rfidInputValue}
                      onChange={(e) => setRfidInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.currentTarget.value || rfidInputValue).trim();
                          if (val.length >= 4) {
                            handleCardScanned(val);
                          }
                        }
                      }}
                      placeholder={language === "ar" ? "أو أدخل UID يدوياً" : "Saisie manuelle ou scan"}
                      className="w-44 h-8 px-2.5 text-[11px] border border-gray-300 rounded font-mono-code nums uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-[10px] flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="text-[13px] font-bold text-[#0F172A]">
                    {language === "ar" ? "الدفع" : language === "en" ? "Payment" : "Paiement"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Montant Versé */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[13px] font-medium text-[#475569] select-none">
                      {language === "ar"
                        ? `المبلغ المدفوع (الإجمالي: ${formatMoney(planPrice)})`
                        : language === "en"
                        ? `Amount Paid (Total: ${formatMoney(planPrice)})`
                        : `Montant versé (Total : ${formatMoney(planPrice)})`}
                    </label>
                    <input
                      id="paidAmountInput"
                      type="number"
                      min={0}
                      max={planPrice}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-full h-9 px-3 text-[13px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-emerald-500 nums font-semibold"
                    />
                  </div>

                  {/* Mode de paiement */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[13px] font-medium text-[#475569] select-none">
                      {language === "ar" ? "طريقة الدفع" : language === "en" ? "Payment Method" : "Mode de règlement"}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full h-9 px-3 text-[13px] border border-[#CBD5E1] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white cursor-pointer"
                    >
                      <option value="CASH">{language === "ar" ? "نقداً (Espèces)" : "Espèces"}</option>
                      <option value="CARD">{language === "ar" ? "بطاقة بنكية (Carte)" : "Carte bancaire"}</option>
                      <option value="OTHER">{language === "ar" ? "أخرى (Autre)" : "Autre"}</option>
                    </select>
                  </div>
                </div>

                {/* Debt Indicator if partial payment */}
                {balanceDue > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-[6px] text-[12px] text-amber-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      {language === "ar" ? "المبلغ المتبقي (دَيْن) :" : "Reste à payer (Dette) :"}
                    </span>
                    <span className="font-bold text-amber-900 nums">
                      {formatMoney(balanceDue)}
                    </span>
                  </div>
                )}

                {/* Checkbox: Print Receipt */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-[#475569] pt-1">
                  <input
                    type="checkbox"
                    checked={printReceipt}
                    onChange={(e) => setPrintReceipt(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>
                    {language === "ar"
                      ? "طباعة وصل الدفع الحراري فور التأكيد"
                      : language === "en"
                      ? "Print thermal receipt upon validation"
                      : "Imprimer le reçu thermique après validation"}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Embedded Webcam Capture Modal */}
      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onSuccess={(dataUrl) => {
          setPhotoUrl(dataUrl);
          setIsWebcamOpen(false);
        }}
        memberName={`${firstName} ${lastName}`.trim() || "Nouvel adhérent"}
      />

      {/* Thermal Receipt Modal (if printed) */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={receiptData}
      />
    </>
  );
};
