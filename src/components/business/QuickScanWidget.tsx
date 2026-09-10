"use client";

import React, { useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { ScanResult } from "@/server/services/access-engine";
import { ScanLine, Check, X, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/dates";

export const QuickScanWidget: React.FC = () => {
  const [uid, setUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async (overrideUid?: string) => {
    const targetUid = overrideUid || uid;
    if (!targetUid.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/access/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: targetUid.trim(), source: "SIMULATION" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isGranted = result?.decision === "GRANTED";

  return (
    <Card
      title="Scan de test rapide"
      subtitle="Simuler un passage RFID immédiatement"
      action={<ScanLine className="w-4 h-4 text-[#64748B]" />}
    >
      <div className="flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="flex gap-2"
        >
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Ex: 04:A3:2B:F1"
            className="flex-1 h-9 px-3 text-[13px] bg-white border border-[#CBD5E1] rounded-[6px] font-mono-code uppercase tracking-wider focus:border-[#2563EB]"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
          >
            Tester
          </Button>
        </form>

        {/* Quick chip presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-[#64748B]">Scénarios :</span>
          <button
            type="button"
            onClick={() => {
              setUid("04:A3:2B:F1");
              handleScan("04:A3:2B:F1");
            }}
            className="text-[11px] px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] hover:bg-[#D1FAE5] font-medium"
          >
            Actif
          </button>
          <button
            type="button"
            onClick={() => {
              setUid("04:EE:11:22");
              handleScan("04:EE:11:22");
            }}
            className="text-[11px] px-2 py-0.5 rounded bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] hover:bg-[#FEE2E2] font-medium"
          >
            Bloqué
          </button>
          <button
            type="button"
            onClick={() => {
              setUid("04:DE:AD:BE:EF");
              handleScan("04:DE:AD:BE:EF");
            }}
            className="text-[11px] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] hover:bg-[#E2E8F0] font-medium"
          >
            Inconnu
          </button>
        </div>

        {/* Result presentation */}
        {result && (
          <div
            className={`p-4 rounded-[8px] border transition-all duration-200 ${
              isGranted
                ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                : "bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isGranted ? "bg-[#059669] text-white" : "bg-[#DC2626] text-white"
                }`}
              >
                {isGranted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <X className="w-5 h-5 stroke-[2.5]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold uppercase tracking-wide">
                  {isGranted ? "ACCÈS AUTORISÉ" : "ACCÈS REFUSÉ"}
                </div>

                {result.member ? (
                  <div className="mt-1">
                    <div className="text-[14px] font-semibold text-[#0F172A]">
                      {result.member.firstName} {result.member.lastName}
                    </div>
                    <div className="text-[12px] text-[#475569]">
                      {result.member.planName} · Échéance {formatDate(result.member.endDate)} (
                      {result.member.daysRemaining} j restants)
                    </div>
                  </div>
                ) : (
                  <div className="text-[13px] font-medium mt-1">
                    Motif : {result.reason}
                  </div>
                )}

                <div className="text-[11px] font-mono-code text-[#64748B] mt-1">
                  UID: {result.cardUid}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
