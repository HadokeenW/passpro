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
          "bg-white border border-[#EAEFF5] rounded-[22px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] overflow-hidden",
          className
        )}
        {...props}
      >
        {(title || action) && (
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#F1F5F9]">
            <div>
              {typeof title === "string" ? (
                <h3 className="text-[16px] font-bold text-[#1E293B] tracking-tight">{title}</h3>
              ) : (
                title
              )}
              {subtitle && <p className="text-[12px] text-[#64748B] mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div className={cn(!noPadding && "p-6")}>{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";
