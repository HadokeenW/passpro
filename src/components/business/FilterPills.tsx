import React from "react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn("inline-flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-full", className)}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-7 px-3.5 rounded-full text-[13px] font-medium transition-all duration-120 select-none flex items-center gap-1.5 cursor-pointer",
              isActive
                ? "bg-white text-[#2563EB] shadow-xs font-semibold"
                : "text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  "text-[11px] px-1.5 py-0.2 rounded-full nums",
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "bg-[#E2E8F0] text-[#64748B]"
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
