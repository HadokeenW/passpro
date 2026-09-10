import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "sm",
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeWidths = {
    sm: "max-w-[480px]",
    md: "max-w-[640px]",
    lg: "max-w-[720px]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.4)] backdrop-blur-[2px] transition-opacity duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full bg-white rounded-[12px] shadow-[0_12px_32px_rgba(15,23,42,0.14)] overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-[0.98] duration-200",
          sizeWidths[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
          <div>
            {typeof title === "string" ? (
              <h2 className="text-[16px] font-semibold text-[#0F172A]">{title}</h2>
            ) : (
              title
            )}
            {description && (
              <p className="text-[13px] text-[#64748B] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
