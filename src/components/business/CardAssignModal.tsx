"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { Radio, CreditCard, Sparkles, CheckCircle2 } from "lucide-react";

interface CardAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memberId?: string;
  memberName?: string;
  currentCardUid?: string | null;
}

export const CardAssignModal: React.FC<CardAssignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  memberId,
  memberName,
  currentCardUid,
}) => {
  const toast = useToast();
  const [uid, setUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUid("");
      setError("");
      // Automatically focus the input for immediate RFID scan
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUid = uid.trim().toUpperCase();
    if (!cleanUid) {
      setError("Veuillez scanner ou saisir le numéro de badge");
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (memberId) {
        // Try to assign directly
        const res = await fetch(`/api/cards/${encodeURIComponent(cleanUid)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ASSIGN", memberId }),
        });

        if (res.status === 404) {
          // Card does not exist yet in DB: create and link directly to member
          const createRes = await fetch("/api/cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: cleanUid, memberId }),
          });
          const createData = await createRes.json();
          if (!createRes.ok) throw new Error(createData.error?.message || "Erreur de création de carte");
        } else if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || "Erreur d'attribution du badge");
        }

        toast.success(
          "Badge attribué",
          `Le badge ${cleanUid} est maintenant associé à ${memberName || "l'adhérent"}`
        );
      } else {
        // Register card into system
        const createRes = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: cleanUid }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error?.message || "Erreur d'enregistrement");

        toast.success("Badge enregistré", `Le badge ${cleanUid} a été enregistré`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memberId ? "Scanner la carte RFID" : "Enregistrer un badge"}
      description={
        memberId
          ? `Approchez le badge du lecteur pour l'associer à ${memberName}`
          : "Approchez le badge du lecteur RFID pour l'enregistrer dans le système"
      }
      size="sm"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit()}
            isLoading={isLoading}
            disabled={!uid.trim()}
          >
            {memberId ? "Valider le badge" : "Enregistrer"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-[13px] text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Scan Visual Box */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#EFF6FF] to-[#F8FAFC] border-2 border-dashed border-[#93C5FD] rounded-[12px] p-6 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 animate-pulse">
            <Radio className="w-7 h-7 animate-spin-slow" />
          </div>
          <div className="text-[15px] font-bold text-[#0F172A]">
            Scannez la carte maintenant
          </div>
          <p className="text-[12px] text-[#64748B] mt-1 max-w-[260px]">
            Placez le badge RFID 13,56 MHz sur le lecteur USB connecté au poste
          </p>
        </div>

        {currentCardUid && (
          <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] text-[12px] text-[#B45309] flex items-center gap-2">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>
              Badge actuel : <strong className="font-mono-code">{currentCardUid}</strong> (sera remplacé).
            </span>
          </div>
        )}

        {/* UID Input with Auto-focus */}
        <div>
          <label className="text-[13px] font-medium text-[#475569] mb-1.5 block">
            Numéro de série / UID du badge *
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="En attente de scan... (ex: 04:A3:2B:F1)"
              className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[14px] font-mono-code font-semibold tracking-wide text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              required
            />
            {uid.trim().length > 3 && (
              <CheckCircle2 className="w-5 h-5 text-[#059669] absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            Détecte automatiquement la frappe clavier du lecteur RFID USB et valide avec Entrée.
          </p>
        </div>
      </form>
    </Modal>
  );
};
