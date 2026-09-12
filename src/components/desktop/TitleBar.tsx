"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Minus, Square, Copy, X, Shield } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export const TitleBar: React.FC = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.isElectron) {
      setIsElectron(true);

      const api = (window as any).electronAPI;
      if (api.isMaximized) {
        api.isMaximized().then((max: boolean) => setIsMaximized(max));
      }
      if (api.isFullScreen) {
        api.isFullScreen().then((full: boolean) => setIsFullScreen(full));
      }

      const cleanupMax = api.onMaximizeChange?.((max: boolean) => {
        setIsMaximized(max);
      });

      const cleanupFull = api.onFullScreenChange?.((full: boolean) => {
        setIsFullScreen(full);
      });

      // Keyboard shortcut F11 for Fullscreen
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "F11") {
          e.preventDefault();
          api.toggleFullScreen?.();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        cleanupMax?.();
        cleanupFull?.();
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  // Only hide on standalone Borne d'accès (/access), NEVER hide on /access-logs (Journal des passages)
  const isKiosk = pathname === "/access" || pathname === "/access/";
  if (!isElectron || isKiosk) {
    return null;
  }

  const handleMinimize = () => {
    (window as any).electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    (window as any).electronAPI?.closeWindow();
  };

  return (
    <div className="w-full h-8 bg-[#0F172A] text-white flex items-center justify-between px-3 select-none app-drag-region z-50 shrink-0 border-b border-white/10 text-[12px]">
      {/* Left: Branding */}
      <div className="flex items-center gap-2 app-no-drag">
        <div className="w-4 h-4 rounded bg-[#2563EB] flex items-center justify-center shadow-xs">
          <Shield className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="font-semibold tracking-wide text-white/95 text-[12px]">
          PASSPro
        </span>
      </div>

      {/* Center: Draggable title space with subtitle text */}
      <div className="flex-1 text-center text-[11.5px] text-white/70 truncate px-4 pointer-events-none select-none font-normal">
        {t("titleBar.subtitle") || "Gestion Salle de Sport & Contrôle d'Accès RFID"}
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center app-no-drag -mr-3">
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          title={t("titleBar.minimize")}
          className="w-11 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore Button */}
        <button
          onClick={handleMaximize}
          title={isMaximized ? t("titleBar.restore") : t("titleBar.maximize")}
          className="w-11 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          title={t("titleBar.closeApp")}
          className="w-12 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#EF4444] transition-colors focus:outline-none cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
