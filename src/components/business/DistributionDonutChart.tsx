"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface ChartSlice {
  label: string;
  count: number;
  color: string;
}

interface DistributionDonutChartProps {
  statusData?: ChartSlice[];
  planData?: ChartSlice[];
  className?: string;
}

export const DistributionDonutChart: React.FC<DistributionDonutChartProps> = ({
  statusData = [],
  planData = [],
  className,
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<"plans" | "status">("plans");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const translateStatusLabel = (lbl: string) => {
    if (lbl === "Actif" || lbl === "ACTIVE") return t("common.active");
    if (lbl === "Expiré" || lbl === "EXPIRED") return t("dashboard.expired");
    if (lbl === "Suspendu" || lbl === "SUSPENDED") return language === "ar" ? "موقوف" : language === "en" ? "Suspended" : "Suspendu";
    return lbl;
  };

  const rawData = activeTab === "plans" ? planData : statusData;
  const currentData = rawData.map((item) => ({
    ...item,
    label: activeTab === "status" ? translateStatusLabel(item.label) : item.label,
  }));
  const total = currentData.reduce((acc, item) => acc + item.count, 0);

  // SVG Donut geometry
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate offsets for segments
  let accumulatedOffset = 0;
  const segments = currentData.map((item, index) => {
    const percentage = total > 0 ? item.count / total : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += percentage * circumference;

    return {
      ...item,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  const activeItem = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className={cn("p-5 flex flex-col justify-between h-full space-y-3", className)}>
      {/* View Switcher Pill */}
      <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
          {language === "ar" ? "التوزيع" : language === "en" ? "Breakdown" : "Répartition"}
        </span>
        <div className="inline-flex bg-[#F1F5F9] p-0.5 rounded-[12px]">
          <button
            onClick={() => {
              setActiveTab("plans");
              setHoveredIndex(null);
            }}
            className={cn(
              "px-3 py-1 rounded-[10px] text-[12px] font-semibold transition-all select-none",
              activeTab === "plans"
                ? "bg-white text-[#0F172A] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            {t("nav.plans")}
          </button>
          <button
            onClick={() => {
              setActiveTab("status");
              setHoveredIndex(null);
            }}
            className={cn(
              "px-3 py-1 rounded-[10px] text-[12px] font-semibold transition-all select-none",
              activeTab === "status"
                ? "bg-white text-[#0F172A] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            {t("common.status")}
          </button>
        </div>
      </div>

      {/* Center Donut SVG */}
      <div className="relative flex items-center justify-center my-1">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base empty ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {total > 0 &&
            segments.map((seg) => {
              const isHovered = hoveredIndex === seg.index;
              return (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(seg.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          {activeItem ? (
            <>
              <span
                className="text-[10.5px] font-semibold uppercase tracking-wider truncate max-w-[95px]"
                style={{ color: activeItem.color }}
              >
                {activeItem.label}
              </span>
              <span className="text-[22px] font-black text-[#0F172A] leading-none nums my-0.5">
                {activeItem.count}
              </span>
              <span className="text-[11px] font-bold text-[#64748B]">
                {activeItem.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                {language === "ar" ? "المجموع" : "Total"}
              </span>
              <span className="text-[26px] font-black text-[#0F172A] leading-tight nums">
                {total}
              </span>
              <span className="text-[11px] font-medium text-[#64748B]">
                {activeTab === "plans"
                  ? language === "ar" ? "اشتراك" : language === "en" ? "plans" : "adhésions"
                  : language === "ar" ? "مشترك" : language === "en" ? "members" : "abonnés"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend List */}
      <div className="space-y-1 pt-1 max-h-[140px] overflow-y-auto">
        {segments.length === 0 ? (
          <div className="text-center text-[12px] text-[#94A3B8] py-2">
            {language === "ar" ? "لا توجد بيانات متاحة" : language === "en" ? "No data available" : "Aucune donnée disponible"}
          </div>
        ) : (
          segments.map((seg) => {
            const isHovered = hoveredIndex === seg.index;
            return (
              <div
                key={seg.label}
                onMouseEnter={() => setHoveredIndex(seg.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1 rounded-[10px] text-[12px] transition-all cursor-pointer",
                  isHovered ? "bg-[#F8FAFC]" : "hover:bg-[#F8FAFC]/60"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span
                    className={cn(
                      "font-medium truncate",
                      isHovered ? "text-[#0F172A] font-bold" : "text-[#475569]"
                    )}
                  >
                    {seg.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-[#0F172A] nums">{seg.count}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] nums">
                    {seg.percentage}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
