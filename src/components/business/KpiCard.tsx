import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface KpiCardProps {
  label: string;
  value: string | number;
  context?: string;
  icon: React.ReactNode;
  variant?: "default" | "alert";
  size?: "hero" | "compact" | "default";
  href?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  context,
  icon,
  variant = "default",
  size = "default",
  href,
  className,
}) => {
  // 1. HERO SIZE: Grand KPI Card with bold typography & smooth wave SVG
  if (size === "hero") {
    const heroContent = (
      <div
        className={cn(
          "bg-white border border-[#EAEFF5] rounded-[26px] p-6 sm:p-7 shadow-[0_4px_24px_rgba(15,23,42,0.035)] flex flex-col justify-between transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] group relative overflow-hidden h-full",
          href && "cursor-pointer",
          className
        )}
      >
        {/* Ambient decorative glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-blue-100/40 via-sky-50/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />

        {/* Top bar: Category label & Squircle Icon */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
              {label}
            </span>
            <div className="text-[13px] font-semibold text-[#0F172A] mt-0.5">
              Performance principale
            </div>
          </div>
          <div
            className={cn(
              "w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs",
              variant === "alert"
                ? "bg-[#FEF2F2] text-[#DC2626]"
                : "bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white shadow-blue-500/20 shadow-sm"
            )}
          >
            {icon}
          </div>
        </div>

        {/* Center: Big Value */}
        <div className="relative z-10 my-2">
          <div className="text-[44px] sm:text-[52px] font-black text-[#0F172A] leading-none nums tracking-tight">
            {value}
          </div>
          {context && (
            <p className="text-[13px] text-[#64748B] mt-2 font-medium leading-snug">
              {context}
            </p>
          )}
        </div>

        {/* Bottom: Smooth Spline Wave SVG (Inspired by reference screenshot) */}
        <div className="mt-3 pt-2 -mx-3 -mb-3 relative z-10">
          <svg
            viewBox="0 0 300 55"
            className="w-full h-12 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0,45 C40,40 60,18 100,24 C140,30 170,10 210,16 C250,22 270,6 300,10 L300,55 L0,55 Z"
              fill="url(#heroGradient)"
            />
            <path
              d="M0,45 C40,40 60,18 100,24 C140,30 170,10 210,16 C250,22 270,6 300,10"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle
              cx="210"
              cy="16"
              r="3.5"
              fill="#2563EB"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    );

    if (href) {
      return <Link href={href} className="w-full flex h-full">{heroContent}</Link>;
    }
    return heroContent;
  }

  // 2. COMPACT SIZE: Smaller, sleek KPI card
  if (size === "compact") {
    const compactContent = (
      <div
        className={cn(
          "bg-white border border-[#EAEFF5] rounded-[20px] p-4.5 shadow-[0_2px_8px_rgba(15,23,42,0.02)] flex flex-col justify-between transition-all duration-150 hover:border-[#CBD5E1] hover:shadow-sm group h-full",
          href && "cursor-pointer",
          className
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[23px] font-bold text-[#0F172A] leading-tight nums tracking-tight">
            {value}
          </div>
          <div
            className={cn(
              "w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
              variant === "alert"
                ? "bg-[#FEF2F2] text-[#DC2626]"
                : "bg-[#F1F5F9] text-[#64748B] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF]"
            )}
          >
            {icon}
          </div>
        </div>

        <div>
          <div className="text-[12.5px] font-semibold text-[#334155] leading-snug truncate">
            {label}
          </div>
          {context && (
            <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-snug truncate">
              {context}
            </p>
          )}
        </div>
      </div>
    );

    if (href) {
      return <Link href={href} className="h-full flex flex-col">{compactContent}</Link>;
    }
    return compactContent;
  }

  // 3. DEFAULT SIZE: Standard balanced KPI card
  const defaultContent = (
    <div
      className={cn(
        "bg-white border border-[#EAEFF5] rounded-[22px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] flex flex-col justify-between transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-[0_8px_25px_rgba(15,23,42,0.05)] group",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[30px] font-bold text-[#0F172A] leading-tight nums tracking-tight">
          {value}
        </div>
        <div
          className={cn(
            "w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
            variant === "alert"
              ? "bg-[#FEF2F2] text-[#DC2626]"
              : "bg-[#F1F5F9] text-[#64748B] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF]"
          )}
        >
          {icon}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-[#334155]">
            {label}
          </span>
        </div>
        {context && (
          <p className="text-[12px] text-[#94A3B8] mt-1 leading-snug">{context}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{defaultContent}</Link>;
  }

  return defaultContent;
};
