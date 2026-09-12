"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { Radio, CreditCard, CheckCircle2 } from "lucide-react";
import { invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

interface CardAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memberId?: string;
  memberName?: string;
  currentCardUid?: string | null;
}

export const CardAssignModal: React.FC<CardAssignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  memberId,
  memberName,
  currentCardUid,
}) => {
  const toast = useToast();
  const { language } = useTranslation();
  const [uid, setUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tLabels = {
    titleAssign: { fr: "Scanner la carte RFID", en: "Scan RFID Card", ar: "مسح بطاقة RFID" },
    titleRegister: { fr: "Enregistrer un badge", en: "Register RFID Card", ar: "تسجيل بطاقة جديدة" },
    descAssign: (mName?: string) => ({
      fr: `Approchez le badge du lecteur pour l'associer à ${mName || "l'adhérent"}`,
      en: `Tap the card on the reader to associate with ${mName || "the member"}`,
      ar: `قرّب البطاقة من القارئ لربطها بـ ${mName || "المشترك"}`,
    }),
    descRegister: {
      fr: "Approchez le badge du lecteur RFID pour l'enregistrer dans le système",
      en: "Tap the badge on the RFID reader to register it in the system",
      ar: "قرّب البطاقة من القارئ لتسجيلها في النظام",
    },
    cancel: { fr: "Annuler", en: "Cancel", ar: "إلغاء" },
    validateCard: { fr: "Valider le badge", en: "Validate Card", ar: "تأكيد البطاقة" },
    registerCard: { fr: "Enregistrer", en: "Save", ar: "حفظ" },
    scanBoxTitle: { fr: "Scannez la carte maintenant", en: "Scan Card Now", ar: "امسح البطاقة الآن" },
    scanBoxDesc: {
      fr: "Placez le badge RFID 13,56 MHz sur le lecteur USB connecté au poste",
      en: "Place the 13.56 MHz RFID badge on the USB reader connected to terminal",
      ar: "ضع بطاقة RFID ذات التردد 13.56 ميغاهرتز على قارئ USB المتصل بالجهاز",
    },
    currentCardWarning: (uidStr: string) => ({
      fr: `Badge actuel : ${uidStr} (sera remplacé).`,
      en: `Current badge: ${uidStr} (will be replaced).`,
      ar: `البطاقة الحالية: ${uidStr} (سيتم استبدالها).`,
    }),
    uidLabel: { fr: "Numéro de série / UID du badge *", en: "Card Serial Number / UID *", ar: "الرقم التسلسلي للبطاقة UID *" },
    uidPlaceholder: {
      fr: "En attente de scan... (ex: 04:A3:2B:F1)",
      en: "Waiting for scan... (e.g. 04:A3:2B:F1)",
      ar: "في انتظار المسح... (مثال: 04:A3:2B:F1)",
    },
    uidHelp: {
      fr: "Détecte automatiquement la frappe clavier du lecteur RFID USB et valide avec Entrée.",
      en: "Automatically detects USB RFID reader keyboard strokes and confirms with Enter.",
      ar: "يتعرف تلقائياً على إدخال قارئ بطاقات RFID USB ويؤكد بالضغط على Enter.",
    },
    errEmpty: {
      fr: "Veuillez scanner ou saisir le numéro de badge",
      en: "Please scan or enter the card number",
      ar: "يرجى مسح أو إدخال رقم البطاقة",
    },
    toastAssignedTitle: { fr: "Badge attribué", en: "Card Assigned", ar: "تم تعيين البطاقة" },
    toastAssignedDesc: (cUid: string, mName?: string) => ({
      fr: `Le badge ${cUid} est maintenant associé à ${mName || "l'adhérent"}`,
      en: `Card ${cUid} is now associated with ${mName || "the member"}`,
      ar: `البطاقة ${cUid} مرتبطة الآن بـ ${mName || "المشترك"}`,
    }),
    toastRegisteredTitle: { fr: "Badge enregistré", en: "Card Registered", ar: "تم تسجيل البطاقة" },
    toastRegisteredDesc: (cUid: string) => ({
      fr: `Le badge ${cUid} a été enregistré`,
      en: `Card ${cUid} has been registered`,
      ar: `تم تسجيل البطاقة ${cUid}`,
    }),
  };

  useEffect(() => {
    if (isOpen) {
      setUid("");
      setError("");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUid = uid.trim().toUpperCase();
    if (!cleanUid) {
      setError(tLabels.errEmpty[language]);
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (memberId) {
        // Try to assign directly
        const res = await fetch(`/api/cards/${encodeURIComponent(cleanUid)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ASSIGN", memberId }),
        });

        if (res.status === 404) {
          // Card does not exist yet in DB: create and link directly to member
          const createRes = await fetch("/api/cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: cleanUid, memberId }),
          });
          const createData = await createRes.json();
          if (!createRes.ok) throw new Error(createData.error?.message || "Erreur de création de carte");
        } else if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || "Erreur d'attribution du badge");
        }

        toast.success(
          tLabels.toastAssignedTitle[language],
          tLabels.toastAssignedDesc(cleanUid, memberName)[language]
        );
      } else {
        // Register card into system
        const createRes = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: cleanUid }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error?.message || "Erreur d'enregistrement");

        toast.success(
          tLabels.toastRegisteredTitle[language],
          tLabels.toastRegisteredDesc(cleanUid)[language]
        );
      }

      invalidateCache(["/api/cards", "/api/dashboard", "/api/members"]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memberId ? tLabels.titleAssign[language] : tLabels.titleRegister[language]}
      description={
        memberId
          ? tLabels.descAssign(memberName)[language]
          : tLabels.descRegister[language]
      }
      size="sm"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {tLabels.cancel[language]}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit()}
            isLoading={isLoading}
            disabled={!uid.trim()}
          >
            {memberId ? tLabels.validateCard[language] : tLabels.registerCard[language]}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-[13px] text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Scan Visual Box */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#EFF6FF] to-[#F8FAFC] border-2 border-dashed border-[#93C5FD] rounded-[12px] p-6 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 animate-pulse">
            <Radio className="w-7 h-7 animate-spin-slow" />
          </div>
          <div className="text-[15px] font-bold text-[#0F172A]">
            {tLabels.scanBoxTitle[language]}
          </div>
          <p className="text-[12px] text-[#64748B] mt-1 max-w-[260px]">
            {tLabels.scanBoxDesc[language]}
          </p>
        </div>

        {currentCardUid && (
          <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] text-[12px] text-[#B45309] flex items-center gap-2">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>
              {tLabels.currentCardWarning(currentCardUid)[language]}
            </span>
          </div>
        )}

        {/* UID Input with Auto-focus */}
        <div>
          <label className="text-[13px] font-medium text-[#475569] mb-1.5 block">
            {tLabels.uidLabel[language]}
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder={tLabels.uidPlaceholder[language]}
              className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[14px] font-mono-code font-semibold tracking-wide text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              required
            />
            {uid.trim().length > 3 && (
              <CheckCircle2 className="w-5 h-5 text-[#059669] absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            {tLabels.uidHelp[language]}
          </p>
        </div>
      </form>
    </Modal>
  );
};
