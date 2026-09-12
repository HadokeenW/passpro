"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/business/Card";
import { Button } from "@/components/business/Button";
import { StatusPill } from "@/components/business/StatusPill";
import { SubscriptionProgress } from "@/components/business/SubscriptionProgress";
import { BadgeRFID } from "@/components/business/BadgeRFID";
import { MemberModal } from "@/components/business/MemberModal";
import { PaymentModal } from "@/components/business/PaymentModal";
import { CardAssignModal } from "@/components/business/CardAssignModal";
import { ReceiptModal } from "@/components/business/ReceiptModal";
import { WebcamCaptureModal } from "@/components/business/WebcamCaptureModal";
import { Modal } from "@/components/business/Modal";
import { useToast } from "@/components/business/Toast";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";
import {
  CreditCard,
  RefreshCw,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Printer,
  Ban,
  ShieldCheck,
  ArrowLeft,
  Camera,
  AlertTriangle,
  Ticket,
  Clock,
} from "lucide-react";

interface MemberDossier {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    photoUrl?: string | null;
    notes: string | null;
    createdAt: string;
  };
  cards: any[];
  currentSubscription: any | null;
  recentAccessLogs: any[];
  recentPayments: any[];
  stats: {
    totalPassages: number;
    totalSpent: number;
  };
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { t, language } = useTranslation();

  const [dossier, setDossier] = useState<MemberDossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDebtSettlementModal, setIsDebtSettlementModal] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const tLabels = {
    loading: { fr: "Chargement du dossier adhérent...", en: "Loading member dossier...", ar: "جاري تحميل ملف المشترك..." },
    changePhotoTooltip: { fr: "Cliquer pour changer la photo", en: "Click to change photo", ar: "اضغط لتغيير الصورة" },
    dueNotice: { fr: "Reste à payer :", en: "Balance due:", ar: "المتبقي للدفع:" },
    phonePrefix: { fr: "Tél :", en: "Phone:", ar: "الهاتف:" },
    emailPrefix: { fr: "Email :", en: "Email:", ar: "البريد:" },
    registeredPrefix: { fr: "Inscrit le", en: "Registered on", ar: "مسجل بتاريخ" },
    photoBtn: { fr: "Photo", en: "Photo", ar: "صورة" },
    settleDebtBtn: (amt: string) => ({
      fr: `Régler la dette (${amt})`,
      en: `Settle debt (${amt})`,
      ar: `تسديد الدين (${amt})`,
    }),
    renewBtn: { fr: "Renouveler", en: "Renew", ar: "تجديد" },
    activeSubCardTitle: { fr: "Abonnement en cours", en: "Current Subscription", ar: "الاشتراك الحالي" },
    sessionsPlanBadge: { fr: "Formule par séances", en: "Session-based plan", ar: "اشتراك بالحصص" },
    timeSlotPlanBadge: { fr: "Formule heure exacte", en: "Time-slot plan", ar: "اشتراك فترة محددة" },
    planRate: { fr: "Tarif formule :", en: "Plan price:", ar: "سعر الاشتراك:" },
    daysSuffix: { fr: "jours", en: "days", ar: "أيام" },
    allowedHours: { fr: "Horaires autorisés :", en: "Allowed hours:", ar: "الأوقات المسموحة:" },
    toWord: { fr: "à", en: "to", ar: "إلى" },
    creditGrantedDue: { fr: "Crédit accordé — Reste à payer :", en: "Credit granted — Balance due:", ar: "تسهيل دفع — المبلغ المتبقي:" },
    totalSub: { fr: "Total souscription :", en: "Total subscription:", ar: "إجمالي الاشتراك:" },
    alreadyPaid: { fr: "Déjà réglé :", en: "Already paid:", ar: "المسدد مسبقاً:" },
    settleBalanceBtn: (amt: string) => ({
      fr: `Régler le solde (${amt})`,
      en: `Settle balance (${amt})`,
      ar: `تسديد الرصيد (${amt})`,
    }),
    availSessions: { fr: "Séances disponibles :", en: "Available sessions:", ar: "الحصص المتاحة:" },
    sessionsDeductNote: {
      fr: "Décompté automatiquement d'1 séance à chaque passage au contrôle d'accès.",
      en: "Automatically deducts 1 session on each access control scan.",
      ar: "يتم خصم حصة واحدة تلقائياً عند كل دخول عند البوابة.",
    },
    noActiveSub: {
      fr: "Cet adhérent ne possède aucun abonnement actif actuellement.",
      en: "This member currently has no active subscription.",
      ar: "لا يمتلك هذا المشترك أي اشتراك نشط حالياً.",
    },
    subscribePlanBtn: { fr: "Souscrire une formule", en: "Subscribe a plan", ar: "إصدار اشتراك" },
    lastPassagesTitle: { fr: "Derniers passages à la borne", en: "Recent terminal entries", ar: "آخر عمليات الدخول عند البوابة" },
    passagesCount: (c: number) => ({
      fr: `${c} passage(s) au total`,
      en: `${c} total passage(s)`,
      ar: `${c} إجمالي عمليات الدخول`,
    }),
    noPassages: {
      fr: "Aucun passage enregistré pour cet adhérent",
      en: "No entry recorded for this member",
      ar: "لا يوجد أي دخول مسجل لهذا المشترك",
    },
    colDateTime: { fr: "Date & Heure", en: "Date & Time", ar: "التاريخ والوقت" },
    colKiosk: { fr: "Borne", en: "Terminal", ar: "البوابة" },
    colReason: { fr: "Motif", en: "Reason", ar: "السبب" },
    colDecision: { fr: "Décision", en: "Decision", ar: "القرار" },
    paymentsHistoryTitle: { fr: "Historique des règlements", en: "Payment history", ar: "سجل المدفوعات" },
    totalSpentPrefix: { fr: "Total réglé :", en: "Total paid:", ar: "إجمالي المسدد:" },
    noPayments: { fr: "Aucun règlement enregistré", en: "No payments recorded", ar: "لا توجد مدفوعات مسجلة" },
    colReceiptNo: { fr: "N° Reçu", en: "Receipt #", ar: "رقم الوصل" },
    colDate: { fr: "Date", en: "Date", ar: "التاريخ" },
    colPlan: { fr: "Formule", en: "Plan", ar: "الاشتراك" },
    colAmount: { fr: "Montant", en: "Amount", ar: "المبلغ" },
    colReceipt: { fr: "Reçu", en: "Receipt", ar: "الوصل" },
    reprintTooltip: { fr: "Voir / Réimprimer le reçu", en: "View / Reprint receipt", ar: "عرض / إعادة طباعة الوصل" },
    rfidCardCardTitle: { fr: "Badge RFID associé", en: "Associated RFID Badge", ar: "بطاقة RFID المرتبطة" },
    replaceCardBtn: { fr: "Remplacer le badge", en: "Replace card", ar: "استبدال البطاقة" },
    unblockCardBtn: { fr: "Débloquer le badge", en: "Unblock card", ar: "إلغاء حظر البطاقة" },
    blockCardBtn: { fr: "Bloquer le badge", en: "Block card", ar: "حظر البطاقة" },
    noCardAssigned: {
      fr: "Aucun badge RFID n'est actuellement assigné à cet adhérent.",
      en: "No RFID badge is currently assigned to this member.",
      ar: "لا توجد بطاقة RFID معينة لهذا المشترك حالياً.",
    },
    assignCardBtn: { fr: "Attribuer un badge", en: "Assign badge", ar: "تعيين بطاقة" },
    notesCardTitle: { fr: "Notes internes", en: "Internal notes", ar: "ملاحظات داخلية" },
    notesPlaceholder: {
      fr: "Saisissez des notes sur l'adhérent (sauvegarde automatique au clic hors du champ)...",
      en: "Enter notes about member (auto-saves on blur)...",
      ar: "أدخل ملاحظات حول المشترك (حفظ تلقائي عند النقر خارج الحقل)...",
    },
    notesConfidentialNote: {
      fr: "Ces notes sont strictement confidentielles et ne figurent jamais sur les reçus.",
      en: "These notes are strictly confidential and never appear on receipts.",
      ar: "هذه الملاحظات سرية للغاية ولا تظهر أبداً على الإيصالات.",
    },
    dangerTitle: { fr: "Suppression du dossier", en: "Dossier archiving", ar: "أرشفة الملف" },
    dangerDesc: {
      fr: "L'adhérent sera désactivé des listes. Tous les reçus et logs d'accès restent conservés pour l'audit.",
      en: "Member will be deactivated from lists. All receipts and access logs are preserved for audit.",
      ar: "سيتم إلغاء تفعيل المشترك من القوائم. يتم الاحتفاظ بجميع الإيصالات وسجلات الدخول لأغراض الرقابة.",
    },
    archiveMemberBtn: { fr: "Archiver l'adhérent", en: "Archive member", ar: "أرشفة المشترك" },
    deleteModalTitle: { fr: "Confirmer l'archivage", en: "Confirm archiving", ar: "تأكيد الأرشفة" },
    deleteModalDesc: {
      fr: "Cette action désactivera l'adhérent du club.",
      en: "This action will deactivate the member from the club.",
      ar: "سيؤدي هذا الإجراء إلى إلغاء تفعيل المشترك في النادي.",
    },
    deleteModalBody: (n: string) => ({
      fr: `Êtes-vous certain de vouloir archiver le dossier de ${n} ? Son badge ne sera plus reconnu au contrôle d'accès.`,
      en: `Are you sure you want to archive the dossier of ${n}? Their card will no longer be recognized at access control.`,
      ar: `هل أنت متأكد من رغبتك في أرشفة ملف ${n}؟ لن يتم التعرف على بطاقته عند نقطة الدخول.`,
    }),
    cancelBtn: { fr: "Annuler", en: "Cancel", ar: "إلغاء" },
    errorTitle: { fr: "Erreur", en: "Error", ar: "خطأ" },
    archiveErrorTitle: { fr: "Erreur d'archivage", en: "Archiving error", ar: "خطأ في الأرشفة" },
    archiveErrorDesc: {
      fr: "Impossible d'archiver cet adhérent",
      en: "Unable to archive this member",
      ar: "تعذر أرشفة هذا العضو",
    },
    networkErrorTitle: { fr: "Erreur réseau", en: "Network error", ar: "خطأ في الشبكة" },
    networkErrorDesc: {
      fr: "Impossible de contacter le serveur",
      en: "Unable to reach server",
      ar: "تعذر الاتصال بالخادم",
    },
    photoErrorDesc: {
      fr: "Impossible d'enregistrer la photo",
      en: "Unable to save photo",
      ar: "تعذر حفظ الصورة الشخصية",
    },
  };

  const translateReason = (reason: string) => {
    const map: Record<string, { fr: string; en: string; ar: string }> = {
      CARD_NOT_FOUND: { fr: "Badge non reconnu", en: "Card not recognized", ar: "بطاقة غير معروفة" },
      CARD_BLOCKED: { fr: "Badge bloqué", en: "Card blocked", ar: "بطاقة محظورة" },
      CARD_UNASSIGNED: { fr: "Badge non assigné", en: "Card unassigned", ar: "بطاقة غير مخصصة" },
      NO_ACTIVE_SUBSCRIPTION: { fr: "Aucun abonnement actif", en: "No active subscription", ar: "لا يوجد اشتراك نشط" },
      SUBSCRIPTION_EXPIRED: { fr: "Abonnement expiré", en: "Subscription expired", ar: "اشتراك منتهي الصلاحية" },
      SUBSCRIPTION_SUSPENDED: { fr: "Abonnement suspendu", en: "Subscription suspended", ar: "اشتراك موقوف مؤقتاً" },
      SESSIONS_EXHAUSTED: { fr: "Séances épuisées (0 restante)", en: "Sessions exhausted (0 remaining)", ar: "استنفدت الحصص (0 متبقية)" },
      OUTSIDE_TIME_WINDOW: { fr: "Hors créneau horaire autorisé", en: "Outside permitted time slot", ar: "خارج الفترة الزمنية المسموح بها" },
      ANTI_PASSBACK: { fr: "Anti-passback : badge déjà utilisé", en: "Anti-passback: card already used", ar: "منع تمرير البطاقة: استخدمت مؤخراً" },
      OK: { fr: "Accès autorisé", en: "Access granted", ar: "تم السماح بالدخول" },
      "Badge non reconnu": { fr: "Badge non reconnu", en: "Card not recognized", ar: "بطاقة غير معروفة" },
      "Badge bloqué": { fr: "Badge bloqué", en: "Card blocked", ar: "بطاقة محظورة" },
      "Badge non assigné": { fr: "Badge non assigné", en: "Card unassigned", ar: "بطاقة غير مخصصة" },
      "Aucun abonnement actif": { fr: "Aucun abonnement actif", en: "No active subscription", ar: "لا يوجد اشتراك نشط" },
      "Abonnement expiré": { fr: "Abonnement expiré", en: "Subscription expired", ar: "اشتراك منتهي الصلاحية" },
      "Abonnement suspendu": { fr: "Abonnement suspendu", en: "Subscription suspended", ar: "اشتراك موقوف مؤقتاً" },
      "Séances épuisées (0 restante)": { fr: "Séances épuisées (0 restante)", en: "Sessions exhausted (0 remaining)", ar: "استنفدت الحصص (0 متبقية)" },
      "Hors créneau horaire autorisé": { fr: "Hors créneau horaire autorisé", en: "Outside permitted time slot", ar: "خارج الفترة الزمنية المسموح بها" },
      "Accès autorisé": { fr: "Accès autorisé", en: "Access granted", ar: "تم السماح بالدخول" },
    };
    return map[reason]?.[language] || reason;
  };

  const fetchDossier = () => {
    setIsLoading(true);
    fetch(`/api/members/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          toast.error(tLabels.errorTitle[language], data.error.message);
          router.push("/members");
        } else {
          setDossier(data);
          setInternalNotes(data.member.notes || "");
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDossier();
  }, [id]);

  const handleNotesBlur = async () => {
    if (!dossier || internalNotes === (dossier.member.notes || "")) return;
    try {
      await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: internalNotes }),
      });
      invalidateCache(["/api/members", "/api/dashboard"]);
      toast.success(
        language === "ar" ? "تم حفظ الملاحظات" : language === "en" ? "Notes saved" : "Notes sauvegardées",
        language === "ar" ? "تم تسجيل التعديلات" : language === "en" ? "Changes recorded" : "Les modifications sont enregistrées"
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCardBlock = async (cardUid: string, currentStatus: string) => {
    const action = currentStatus === "BLOCKED" ? "UNBLOCK" : "BLOCK";
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(cardUid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        invalidateCache(["/api/cards", "/api/members", "/api/dashboard"]);
        toast.success(
          action === "BLOCK"
            ? language === "ar" ? "تم حظر البطاقة" : language === "en" ? "Card blocked" : "Badge bloqué"
            : language === "ar" ? "تم إلغاء حظر البطاقة" : language === "en" ? "Card unblocked" : "Badge débloqué",
          cardUid
        );
        fetchDossier();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubscriptionSuspend = async (subId: string, isSuspended: boolean) => {
    const action = isSuspended ? "reactivate" : "suspend";
    try {
      const res = await fetch(`/api/subscriptions/${subId}/${action}`, {
        method: "POST",
      });
      if (res.ok) {
        invalidateCache(["/api/subscriptions", "/api/members", "/api/dashboard"]);
        toast.success(
          isSuspended
            ? language === "ar" ? "تمت إعادة تفعيل الاشتراك" : language === "en" ? "Subscription reactivated" : "Abonnement réactivé"
            : language === "ar" ? "تم إيقاف الاشتراك مؤقتاً" : language === "en" ? "Subscription suspended" : "Abonnement suspendu",
          dossier ? `${dossier.member.firstName} ${dossier.member.lastName}` : ""
        );
        fetchDossier();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async () => {
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        invalidateCache(["/api/members", "/api/dashboard", "/api/subscriptions", "/api/cards"]);
        toast.success(
          language === "ar" ? "تمت أرشفة المشترك" : language === "en" ? "Member archived" : "Adhérent archivé",
          dossier ? `${dossier.member.firstName} ${dossier.member.lastName}` : ""
        );
        setIsDeleteModalOpen(false);
        router.push("/members");
      } else {
        const d = await res.json();
        toast.error(tLabels.archiveErrorTitle[language], d.error?.message || tLabels.archiveErrorDesc[language]);
      }
    } catch (err) {
      console.error(err);
      toast.error(tLabels.networkErrorTitle[language], tLabels.networkErrorDesc[language]);
    }
  };

  const handleSavePhoto = async (photoUrl: string) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      });
      if (res.ok) {
        invalidateCache(["/api/members", "/api/dashboard"]);
        toast.success(
          language === "ar" ? "تم تحديث الصورة" : language === "en" ? "Photo updated" : "Photo mise à jour",
          language === "ar" ? "تم تسجيل الصورة الشخصية بنجاح" : language === "en" ? "ID photo saved" : "La photo d'identité est enregistrée"
        );
        fetchDossier();
      } else {
        const d = await res.json();
        toast.error(tLabels.errorTitle[language], d.error?.message || tLabels.photoErrorDesc[language]);
      }
    } catch (err) {
      console.error(err);
      toast.error(tLabels.networkErrorTitle[language], tLabels.networkErrorDesc[language]);
    }
  };

  const handleReprint = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/reprint`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReceiptData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !dossier) {
    return (
      <div className="h-96 flex items-center justify-center text-[#64748B] text-[14px]">
        {tLabels.loading[language]}
      </div>
    );
  }

  const { member, cards, currentSubscription, recentAccessLogs, recentPayments, stats } = dossier;
  const activeCard = cards.find((c) => c.status === "ACTIVE");
  const currentCard = activeCard || cards[0] || null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.push("/members")}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t("common.back")} · {t("members.title")}</span>
        </button>
      </div>

      {/* 1. Header Card (Full width, 96px content) */}
      <Card noPadding>
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Photo / Initials Avatar with click to capture */}
            <div
              onClick={() => setIsPhotoModalOpen(true)}
              className="relative group cursor-pointer shrink-0"
              title={tLabels.changePhotoTooltip[language]}
            >
              {member.photoUrl ? (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#2563EB] shadow-sm bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.photoUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-[20px] flex items-center justify-center border border-[#BFDBFE]">
                  {member.firstName[0]}
                  {member.lastName[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-[24px] font-bold text-[#0F172A] tracking-tight">
                  {member.firstName} {member.lastName}
                </h2>
                <StatusPill
                  status={
                    currentCard?.status === "BLOCKED"
                      ? "BLOCKED"
                      : currentSubscription?.status || "NO_SUBSCRIPTION"
                  }
                />
                {currentSubscription?.balanceDue > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] nums inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{tLabels.dueNotice[language]} {formatMoney(currentSubscription.balanceDue)}</span>
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#64748B] mt-1">
                {tLabels.phonePrefix[language]} <span className="font-medium text-[#0F172A]">{member.phone || "—"}</span> · {tLabels.emailPrefix[language]}{" "}
                <span className="font-medium text-[#0F172A]">{member.email || "—"}</span> · {tLabels.registeredPrefix[language]}{" "}
                {formatDate(member.createdAt)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Camera className="w-3.5 h-3.5" />}
              onClick={() => setIsPhotoModalOpen(true)}
            >
              {tLabels.photoBtn[language]}
            </Button>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              {t("common.edit")}
            </Button>

            {currentSubscription?.balanceDue > 0 && (
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setIsDebtSettlementModal(true);
                  setIsPaymentModalOpen(true);
                }}
              >
                {tLabels.settleDebtBtn(formatMoney(currentSubscription.balanceDue))[language]}
              </Button>
            )}

            {currentSubscription && (
              <Button
                variant={currentSubscription.storedStatus === "SUSPENDED" ? "secondary" : "danger-soft"}
                size="md"
                leftIcon={
                  currentSubscription.storedStatus === "SUSPENDED" ? (
                    <PlayCircle className="w-4 h-4" />
                  ) : (
                    <PauseCircle className="w-4 h-4" />
                  )
                }
                onClick={() =>
                  handleToggleSubscriptionSuspend(
                    currentSubscription.id,
                    currentSubscription.storedStatus === "SUSPENDED"
                  )
                }
              >
                {currentSubscription.storedStatus === "SUSPENDED" ? t("subscriptions.actions.reactivate") : t("subscriptions.actions.suspend")}
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                setIsDebtSettlementModal(false);
                setIsPaymentModalOpen(true);
              }}
            >
              {tLabels.renewBtn[language]}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Body: 2 Columns (2fr / 1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2fr) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Abonnement en cours */}
          <Card title={tLabels.activeSubCardTitle[language]}>
            {currentSubscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[20px] font-bold text-[#0F172A]">
                        {currentSubscription.planName}
                      </h3>
                      {currentSubscription.planType === "SESSIONS" && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] inline-flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 shrink-0" />
                          <span>{tLabels.sessionsPlanBadge[language]}</span>
                        </span>
                      )}
                      {currentSubscription.planType === "TIME_SLOT" && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{tLabels.timeSlotPlanBadge[language]}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] text-[#64748B] mt-0.5">
                      {tLabels.planRate[language]} {formatMoney(currentSubscription.price || currentSubscription.planPrice)} · {currentSubscription.durationDays} {tLabels.daysSuffix[language]}
                      {currentSubscription.planType === "TIME_SLOT" && currentSubscription.startTime && currentSubscription.endTime && (
                        <span> · {tLabels.allowedHours[language]} <strong className="text-[#0F172A]">{currentSubscription.startTime} {tLabels.toWord[language]} {currentSubscription.endTime}</strong></span>
                      )}
                    </div>
                  </div>
                  <StatusPill status={currentSubscription.status} />
                </div>

                {/* Debt Callout */}
                {currentSubscription.balanceDue > 0 && (
                  <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
                      <div>
                        <div className="text-[13px] font-bold text-[#991B1B]">
                          {tLabels.creditGrantedDue[language]} {formatMoney(currentSubscription.balanceDue)}
                        </div>
                        <div className="text-[11px] text-[#B91C1C]">
                          {tLabels.totalSub[language]} {formatMoney(currentSubscription.price || currentSubscription.planPrice)} · {tLabels.alreadyPaid[language]} {formatMoney(currentSubscription.paidAmount || 0)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setIsDebtSettlementModal(true);
                        setIsPaymentModalOpen(true);
                      }}
                    >
                      {tLabels.settleBalanceBtn(formatMoney(currentSubscription.balanceDue))[language]}
                    </Button>
                  </div>
                )}

                {/* Sessions Counter if SESSIONS plan */}
                {currentSubscription.planType === "SESSIONS" && (
                  <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[8px]">
                    <div className="flex justify-between items-center text-[13px] mb-1.5 font-semibold text-[#1E40AF]">
                      <span>{tLabels.availSessions[language]}</span>
                      <span className="nums text-[15px] font-bold">
                        {currentSubscription.remainingSessions ?? 0} / {currentSubscription.totalSessions ?? 10}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#DBEAFE] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB] transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              ((currentSubscription.remainingSessions ?? 0) /
                                (currentSubscription.totalSessions || 10)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#3B82F6] mt-1.5">
                      {tLabels.sessionsDeductNote[language]}
                    </p>
                  </div>
                )}

                <SubscriptionProgress
                  startDate={currentSubscription.startDate}
                  endDate={currentSubscription.endDate}
                  daysRemaining={currentSubscription.daysRemaining}
                />
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[13px] text-[#64748B]">
                  {tLabels.noActiveSub[language]}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  {tLabels.subscribePlanBtn[language]}
                </Button>
              </div>
            )}
          </Card>

          {/* Card: Derniers passages */}
          <Card
            title={tLabels.lastPassagesTitle[language]}
            subtitle={tLabels.passagesCount(stats.totalPassages)[language]}
            noPadding
          >
            {recentAccessLogs.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] text-[13px]">
                {tLabels.noPassages[language]}
              </div>
            ) : (
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="h-9 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B]">
                    <th className="px-5">{tLabels.colDateTime[language]}</th>
                    <th className="px-4">{tLabels.colKiosk[language]}</th>
                    <th className="px-4">{tLabels.colReason[language]}</th>
                    <th className="px-5 text-right">{tLabels.colDecision[language]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {recentAccessLogs.map((log) => (
                    <tr key={log.id} className="h-10 hover:bg-[#F8FAFC]">
                      <td className="px-5 font-medium text-[#0F172A] nums">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 text-[#64748B]">{log.kioskName}</td>
                      <td className="px-4 text-[#64748B]">{translateReason(log.reason)}</td>
                      <td className="px-5 text-right">
                        <StatusPill status={log.decision} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Card: Règlements & Reçus */}
          <Card
            title={tLabels.paymentsHistoryTitle[language]}
            subtitle={`${tLabels.totalSpentPrefix[language]} ${formatMoney(stats.totalSpent)}`}
            noPadding
          >
            {recentPayments.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] text-[13px]">
                {tLabels.noPayments[language]}
              </div>
            ) : (
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="h-9 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B]">
                    <th className="px-5">{tLabels.colReceiptNo[language]}</th>
                    <th className="px-4">{tLabels.colDate[language]}</th>
                    <th className="px-4">{tLabels.colPlan[language]}</th>
                    <th className="px-4 text-right">{tLabels.colAmount[language]}</th>
                    <th className="px-5 text-right">{tLabels.colReceipt[language]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="h-11 hover:bg-[#F8FAFC]">
                      <td className="px-5 font-mono-code font-semibold text-[#0F172A]">
                        {p.receiptNumber}
                      </td>
                      <td className="px-4 text-[#64748B]">{formatDate(p.createdAt)}</td>
                      <td className="px-4 font-medium text-[#0F172A]">{p.planName}</td>
                      <td className="px-4 text-right font-bold nums">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="px-5 text-right">
                        <button
                          onClick={() => handleReprint(p.id)}
                          title={tLabels.reprintTooltip[language]}
                          className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-[#EFF6FF] text-[#2563EB] transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Side Column (1fr) */}
        <div className="space-y-6">
          {/* Card: Badge RFID Virtuel */}
          <Card title={tLabels.rfidCardCardTitle[language]}>
            <div className="flex flex-col items-center">
              {currentCard ? (
                <>
                  <BadgeRFID
                    memberName={`${member.firstName} ${member.lastName}`}
                    uid={currentCard.uid}
                    status={currentCard.status}
                  />

                  {/* Card Controls */}
                  <div className="w-full space-y-2 mt-5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      leftIcon={<CreditCard className="w-4 h-4" />}
                      onClick={() => setIsCardModalOpen(true)}
                    >
                      {tLabels.replaceCardBtn[language]}
                    </Button>

                    <Button
                      variant={currentCard.status === "BLOCKED" ? "secondary" : "danger-soft"}
                      size="sm"
                      className="w-full"
                      leftIcon={currentCard.status === "BLOCKED" ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      onClick={() => handleToggleCardBlock(currentCard.uid, currentCard.status)}
                    >
                      {currentCard.status === "BLOCKED" ? tLabels.unblockCardBtn[language] : tLabels.blockCardBtn[language]}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 w-full">
                  <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <p className="text-[13px] text-[#64748B] mb-4">
                    {tLabels.noCardAssigned[language]}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsCardModalOpen(true)}
                  >
                    {tLabels.assignCardBtn[language]}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Card: Notes internes */}
          <Card title={tLabels.notesCardTitle[language]}>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder={tLabels.notesPlaceholder[language]}
              rows={4}
              className="w-full p-3 text-[13px] bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-[6px] focus:border-[#2563EB] focus:bg-white transition-colors"
            />
            <p className="text-[11px] text-[#94A3B8] mt-1.5">
              {tLabels.notesConfidentialNote[language]}
            </p>
          </Card>

          {/* Danger Zone: Soft delete */}
          <div className="p-5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2]/50">
            <h4 className="text-[13px] font-semibold text-[#DC2626] mb-1">
              {tLabels.dangerTitle[language]}
            </h4>
            <p className="text-[12px] text-[#64748B] mb-3">
              {tLabels.dangerDesc[language]}
            </p>
            <Button
              variant="danger-soft"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              {tLabels.archiveMemberBtn[language]}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      <MemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchDossier}
        initialMember={member}
      />

      {/* Payment & Renewal Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setIsDebtSettlementModal(false);
        }}
        preselectedMember={{
          ...member,
          currentSubscription,
        }}
        initialDebtSettlement={isDebtSettlementModal}
        onPaymentSuccess={(payId) => {
          fetchDossier();
          fetch(`/api/payments/${payId}`)
            .then((r) => r.json())
            .then((d) => setReceiptData(d));
        }}
      />

      {/* Card Assignment Modal */}
      <CardAssignModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        memberId={member.id}
        memberName={`${member.firstName} ${member.lastName}`}
        currentCardUid={currentCard?.uid}
        onSuccess={fetchDossier}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        receiptData={receiptData}
      />

      {/* Webcam Photo Modal */}
      <WebcamCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        memberName={`${member.firstName} ${member.lastName}`}
        onSuccess={handleSavePhoto}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={tLabels.deleteModalTitle[language]}
        description={tLabels.deleteModalDesc[language]}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              {tLabels.cancelBtn[language]}
            </Button>
            <Button variant="danger" onClick={handleDeleteMember}>
              {tLabels.deleteModalTitle[language]}
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[#475569]">
          {tLabels.deleteModalBody(`${member.firstName} ${member.lastName}`)[language]}
        </p>
      </Modal>
    </div>
  );
}
