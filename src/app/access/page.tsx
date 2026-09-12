"use client";

import React, { useEffect, useState, useRef } from "react";
import { ScanResultView } from "@/components/business/ScanResult";
import { ScanResult } from "@/server/services/access-engine";
import { KioskTopBar } from "@/components/desktop/KioskTopBar";
import { useTranslation } from "@/lib/i18n";
import { toLatinDigits } from "@/lib/dates";
import { Shield, Radio } from "lucide-react";

export default function KioskPage() {
  const { t, language } = useTranslation();
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [kioskName, setKioskName] = useState("BORNE-01");
  const [gymName, setGymName] = useState("PASSPro Fitness");

  // Scan result state
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);

  // Hidden keyboard buffer for USB-HID RFID readers
  const keyBuffer = useRef("");
  const lastKeyTime = useRef(0);
  const lastScanProcessed = useRef(0);
  const isBackgroundScanRef = useRef(false);

  // Web Audio Context for Beeps (Cached singleton to eliminate memory and thread leaks)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (granted: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (granted) {
        // 880 Hz, 120ms (Bip original)
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        // 220 Hz, 400ms (Bip original)
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.45, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (err) {
      console.warn("Web Audio not allowed or failed:", err);
    }
  };

  // Clock update (localized with Latin numbers like French version)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const locale = language === "ar" ? "ar-DZ-u-nu-latn" : language === "en" ? "en-US" : "fr-FR";
      const timeFormatted = now.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const dateFormatted = now.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      setTime(toLatinDigits(timeFormatted));
      setDateStr(toLatinDigits(dateFormatted));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [language]);

  // Fetch settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.kioskName) setKioskName(data.kioskName);
          if (data.gymName) setGymName(data.gymName);
        }
      })
      .catch(console.error);
  }, []);

  // Keyboard capture for USB-HID RFID readers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      const now = Date.now();
      if (now - lastKeyTime.current > 300) {
        keyBuffer.current = "";
      }
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (keyBuffer.current.trim().length >= 4) {
          executeScan(keyBuffer.current.trim(), "HARDWARE");
        }
        keyBuffer.current = "";
      } else if (e.key.length === 1) {
        keyBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto reset scan result after 3.8 seconds & hide popup (allows manager time to visually verify face/ID)
  useEffect(() => {
    if (!currentResult) return;
    const timer = setTimeout(() => {
      setCurrentResult(null);
      if (isBackgroundScanRef.current && typeof window !== "undefined") {
        (window as any).electronAPI?.hideKioskPopup?.();
      }
      isBackgroundScanRef.current = false;
    }, 3800);
    return () => clearTimeout(timer);
  }, [currentResult]);

  // Check URL search params for immediate scan parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const scanUid = params.get("scan") || params.get("uid");
      if (scanUid) {
        executeScan(scanUid, "HARDWARE");
        window.history.replaceState({}, "", "/access");
      }
    }
  }, []);

  // Listen to background global RFID scans forwarded from Electron
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.onGlobalRfidScan) {
      const cleanup = (window as any).electronAPI.onGlobalRfidScan(
        (data: { uid: string; result?: ScanResult }) => {
          const now = Date.now();
          if (now - lastScanProcessed.current < 800) {
            return;
          }
          lastScanProcessed.current = now;
          isBackgroundScanRef.current = true;

          if (data?.result) {
            setCurrentResult(data.result);
            playBeep(data.result.decision === "GRANTED");
          } else if (data?.uid) {
            executeScan(data.uid, "HARDWARE");
          }
        }
      );
      return () => cleanup?.();
    }
  }, [kioskName]);

  // Escape key to dismiss scan result and hide popup immediately
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCurrentResult(null);
        if (typeof window !== "undefined") {
          (window as any).electronAPI?.hideKioskPopup?.();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const executeScan = async (uid: string, source: "HARDWARE" | "SIMULATION" = "SIMULATION") => {
    if (!uid.trim()) return;
    try {
      const res = await fetch("/api/access/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-kiosk": "passpro-internal",
        },
        body: JSON.stringify({
          uid: uid.trim(),
          source,
          kioskName,
        }),
      });

      const data: ScanResult = await res.json();
      setCurrentResult(data);
      playBeep(data.decision === "GRANTED");
    } catch (err) {
      console.error("Scan request failed:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black select-none flex flex-col"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Bespoke Designed Top Menu Bar for Borne d'accès */}
      <KioskTopBar gymName={gymName} kioskName={kioskName} />

      {/* Main Kiosk Content Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* 1. Decision Result Screen (if active) */}
        {currentResult ? (
          <ScanResultView
            result={currentResult}
            onReset={() => setCurrentResult(null)}
          />
        ) : (
          /* 2. Idle Kiosk Screen */
          <div
            className="relative w-full h-full flex flex-col justify-between items-center p-8 text-white overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
            }}
          >
            {/* Header / Club Identity */}
            <div className="w-full flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-white/20 flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[17px] font-semibold tracking-wide block leading-tight">
                    {gymName}
                  </span>
                  <span className="text-[11px] text-blue-200 font-medium tracking-wider uppercase">
                    {t("kiosk.accessControlTerminal")}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Concentric Radar Waves + Clock Circle + Consigne */}
            <div className="flex flex-col items-center justify-center my-auto z-10">
              {/* Clock Circle with Concentric Radar Pulse Rings */}
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-3 rounded-full border border-white/35 pointer-events-none animate-radar" />
                <div className="absolute -inset-3 rounded-full border border-white/35 pointer-events-none animate-radar-delayed" />
                <div
                  className="absolute -inset-8 rounded-full border border-white/20 pointer-events-none animate-radar"
                  style={{ animationDelay: "0.65s" }}
                />

                {/* Static Clock Circle */}
                <div className="w-[300px] h-[300px] md:w-[340px] md:h-[340px] rounded-full border border-white/40 flex flex-col items-center justify-center text-center p-6 bg-white/10 backdrop-blur-md shadow-2xl relative z-10">
                  <div className="text-[68px] md:text-[84px] font-extralight tracking-tight nums text-white leading-none">
                    {time || "--:--:--"}
                  </div>
                  <div className="text-[16px] md:text-[18px] text-white/90 capitalize mt-3 font-medium">
                    {dateStr}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-lg">
                  <Radio className="w-6 h-6 text-blue-200 animate-pulse" />
                  <span className="text-[22px] md:text-[25px] font-medium tracking-wide text-white">
                    {t("kiosk.presentBadge")}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Kiosk Badge Name */}
            <div className="text-[13px] font-mono-code text-white/60 tracking-wider z-10">
              {kioskName} · {t("kiosk.onPremiseReady")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
