"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "./Field";
import { useToast } from "./Toast";
import { invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

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
  const { language } = useTranslation();
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

  const tLabels = {
    titleEdit: { fr: "Modifier la formule", en: "Edit Membership Plan", ar: "تعديل نوع الاشتراك" },
    titleCreate: { fr: "Nouvelle formule tarifaire", en: "New Pricing Plan", ar: "نوع اشتراك تسعيري جديد" },
    desc: {
      fr: "Configurez le type d'abonnement, les tarifs, la durée et les restrictions d'accès",
      en: "Configure subscription type, pricing, duration, and access restrictions",
      ar: "تهيئة نوع الاشتراك والأسعار والمدة وشروط الدخول",
    },
    cancel: { fr: "Annuler", en: "Cancel", ar: "إلغاء" },
    save: { fr: "Enregistrer", en: "Save", ar: "حفظ" },
    createBtn: { fr: "Créer la formule", en: "Create Plan", ar: "إنشاء الاشتراك" },
    planTypeLabel: { fr: "Type d'abonnement *", en: "Subscription Type *", ar: "نوع الاشتراك *" },
    types: {
      TEMPORAL: {
        label: { fr: "Temporel", en: "Time-based", ar: "زمني" },
        desc: { fr: "1 mois, 3 mois, etc.", en: "1 month, 3 months, etc.", ar: "شهر، 3 أشهر، إلخ" },
      },
      SESSIONS: {
        label: { fr: "Par séances", en: "By Sessions", ar: "بالحصص" },
        desc: { fr: "Carnet décompté au scan", en: "Counted down at scan", ar: "تُخصم الحصص عند الدخول" },
      },
      TIME_SLOT: {
        label: { fr: "Heure exacte", en: "Time Slot", ar: "فترة محددة" },
        desc: { fr: "Créneau (ex: 13h - 16h)", en: "Slot (e.g. 13:00 - 16:00)", ar: "ساعات محددة (مثلاً 13:00 - 16:00)" },
      },
    },
    planNameLabel: { fr: "Nom commercial de la formule *", en: "Commercial Plan Name *", ar: "الاسم التجاري للاشتراك *" },
    sessionConfig: { fr: "Paramétrage des séances", en: "Session Configuration", ar: "إعدادات الحصص" },
    sessionCountLabel: { fr: "Nombre de séances incluses *", en: "Included Sessions Count *", ar: "عدد الحصص المضمنة *" },
    sessionChips: (s: string) => ({
      fr: `${s} séances`,
      en: `${s} sessions`,
      ar: `${s} حصص`,
    }),
    sessionHelp: {
      fr: "Le système décrémentera automatiquement 1 séance à chaque passage validé à la borne.",
      en: "The system will automatically deduct 1 session at each validated terminal passage.",
      ar: "يقوم النظام تلقائياً بخصم حصة واحدة عند كل مرور مؤكد عند البوابة.",
    },
    timeSlotConfig: {
      fr: "Créneau d'accès restreint (Heure exacte)",
      en: "Restricted Access Time Slot",
      ar: "فترة الدخول المسموح بها (ساعات محددة)",
    },
    startTime: { fr: "Heure de début (accès dès) *", en: "Start Time (access from) *", ar: "وقت البداية (الدخول من) *" },
    endTime: { fr: "Heure de fin (accès jusqu'à) *", en: "End Time (access until) *", ar: "وقت النهاية (الدخول إلى) *" },
    presetSlots: { fr: "Créneaux types :", en: "Typical slots:", ar: "الفترات الشائعة:" },
    slotOffPeak: { fr: "13h - 16h (Heures creuses)", en: "13:00 - 16:00 (Off-peak)", ar: "13:00 - 16:00 (أوقات هادئة)" },
    slotMorning: { fr: "07h - 12h (Matinée)", en: "07:00 - 12:00 (Morning)", ar: "07:00 - 12:00 (صباحية)" },
    slotLunch: { fr: "12h - 14h (Pause midi)", en: "12:00 - 14:00 (Lunch break)", ar: "12:00 - 14:00 (فترة الغداء)" },
    timeSlotHelp: {
      fr: "En dehors de ces heures, le passage à la borne sera automatiquement refusé (motif : Hors créneau horaire).",
      en: "Outside of these hours, terminal entry will be automatically refused (reason: Outside time window).",
      ar: "خارج هذه الأوقات، سيتم رفض الدخول عند البوابة تلقائياً (السبب: خارج الفترة المسموح بها).",
    },
    priceLabel: { fr: "Tarif de vente (DA) *", en: "Sale Price (DZD) *", ar: "سعر البيع (دج) *" },
    maxValidityLabel: { fr: "Validité max (jours) *", en: "Max Validity (days) *", ar: "أقصى صلاحية (أيام) *" },
    durationValidityLabel: { fr: "Durée de validité (jours) *", en: "Validity Duration (days) *", ar: "مدة الصلاحية (أيام) *" },
    descLabel: { fr: "Description / Notes commerciales", en: "Description / Sales Notes", ar: "الوصف / ملاحظات تجارية" },
    descPlaceholder: {
      fr: "Accès musculation, cours collectifs, vestiaire...",
      en: "Gym floor access, group classes, locker room...",
      ar: "قاعة كمال الأجسام، حصص جماعية، غرف تبديل الملابس...",
    },
    sortOrderLabel: { fr: "Ordre d'affichage", en: "Display Order", ar: "ترتيب العرض" },
    sortOrderHelp: {
      fr: "Les formules sont triées par ordre croissant dans la caisse",
      en: "Plans are sorted in ascending order in the checkout register",
      ar: "تُرتب الاشتراكات تصاعدياً في واجهة الصندوق",
    },
    errRequired: { fr: "Le nom, le tarif et la durée sont requis", en: "Name, price and duration are required", ar: "الاسم والسعر والمدة حقول إلزامية" },
    errInvalidSessions: { fr: "Veuillez indiquer un nombre de séances valide", en: "Please indicate a valid number of sessions", ar: "يرجى إدخال عدد حصص صحيح" },
    errInvalidSlot: {
      fr: "Veuillez indiquer une plage horaire valide (heure début < heure fin)",
      en: "Please provide a valid time window (start time < end time)",
      ar: "يرجى إدخال فترة زمنية صحيحة (وقت البداية < وقت النهاية)",
    },
    toastSuccessEdit: { fr: "Formule mise à jour", en: "Plan updated", ar: "تم تحديث الاشتراك" },
    toastSuccessCreate: { fr: "Formule créée", en: "Plan created", ar: "تم إنشاء الاشتراك" },
    toastDesc: (n: string) => ({
      fr: `La formule ${n} a été enregistrée`,
      en: `Plan ${n} has been saved`,
      ar: `تم حفظ نوع الاشتراك ${n}`,
    }),
  };

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
      setError(tLabels.errRequired[language]);
      return;
    }

    if (planType === "SESSIONS" && (!sessionCount || parseInt(sessionCount, 10) <= 0)) {
      setError(tLabels.errInvalidSessions[language]);
      return;
    }

    if (planType === "TIME_SLOT" && (!startTime || !endTime || startTime >= endTime)) {
      setError(tLabels.errInvalidSlot[language]);
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
        initialPlan ? tLabels.toastSuccessEdit[language] : tLabels.toastSuccessCreate[language],
        tLabels.toastDesc(name)[language]
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
      title={initialPlan ? tLabels.titleEdit[language] : tLabels.titleCreate[language]}
      description={tLabels.desc[language]}
      size="md"
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
            {initialPlan ? tLabels.save[language] : tLabels.createBtn[language]}
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
            {tLabels.planTypeLabel[language]}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                id: "TEMPORAL",
                label: tLabels.types.TEMPORAL.label[language],
                desc: tLabels.types.TEMPORAL.desc[language],
                icon: "⏱️",
              },
              {
                id: "SESSIONS",
                label: tLabels.types.SESSIONS.label[language],
                desc: tLabels.types.SESSIONS.desc[language],
                icon: "🎟️",
              },
              {
                id: "TIME_SLOT",
                label: tLabels.types.TIME_SLOT.label[language],
                desc: tLabels.types.TIME_SLOT.desc[language],
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
          label={tLabels.planNameLabel[language]}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            planType === "SESSIONS"
              ? "Ex: 10 Sessions / 10 حصص"
              : planType === "TIME_SLOT"
              ? "Ex: Heures Creuses (13h-16h)"
              : "Ex: Mensuel Standard / اشتراك شهري"
          }
          required
        />

        {/* Specific Type Options */}
        {planType === "SESSIONS" && (
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-2.5">
            <div className="text-[12px] font-semibold text-[#0F172A] flex items-center gap-1.5">
              <span>🎟️</span>
              <span>{tLabels.sessionConfig[language]}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Field
                  label={tLabels.sessionCountLabel[language]}
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
                    {tLabels.sessionChips(s)[language]}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#64748B]">
              {tLabels.sessionHelp[language]}
            </p>
          </div>
        )}

        {planType === "TIME_SLOT" && (
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] space-y-2.5">
            <div className="text-[12px] font-semibold text-[#0F172A] flex items-center gap-1.5">
              <span>🕒</span>
              <span>{tLabels.timeSlotConfig[language]}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={tLabels.startTime[language]}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Field
                label={tLabels.endTime[language]}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
            {/* Quick presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#64748B]">{tLabels.presetSlots[language]}</span>
              {[
                { label: tLabels.slotOffPeak[language], s: "13:00", e: "16:00" },
                { label: tLabels.slotMorning[language], s: "07:00", e: "12:00" },
                { label: tLabels.slotLunch[language], s: "12:00", e: "14:00" },
              ].map((slot) => (
                <button
                  type="button"
                  key={slot.s}
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
              {tLabels.timeSlotHelp[language]}
            </p>
          </div>
        )}

        {/* Price & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={tLabels.priceLabel[language]}
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
                  ? tLabels.maxValidityLabel[language]
                  : tLabels.durationValidityLabel[language]
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
                { label: "1d", val: "1" },
                { label: "7d", val: "7" },
                { label: "30d (1m)", val: "30" },
                { label: "90d (3m)", val: "90" },
                { label: "180d (6m)", val: "180" },
                { label: "365d (1y)", val: "365" },
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
          label={tLabels.descLabel[language]}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={tLabels.descPlaceholder[language]}
        />

        <Field
          label={tLabels.sortOrderLabel[language]}
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="0"
          help={tLabels.sortOrderHelp[language]}
        />
      </form>
    </Modal>
  );
};
