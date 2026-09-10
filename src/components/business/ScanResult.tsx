import React from "react";
import { Check, X } from "lucide-react";
import { ScanResult as ScanResultType } from "@/server/services/access-engine";
import { formatDate } from "@/lib/dates";

interface ScanResultViewProps {
  result: ScanResultType;
  onReset?: () => void;
}

export const ScanResultView: React.FC<ScanResultViewProps> = ({ result, onReset }) => {
  const isGranted = result.decision === "GRANTED";

  const reasonLabels: Record<string, string> = {
    CARD_NOT_FOUND: "Badge non reconnu",
    CARD_BLOCKED: "Badge bloqué",
    CARD_UNASSIGNED: "Badge non assigné",
    NO_ACTIVE_SUBSCRIPTION: "Aucun abonnement actif",
    SUBSCRIPTION_EXPIRED: "Abonnement expiré",
    SUBSCRIPTION_SUSPENDED: "Abonnement suspendu",
    OK: "Accès autorisé",
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      onClick={onReset}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-white select-none cursor-pointer animate-in fade-in zoom-in-[0.96] duration-400"
      style={{
        background: isGranted
          ? "linear-gradient(180deg, #059669 0%, #047857 100%)"
          : "linear-gradient(180deg, #DC2626 0%, #B91C1C 100%)",
      }}
    >
      {/* Central Circle: Member photo if available, otherwise check/x icon */}
      <div className="relative mb-6">
        <div className="w-36 h-36 rounded-full border-4 border-white/50 overflow-hidden shadow-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm">
          {result.member?.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={result.member.photoUrl}
              alt="Photo adhérent"
              className="w-full h-full object-cover"
            />
          ) : isGranted ? (
            <Check className="w-24 h-24 text-white stroke-[2.5]" />
          ) : (
            <X className="w-24 h-24 text-white stroke-[2.5]" />
          )}
        </div>

        {/* Status Badge overlay */}
        {result.member?.photoUrl && (
          <div
            className={`absolute bottom-0 right-0 w-11 h-11 rounded-full flex items-center justify-center border-2 border-white shadow-lg ${
              isGranted ? "bg-[#059669]" : "bg-[#DC2626]"
            }`}
          >
            {isGranted ? (
              <Check className="w-6 h-6 text-white stroke-[3]" />
            ) : (
              <X className="w-6 h-6 text-white stroke-[3]" />
            )}
          </div>
        )}
      </div>

      {/* Decision Big Heading */}
      <div className="text-[28px] md:text-[36px] font-bold tracking-[0.08em] uppercase text-white/90 mb-4">
        {isGranted ? "ACCÈS AUTORISÉ" : "ACCÈS REFUSÉ"}
      </div>

      {isGranted && result.member ? (
        <div className="flex flex-col items-center text-center max-w-2xl">
          {/* Member Name */}
          <h1 className="text-[38px] md:text-[50px] font-bold uppercase tracking-tight text-white mb-2 leading-tight">
            {result.member.firstName} {result.member.lastName}
          </h1>

          {/* Plan Name */}
          <div className="text-[20px] md:text-[24px] text-white/90 font-medium mb-6">
            {result.member.planName}
          </div>

          {/* Validity Pill */}
          <div className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-2.5 rounded-full text-[16px] md:text-[18px] font-semibold text-white tracking-wide shadow-lg nums">
            Échéance : {formatDate(result.member.endDate)} · {result.member.daysRemaining} jour
            {result.member.daysRemaining > 1 ? "s" : ""}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center max-w-xl">
          {/* Refusal Reason */}
          <h2 className="text-[24px] md:text-[32px] font-semibold text-white mb-4">
            {reasonLabels[result.reason] || result.reason}
          </h2>

          {/* UID in monospace */}
          <div className="bg-black/20 border border-white/20 px-5 py-2 rounded-[8px] font-mono-code text-[16px] md:text-[18px] text-white/90 tracking-[0.1em] mb-4">
            UID : {result.cardUid}
          </div>

          <div className="text-[14px] text-white/70">
            {new Date(result.loggedAt).toLocaleTimeString("fr-FR")} · {result.kioskName}
          </div>
        </div>
      )}

      {/* Subtle bottom note */}
      <div className="absolute bottom-8 text-[13px] text-white/50 tracking-wider">
        Touchez l'écran ou patientez pour retourner à l'accueil
      </div>
    </div>
  );
};
