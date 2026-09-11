"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "./Field";
import { useToast } from "./Toast";
import { invalidateCache } from "@/lib/cache";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPlan?: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    planType?: "TEMPORAL" | "SESSIONS" | "TIME_SLOT";
    sessionCount?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    description?: string | null;
    sortOrder?: number;
    active?: boolean;
  } | null;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPlan,
}) => {
  const toast = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [planType, setPlanType] = useState<"TEMPORAL" | "SESSIONS" | "TIME_SLOT">("TEMPORAL");
  const [sessionCount, setSessionCount] = useState("10");
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("16:00");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialPlan) {
      setName(initialPlan.name);
      setPrice(initialPlan.price.toString());
      setDurationDays(initialPlan.durationDays.toString());
      setPlanType(initialPlan.planType || "TEMPORAL");
      setSessionCount(initialPlan.sessionCount?.toString() || "10");
      setStartTime(initialPlan.startTime || "13:00");
      setEndTime(initialPlan.endTime || "16:00");
      setDescription(initialPlan.description || "");
      setSortOrder(initialPlan.sortOrder?.toString() || "0");
    } else {
      setName("");
      setPrice("");
      setDurationDays("30");
      setPlanType("TEMPORAL");
      setSessionCount("10");
      setStartTime("13:00");
      setEndTime("16:00");
      setDescription("");
      setSortOrder("0");
    }
    setError("");
  }, [initialPlan, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !durationDays) {
      setError("Le nom, le tarif et la durée sont requis");
      return;
    }

    if (planType === "SESSIONS" && (!sessionCount || parseInt(sessionCount, 10) <= 0)) {
      setError("Veuillez indiquer un nombre de séances valide");
      return;
    }

    if (planType === "TIME_SLOT" && (!startTime || !endTime || startTime >= endTime)) {
      setError("Veuillez indiquer une plage horaire valide (heure début < heure fin)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const url = initialPlan ? `/api/plans/${initialPlan.id}` : "/api/plans";
      const method = initialPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: parseInt(price, 10),
          durationDays: parseInt(durationDays, 10),
          planType,
          sessionCount: planType === "SESSIONS" ? parseInt(sessionCount, 10) : null,
          startTime: planType === "TIME_SLOT" ? startTime : null,
          endTime: planType === "TIME_SLOT" ? endTime : null,
          description: description ? description.trim() : null,
          sortOrder: parseInt(sortOrder, 10) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur d'enregistrement");
      }

      invalidateCache(["/api/plans", "/api/dashboard"]);
      toast.success(
        initialPlan ? "Formule mise à jour" : "Formule créée",
        `La formule ${name} a été enregistrée`
      );
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
      title={initialPlan ? "Modifier la formule" : "Nouvelle formule tarifaire"}
      description="Configurez le type d'abonnement, les tarifs, la durée et les restrictions d'accès"
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
            {initialPlan ? "Enregistrer" : "Créer la formule"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] text-[13px] text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Plan Type Selector */}
        <div>
          <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">
            Type d'abonnement *
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                id: "TEMPORAL",
                label: "Temporel",
                desc: "1 mois, 3 mois, etc.",
                icon: "⏱️",
              },
              {
                id: "SESSIONS",
                label: "Par séances",
                desc: "Carnet décompté au scan",
                icon: "🎟️",
              },
              {
                id: "TIME_SLOT",
                label: "Heure exacte",
                desc: "Créneau (ex: 13h - 16h)",
                icon: "🕒",
              },
            ].map((t) => {
              const isSelected = planType === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setPlanType(t.id as any)}
                  className={`p-3 rounded-[8px] border text-left flex flex-col transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#EFF6FF] border-[#2563EB] ring-2 ring-[#93C5FD]"
                      : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[13px] text-[#0F172A]">
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1 leading-tight">
                    {t.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Field
          label="Nom commercial de la formule *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            planType === "SESSIONS"
              ? "Ex: Carnet 10 Séances, Pack 20 Pass..."
              : planType === "TIME_SLOT"
              ? "Ex: Formule Heures Creuses (13h-16h), Matinée..."
              : "Ex: Mensuel Standard, Trimestriel Cardio..."
          }
          required
        />

        {/* Specific Type Options */}
        {planType === "SESSIONS" && (
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-2.5">
            <div className="text-[12px] font-semibold text-[#0F172A] flex items-center gap-1.5">
              <span>🎟️</span>
              <span>Paramétrage des séances</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Field
                  label="Nombre de séances incluses *"
                  type="number"
                  min="1"
                  value={sessionCount}
                  onChange={(e) => setSessionCount(e.target.value)}
                  placeholder="Ex: 10"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 mt-5 flex-wrap">
                {["5", "10", "20", "30"].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSessionCount(s)}
                    className={`px-2.5 py-1 text-[12px] font-semibold rounded border transition-colors ${
                      sessionCount === s
                        ? "bg-[#2563EB] text-white border-[#2563EB]"
                        : "bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {s} séances
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Le système décrémentera automatiquement 1 séance à chaque passage validé à la borne.
            </p>
          </div>
        )}

        {planType === "TIME_SLOT" && (
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-2.5">
            <div className="text-[12px] font-semibold text-[#0F172A] flex items-center gap-1.5">
              <span>🕒</span>
              <span>Créneau d'accès restreint (Heure exacte)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Heure de début (accès dès) *"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Field
                label="Heure de fin (accès jusqu'à) *"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
            {/* Quick presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#64748B]">Créneaux types :</span>
              {[
                { label: "13h - 16h (Heures creuses)", s: "13:00", e: "16:00" },
                { label: "07h - 12h (Matinée)", s: "07:00", e: "12:00" },
                { label: "12h - 14h (Pause midi)", s: "12:00", e: "14:00" },
              ].map((slot) => (
                <button
                  type="button"
                  key={slot.label}
                  onClick={() => {
                    setStartTime(slot.s);
                    setEndTime(slot.e);
                  }}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white text-[#2563EB] border border-[#BFDBFE] rounded hover:bg-[#EFF6FF]"
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#64748B]">
              En dehors de ces heures, le passage à la borne sera automatiquement refusé (motif : Hors créneau horaire).
            </p>
          </div>
        )}

        {/* Price & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Tarif de vente (DA) *"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 5500"
            required
          />
          <div>
            <Field
              label={
                planType === "SESSIONS"
                  ? "Validité max (jours) *"
                  : "Durée de validité (jours) *"
              }
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="Ex: 30"
              required
            />
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {[
                { label: "1j", val: "1" },
                { label: "7j", val: "7" },
                { label: "30j (1m)", val: "30" },
                { label: "90j (3m)", val: "90" },
                { label: "180j (6m)", val: "180" },
                { label: "365j (1an)", val: "365" },
              ].map((chip) => (
                <button
                  type="button"
                  key={chip.val}
                  onClick={() => setDurationDays(chip.val)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
                    durationDays === chip.val
                      ? "bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]"
                      : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Field
          label="Description / Notes commerciales"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Accès musculation, cours collectifs, vestiaire..."
        />

        <Field
          label="Ordre d'affichage"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="0"
          help="Les formules sont triées par ordre croissant dans la caisse"
        />
      </form>
    </Modal>
  );
};
