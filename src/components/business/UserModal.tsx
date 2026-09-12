"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "./Field";
import { useToast } from "./Toast";
import { useTranslation } from "@/lib/i18n";

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
  const { language } = useTranslation();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("RECEPTIONIST");
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const tLabels = {
    titleEdit: { fr: "Modifier le compte", en: "Edit Operator Account", ar: "تعديل حساب المستخدم" },
    titleCreate: { fr: "Nouvel opérateur", en: "New Operator Account", ar: "مستخدم جديد" },
    desc: {
      fr: "Gestion des accès au système et affectation des rôles RBAC",
      en: "Manage system access and assign RBAC roles",
      ar: "إدارة الوصول وتعيين صلاحيات النظام",
    },
    cancel: { fr: "Annuler", en: "Cancel", ar: "إلغاء" },
    save: { fr: "Enregistrer", en: "Save", ar: "حفظ" },
    createBtn: { fr: "Créer le compte", en: "Create Account", ar: "إنشاء الحساب" },
    nameLabel: { fr: "Nom complet de l'opérateur *", en: "Operator Full Name *", ar: "الاسم الكامل للمستخدم *" },
    usernameLabel: { fr: "Identifiant de connexion *", en: "Username *", ar: "اسم المستخدم *" },
    usernameStatic: { fr: "Identifiant", en: "Username", ar: "اسم المستخدم" },
    passwordNew: {
      fr: "Nouveau mot de passe (laisser vide pour conserver)",
      en: "New password (leave empty to keep current)",
      ar: "كلمة مرور جديدة (اتركه فارغاً للاحتفاظ بالحالية)",
    },
    passwordRequired: { fr: "Mot de passe *", en: "Password *", ar: "كلمة المرور *" },
    roleLabel: { fr: "Rôle RBAC *", en: "RBAC Role *", ar: "الصلاحية RBAC *" },
    roles: {
      RECEPTIONIST: {
        fr: "RECEPTIONIST — Accueil, caisse, ventes, badges",
        en: "RECEPTIONIST — Front desk, checkout, sales, cards",
        ar: "RECEPTIONIST — الاستقبال، الصندوق، المبيعات، البطاقات",
      },
      MANAGER: {
        fr: "MANAGER — Gestion formules, exclusions, abonnements",
        en: "MANAGER — Plans, exclusions, memberships management",
        ar: "MANAGER — إدارة الاشتراكات والخطط والاستثناءات",
      },
      ADMIN: {
        fr: "ADMIN — Accès complet (paramètres, comptes, audit)",
        en: "ADMIN — Full access (settings, accounts, audit)",
        ar: "ADMIN — وصول كامل (الإعدادات، الحسابات، الرقابة)",
      },
      ACCESS_GUARD: {
        fr: "ACCESS_GUARD — Kiosk / contrôle d'accès borne uniquement",
        en: "ACCESS_GUARD — Kiosk / access terminal only",
        ar: "ACCESS_GUARD — نقطة العبور / مراقبة البوابات فقط",
      },
    },
    activeAccount: { fr: "Compte actif", en: "Active account", ar: "حساب نشط" },
    passwordPlaceholder: {
      fr: "8 caractères minimum",
      en: "8 characters minimum",
      ar: "8 أحرف على الأقل",
    },
    errSave: {
      fr: "Erreur d'enregistrement",
      en: "Failed to save",
      ar: "خطأ في التسجيل",
    },
    errGeneric: {
      fr: "Une erreur est survenue",
      en: "An error occurred",
      ar: "حدث خطأ غير متوقع",
    },
    errReqUserPass: {
      fr: "L'identifiant et le mot de passe sont requis",
      en: "Username and password are required",
      ar: "اسم المستخدم وكلمة المرور مطلوبان",
    },
    errReqName: {
      fr: "Le nom complet est requis",
      en: "Full name is required",
      ar: "الاسم الكامل مطلوب",
    },
    toastUpdated: { fr: "Compte mis à jour", en: "Account updated", ar: "تم تحديث الحساب" },
    toastCreated: { fr: "Compte créé", en: "Account created", ar: "تم إنشاء الحساب" },
    toastSavedDesc: (n: string) => ({
      fr: `Le compte opérateur ${n} a été enregistré`,
      en: `Operator account ${n} has been saved`,
      ar: `تم حفظ حساب المستخدم ${n}`,
    }),
  };

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
      setError(tLabels.errReqUserPass[language]);
      return;
    }
    if (!name.trim()) {
      setError(tLabels.errReqName[language]);
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
        throw new Error(data.error?.message || tLabels.errSave[language]);
      }

      toast.success(
        initialUser ? tLabels.toastUpdated[language] : tLabels.toastCreated[language],
        tLabels.toastSavedDesc(name)[language]
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || tLabels.errGeneric[language]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialUser ? tLabels.titleEdit[language] : tLabels.titleCreate[language]}
      description={tLabels.desc[language]}
      size="sm"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {tLabels.cancel[language]}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {initialUser ? tLabels.save[language] : tLabels.createBtn[language]}
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
          label={tLabels.nameLabel[language]}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Inès Benali"
          required
        />

        {!initialUser ? (
          <Field
            label={tLabels.usernameLabel[language]}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ex: ines"
            required
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#475569]">{tLabels.usernameStatic[language]}</span>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] text-[14px] text-[#64748B] font-mono-code">
              {username}
            </div>
          </div>
        )}

        <Field
          label={initialUser ? tLabels.passwordNew[language] : tLabels.passwordRequired[language]}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={tLabels.passwordPlaceholder[language]}
          required={!initialUser}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#475569]">
            {tLabels.roleLabel[language]}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full h-9 px-3 text-[14px] bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:border-[#2563EB]"
          >
            <option value="RECEPTIONIST">{tLabels.roles.RECEPTIONIST[language]}</option>
            <option value="MANAGER">{tLabels.roles.MANAGER[language]}</option>
            <option value="ADMIN">{tLabels.roles.ADMIN[language]}</option>
            <option value="ACCESS_GUARD">{tLabels.roles.ACCESS_GUARD[language]}</option>
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
            <span className="text-[13px] font-medium text-[#0F172A]">{tLabels.activeAccount[language]}</span>
          </label>
        )}
      </form>
    </Modal>
  );
};
