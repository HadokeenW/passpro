"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "danger" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options.duration ?? (options.type === "danger" || options.type === "warning" ? 6000 : 4000);

      const newToast: ToastItem = { ...options, id };
      setToasts((prev) => [newToast, ...prev.slice(0, 2)]); // max 3

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const toastHelpers = {
    toast: addToast,
    success: (title: string, message?: string) => addToast({ type: "success", title, message }),
    error: (title: string, message?: string) => addToast({ type: "danger", title, message }),
    warning: (title: string, message?: string) => addToast({ type: "warning", title, message }),
    info: (title: string, message?: string) => addToast({ type: "info", title, message }),
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />,
    danger: <XCircle className="w-5 h-5 text-[#DC2626] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#2563EB] shrink-0" />,
  };

  const borderColors = {
    success: "border-l-[#059669]",
    danger: "border-l-[#DC2626]",
    warning: "border-l-[#D97706]",
    info: "border-l-[#2563EB]",
  };

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "w-[360px] bg-white rounded-[12px] p-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-[#E2E8F0] border-l-[4px] pointer-events-auto flex items-start gap-3 animate-toast",
              borderColors[t.type]
            )}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-semibold text-[#0F172A] leading-tight">
                {t.title}
              </h4>
              {t.message && (
                <p className="text-[13px] text-[#64748B] mt-1 leading-snug break-words">
                  {t.message}
                </p>
              )}
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    removeToast(t.id);
                  }}
                  className="mt-2 text-[12px] font-semibold text-[#2563EB] hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
