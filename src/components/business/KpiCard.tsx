import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface KpiCardProps {
  label: string;
  value: string | number;
  context?: string;
  icon: React.ReactNode;
  variant?: "default" | "alert";
  href?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  context,
  icon,
  variant = "default",
  href,
  className,
}) => {
  const content = (
    <div
      className={cn(
        "bg-white border border-[#E2E8F0] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] flex flex-col justify-between transition-all duration-120 hover:border-[#CBD5E1]",
        href && "cursor-pointer hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#64748B]">
          {label}
        </span>
        <div
          className={cn(
            "w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0",
            variant === "alert"
              ? "bg-[#FEF2F2] text-[#DC2626]"
              : "bg-[#EFF6FF] text-[#2563EB]"
          )}
        >
          {icon}
        </div>
      </div>

      <div>
        <div className="text-[28px] font-semibold text-[#0F172A] leading-tight nums">
          {value}
        </div>
        {context && (
          <p className="text-[12px] text-[#64748B] mt-1.5 leading-snug">{context}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
