"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { formatMoney } from "@/lib/money";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
  preselectedMember?: Member | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  preselectedMember,
}) => {
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [mode, setMode] = useState<"EXTEND" | "RESTART">("EXTEND");
  const [method, setMethod] = useState<"CASH" | "CARD" | "OTHER">("CASH");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      // Fetch active plans
      fetch("/api/plans")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPlans(data);
            if (data.length > 0 && !selectedPlanId) {
              // Default to Mensuel or first
              const mensuel = data.find((p) => p.name.toLowerCase().includes("mensuel"));
              setSelectedPlanId(mensuel ? mensuel.id : data[0].id);
            }
          }
        })
        .catch(console.error);

      // If member preselected
      if (preselectedMember) {
        setSelectedMemberId(preselectedMember.id);
      } else {
        // Fetch members list for dropdown
        fetch("/api/members?pageSize=100")
          .then((r) => r.json())
          .then((data) => {
            if (data.items) {
              setMembers(data.items);
              if (data.items.length > 0 && !selectedMemberId) {
                setSelectedMemberId(data.items[0].id);
              }
            }
          })
          .catch(console.error);
      }
    }
  }, [isOpen, preselectedMember]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedPlanId) {
      setError("Veuillez sélectionner un adhérent et une formule");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          planId: selectedPlanId,
          mode,
          method,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors du règlement");
      }

      toast.success("Règlement enregistré", `Reçu N° ${data.receiptNumber} émis`);
      onPaymentSuccess(data.id);
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
      title="Caisse — Nouvel encaissement"
      description="Émission d'un abonnement et génération du reçu thermique"
      size="md"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Encaisser {selectedPlan ? formatMoney(selectedPlan.price) : ""}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] text-[13px] text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Member selector or info */}
        <div>
          <label className="text-[13px] font-medium text-[#475569] mb-1.5 block">
            Adhérent *
          </label>
          {preselectedMember ? (
            <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] text-[14px] font-semibold text-[#0F172A]">
              {preselectedMember.firstName} {preselectedMember.lastName}
            </div>
          ) : (
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-9 px-3 text-[14px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:border-[#2563EB]"
            >
              <option value="">Sélectionner un adhérent...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Plans Grid Selection */}
        <div>
          <label className="text-[13px] font-medium text-[#475569] mb-2 block">
            Formule d'abonnement *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {plans.map((p) => {
              const isSelected = p.id === selectedPlanId;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-3 rounded-[8px] border text-left flex flex-col justify-between transition-all select-none cursor-pointer ${
                    isSelected
                      ? "bg-[#EFF6FF] border-[#2563EB] ring-2 ring-[#93C5FD]"
                      : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="text-[13px] font-semibold text-[#0F172A] leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    {p.durationDays} jour{p.durationDays > 1 ? "s" : ""}
                  </div>
                  <div className="text-[15px] font-bold text-[#2563EB] mt-2 nums">
                    {formatMoney(p.price)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Renewal Mode: EXTEND vs RESTART */}
        <div>
          <label className="text-[13px] font-medium text-[#475569] mb-1.5 block">
            Mode de renouvellement
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`p-3 rounded-[8px] border cursor-pointer flex flex-col gap-1 ${
                mode === "EXTEND"
                  ? "bg-[#EFF6FF] border-[#2563EB]"
                  : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "EXTEND"}
                  onChange={() => setMode("EXTEND")}
                  className="accent-[#2563EB]"
                />
                <span className="text-[13px] font-semibold text-[#0F172A]">
                  Prolongation (EXTEND)
                </span>
              </div>
              <span className="text-[12px] text-[#64748B] pl-5">
                Conserve les jours restants de l'abonnement en cours
              </span>
            </label>

            <label
              className={`p-3 rounded-[8px] border cursor-pointer flex flex-col gap-1 ${
                mode === "RESTART"
                  ? "bg-[#EFF6FF] border-[#2563EB]"
                  : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "RESTART"}
                  onChange={() => setMode("RESTART")}
                  className="accent-[#2563EB]"
                />
                <span className="text-[13px] font-semibold text-[#0F172A]">
                  Nouveau départ (RESTART)
                </span>
              </div>
              <span className="text-[12px] text-[#64748B] pl-5">
                Démarre la validité à compter d'aujourd'hui
              </span>
            </label>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-[13px] font-medium text-[#475569] mb-1.5 block">
            Mode de règlement
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "CASH", label: "Espèces" },
              { id: "CARD", label: "Carte bancaire" },
              { id: "OTHER", label: "Autre" },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMethod(m.id as any)}
                className={`py-2 px-3 rounded-[6px] border text-[13px] font-medium transition-all ${
                  method === m.id
                    ? "bg-[#0F172A] text-white border-[#0F172A]"
                    : "bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F8FAFC]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
