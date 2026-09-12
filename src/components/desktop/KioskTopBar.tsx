"use client";

import React, { useEffect, useState } from "react";
import { Minus, Square, Copy, X, Shield } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface KioskTopBarProps {
  gymName?: string;
  kioskName?: string;
}

export const KioskTopBar: React.FC<KioskTopBarProps> = ({
  gymName = "PASSPro Fitness",
  kioskName = "BORNE-01",
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.isElectron) {
      setIsElectron(true);
      const api = (window as any).electronAPI;

      if (api.isMaximized) {
        api.isMaximized().then((max: boolean) => setIsMaximized(max));
      }

      const cleanup = api.onMaximizeChange?.((max: boolean) => {
        setIsMaximized(max);
      });

      return () => cleanup?.();
    }
  }, []);

  const handleMinimize = () => {
    (window as any).electronAPI?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximizeWindow?.();
  };

  const handleClose = () => {
    (window as any).electronAPI?.closeWindow?.();
  };

  return (
    <div className="w-full h-9 bg-[#0B1329]/95 text-white flex items-center justify-between px-3.5 select-none app-drag-region z-[60] shrink-0 border-b border-white/10 text-[12px] shadow-sm">
      {/* Left: Branding & Name (No online text badge) */}
      <div className="flex items-center gap-2.5 app-no-drag">
        <div className="w-5 h-5 rounded-[6px] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xs">
          <Shield className="w-3 h-3 text-white" />
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-white tracking-wide text-[12px]">
          <span>PASSPro</span>
          <span className="text-white/30 font-light">/</span>
          <span className="text-blue-300 font-medium">{t("kiosk.topBarTitle")}</span>
        </div>
      </div>

      {/* Center: Draggable gym title */}
      <div className="flex-1 text-center text-[12px] text-white/60 truncate px-4 pointer-events-none font-medium">
        {gymName} · {kioskName}
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-2 app-no-drag -mr-3.5 rtl:-mr-0 rtl:-ml-3.5">
        {isElectron && (
          <div className="flex items-center">
            {/* Minimize */}
            <button
              onClick={handleMinimize}
              title={t("kiosk.minimizeTooltip")}
              className="w-11 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Maximize / Restore */}
            <button
              onClick={handleMaximize}
              title={isMaximized ? t("titleBar.restore") : t("kiosk.maximizeTooltip")}
              className="w-11 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
            >
              {isMaximized ? (
                <Copy className="w-3 h-3 rotate-180" />
              ) : (
                <Square className="w-3 h-3" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={handleClose}
              title={t("kiosk.closeTooltip")}
              className="w-12 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#EF4444] transition-colors focus:outline-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
