"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { Field } from "@/components/business/Field";
import { StatusPill } from "@/components/business/StatusPill";
import { UserModal } from "@/components/business/UserModal";
import { Modal } from "@/components/business/Modal";
import { useToast } from "@/components/business/Toast";
import { formatDateTime } from "@/lib/dates";
import {
  Building2,
  Sliders,
  Cpu,
  Users,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  Database,
  Download,
  UploadCloud,
  HardDrive,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "gym" | "general" | "hardware" | "accounts" | "backup" | "audit"
  >("gym");

  // Settings state
  const [settings, setSettings] = useState<any>({
    gymName: "PASSPro Fitness Club",
    gymPhone: "0550 12 34 56",
    gymEmail: "contact@passpro.dz",
    gymAddress: "14 Rue Didouche Mourad, Alger",
    currency: "DA",
    timezone: "Africa/Algiers",
    dateFormat: "dd/MM/yyyy",
    kioskName: "BORNE-01",
    simulationMode: true,
    receiptFooter: "Merci de votre fidélité et à bientôt !",
  });

  const [isSaving, setIsSaving] = useState(false);

  // Accounts state
  const [users, setUsers] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);

  // Backup state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const handleDownloadBackup = () => {
    toast.info("Téléchargement", "Export de la base de données SQLite...");
    window.location.href = "/api/backup";
  };

  const handleRestoreSubmit = async () => {
    if (!restoreFile) return;
    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append("backup", restoreFile);
      const res = await fetch("/api/backup", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Erreur lors de la restauration");

      toast.success("Restauration terminée", data.message || "Base restaurée");
      setIsRestoreModalOpen(false);
      setRestoreFile(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error("Échec de restauration", err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const fetchSettings = () => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(console.error);
  };

  const fetchUsers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(console.error);
  };

  const fetchAudit = () => {
    fetch(`/api/audit?page=${auditPage}&pageSize=20`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setAuditLogs(data.items);
          setAuditTotal(data.total);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) {
          router.replace("/login");
          return;
        }
        if (d.user.role === "RECEPTIONIST") {
          toast.error("Accès refusé", "Les réceptionnistes n'ont pas accès aux paramètres");
          router.replace("/");
          return;
        }
        setCurrentUser(d.user);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setIsLoadingUser(false));
  }, [router, toast]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "accounts") fetchUsers();
    if (activeTab === "audit") fetchAudit();
  }, [activeTab, auditPage]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Erreur de sauvegarde");

      toast.success("Paramètres enregistrés", "Les modifications sont actives sur les reçus et bornes");
      setSettings(data);
    } catch (err: any) {
      toast.error("Erreur", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Suppression refusée", data.error?.message || "Erreur");
      } else {
        toast.success("Compte supprimé", "L'opérateur a été retiré");
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUserToDelete(null);
    }
  };

  const allTabs = [
    { id: "gym", label: "Établissement & Reçus", icon: Building2 },
    { id: "general", label: "Général", icon: Sliders },
    { id: "hardware", label: "Matériel & Bornes", icon: Cpu },
    { id: "accounts", label: "Comptes & Rôles", icon: Users },
    { id: "backup", label: "Sauvegarde & Données", icon: Database },
    { id: "audit", label: "Journal d'audit", icon: ShieldCheck },
  ];

  const tabs = allTabs.filter((tab) => {
    if (currentUser?.role === "MANAGER") {
      return tab.id !== "accounts" && tab.id !== "audit";
    }
    return true;
  });

  useEffect(() => {
    if (currentUser?.role === "MANAGER" && (activeTab === "accounts" || activeTab === "audit")) {
      setActiveTab("gym");
    }
  }, [currentUser, activeTab]);

  if (isLoadingUser || currentUser?.role === "RECEPTIONIST") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
          Paramètres du système
        </h1>
        <p className="text-[14px] text-[#64748B] mt-0.5">
          Configuration de l'établissement, du matériel RFID et des habilitations
        </p>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-[#E2E8F0] gap-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-[14px] font-medium transition-colors flex items-center gap-2 relative select-none cursor-pointer ${
                isActive
                  ? "text-[#2563EB] font-semibold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#2563EB]" : "text-[#94A3B8]"}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#2563EB]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Établissement (avec aperçu de reçu en direct à droite) */}
      {activeTab === "gym" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <Card title="Informations de l'établissement">
                <div className="space-y-4">
                  <Field
                    label="Nom du club / salle *"
                    value={settings.gymName}
                    onChange={(e) => setSettings({ ...settings, gymName: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Téléphone de contact"
                      value={settings.gymPhone}
                      onChange={(e) => setSettings({ ...settings, gymPhone: e.target.value })}
                    />
                    <Field
                      label="Email de contact"
                      type="email"
                      value={settings.gymEmail}
                      onChange={(e) => setSettings({ ...settings, gymEmail: e.target.value })}
                    />
                  </div>
                  <Field
                    label="Adresse physique"
                    value={settings.gymAddress}
                    onChange={(e) => setSettings({ ...settings, gymAddress: e.target.value })}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-[#475569]">
                      Message de bas de ticket thermique (pied de reçu)
                    </label>
                    <input
                      value={settings.receiptFooter}
                      onChange={(e) =>
                        setSettings({ ...settings, receiptFooter: e.target.value })
                      }
                      className="h-9 px-3 text-[14px] bg-white border border-[#CBD5E1] rounded-[6px] focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Live Receipt Preview */}
            <div className="lg:col-span-5">
              <Card title="Aperçu en direct du ticket (80 mm)">
                <div className="bg-[#F8FAFC] p-4 rounded-[8px] flex justify-center border border-[#E2E8F0]">
                  <div className="w-[240px] bg-white p-4 rounded shadow-xs border border-[#CBD5E1] text-[11px] leading-relaxed text-[#0F172A] font-sans">
                    <div className="text-center">
                      <div className="font-bold text-[13px]">{settings.gymName || "Nom du club"}</div>
                      {settings.gymAddress && (
                        <div className="text-[10px] text-[#64748B]">{settings.gymAddress}</div>
                      )}
                      {settings.gymPhone && (
                        <div className="text-[10px] text-[#64748B]">Tél : {settings.gymPhone}</div>
                      )}
                    </div>
                    <div className="border-t border-dashed border-[#CBD5E1] my-2" />
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">N° REÇU:</span>
                      <span className="font-mono-code font-bold">REC-2026-0042</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">ADHÉRENT:</span>
                      <span className="font-medium">Amine Belkacem</span>
                    </div>
                    <div className="border-t border-dashed border-[#CBD5E1] my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Mensuel (30j)</span>
                      <span className="nums">5 500 {settings.currency}</span>
                    </div>
                    <div className="border-t border-black my-2" />
                    <div className="flex justify-between font-bold text-[12px]">
                      <span>TOTAL</span>
                      <span className="nums">5 500 {settings.currency}</span>
                    </div>
                    <div className="border-t border-dashed border-[#CBD5E1] my-2" />
                    <div className="text-center italic text-[#64748B] text-[10px]">
                      {settings.receiptFooter || "Merci de votre fidélité"}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Général */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Card title="Préférences régionales & comptables">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Devise"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                help="Ex: DA, EUR, DZD"
                required
              />
              <Field
                label="Fuseau horaire de l'établissement"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                help="Ex: Africa/Algiers, Europe/Paris"
                required
              />
              <Field
                label="Format de date"
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                help="dd/MM/yyyy"
                disabled
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Enregistrer
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Matériel & Borne */}
      {activeTab === "hardware" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Card title="Configuration des bornes d'accès">
            <div className="space-y-5">
              <div className="max-w-md">
                <Field
                  label="Identifiant de la borne locale"
                  value={settings.kioskName}
                  onChange={(e) => setSettings({ ...settings, kioskName: e.target.value })}
                  help="Nom affiché dans le journal des passages et sur la borne (ex: BORNE-01)"
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#F1F5F9]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.simulationMode}
                    onChange={(e) =>
                      setSettings({ ...settings, simulationMode: e.target.checked })
                    }
                    className="w-4 h-4 mt-0.5 text-[#2563EB] rounded border-[#CBD5E1]"
                  />
                  <div>
                    <span className="text-[14px] font-semibold text-[#0F172A]">
                      Activer le tiroir de simulation sur la borne (/access)
                    </span>
                    <p className="text-[13px] text-[#64748B] mt-0.5">
                      Permet aux opérateurs de déclencher les 7 scénarios de test (badge valide, expiré, bloqué, inconnu) sans lecteur physique.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Enregistrer
            </Button>
          </div>
        </form>
      )}

      {/* Tab 4: Comptes opérateurs */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-[#64748B]">
              Gestion des utilisateurs et rôles (ADMIN, MANAGER, RECEPTIONIST, ACCESS_GUARD)
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setSelectedUser(null);
                setIsUserModalOpen(true);
              }}
            >
              Nouvel opérateur
            </Button>
          </div>

          <Card noPadding>
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">Nom complet</th>
                  <th className="px-4">Identifiant</th>
                  <th className="px-4">Rôle</th>
                  <th className="px-4 text-center">Statut</th>
                  <th className="px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {users.map((u) => (
                  <tr key={u.id} className="h-12 hover:bg-[#F8FAFC]">
                    <td className="px-5 font-semibold text-[#0F172A]">{u.name}</td>
                    <td className="px-4 font-mono-code text-[#475569]">{u.username}</td>
                    <td className="px-4 font-medium text-[#2563EB]">{u.role}</td>
                    <td className="px-4 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          u.active
                            ? "bg-[#ECFDF5] text-[#047857]"
                            : "bg-[#FEF2F2] text-[#B91C1C]"
                        }`}
                      >
                        {u.active ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsUserModalOpen(true);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#2563EB] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#DC2626] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <UserModal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            initialUser={selectedUser}
            onSuccess={fetchUsers}
          />

          <Modal
            isOpen={!!userToDelete}
            onClose={() => setUserToDelete(null)}
            title="Supprimer l'opérateur"
            description="Cette action est irréversible."
            footer={
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setUserToDelete(null)}>
                  Annuler
                </Button>
                <Button variant="danger" onClick={handleDeleteUser}>
                  Supprimer
                </Button>
              </div>
            }
          >
            <p className="text-[13px] text-[#475569]">
              Êtes-vous certain de vouloir supprimer le compte{" "}
              <strong>{userToDelete?.name}</strong> ? S'il a déjà enregistré des encaissements,
              la suppression sera rejetée et vous devrez désactiver son compte à la place.
            </p>
          </Modal>
        </div>
      )}

      {/* Tab: Sauvegarde & Données */}
      {activeTab === "backup" && (
        <div className="space-y-5">
          <Card
            title="Sauvegarde & Sécurité des données"
            subtitle="L'application PASSPro fonctionne sur une base de données embarquée SQLite avec journalisation WAL."
          >
            <div className={`grid grid-cols-1 ${currentUser?.role === "ADMIN" ? "md:grid-cols-2" : "max-w-xl"} gap-5 pt-2`}>
              {/* Export Box */}
              <div className="p-5 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-[8px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#0F172A]">
                        Sauvegarde manuelle 1-clic
                      </h4>
                      <p className="text-[12px] text-[#64748B]">
                        Télécharge le fichier de base de données complet
                      </p>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#475569] mt-3">
                    Cette action force la synchronisation de toutes les transactions et génère un fichier <code>.db</code> contenant l'intégralité des adhérents, photos, abonnements et encaissements.
                  </p>
                </div>
                <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                  <Button
                    variant="primary"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleDownloadBackup}
                  >
                    Télécharger la sauvegarde (.db)
                  </Button>
                </div>
              </div>

              {/* Restore Box (Admin only) */}
              {currentUser?.role === "ADMIN" && (
                <div className="p-5 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-[8px] bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-[#0F172A]">
                          Restauration d'une sauvegarde
                        </h4>
                        <p className="text-[12px] text-[#64748B]">
                          Restaurer un fichier .db existant
                        </p>
                      </div>
                    </div>
                    <p className="text-[13px] text-[#475569] mt-3">
                      Attention : la restauration remplacera toutes les données actuelles par celles contenues dans le fichier de sauvegarde importé.
                    </p>
                  </div>
                  <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                    <input
                      type="file"
                      accept=".db,.sqlite"
                      id="restore-file-input"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setRestoreFile(file);
                          setIsRestoreModalOpen(true);
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      leftIcon={<UploadCloud className="w-4 h-4" />}
                      onClick={() => document.getElementById("restore-file-input")?.click()}
                    >
                      Restaurer un fichier (.db)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="mt-6 p-4 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-3 text-[13px] text-[#1E40AF]">
              <HardDrive className="w-5 h-5 shrink-0 mt-0.5 text-[#2563EB]" />
              <div>
                <strong className="font-semibold block mb-0.5">
                  Recommandation de sécurité pour la salle :
                </strong>
                Effectuez un téléchargement de sauvegarde chaque fin de semaine et conservez une copie sur une clé USB ou un disque externe sécurisé.
              </div>
            </div>
          </Card>

          {/* Restore Confirmation Modal */}
          <Modal
            isOpen={isRestoreModalOpen}
            onClose={() => setIsRestoreModalOpen(false)}
            title="Confirmer la restauration de la base"
            description="Cette opération remplacera immédiatement la base actuelle."
            size="sm"
            footer={
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setIsRestoreModalOpen(false)} disabled={isRestoring}>
                  Annuler
                </Button>
                <Button variant="danger" onClick={handleRestoreSubmit} isLoading={isRestoring}>
                  Confirmer la restauration
                </Button>
              </div>
            }
          >
            <p className="text-[13px] text-[#475569]">
              Vous allez restaurer le fichier : <strong>{restoreFile?.name}</strong>.
              Toutes les données créées après cette sauvegarde seront écrasées. Êtes-vous certain de vouloir continuer ?
            </p>
          </Modal>
        </div>
      )}

      {/* Tab 5: Journal d'audit */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <Card noPadding>
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">Date & Heure</th>
                  <th className="px-4">Opérateur</th>
                  <th className="px-4">Action</th>
                  <th className="px-4">Entité</th>
                  <th className="px-5">Détail des modifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#64748B]">
                      Aucune action d'audit enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="h-12 hover:bg-[#F8FAFC]">
                      <td className="px-5 font-medium text-[#0F172A] nums">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 font-semibold text-[#0F172A]">
                        {log.user ? log.user.name : "Système"}
                      </td>
                      <td className="px-4 font-mono-code text-[12px] text-[#2563EB]">
                        {log.action}
                      </td>
                      <td className="px-4 text-[#64748B]">{log.entityType}</td>
                      <td className="px-5 text-[#64748B] font-mono-code text-[11px] truncate max-w-[300px]">
                        {log.after || log.before || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
