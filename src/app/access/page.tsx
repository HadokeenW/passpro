"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ScanResultView } from "@/components/business/ScanResult";
import { ScanResult } from "@/server/services/access-engine";
import { Button } from "@/components/business/Button";
import {
  Shield,
  Sliders,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  HelpCircle,
  Play,
  ArrowLeft,
} from "lucide-react";

export default function KioskPage() {
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [kioskName, setKioskName] = useState("BORNE-01");
  const [gymName, setGymName] = useState("PASSPro Fitness");
  const [simulationEnabled, setSimulationEnabled] = useState(true);

  // Scan result state
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);

  // Simulation Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [customUid, setCustomUid] = useState("");

  // Hidden keyboard buffer for USB-HID RFID readers
  const keyBuffer = useRef("");
  const lastKeyTime = useRef(0);

  // Web Audio Context for Beeps
  const playBeep = (granted: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (granted) {
        // 880 Hz, 120ms
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        // 220 Hz, 400ms
        osc.frequency.value = 220;
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (err) {
      console.warn("Web Audio not allowed or failed:", err);
    }
  };

  // Clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDateStr(
        now.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch settings & heartbeat
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.kioskName) setKioskName(data.kioskName);
          if (data.gymName) setGymName(data.gymName);
          if (data.simulationMode !== undefined) setSimulationEnabled(data.simulationMode);
        }
      })
      .catch(console.error);

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      fetch("/api/health").catch(() => {
        console.warn("Kiosk lost connection to server");
      });
    }, 30000);

    return () => clearInterval(heartbeat);
  }, []);

  // Keyboard capture for USB-HID RFID readers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in the simulation input
      if (document.activeElement?.tagName === "INPUT") return;

      const now = Date.now();
      // If interval > 300ms, reset buffer
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

  // Auto reset scan result after 5 seconds
  useEffect(() => {
    if (!currentResult) return;
    const timer = setTimeout(() => {
      setCurrentResult(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentResult]);

  const executeScan = async (uid: string, source: "HARDWARE" | "SIMULATION" = "SIMULATION") => {
    if (!uid.trim()) return;
    try {
      const res = await fetch("/api/access/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: uid.trim(),
          source,
          kioskName,
        }),
      });

      const data: ScanResult = await res.json();
      setCurrentResult(data);
      playBeep(data.decision === "GRANTED");
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Scan request failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black select-none">
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
          {/* Header */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-[13px] font-medium text-white transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tableau de bord</span>
              </Link>
              <div
                onClick={() => simulationEnabled && setIsDrawerOpen(true)}
                className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                title="Cliquer pour ouvrir la simulation"
              >
                <div className="w-8 h-8 rounded-[8px] bg-white/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-[16px] font-semibold tracking-wide">
                  {gymName}
                </span>
              </div>
            </div>

            {simulationEnabled && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[13px] font-medium transition-colors"
              >
                <Sliders className="w-4 h-4 text-blue-200" />
                <span>Console de simulation</span>
              </button>
            )}
          </div>

          {/* Center: Concentric Radar Waves + Clock Circle + Consigne */}
          <div className="flex flex-col items-center justify-center my-auto z-10">
            {/* Clock Circle with Perfectly Concentric Radar Pulse Rings */}
            <div className="relative flex items-center justify-center">
              {/* Concentric expanding pulse waves - exactly centered on the clock circle */}
              <div className="absolute -inset-3 rounded-full border border-white/35 pointer-events-none animate-radar" />
              <div className="absolute -inset-3 rounded-full border border-white/35 pointer-events-none animate-radar-delayed" />
              <div
                className="absolute -inset-8 rounded-full border border-white/20 pointer-events-none animate-radar"
                style={{ animationDelay: "0.65s" }}
              />

              {/* Static Clock Circle */}
              <div className="w-[320px] h-[320px] rounded-full border border-white/40 flex flex-col items-center justify-center text-center p-6 bg-white/10 backdrop-blur-md shadow-2xl relative z-10">
                <div className="text-[72px] md:text-[84px] font-extralight tracking-tight nums text-white leading-none">
                  {time || "--:--:--"}
                </div>
                <div className="text-[16px] md:text-[18px] text-white/90 capitalize mt-3 font-medium">
                  {dateStr}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-lg">
                <Radio className="w-5 h-5 text-blue-200 animate-pulse" />
                <span className="text-[22px] md:text-[24px] font-medium tracking-wide text-white">
                  Présentez votre badge
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Kiosk Badge Name */}
          <div className="text-[13px] font-mono-code text-white/60 tracking-wider z-10">
            {kioskName} · ON-PREMISE LAN READY
          </div>
        </div>
      )}

      {/* 3. Simulation Console Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-[360px] bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 text-[#0F172A]">
            <div className="space-y-5 overflow-y-auto">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2 font-bold text-[16px]">
                  <Sliders className="w-4 h-4 text-[#2563EB]" />
                  <span>Simulation RFID</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#0F172A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[13px] text-[#64748B]">
                Testez immédiatement le comportement du contrôle d'accès selon les 7 scénarios métier prévus par la spécification :
              </p>

              {/* Quick Scenarios */}
              <div className="space-y-2">
                <button
                  onClick={() => executeScan("04:A3:2B:F1")}
                  className="w-full p-3 text-left rounded-[8px] border border-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-[#047857]">
                      1. Adhérent Actif (Amine)
                    </div>
                    <div className="text-[11px] text-[#059669]">UID: 04:A3:2B:F1 · Accès accordé</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                </button>

                <button
                  onClick={() => executeScan("04:F8:70:E6")}
                  className="w-full p-3 text-left rounded-[8px] border border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-[#B45309]">
                      2. Expire bientôt (Khaled)
                    </div>
                    <div className="text-[11px] text-[#D97706]">J-2 · Accès accordé + Alerte</div>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                </button>

                <button
                  onClick={() => executeScan("04:2B:A3:19")}
                  className="w-full p-3 text-left rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-[#B91C1C]">
                      3. Abonnement expiré (Bilel)
                    </div>
                    <div className="text-[11px] text-[#DC2626]">Expiré · Accès refusé</div>
                  </div>
                  <Clock className="w-4 h-4 text-[#DC2626]" />
                </button>

                <button
                  onClick={() => executeScan("04:5E:D6:4C")}
                  className="w-full p-3 text-left rounded-[8px] border border-[#E2E8F0] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-[#475569]">
                      4. Abonnement suspendu (Mourad)
                    </div>
                    <div className="text-[11px] text-[#64748B]">Litige en cours · Refusé</div>
                  </div>
                  <Ban className="w-4 h-4 text-[#64748B]" />
                </button>

                <button
                  onClick={() => executeScan("04:EE:11:22")}
                  className="w-full p-3 text-left rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-[#B91C1C]">
                      5. Carte bloquée
                    </div>
                    <div className="text-[11px] text-[#DC2626]">Vol / Impayé · Refusé</div>
                  </div>
                  <Ban className="w-4 h-4 text-[#DC2626]" />
                </button>

                <button
                  onClick={() => executeScan("04:00:AA:11")}
                  className="w-full p-3 text-left rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-[#475569]">
                      6. Carte en stock (non assignée)
                    </div>
                    <div className="text-[11px] text-[#64748B]">Non liée à un adhérent · Refusé</div>
                  </div>
                  <HelpCircle className="w-4 h-4 text-[#64748B]" />
                </button>

                <button
                  onClick={() => executeScan("04:DE:AD:BE:EF")}
                  className="w-full p-3 text-left rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-[#B91C1C]">
                      7. Carte inconnue (hors parc)
                    </div>
                    <div className="text-[11px] text-[#DC2626]">UID absent de la base · Refusé</div>
                  </div>
                  <HelpCircle className="w-4 h-4 text-[#DC2626]" />
                </button>
              </div>

              {/* Free UID input */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <label className="text-[12px] font-semibold text-[#475569] mb-1.5 block">
                  UID hexadécimal libre :
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeScan(customUid);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={customUid}
                    onChange={(e) => setCustomUid(e.target.value)}
                    placeholder="04:XX:XX:XX"
                    className="flex-1 h-9 px-3 text-[13px] font-mono-code uppercase border border-[#CBD5E1] rounded-[6px] focus:border-[#2563EB]"
                  />
                  <Button type="submit" variant="primary" size="md">
                    Scanner
                  </Button>
                </form>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setIsDrawerOpen(false)}
              >
                Fermer le panneau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
