"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "./Field";
import { useToast } from "./Toast";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPlan?: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
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
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialPlan) {
      setName(initialPlan.name);
      setPrice(initialPlan.price.toString());
      setDurationDays(initialPlan.durationDays.toString());
      setDescription(initialPlan.description || "");
      setSortOrder(initialPlan.sortOrder?.toString() || "0");
    } else {
      setName("");
      setPrice("");
      setDurationDays("30");
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
          description: description ? description.trim() : null,
          sortOrder: parseInt(sortOrder, 10) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur d'enregistrement");
      }

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
      description="Définissez le nom commercial, le tarif et la durée de validité en jours"
      size="sm"
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

        <Field
          label="Nom de la formule *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Mensuel Standard, Pass Semaine..."
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Prix (DA) *"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 5500"
            required
          />
          <div>
            <Field
              label="Durée (jours) *"
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
                { label: "30j", val: "30" },
                { label: "90j", val: "90" },
                { label: "180j", val: "180" },
                { label: "365j", val: "365" },
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
          label="Description courte"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Accès libre musculation et cardio..."
        />

        <Field
          label="Ordre d'affichage"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="0"
          help="Les formules sont triées par ordre croissant"
        />
      </form>
    </Modal>
  );
};
