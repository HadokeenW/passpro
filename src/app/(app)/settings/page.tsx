"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { Field } from "@/components/business/Field";
import { UserModal } from "@/components/business/UserModal";
import { Modal } from "@/components/business/Modal";
import { useToast } from "@/components/business/Toast";
import { formatDateTime } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/desktop/LanguageSelector";
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
  Database,
  Download,
  UploadCloud,
  HardDrive,
} from "lucide-react";
import { getCachedData, setCachedData } from "@/lib/cache";

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const { t, language } = useTranslation();

  const cachedAuth = getCachedData<any>("/api/auth/me");
  const cachedSettings = getCachedData<any>("/api/settings");

  const [currentUser, setCurrentUser] = useState<any>(() => cachedAuth?.user || null);
  const [activeTab, setActiveTab] = useState<
    "gym" | "general" | "hardware" | "accounts" | "backup" | "audit"
  >("gym");

  // Settings state
  const [settings, setSettings] = useState<any>(() => cachedSettings || {
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

  const tLabels = {
    gymInfoTitle: { fr: "Informations de l'établissement", en: "Gym & Facility Information", ar: "معلومات المنشأة الرياضية" },
    gymNameLabel: { fr: "Nom du club / salle *", en: "Gym / Club Name *", ar: "اسم النادي / القاعة *" },
    gymPhoneLabel: { fr: "Téléphone de contact", en: "Contact Phone", ar: "هاتف الاتصال" },
    gymEmailLabel: { fr: "Email de contact", en: "Contact Email", ar: "البريد الإلكتروني" },
    gymAddressLabel: { fr: "Adresse physique", en: "Physical Address", ar: "العنوان الفعلي" },
    receiptFooterLabel: {
      fr: "Message de bas de ticket thermique (pied de reçu)",
      en: "Thermal receipt footer message",
      ar: "رسالة أسفل وصل الدفع",
    },
    liveReceiptTitle: { fr: "Aperçu en direct du ticket (80 mm)", en: "Live Receipt Preview (80 mm)", ar: "معاينة مباشرة للوصل (80 مم)" },
    saveChangesBtn: { fr: "Enregistrer les modifications", en: "Save Changes", ar: "حفظ التعديلات" },
    regionalPrefsTitle: { fr: "Préférences régionales & comptables", en: "Regional & Accounting Preferences", ar: "التفضيلات الإقليمية والمحاسبية" },
    currencyLabel: { fr: "Devise", en: "Currency", ar: "العملة" },
    timezoneLabel: { fr: "Fuseau horaire de l'établissement", en: "Timezone", ar: "المنطقة الزمنية" },
    dateFormatLabel: { fr: "Format de date", en: "Date Format", ar: "صيغة التاريخ" },
    kioskConfigTitle: { fr: "Configuration des bornes d'accès", en: "Access Terminal Configuration", ar: "إعدادات نقاط العبور" },
    kioskIdLabel: { fr: "Identifiant de la borne locale", en: "Local Terminal ID", ar: "معرّف نقطة العبور المحلية" },
    kioskIdHelp: {
      fr: "Nom affiché dans le journal des passages et sur la borne (ex: BORNE-01)",
      en: "Name displayed in access logs and on kiosk (e.g. BORNE-01)",
      ar: "الاسم المعروض في سجل الدخول وعلى شاشة البوابة (مثال: BORNE-01)",
    },
    saveBtn: { fr: "Enregistrer", en: "Save", ar: "حفظ" },
    accountsSubtitle: {
      fr: "Gestion des utilisateurs et rôles (ADMIN, MANAGER, RECEPTIONIST, ACCESS_GUARD)",
      en: "User accounts & RBAC roles management",
      ar: "إدارة المستخدمين وصلاحيات الأدوار",
    },
    newOperatorBtn: { fr: "Nouvel opérateur", en: "New Operator", ar: "مستخدم جديد" },
    colFullName: { fr: "Nom complet", en: "Full Name", ar: "الاسم الكامل" },
    colUsername: { fr: "Identifiant", en: "Username", ar: "اسم المستخدم" },
    colRole: { fr: "Rôle", en: "Role", ar: "الدور" },
    colStatus: { fr: "Statut", en: "Status", ar: "الحالة" },
    colActions: { fr: "Actions", en: "Actions", ar: "إجراءات" },
    statusActive: { fr: "Actif", en: "Active", ar: "نشط" },
    statusDisabled: { fr: "Désactivé", en: "Disabled", ar: "معطل" },
    deleteUserTitle: { fr: "Supprimer l'opérateur", en: "Delete Operator Account", ar: "حذف حساب المستخدم" },
    deleteUserDesc: { fr: "Cette action est irréversible.", en: "This action is irreversible.", ar: "هذا الإجراء لا يمكن التراجع عنه." },
    deleteUserBody: (n: string) => ({
      fr: `Êtes-vous certain de vouloir supprimer le compte ${n} ? S'il a déjà enregistré des encaissements, la suppression sera rejetée et vous devrez désactiver son compte à la place.`,
      en: `Are you sure you want to delete account ${n}? If collections were already logged, deletion will be rejected and you should disable it instead.`,
      ar: `هل أنت متأكد من رغبتك في حذف حساب ${n}؟ إذا كانت هناك مبيعات مسجلة باسمه، فسيتم رفض الحذف ويمكنك تعطيل حسابه بدلاً من ذلك.`,
    }),
    cancelBtn: { fr: "Annuler", en: "Cancel", ar: "إلغاء" },
    deleteBtn: { fr: "Supprimer", en: "Delete", ar: "حذف" },
    backupCardTitle: { fr: "Sauvegarde & Sécurité des données", en: "Data Backup & Security", ar: "النسخ الاحتياطي وأمان البيانات" },
    backupCardSubtitle: {
      fr: "L'application PASSPro fonctionne sur une base de données embarquée SQLite avec journalisation WAL.",
      en: "PASSPro runs on an embedded SQLite database with WAL journaling.",
      ar: "يعمل تطبيق PASSPro على قاعدة بيانات SQLite مدمجة ومؤمنة بتقنية WAL.",
    },
    manualBackupTitle: { fr: "Sauvegarde manuelle 1-clic", en: "1-Click Manual Backup", ar: "نسخ احتياطي يدوي بنقرة واحدة" },
    manualBackupDesc: { fr: "Télécharge le fichier de base de données complet", en: "Downloads full database snapshot file", ar: "تنزيل ملف قاعدة البيانات كاملاً" },
    manualBackupDetail: {
      fr: "Cette action force la synchronisation de toutes les transactions et génère un fichier .db contenant l'intégralité des adhérents, photos, abonnements et encaissements.",
      en: "Forces a sync of all transactions and generates a .db file containing all members, photos, plans and payments.",
      ar: "يقوم هذا الإجراء بمزامنة جميع العمليات وتوليد ملف .db يحتوي على كافة المشتركين والصور والاشتراكات والمدفوعات.",
    },
    downloadBackupBtn: { fr: "Télécharger la sauvegarde (.db)", en: "Download Backup (.db)", ar: "تنزيل النسخة الاحتياطية (.db)" },
    restoreTitle: { fr: "Restauration d'une sauvegarde", en: "Database Restore", ar: "استعادة نسخة احتياطية" },
    restoreDesc: { fr: "Restaurer un fichier .db existant", en: "Restore an existing .db file", ar: "استعادة ملف .db موجود" },
    restoreDetail: {
      fr: "Attention : la restauration remplacera toutes les données actuelles par celles contenues dans le fichier de sauvegarde importé.",
      en: "Warning: restore will replace all existing data with data from imported file.",
      ar: "تحذير: ستؤدي الاستعادة إلى استبدال كافة البيانات الحالية بالبيانات الموجودة في الملف المستورد.",
    },
    restoreFileBtn: { fr: "Restaurer un fichier (.db)", en: "Restore file (.db)", ar: "استعادة ملف (.db)" },
    securityRecTitle: { fr: "Recommandation de sécurité pour la salle :", en: "Security recommendation for the gym:", ar: "توصية أمنية لإدارة النادي:" },
    securityRecDetail: {
      fr: "Effectuez un téléchargement de sauvegarde chaque fin de semaine et conservez une copie sur une clé USB ou un disque externe sécurisé.",
      en: "Perform a backup download at the end of each week and keep a copy on a USB flash drive or secure external disk.",
      ar: "قم بتنزيل نسخة احتياطية نهاية كل أسبوع واحتفظ بنسخة على قرص خارجي أو فلاشة USB آمنة.",
    },
    restoreModalTitle: { fr: "Confirmer la restauration de la base", en: "Confirm Database Restore", ar: "تأكيد استعادة قاعدة البيانات" },
    restoreModalDesc: { fr: "Cette opération remplacera immédiatement la base actuelle.", en: "This operation will immediately replace the active database.", ar: "ستؤدي هذه العملية إلى استبدال قاعدة البيانات النشطة فوراً." },
    restoreModalBody: (fName?: string) => ({
      fr: `Vous allez restaurer le fichier : ${fName || ""}. Toutes les données créées après cette sauvegarde seront écrasées. Êtes-vous certain de vouloir continuer ?`,
      en: `You are about to restore file: ${fName || ""}. All data created after this backup will be overwritten. Are you sure you want to proceed?`,
      ar: `أنت على وشك استعادة الملف: ${fName || ""}. سيتم الكتابة فوق جميع البيانات المنشأة بعد هذه النسخة. هل أنت متأكد من المتابعة؟`,
    }),
    confirmRestoreBtn: { fr: "Confirmer la restauration", en: "Confirm Restore", ar: "تأكيد الاستعادة" },
    auditColDateTime: { fr: "Date & Heure", en: "Date & Time", ar: "التاريخ والوقت" },
    auditColOperator: { fr: "Opérateur", en: "Operator", ar: "المستخدم" },
    auditColAction: { fr: "Action", en: "Action", ar: "الإجراء" },
    auditColEntity: { fr: "Entité", en: "Entity", ar: "العنصر" },
    auditColDetails: { fr: "Détail des modifications", en: "Change Details", ar: "تفاصيل التعديلات" },
    auditEmpty: { fr: "Aucune action d'audit enregistrée pour le moment.", en: "No audit action recorded yet.", ar: "لا توجد أي إجراءات رقابية مسجلة حتى الآن." },
    systemFallback: { fr: "Système", en: "System", ar: "النظام" },
    downloadToastTitle: { fr: "Téléchargement", en: "Download", ar: "تنزيل" },
    downloadToastDesc: { fr: "Export de la base de données SQLite...", en: "Exporting SQLite database...", ar: "جاري تصدير قاعدة بيانات SQLite..." },
    restoreFailTitle: { fr: "Échec de restauration", en: "Restore failed", ar: "فشلت الاستعادة" },
    accessDeniedTitle: { fr: "Accès refusé", en: "Access denied", ar: "تم رفض الوصول" },
    accessDeniedDesc: { fr: "Les réceptionnistes n'ont pas accès aux paramètres", en: "Receptionists do not have access to settings", ar: "موظفو الاستقبال لا يملكون صلاحية الوصول إلى الإعدادات" },
    errTitle: { fr: "Erreur", en: "Error", ar: "خطأ" },
    deleteRefused: { fr: "Suppression refusée", en: "Deletion refused", ar: "تم رفض الحذف" },
  };

  const handleDownloadBackup = () => {
    toast.info(tLabels.downloadToastTitle[language], tLabels.downloadToastDesc[language]);
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
      if (!res.ok) throw new Error(data.error?.message || (language === "ar" ? "خطأ في الاستعادة" : "Erreur lors de la restauration"));

      toast.success(
        language === "ar" ? "اكتملت الاستعادة" : language === "en" ? "Restore complete" : "Restauration terminée",
        data.message || (language === "ar" ? "تمت استعادة القاعدة بنجاح" : "Base restaurée")
      );
      setIsRestoreModalOpen(false);
      setRestoreFile(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error(tLabels.restoreFailTitle[language], err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const fetchSettings = () => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings(data);
          setCachedData("/api/settings", data);
        }
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
          toast.error(tLabels.accessDeniedTitle[language], tLabels.accessDeniedDesc[language]);
          router.replace("/");
          return;
        }
        setCurrentUser(d.user);
        setCachedData("/api/auth/me", d);
      })
      .catch(() => router.replace("/login"));
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
      if (!res.ok) throw new Error(data.error?.message || (language === "ar" ? "خطأ في الحفظ" : "Erreur de sauvegarde"));

      toast.success(
        language === "ar" ? "تم حفظ الإعدادات" : language === "en" ? "Settings saved" : "Paramètres enregistrés",
        language === "ar" ? "التعديلات نشطة على الوصل وشاشات البوابة" : language === "en" ? "Changes are live on receipts and terminals" : "Les modifications sont actives sur les reçus et bornes"
      );
      setSettings(data);
    } catch (err: any) {
      toast.error(tLabels.errTitle[language], err.message);
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
        toast.error(tLabels.deleteRefused[language], data.error?.message || tLabels.errTitle[language]);
      } else {
        toast.success(
          language === "ar" ? "تم حذف الحساب" : language === "en" ? "Account deleted" : "Compte supprimé",
          userToDelete.name
        );
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUserToDelete(null);
    }
  };

  const tabLabels: Record<string, { fr: string; en: string; ar: string }> = {
    gym: { fr: "Établissement & Reçus", en: "Gym & Receipts", ar: "المنشأة والإيصالات" },
    general: { fr: "Général & Langue", en: "General & Language", ar: "عام واللغة" },
    hardware: { fr: "Matériel & Bornes", en: "Hardware & Kiosks", ar: "الأجهزة ونقاط العبور" },
    accounts: { fr: "Comptes & Rôles", en: "Accounts & Roles", ar: "الحسابات والصلاحيات" },
    backup: { fr: "Sauvegarde & Données", en: "Backup & Data", ar: "النسخ الاحتياطي" },
    audit: { fr: "Journal d'audit", en: "Audit Log", ar: "سجل الرقابة" },
  };

  const allTabs = [
    { id: "gym", label: tabLabels.gym[language] || tabLabels.gym.fr, icon: Building2 },
    { id: "general", label: tabLabels.general[language] || tabLabels.general.fr, icon: Sliders },
    { id: "hardware", label: tabLabels.hardware[language] || tabLabels.hardware.fr, icon: Cpu },
    { id: "accounts", label: tabLabels.accounts[language] || tabLabels.accounts.fr, icon: Users },
    { id: "backup", label: tabLabels.backup[language] || tabLabels.backup.fr, icon: Database },
    { id: "audit", label: tabLabels.audit[language] || tabLabels.audit.fr, icon: ShieldCheck },
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

  if (currentUser?.role === "RECEPTIONIST") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-[14px] text-[#64748B] mt-0.5">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-[#E2E8F0] gap-8 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-[14px] font-medium transition-colors flex items-center gap-2 relative select-none cursor-pointer shrink-0 ${
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
              <Card title={tLabels.gymInfoTitle[language]}>
                <div className="space-y-4">
                  <Field
                    label={tLabels.gymNameLabel[language]}
                    value={settings.gymName}
                    onChange={(e) => setSettings({ ...settings, gymName: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label={tLabels.gymPhoneLabel[language]}
                      value={settings.gymPhone}
                      onChange={(e) => setSettings({ ...settings, gymPhone: e.target.value })}
                    />
                    <Field
                      label={tLabels.gymEmailLabel[language]}
                      type="email"
                      value={settings.gymEmail}
                      onChange={(e) => setSettings({ ...settings, gymEmail: e.target.value })}
                    />
                  </div>
                  <Field
                    label={tLabels.gymAddressLabel[language]}
                    value={settings.gymAddress}
                    onChange={(e) => setSettings({ ...settings, gymAddress: e.target.value })}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-[#475569]">
                      {tLabels.receiptFooterLabel[language]}
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
              <Card title={tLabels.liveReceiptTitle[language]}>
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
              {tLabels.saveChangesBtn[language]}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Général */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Card
            title={t("settings.language")}
            subtitle={t("settings.languageHelp")}
          >
            <div className="py-2">
              <LanguageSelector variant="pills" />
            </div>
          </Card>

          <Card title={tLabels.regionalPrefsTitle[language]}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label={tLabels.currencyLabel[language]}
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                help="Ex: DA, EUR, DZD"
                required
              />
              <Field
                label={tLabels.timezoneLabel[language]}
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                help="Ex: Africa/Algiers, Europe/Paris"
                required
              />
              <Field
                label={tLabels.dateFormatLabel[language]}
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
              {t("common.save")}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Matériel & Borne */}
      {activeTab === "hardware" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Card title={tLabels.kioskConfigTitle[language]}>
            <div className="space-y-5">
              <div className="max-w-md">
                <Field
                  label={tLabels.kioskIdLabel[language]}
                  value={settings.kioskName}
                  onChange={(e) => setSettings({ ...settings, kioskName: e.target.value })}
                  help={tLabels.kioskIdHelp[language]}
                  required
                />
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
              {tLabels.saveBtn[language]}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 4: Comptes opérateurs */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-[#64748B]">
              {tLabels.accountsSubtitle[language]}
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
              {tLabels.newOperatorBtn[language]}
            </Button>
          </div>

          <Card noPadding>
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">{tLabels.colFullName[language]}</th>
                  <th className="px-4">{tLabels.colUsername[language]}</th>
                  <th className="px-4">{tLabels.colRole[language]}</th>
                  <th className="px-4 text-center">{tLabels.colStatus[language]}</th>
                  <th className="px-5 text-right">{tLabels.colActions[language]}</th>
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
                        {u.active ? tLabels.statusActive[language] : tLabels.statusDisabled[language]}
                      </span>
                    </td>
                    <td className="px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsUserModalOpen(true);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#2563EB] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
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
            title={tLabels.deleteUserTitle[language]}
            description={tLabels.deleteUserDesc[language]}
            footer={
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setUserToDelete(null)}>
                  {tLabels.cancelBtn[language]}
                </Button>
                <Button variant="danger" onClick={handleDeleteUser}>
                  {tLabels.deleteBtn[language]}
                </Button>
              </div>
            }
          >
            <p className="text-[13px] text-[#475569]">
              {userToDelete && tLabels.deleteUserBody(userToDelete.name)[language]}
            </p>
          </Modal>
        </div>
      )}

      {/* Tab: Sauvegarde & Données */}
      {activeTab === "backup" && (
        <div className="space-y-5">
          <Card
            title={tLabels.backupCardTitle[language]}
            subtitle={tLabels.backupCardSubtitle[language]}
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
                        {tLabels.manualBackupTitle[language]}
                      </h4>
                      <p className="text-[12px] text-[#64748B]">
                        {tLabels.manualBackupDesc[language]}
                      </p>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#475569] mt-3">
                    {tLabels.manualBackupDetail[language]}
                  </p>
                </div>
                <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                  <Button
                    variant="primary"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleDownloadBackup}
                  >
                    {tLabels.downloadBackupBtn[language]}
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
                          {tLabels.restoreTitle[language]}
                        </h4>
                        <p className="text-[12px] text-[#64748B]">
                          {tLabels.restoreDesc[language]}
                        </p>
                      </div>
                    </div>
                    <p className="text-[13px] text-[#475569] mt-3">
                      {tLabels.restoreDetail[language]}
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
                      {tLabels.restoreFileBtn[language]}
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
                  {tLabels.securityRecTitle[language]}
                </strong>
                {tLabels.securityRecDetail[language]}
              </div>
            </div>
          </Card>

          {/* Restore Confirmation Modal */}
          <Modal
            isOpen={isRestoreModalOpen}
            onClose={() => setIsRestoreModalOpen(false)}
            title={tLabels.restoreModalTitle[language]}
            description={tLabels.restoreModalDesc[language]}
            size="sm"
            footer={
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setIsRestoreModalOpen(false)} disabled={isRestoring}>
                  {tLabels.cancelBtn[language]}
                </Button>
                <Button variant="danger" onClick={handleRestoreSubmit} isLoading={isRestoring}>
                  {tLabels.confirmRestoreBtn[language]}
                </Button>
              </div>
            }
          >
            <p className="text-[13px] text-[#475569]">
              {tLabels.restoreModalBody(restoreFile?.name)[language]}
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
                  <th className="px-5">{tLabels.auditColDateTime[language]}</th>
                  <th className="px-4">{tLabels.auditColOperator[language]}</th>
                  <th className="px-4">{tLabels.auditColAction[language]}</th>
                  <th className="px-4">{tLabels.auditColEntity[language]}</th>
                  <th className="px-5">{tLabels.auditColDetails[language]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#64748B]">
                      {tLabels.auditEmpty[language]}
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="h-12 hover:bg-[#F8FAFC]">
                      <td className="px-5 font-medium text-[#0F172A] nums">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 font-semibold text-[#0F172A]">
                        {log.user ? log.user.name : tLabels.systemFallback[language]}
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
