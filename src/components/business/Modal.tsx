"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "sm",
  children,
  footer,
  className,
}) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth entrance and exit animation cycle
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsExiting(false);
    } else if (shouldRender) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, 190);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Keyboard dismiss (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isExiting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExiting, onClose]);

  // Lock background scrolling while modal is active or exiting
  useEffect(() => {
    if (!shouldRender) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldRender]);

  if (!shouldRender || !mounted) return null;

  const sizeWidths = {
    sm: "max-w-[480px]",
    md: "max-w-[640px]",
    lg: "max-w-[760px]",
    xl: "max-w-[900px]",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Smooth Opacity & Blur Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/60 backdrop-blur-[3px]",
          isExiting ? "animate-backdrop-out" : "animate-backdrop-in"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Scrollable Container */}
      <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 relative z-10 pointer-events-none">
        {/* Modal Dialog Card */}
        <div
          className={cn(
            "relative w-full max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-3.5rem)] bg-white rounded-[18px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] border border-[#E2E8F0] overflow-hidden flex flex-col pointer-events-auto",
            isExiting ? "animate-frame-out" : "animate-frame-in",
            sizeWidths[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] shrink-0 bg-white">
            <div className="min-w-0 pr-4 rtl:pr-0 rtl:pl-4">
              {typeof title === "string" ? (
                <h2 id="modal-title" className="text-[16px] font-semibold text-[#0F172A] truncate">
                  {title}
                </h2>
              ) : (
                title
              )}
              {description && (
                <p className="text-[13px] text-[#64748B] mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors shrink-0 cursor-pointer"
              aria-label={t("common.close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
