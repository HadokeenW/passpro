"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "./Field";
import { useToast } from "./Toast";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialUser?: {
    id: string;
    username: string;
    name: string;
    role: string;
    active: boolean;
  } | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialUser,
}) => {
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("RECEPTIONIST");
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialUser) {
      setUsername(initialUser.username);
      setName(initialUser.name);
      setRole(initialUser.role);
      setActive(initialUser.active);
      setPassword("");
    } else {
      setUsername("");
      setName("");
      setPassword("");
      setRole("RECEPTIONIST");
      setActive(true);
    }
    setError("");
  }, [initialUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialUser && (!username.trim() || !password)) {
      setError("L'identifiant et le mot de passe sont requis");
      return;
    }
    if (!name.trim()) {
      setError("Le nom complet est requis");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const url = initialUser ? `/api/users/${initialUser.id}` : "/api/users";
      const method = initialUser ? "PATCH" : "POST";

      const payload: any = {
        name: name.trim(),
        role,
      };

      if (!initialUser) {
        payload.username = username.trim().toLowerCase();
        payload.password = password;
      } else {
        payload.active = active;
        if (password) payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur d'enregistrement");
      }

      toast.success(
        initialUser ? "Compte mis à jour" : "Compte créé",
        `Le compte opérateur ${name} a été enregistré`
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
      title={initialUser ? "Modifier le compte" : "Nouvel opérateur"}
      description="Gestion des accès au système et affectation des rôles RBAC"
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
            {initialUser ? "Enregistrer" : "Créer le compte"}
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
          label="Nom complet de l'opérateur *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Inès Benali"
          required
        />

        {!initialUser ? (
          <Field
            label="Identifiant de connexion *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ex: ines"
            required
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#475569]">Identifiant</span>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] text-[14px] text-[#64748B] font-mono-code">
              {username}
            </div>
          </div>
        )}

        <Field
          label={initialUser ? "Nouveau mot de passe (laisser vide pour conserver)" : "Mot de passe *"}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8 caractères minimum"
          required={!initialUser}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#475569]">
            Rôle RBAC *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full h-9 px-3 text-[14px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:border-[#2563EB]"
          >
            <option value="RECEPTIONIST">RECEPTIONIST — Accueil, caisse, ventes, badges</option>
            <option value="MANAGER">MANAGER — Gestion formules, exclusions, abonnements</option>
            <option value="ADMIN">ADMIN — Accès complet (paramètres, comptes, audit)</option>
            <option value="ACCESS_GUARD">ACCESS_GUARD — Kiosk / contrôle d'accès borne uniquement</option>
          </select>
        </div>

        {initialUser && (
          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded border-[#CBD5E1]"
            />
            <span className="text-[13px] font-medium text-[#0F172A]">Compte actif</span>
          </label>
        )}
      </form>
    </Modal>
  );
};
