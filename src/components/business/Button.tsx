import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-soft";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-120 select-none cursor-pointer disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] disabled:border-transparent active:scale-[0.98]";

    const variantStyles = {
      primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]",
      secondary: "bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC]",
      ghost: "bg-transparent text-[#2563EB] hover:bg-[#EFF6FF]",
      danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
      "danger-soft": "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-[13px] rounded-[6px] gap-1.5",
      md: "h-9 px-4 text-[14px] rounded-[8px] gap-2",
      lg: "h-11 px-6 text-[15px] rounded-[8px] gap-2.5",
      icon: "h-9 w-9 p-0 rounded-[8px] justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            {size !== "icon" && children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
