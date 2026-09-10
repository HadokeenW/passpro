import React from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";

interface SubscriptionProgressProps {
  startDate: string | Date;
  endDate: string | Date;
  daysRemaining?: number;
  className?: string;
}

export const SubscriptionProgress: React.FC<SubscriptionProgressProps> = ({
  startDate,
  endDate,
  daysRemaining: customDays,
  className,
}) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();

  const totalDuration = Math.max(1, end - start);
  const elapsed = Math.max(0, now - start);
  const remainingPercent = Math.max(0, Math.min(100, ((end - now) / totalDuration) * 100));

  const daysRemaining =
    customDays !== undefined
      ? customDays
      : Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  let barColor = "bg-[#2563EB]";
  if (remainingPercent < 20 || daysRemaining <= 3) {
    barColor = "bg-[#DC2626]";
  } else if (remainingPercent <= 50 || daysRemaining <= 7) {
    barColor = "bg-[#D97706]";
  }

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <div className="flex items-center justify-between text-[12px] font-medium text-[#475569]">
        <span>Validité restante</span>
        <span className="nums font-semibold text-[#0F172A]">
          {daysRemaining} j {daysRemaining > 0 ? "restant" + (daysRemaining > 1 ? "s" : "") : "(expiré)"}
        </span>
      </div>

      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300 rounded-full", barColor)}
          style={{ width: `${remainingPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[13px] text-[#64748B] mt-0.5">
        <span>{formatDate(startDate)}</span>
        <span>→</span>
        <span>{formatDate(endDate)}</span>
      </div>
    </div>
  );
};
