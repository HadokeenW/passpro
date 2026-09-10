import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
  isMono?: boolean;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ className, label, help, error, isMono = false, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-[#475569] select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-9 px-3 text-[14px] bg-white text-[#0F172A] border rounded-[6px] transition-colors duration-120 placeholder:text-[#94A3B8] disabled:bg-[#F8FAFC] disabled:cursor-not-allowed",
            error
              ? "border-[#DC2626] focus:border-[#DC2626]"
              : "border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#2563EB]",
            isMono && "font-mono-code uppercase tracking-wider",
            className
          )}
          {...props}
        />
        {error ? (
          <div className="flex items-center gap-1.5 text-[12px] text-[#DC2626] mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : help ? (
          <p className="text-[12px] text-[#64748B] mt-0.5">{help}</p>
        ) : null}
      </div>
    );
  }
);

Field.displayName = "Field";
