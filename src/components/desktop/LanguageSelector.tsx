"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation, SUPPORTED_LANGUAGES, Language } from "@/lib/i18n";
import { Check, ChevronDown } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "compact" | "pills" | "dropdown";
  className?: string;
  theme?: "dark" | "light";
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "compact",
  className = "",
  theme = "dark",
}) => {
  const { language, setLanguage, languages, currentLanguageInfo } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Variant: Interactive full pills for Settings page
  if (variant === "pills") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {languages.map((item) => {
          const isSelected = item.code === language;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={`flex items-center justify-between p-3.5 rounded-[14px] border transition-all text-left cursor-pointer ${
                isSelected
                  ? "bg-blue-50/80 border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xs"
                  : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-[8px] bg-slate-100 flex items-center justify-center font-bold text-[11px] text-slate-700 font-mono select-none shrink-0 border border-slate-200">
                  {item.flag}
                </span>
                <div>
                  <div
                    className={`text-[13.5px] font-semibold leading-tight ${
                      isSelected ? "text-[#2563EB]" : "text-[#0F172A]"
                    }`}
                  >
                    {item.nativeLabel}
                  </div>
                  <div className="text-[11.5px] text-[#64748B] mt-0.5">{item.label}</div>
                </div>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: Compact dropdown for TitleBar & KioskTopBar
  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className={`relative inline-block app-no-drag ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Changer de langue / Change language / تغيير اللغة"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[11.5px] font-medium transition-colors cursor-pointer select-none ${
          isDark
            ? "text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
            : "text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 border border-slate-200"
        }`}
      >
        <span className="font-semibold tracking-wide uppercase">
          {currentLanguageInfo.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          } ${isDark ? "text-white/50" : "text-slate-400"}`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={`absolute z-[120] mt-1.5 min-w-[130px] rounded-[10px] shadow-xl border p-1 text-[12px] animate-dropdown ${
            currentLanguageInfo.dir === "rtl" ? "left-0" : "right-0"
          } ${
            isDark
              ? "bg-[#0F172A] border-white/15 text-white shadow-black/60"
              : "bg-white border-slate-200 text-slate-800 shadow-slate-200/50"
          }`}
        >
          {languages.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-left transition-colors cursor-pointer ${
                  isSelected
                    ? isDark
                      ? "bg-blue-600/30 text-blue-300 font-semibold"
                      : "bg-blue-50 text-blue-700 font-semibold"
                    : isDark
                    ? "hover:bg-white/10 text-white/85"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-[5px] flex items-center justify-center font-bold text-[10px] font-mono select-none shrink-0 ${
                    isDark ? "bg-white/10 text-white/90" : "bg-slate-100 text-slate-700"
                  }`}>
                    {item.flag}
                  </span>
                  <span>{item.nativeLabel}</span>
                </div>
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
