"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "./Field";
import { useToast } from "./Toast";
import { invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMember?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  } | null;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMember,
}) => {
  const toast = useToast();
  const { t, language } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialMember) {
      setFirstName(initialMember.firstName || "");
      setLastName(initialMember.lastName || "");
      setPhone(initialMember.phone || "");
      setEmail(initialMember.email || "");
      setNotes(initialMember.notes || "");
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setNotes("");
    }
    setError("");
  }, [initialMember, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError(
        language === "ar"
          ? "الاسم الشخصي واللقب مطلوبان"
          : language === "en"
          ? "First and last name are required"
          : "Le prénom et le nom sont requis"
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const url = initialMember ? `/api/members/${initialMember.id}` : "/api/members";
      const method = initialMember ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || null,
          email: email || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error?.message ||
            (language === "ar"
              ? "حدث خطأ أثناء التسجيل"
              : language === "en"
              ? "Error saving member"
              : "Erreur lors de l'enregistrement")
        );
      }

      invalidateCache(["/api/members", "/api/dashboard"]);
      toast.success(
        initialMember
          ? language === "ar"
            ? "تم تحديث بيانات العضو"
            : language === "en"
            ? "Member updated"
            : "Adhérent mis à jour"
          : language === "ar"
          ? "تم إنشاء العضو بنجاح"
          : language === "en"
          ? "Member created"
          : "Adhérent créé",
        `${firstName} ${lastName}`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          (language === "ar"
            ? "حدث خطأ غير متوقع"
            : language === "en"
            ? "An error occurred"
            : "Une erreur est survenue")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const labels = {
    firstName: { fr: "Prénom *", en: "First Name *", ar: "الاسم الشخصي *" },
    lastName: { fr: "Nom *", en: "Last Name *", ar: "اللقب *" },
    phone: { fr: "Téléphone", en: "Phone", ar: "رقم الهاتف" },
    email: { fr: "Email", en: "Email", ar: "البريد الإلكتروني" },
    notes: { fr: "Notes internes", en: "Internal notes", ar: "ملاحظات داخلية" },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialMember ? t("common.edit") : t("members.newMember")}
      description={language === "ar" ? "معلومات الهوية والاتصال" : language === "en" ? "Identity & contact information" : "Renseignez les informations d'identité et de contact"}
      size="sm"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {t("common.save")}
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

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={labels.firstName[language]}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ex: Amine"
            required
          />
          <Field
            label={labels.lastName[language]}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Ex: Belkacem"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={labels.phone[language]}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ex: 0550 12 34 56"
          />
          <Field
            label={labels.email[language]}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex: contact@email.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#475569]">
            {labels.notes[language]}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="..."
            rows={3}
            className="w-full px-3 py-2 text-[13px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] transition-colors focus:border-[#2563EB]"
          />
        </div>
      </form>
    </Modal>
  );
};
