"use client";

import React, { useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { ScanResult } from "@/server/services/access-engine";
import { ScanLine, Check, X, Ticket, Clock, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useTranslation } from "@/lib/i18n";

export const QuickScanWidget: React.FC = () => {
  const { language } = useTranslation();
  const [uid, setUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const tLabels = {
    title: { fr: "Scan de test rapide", en: "Quick Test Scan", ar: "فحص تجريبي سريع" },
    subtitle: {
      fr: "Simuler un passage RFID immédiatement",
      en: "Simulate an RFID badge passage immediately",
      ar: "محاكاة فورية لمرور بطاقة RFID",
    },
    tester: { fr: "Tester", en: "Test", ar: "فحص" },
    scenarios: { fr: "Scénarios :", en: "Scenarios:", ar: "سيناريوهات:" },
    active: { fr: "Actif", en: "Active", ar: "نشط" },
    blocked: { fr: "Bloqué", en: "Blocked", ar: "محظور" },
    unknown: { fr: "Inconnu", en: "Unknown", ar: "غير معروف" },
    granted: { fr: "ACCÈS AUTORISÉ", en: "ACCESS GRANTED", ar: "تم السماح بالدخول" },
    denied: { fr: "ACCÈS REFUSÉ", en: "ACCESS DENIED", ar: "تم رفض الدخول" },
    expires: { fr: "Échéance", en: "Expires", ar: "تاريخ الانتهاء" },
    daysRemaining: (days: number) => ({
      fr: `${days} j restants`,
      en: `${days}d left`,
      ar: `${days} يوم متبقي`,
    }),
    sessionDeducted: (rem: number, tot: number) => ({
      fr: `Séance décomptée · ${rem} restante(s) sur ${tot}`,
      en: `Session deducted · ${rem} remaining of ${tot}`,
      ar: `تم خصم حصة · ${rem} متبقية من أصل ${tot}`,
    }),
    timeSlot: (start: string, end: string) => ({
      fr: `Créneau autorisé : ${start} à ${end}`,
      en: `Permitted slot: ${start} to ${end}`,
      ar: `الفترة المسموح بها: ${start} إلى ${end}`,
    }),
    debtWarning: (balance: number) => ({
      fr: `Attention : Solde dû de ${formatMoney(balance)}`,
      en: `Warning: Outstanding balance of ${formatMoney(balance)}`,
      ar: `تنبيه: رصيد مستحق بقيمة ${formatMoney(balance)}`,
    }),
    reasonPrefix: { fr: "Motif :", en: "Reason:", ar: "السبب:" },
  };

  const translateReason = (reason?: string) => {
    if (!reason) return "";
    const map: Record<string, { fr: string; en: string; ar: string }> = {
      SESSIONS_EXHAUSTED: { fr: "Séances épuisées (0 séance restante)", en: "Sessions exhausted (0 remaining)", ar: "استنفدت الحصص (0 متبقية)" },
      OUTSIDE_TIME_WINDOW: { fr: "Hors créneau horaire autorisé", en: "Outside permitted time slot", ar: "خارج الفترة الزمنية المسموح بها" },
      CARD_NOT_FOUND: { fr: "Badge non reconnu", en: "Card not recognized", ar: "بطاقة غير معروفة" },
      CARD_BLOCKED: { fr: "Badge bloqué", en: "Card blocked", ar: "بطاقة محظورة" },
      CARD_UNASSIGNED: { fr: "Badge non assigné", en: "Card unassigned", ar: "بطاقة غير مخصصة" },
      NO_ACTIVE_SUBSCRIPTION: { fr: "Aucun abonnement actif", en: "No active subscription", ar: "لا يوجد اشتراك نشط" },
      SUBSCRIPTION_EXPIRED: { fr: "Abonnement expiré", en: "Subscription expired", ar: "اشتراك منتهي الصلاحية" },
      SUBSCRIPTION_SUSPENDED: { fr: "Abonnement suspendu", en: "Subscription suspended", ar: "اشتراك موقوف مؤقتاً" },
      OK: { fr: "Accès autorisé", en: "Access granted", ar: "تم السماح بالدخول" },
    };
    return map[reason]?.[language] || reason;
  };

  const handleScan = async (overrideUid?: string) => {
    const targetUid = overrideUid || uid;
    if (!targetUid.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/access/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: targetUid.trim(), source: "SIMULATION" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isGranted = result?.decision === "GRANTED";

  return (
    <Card
      title={tLabels.title[language]}
      subtitle={tLabels.subtitle[language]}
      action={<ScanLine className="w-4 h-4 text-[#64748B]" />}
    >
      <div className="flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="flex gap-2"
        >
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Ex: 04:A3:2B:F1"
            className="flex-1 h-9 px-3 text-[13px] bg-white border border-[#CBD5E1] rounded-[6px] font-mono-code uppercase tracking-wider focus:border-[#2563EB]"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
          >
            {tLabels.tester[language]}
          </Button>
        </form>

        {/* Quick chip presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-[#64748B]">{tLabels.scenarios[language]}</span>
          <button
            type="button"
            onClick={() => {
              setUid("04:A3:2B:F1");
              handleScan("04:A3:2B:F1");
            }}
            className="text-[11px] px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] hover:bg-[#D1FAE5] font-medium"
          >
            {tLabels.active[language]}
          </button>
          <button
            type="button"
            onClick={() => {
              setUid("04:EE:11:22");
              handleScan("04:EE:11:22");
            }}
            className="text-[11px] px-2 py-0.5 rounded bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] hover:bg-[#FEE2E2] font-medium"
          >
            {tLabels.blocked[language]}
          </button>
          <button
            type="button"
            onClick={() => {
              setUid("04:DE:AD:BE:EF");
              handleScan("04:DE:AD:BE:EF");
            }}
            className="text-[11px] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] hover:bg-[#E2E8F0] font-medium"
          >
            {tLabels.unknown[language]}
          </button>
        </div>

        {/* Result presentation */}
        {result && (
          <div
            className={`p-4 rounded-[8px] border transition-all duration-200 ${
              isGranted
                ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                : "bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isGranted ? "bg-[#059669] text-white" : "bg-[#DC2626] text-white"
                }`}
              >
                {isGranted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <X className="w-5 h-5 stroke-[2.5]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold uppercase tracking-wide">
                  {isGranted ? tLabels.granted[language] : tLabels.denied[language]}
                </div>

                {result.member ? (
                  <div className="mt-1 space-y-1">
                    <div className="text-[14px] font-semibold text-[#0F172A]">
                      {result.member.firstName} {result.member.lastName}
                    </div>
                    <div className="text-[12px] text-[#475569]">
                      {result.member.planName} · {tLabels.expires[language]} {formatDate(result.member.endDate)} (
                      {tLabels.daysRemaining(result.member.daysRemaining)[language]})
                    </div>

                    {result.member.planType === "SESSIONS" && (
                      <div className="text-[11px] font-semibold text-[#1E40AF] flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {tLabels.sessionDeducted(
                            result.member.remainingSessions ?? 0,
                            result.member.totalSessions ?? 10
                          )[language]}
                        </span>
                      </div>
                    )}

                    {result.member.planType === "TIME_SLOT" && result.member.startTime && result.member.endTime && (
                      <div className="text-[11px] font-semibold text-[#D97706] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {tLabels.timeSlot(result.member.startTime, result.member.endTime)[language]}
                        </span>
                      </div>
                    )}

                    {result.member.hasDebt && result.member.balanceDue && (
                      <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] nums">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{tLabels.debtWarning(result.member.balanceDue)[language]}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[13px] font-medium mt-1">
                    {tLabels.reasonPrefix[language]} {translateReason(result.reason)}
                  </div>
                )}

                <div className="text-[11px] font-mono-code text-[#64748B] mt-1">
                  UID: {result.cardUid}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
