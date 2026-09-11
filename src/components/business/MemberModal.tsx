"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "./Field";
import { useToast } from "./Toast";
import { invalidateCache } from "@/lib/cache";

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMember?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  } | null;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMember,
}) => {
  const toast = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialMember) {
      setFirstName(initialMember.firstName || "");
      setLastName(initialMember.lastName || "");
      setPhone(initialMember.phone || "");
      setEmail(initialMember.email || "");
      setNotes(initialMember.notes || "");
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setNotes("");
    }
    setError("");
  }, [initialMember, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Le prénom et le nom sont requis");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const url = initialMember ? `/api/members/${initialMember.id}` : "/api/members";
      const method = initialMember ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || null,
          email: email || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de l'enregistrement");
      }

      invalidateCache(["/api/members", "/api/dashboard"]);
      toast.success(
        initialMember ? "Adhérent mis à jour" : "Adhérent créé",
        `${firstName} ${lastName} a été enregistré avec succès`
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
      title={initialMember ? "Modifier le dossier" : "Nouvel adhérent"}
      description="Renseignez les informations d'identité et de contact"
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
            {initialMember ? "Enregistrer les modifications" : "Créer l'adhérent"}
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

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Prénom *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ex: Amine"
            required
          />
          <Field
            label="Nom *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Ex: Belkacem"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ex: 0550 12 34 56"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex: contact@email.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#475569]">
            Notes internes (jamais imprimées sur les reçus)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Remarques de santé, préférences, historique..."
            rows={3}
            className="w-full px-3 py-2 text-[13px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] transition-colors focus:border-[#2563EB]"
          />
        </div>
      </form>
    </Modal>
  );
};
