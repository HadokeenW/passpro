import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, action, noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.06)] overflow-hidden",
          className
        )}
        {...props}
      >
        {(title || action) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
            <div>
              {typeof title === "string" ? (
                <h3 className="text-[14px] font-semibold text-[#0F172A]">{title}</h3>
              ) : (
                title
              )}
              {subtitle && <p className="text-[12px] text-[#64748B] mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div className={cn(!noPadding && "p-5")}>{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";
