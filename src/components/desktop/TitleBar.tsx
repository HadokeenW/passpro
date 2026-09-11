"use client";

import React, { useEffect, useState } from "react";
import { Minus, Square, Copy, X, Shield, Expand, Shrink } from "lucide-react";

export const TitleBar: React.FC = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // Only display in Electron desktop environment
  if (!isElectron) {
    return null;
  }

  const handleMinimize = () => {
    (window as any).electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximizeWindow();
  };

  const handleToggleFullScreen = () => {
    (window as any).electronAPI?.toggleFullScreen();
  };

  const handleClose = () => {
    (window as any).electronAPI?.closeWindow();
  };

  return (
    <div className="w-full h-8 bg-[#0F172A] text-white flex items-center justify-between px-3 select-none app-drag-region z-50 shrink-0 border-b border-white/10 text-[12px]">
      {/* Left: Branding & Status Indicator */}
      <div className="flex items-center gap-2.5 app-no-drag">
        <div className="w-4 h-4 rounded bg-[#2563EB] flex items-center justify-center shadow-xs">
          <Shield className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="font-semibold tracking-wide text-white/95 text-[12px]">
          PASSPro
        </span>
        <span className="text-white/35 font-light">|</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-300">En Ligne LAN</span>
        </div>
      </div>

      {/* Center: Draggable title space */}
      <div className="flex-1 text-center text-[11px] text-white/45 truncate px-4 pointer-events-none">
        Gestion Salle de Sport & Contrôle d'Accès RFID
      </div>

      {/* Right: Window Controls (Minimize, Windowed Maximize, Total FullScreen, Close) */}
      <div className="flex items-center app-no-drag -mr-3">
        {/* FullScreen Button (Covers 100% of display, hiding taskbar) */}
        <button
          onClick={handleToggleFullScreen}
          title={isFullScreen ? "Quitter le plein écran total (F11)" : "Plein écran total (F11 - Recouvrir tout l'écran)"}
          className="w-10 h-8 flex items-center justify-center text-blue-300 hover:text-white hover:bg-blue-600/30 transition-colors focus:outline-none"
        >
          {isFullScreen ? (
            <Shrink className="w-3.5 h-3.5" />
          ) : (
            <Expand className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          title="Minimiser"
          className="w-10 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore Button (Work area with taskbar) */}
        <button
          onClick={handleMaximize}
          title={isMaximized ? "Niveau inférieur" : "Agrandir la fenêtre"}
          className="w-10 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
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
          title="Fermer (Réduire dans la barre des tâches)"
          className="w-11 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#EF4444] transition-colors focus:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
