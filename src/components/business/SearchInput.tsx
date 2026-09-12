import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (val: string) => void;
  shortcutBadge?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, shortcutBadge, onChange, onFocus, onBlur, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref || internalRef) as React.RefObject<HTMLInputElement>;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (typeof window !== "undefined" && (window as any).electronAPI?.setManagementMode) {
        (window as any).electronAPI.setManagementMode(true);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTimeout(() => {
        if (typeof window !== "undefined" && (window as any).electronAPI?.setManagementMode) {
          const hasDialog = Boolean(document.querySelector('[role="dialog"]'));
          const isInputActive = Boolean(document.activeElement?.tagName === "INPUT");
          if (!hasDialog && !isInputActive) {
            (window as any).electronAPI.setManagementMode(false);
          }
        }
      }, 200);
      onBlur?.(e);
    };

    return (
      <div className={cn("relative w-[280px]", className)}>
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={resolvedRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => {
            onChange?.(e);
            onSearch?.(e.target.value);
          }}
          className="w-full h-9 pl-9 pr-10 bg-white border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] transition-colors hover:border-[#94A3B8] focus:border-[#2563EB]"
          {...props}
        />
        {shortcutBadge && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded text-[10px] font-mono-code text-[#64748B] pointer-events-none select-none">
            {shortcutBadge}
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
