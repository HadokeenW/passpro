import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export type StatusPillType =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED"
  | "BLOCKED"
  | "UNASSIGNED"
  | "NO_SUBSCRIPTION"
  | "GRANTED"
  | "DENIED";

interface StatusPillProps {
  status: StatusPillType | string;
  customLabel?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, customLabel, className }) => {
  const { language } = useTranslation();

  const labels: Record<string, { fr: string; en: string; ar: string }> = {
    ACTIVE: { fr: "Actif", en: "Active", ar: "نشط" },
    EXPIRING_SOON: { fr: "Expire bientôt", en: "Expiring soon", ar: "ينتهي قريباً" },
    EXPIRED: { fr: "Expiré", en: "Expired", ar: "منتهي" },
    SUSPENDED: { fr: "Suspendu", en: "Suspended", ar: "معلق" },
    CANCELLED: { fr: "Résilié", en: "Cancelled", ar: "ملغى" },
    BLOCKED: { fr: "Bloquée", en: "Blocked", ar: "محظورة" },
    UNASSIGNED: { fr: "En stock", en: "In stock", ar: "في المخزون" },
    NO_SUBSCRIPTION: { fr: "Sans formule", en: "No plan", ar: "بدون اشتراك" },
    GRANTED: { fr: "Autorisé", en: "Granted", ar: "مسموح" },
    DENIED: { fr: "Refusé", en: "Denied", ar: "مرفوض" },
  };

  const configs: Record<string, { bg: string; text: string; border: string }> = {
    ACTIVE: { bg: "bg-[#ECFDF5]", text: "text-[#047857]", border: "border-[#A7F3D0]" },
    EXPIRING_SOON: { bg: "bg-[#FFFBEB]", text: "text-[#B45309]", border: "border-[#FDE68A]" },
    EXPIRED: { bg: "bg-[#FEF2F2]", text: "text-[#B91C1C]", border: "border-[#FECACA]" },
    SUSPENDED: { bg: "bg-[#F1F5F9]", text: "text-[#475569]", border: "border-[#E2E8F0]" },
    CANCELLED: { bg: "bg-[#FFFFFF]", text: "text-[#94A3B8]", border: "border-[#E2E8F0]" },
    BLOCKED: { bg: "bg-[#FEF2F2]", text: "text-[#B91C1C]", border: "border-[#FECACA]" },
    UNASSIGNED: { bg: "bg-[#F1F5F9]", text: "text-[#64748B]", border: "border-[#E2E8F0]" },
    NO_SUBSCRIPTION: { bg: "bg-[#F1F5F9]", text: "text-[#64748B]", border: "border-[#E2E8F0]" },
    GRANTED: { bg: "bg-[#ECFDF5]", text: "text-[#047857]", border: "border-[#A7F3D0]" },
    DENIED: { bg: "bg-[#FEF2F2]", text: "text-[#B91C1C]", border: "border-[#FECACA]" },
  };

  const config = configs[status] || {
    bg: "bg-[#F1F5F9]",
    text: "text-[#475569]",
    border: "border-[#E2E8F0]",
  };

  const defaultLabel = labels[status]?.[language] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center h-[22px] px-2.5 rounded-full border text-[12px] font-semibold tracking-wide whitespace-nowrap",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {customLabel || defaultLabel}
    </span>
  );
};
