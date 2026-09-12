import React from "react";
import { Check, X, AlertTriangle, Ticket, Clock, UserX, CameraOff } from "lucide-react";
import { ScanResult as ScanResultType } from "@/server/services/access-engine";
import { formatDate, toLatinDigits } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useTranslation } from "@/lib/i18n";

interface ScanResultViewProps {
  result: ScanResultType;
  onReset?: () => void;
  forceFrench?: boolean;
}

export const ScanResultView: React.FC<ScanResultViewProps> = ({
  result,
  onReset,
  forceFrench = false,
}) => {
  const { t, language } = useTranslation();
  const effectiveLang = forceFrench ? "fr" : language;
  const isGranted = result.decision === "GRANTED";
  const isExpiringSoon =
    isGranted &&
    Boolean(
      result.member?.isExpiringSoon ||
        (result.member?.daysRemaining !== undefined &&
          result.member.daysRemaining <= 7 &&
          result.member.daysRemaining >= 0)
    );

  const getReasonLabel = (reason: string) => {
    const map: Record<string, { fr: string; en: string; ar: string }> = {
      CARD_NOT_FOUND: { fr: "Badge non reconnu", en: "Card not recognized", ar: "بطاقة غير معروفة" },
      CARD_BLOCKED: { fr: "Badge bloqué", en: "Card blocked", ar: "بطاقة محظورة" },
      CARD_UNASSIGNED: { fr: "Badge non assigné", en: "Card unassigned", ar: "بطاقة غير مخصصة" },
      NO_ACTIVE_SUBSCRIPTION: { fr: "Aucun abonnement actif", en: "No active subscription", ar: "لا يوجد اشتراك نشط" },
      SUBSCRIPTION_EXPIRED: { fr: "Abonnement expiré", en: "Subscription expired", ar: "اشتراك منتهي الصلاحية" },
      SUBSCRIPTION_SUSPENDED: { fr: "Abonnement suspendu", en: "Subscription suspended", ar: "اشتراك موقوف مؤقتاً" },
      SESSIONS_EXHAUSTED: { fr: "Séances épuisées (0 restante)", en: "Sessions exhausted (0 remaining)", ar: "استنفدت الحصص (0 متبقية)" },
      OUTSIDE_TIME_WINDOW: { fr: "Hors créneau horaire autorisé", en: "Outside permitted time slot", ar: "خارج الفترة الزمنية المسموح بها" },
      ANTI_PASSBACK: { fr: "Anti-passback : badge déjà utilisé", en: "Anti-passback: card already used", ar: "منع تمرير البطاقة: استخدمت مؤخراً" },
      OK: { fr: "Accès autorisé", en: "Access granted", ar: "تم السماح بالدخول" },
      "Badge non reconnu": { fr: "Badge non reconnu", en: "Card not recognized", ar: "بطاقة غير معروفة" },
      "Badge bloqué": { fr: "Badge bloqué", en: "Card blocked", ar: "بطاقة محظورة" },
      "Badge non assigné": { fr: "Badge non assigné", en: "Card unassigned", ar: "بطاقة غير مخصصة" },
      "Aucun abonnement actif": { fr: "Aucun abonnement actif", en: "No active subscription", ar: "لا يوجد اشتراك نشط" },
      "Abonnement expiré": { fr: "Abonnement expiré", en: "Subscription expired", ar: "اشتراك منتهي الصلاحية" },
      "Abonnement suspendu": { fr: "Abonnement suspendu", en: "Subscription suspended", ar: "اشتراك موقوف مؤقتاً" },
      "Séances épuisées (0 restante)": { fr: "Séances épuisées (0 restante)", en: "Sessions exhausted (0 remaining)", ar: "استنفدت الحصص (0 متبقية)" },
      "Hors créneau horaire autorisé": { fr: "Hors créneau horaire autorisé", en: "Outside permitted time slot", ar: "خارج الفترة الزمنية المسموح بها" },
      "Anti-passback : badge déjà utilisé": { fr: "Anti-passback : badge déjà utilisé", en: "Anti-passback: card already used", ar: "منع تمرير البطاقة: استخدمت مؤخراً" },
      "Accès autorisé": { fr: "Accès autorisé", en: "Access granted", ar: "تم السماح بالدخول" },
    };

    if (forceFrench) {
      return map[reason]?.fr || reason;
    }

    const key = `kiosk.reasons.${reason}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;

    return map[reason]?.[effectiveLang] || reason;
  };

  const background = !isGranted
    ? "linear-gradient(180deg, #DC2626 0%, #B91C1C 100%)"
    : isExpiringSoon || (result.member?.hasDebt && result.member?.balanceDue)
    ? "linear-gradient(180deg, #F59E0B 0%, #D97706 50%, #B45309 100%)"
    : "linear-gradient(180deg, #059669 0%, #047857 100%)";

  return (
    <div
      role="alert"
      aria-live="assertive"
      dir={effectiveLang === "ar" ? "rtl" : "ltr"}
      onClick={onReset}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-white select-none cursor-pointer animate-in fade-in zoom-in-[0.96] duration-400"
      style={{ background }}
    >
      {/* Central Circle: Member photo if available, otherwise check/alert/x/userX icon */}
      <div className="relative mb-6">
        <div className="w-44 h-44 md:w-52 md:h-52 rounded-full border-4 border-white/60 overflow-hidden shadow-2xl flex items-center justify-center bg-white/15 backdrop-blur-md">
          {result.member?.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={result.member.photoUrl}
              alt="Photo adhérent"
              className="w-full h-full object-cover"
            />
          ) : !isGranted ? (
            <X className="w-24 h-24 text-white stroke-[2.5]" />
          ) : isExpiringSoon ? (
            <AlertTriangle className="w-24 h-24 text-white stroke-[2.5]" />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/90">
              <UserX className="w-20 h-20 stroke-[1.8]" />
              <span className="text-[11px] font-bold uppercase tracking-wider mt-1 opacity-90">
                {forceFrench
                  ? "Sans photo"
                  : effectiveLang === "ar"
                  ? "بدون صورة"
                  : effectiveLang === "en"
                  ? "No Photo"
                  : "Sans photo"}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge overlay */}
        <div
          className={`absolute bottom-1 right-1 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg ${
            !isGranted
              ? "bg-[#DC2626]"
              : !result.member?.photoUrl
              ? "bg-[#D97706]"
              : isExpiringSoon
              ? "bg-[#D97706]"
              : "bg-[#059669]"
          }`}
        >
          {!isGranted ? (
            <X className="w-6 h-6 text-white stroke-[3]" />
          ) : !result.member?.photoUrl ? (
            <AlertTriangle className="w-6 h-6 text-white stroke-[2.5]" />
          ) : isExpiringSoon ? (
            <AlertTriangle className="w-6 h-6 text-white stroke-[2.5]" />
          ) : (
            <Check className="w-6 h-6 text-white stroke-[3]" />
          )}
        </div>
      </div>

      {/* Decision Big Heading */}
      <div className="text-[28px] md:text-[36px] font-bold tracking-[0.08em] uppercase text-white/90 mb-4 text-center">
        {forceFrench
          ? !isGranted
            ? "ACCÈS REFUSÉ"
            : isExpiringSoon
            ? "ACCÈS AUTORISÉ · EXPIRATION PROCHE"
            : "ACCÈS AUTORISÉ"
          : !isGranted
          ? t("kiosk.scanDenied")
          : isExpiringSoon
          ? `${t("kiosk.scanGranted")} · ${t("kiosk.scanWarning")}`
          : t("kiosk.scanGranted")}
      </div>

      {result.member ? (
        <div className="flex flex-col items-center text-center max-w-2xl">
          {/* Visual ID verification pill or missing photo alert */}
          {result.member.photoUrl ? (
            <div className="mb-2 px-4 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-[12px] md:text-[13px] font-semibold tracking-wider uppercase text-white/90">
              {forceFrench
                ? "Contrôle visuel adhérent"
                : effectiveLang === "ar"
                ? "التحقق البصري من المشترك"
                : effectiveLang === "en"
                ? "Visual ID Verification"
                : "Contrôle visuel adhérent"}
            </div>
          ) : (
            <div className="mb-3 px-5 py-2 rounded-full bg-amber-500/90 text-white border-2 border-white shadow-xl flex items-center gap-2 font-bold text-[14px] md:text-[16px] animate-pulse">
              <AlertTriangle className="w-5 h-5 text-white shrink-0" />
              <span>
                {forceFrench
                  ? "PHOTO MANQUANTE · VÉRIFIER LA PIÈCE D'IDENTITÉ"
                  : effectiveLang === "ar"
                  ? "صورة غير مسجلة · يرجى التحقق من بطاقة الهوية"
                  : effectiveLang === "en"
                  ? "NO PHOTO ON FILE · VERIFY IDENTITY CARD"
                  : "PHOTO MANQUANTE · VÉRIFIER LA PIÈCE D'IDENTITÉ"}
              </span>
            </div>
          )}

          {/* Member Name */}
          <h1 className="text-[38px] md:text-[50px] font-bold uppercase tracking-tight text-white mb-2 leading-tight">
            {result.member.firstName} {result.member.lastName}
          </h1>

          {/* Reason if Denied (e.g. Anti-Passback or Suspended or Expired) */}
          {!isGranted ? (
            <div className="mb-4 px-6 py-2.5 rounded-full bg-black/40 text-white border-2 border-white/60 shadow-xl flex items-center gap-2.5 font-bold text-[17px] md:text-[20px]">
              <X className="w-5 h-5 text-red-400 shrink-0" />
              <span>{getReasonLabel(result.reason)}</span>
            </div>
          ) : (
            <>
              {/* Plan Name */}
              <div className="text-[20px] md:text-[24px] text-white/90 font-medium mb-3">
                {result.member.planName}
              </div>

              {/* Special notices (Debt / Sessions / Time slot) */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                {result.member.hasDebt && result.member.balanceDue && (
                  <div className="bg-red-600/90 text-white font-bold px-5 py-2 rounded-full border-2 border-white shadow-lg text-[16px] nums flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                    <span>
                      {forceFrench ? "Dette en cours" : t("kiosk.memberDetails.debtAlert")} : {formatMoney(result.member.balanceDue)}
                    </span>
                  </div>
                )}

                {result.member.planType === "SESSIONS" && (
                  <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30 text-[16px] font-semibold text-white nums flex items-center gap-2">
                    <Ticket className="w-4 h-4 shrink-0" />
                    <span>
                      {toLatinDigits(String(result.member.remainingSessions ?? 0))} {forceFrench ? "séance(s) restante(s)" : t("kiosk.memberDetails.sessionsRemaining")}
                    </span>
                  </div>
                )}

                {result.member.planType === "TIME_SLOT" && result.member.startTime && result.member.endTime && (
                  <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30 text-[16px] font-semibold text-white nums flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {toLatinDigits(result.member.startTime)} - {toLatinDigits(result.member.endTime)}
                    </span>
                  </div>
                )}
              </div>

              {/* Validity Pill */}
              <div
                className={`backdrop-blur-md border px-6 py-2.5 rounded-full text-[16px] md:text-[18px] font-semibold text-white tracking-wide shadow-lg nums flex items-center gap-2 ${
                  isExpiringSoon
                    ? "bg-black/25 border-white/40"
                    : "bg-white/20 border-white/30"
                }`}
              >
                {isExpiringSoon && <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />}
                <span>
                  {forceFrench ? "Valable jusqu'au" : t("kiosk.memberDetails.validUntil")} :{" "}
                  {formatDate(result.member.endDate, "Africa/Algiers", forceFrench ? "fr" : effectiveLang)} · {toLatinDigits(String(result.member.daysRemaining))}{" "}
                  {result.member.daysRemaining > 1
                    ? forceFrench
                      ? "jours restants"
                      : t("kiosk.memberDetails.daysLeftPlural")
                    : forceFrench
                    ? "jour restant"
                    : t("kiosk.memberDetails.daysLeftSingular")}
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center max-w-xl">
          {/* Refusal Reason */}
          <h2 className="text-[24px] md:text-[32px] font-semibold text-white mb-4">
            {getReasonLabel(result.reason)}
          </h2>

          {/* UID in monospace */}
          <div className="bg-black/20 border border-white/20 px-5 py-2 rounded-[8px] font-mono-code text-[16px] md:text-[18px] text-white/90 tracking-[0.1em] mb-4">
            UID : {toLatinDigits(result.cardUid)}
          </div>

          <div className="text-[14px] text-white/70 nums">
            {toLatinDigits(
              new Date(result.loggedAt).toLocaleTimeString(
                forceFrench
                  ? "fr-FR"
                  : effectiveLang === "ar"
                  ? "ar-DZ-u-nu-latn"
                  : effectiveLang === "en"
                  ? "en-US"
                  : "fr-FR",
                { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
              )
            )} · {result.kioskName}
          </div>
        </div>
      )}

      {/* Subtle bottom note */}
      <div className="absolute bottom-8 text-[13px] text-white/50 tracking-wider">
        PASSPro · {forceFrench ? "ON-PREMISE LAN READY" : t("kiosk.onPremiseReady")}
      </div>
    </div>
  );
};
