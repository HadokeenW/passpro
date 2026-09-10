import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 w-full select-none",
        className
      )}
    >
      <div className="w-[72px] h-[72px] rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] mb-4 shadow-xs">
        {icon}
      </div>
      <h3 className="text-[14px] font-semibold text-[#0F172A]">{title}</h3>
      {description && (
        <p className="text-[13px] text-[#64748B] mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
