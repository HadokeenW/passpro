"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { PlanModal } from "@/components/business/PlanModal";
import { Modal } from "@/components/business/Modal";
import { useToast } from "@/components/business/Toast";
import { formatMoney } from "@/lib/money";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

export default function PlansPage() {
  const toast = useToast();
  const { t, language } = useTranslation();
  const cachedPlans = getCachedData<any[]>("/api/plans?includeInactive=true");
  const [plans, setPlans] = useState<any[]>(() => cachedPlans || []);
  const [isLoading, setIsLoading] = useState(() => !cachedPlans);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(() => getCachedData<any>("/api/auth/me")?.user || null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setCurrentUser(d.user);
          setCachedData("/api/auth/me", d);
        }
      })
      .catch(console.error);
  }, []);

  const canManagePlans = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  const fetchPlans = () => {
    const cached = getCachedData<any[]>("/api/plans?includeInactive=true");
    if (cached) {
      setPlans(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetch("/api/plans?includeInactive=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlans(data);
          setCachedData("/api/plans?includeInactive=true", data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPlans();

    const onInvalidate = (e: Event) => {
      const customEvent = e as CustomEvent<{ prefixes?: string[] }>;
      const prefixes = customEvent.detail?.prefixes;
      if (!prefixes || prefixes.length === 0 || prefixes.some((p) => p.includes("plan"))) {
        fetchPlans();
      }
    };

    window.addEventListener("passpro:cache-invalidate", onInvalidate);
    return () => window.removeEventListener("passpro:cache-invalidate", onInvalidate);
  }, []);

  const tLabels = {
    deactivatedToast: { fr: "Formule désactivée", en: "Plan deactivated", ar: "تم تعطيل الاشتراك" },
    activatedToast: { fr: "Formule activée", en: "Plan activated", ar: "تم تفعيل الاشتراك" },
    deletedToast: { fr: "Formule supprimée", en: "Plan deleted", ar: "تم حذف الاشتراك" },
    noDesc: { fr: "Aucune description renseignée.", en: "No description provided.", ar: "لا يوجد وصف مدخل." },
    maxValidity: (days: number, sessions: number) => ({
      fr: `Validité max : ${days} j (${sessions} ${t("plans.sessionsCount")})`,
      en: `Max validity: ${days} d (${sessions} ${t("plans.sessionsCount")})`,
      ar: `أقصى صلاحية: ${days} يوم (${sessions} ${t("plans.sessionsCount")})`,
    }),
    slotValidity: (days: number, s: string, e: string) => ({
      fr: `Validité : ${days} j (${s} à ${e})`,
      en: `Validity: ${days} d (${s} to ${e})`,
      ar: `الصلاحية: ${days} يوم (${s} إلى ${e})`,
    }),
    duration: (days: number) => ({
      fr: `Durée : ${days} ${t("plans.daysCount")}`,
      en: `Duration: ${days} ${t("plans.daysCount")}`,
      ar: `المدة: ${days} ${t("plans.daysCount")}`,
    }),
    subscribedCount: (c: number) => ({
      fr: `${c} souscrit${c > 1 ? "s" : ""}`,
      en: `${c} subscribed`,
      ar: `${c} مشترك`,
    }),
    deleteModalDesc: { fr: "Cette action est irréversible.", en: "This action is irreversible.", ar: "هذا الإجراء لا يمكن التراجع عنه." },
    deleteModalBody: (name: string) => ({
      fr: `Êtes-vous certain de vouloir supprimer définitivement la formule ${name} ? Si des abonnements y sont associés, la suppression sera refusée et vous devrez la désactiver à la place.`,
      en: `Are you sure you want to permanently delete plan ${name}? If subscriptions are linked, deletion will be rejected and you must deactivate it instead.`,
      ar: `هل أنت متأكد من رغبتك في حذف نوع الاشتراك ${name} نهائياً؟ إذا كانت هناك اشتراكات مرتبطة به، فسيتم رفض الحذف ويمكنك تعطيله بدلاً من ذلك.`,
    }),
    errTitle: { fr: "Erreur", en: "Error", ar: "خطأ" },
    errModifyDesc: { fr: "Impossible de modifier la formule", en: "Unable to update plan", ar: "تعذر تعديل الاشتراك" },
    errNetworkTitle: { fr: "Erreur réseau", en: "Network error", ar: "خطأ في الشبكة" },
    errNetworkDesc: { fr: "Impossible de contacter le serveur", en: "Unable to contact server", ar: "تعذر الاتصال بالخادم" },
    errDeleteRefused: { fr: "Suppression refusée", en: "Deletion refused", ar: "تم رفض الحذف" },
    errDeleteDesc: { fr: "Impossible de supprimer", en: "Unable to delete", ar: "تعذر الحذف" },
  };

  const handleToggleActive = async (plan: any) => {
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !plan.active }),
      });
      if (res.ok) {
        invalidateCache(["/api/plans", "/api/dashboard"]);
        toast.success(
          plan.active ? tLabels.deactivatedToast[language] : tLabels.activatedToast[language],
          plan.name
        );
        fetchPlans();
      } else {
        const d = await res.json();
        toast.error(tLabels.errTitle[language], d.error?.message || tLabels.errModifyDesc[language]);
      }
    } catch (err) {
      console.error(err);
      toast.error(tLabels.errNetworkTitle[language], tLabels.errNetworkDesc[language]);
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      const res = await fetch(`/api/plans/${planToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(tLabels.errDeleteRefused[language], data.error?.message || tLabels.errDeleteDesc[language]);
      } else {
        invalidateCache(["/api/plans", "/api/dashboard"]);
        toast.success(tLabels.deletedToast[language], planToDelete.name);
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlanToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            {t("plans.title")}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {t("plans.subtitle")}
          </p>
        </div>
        {canManagePlans && (
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSelectedPlan(null);
              setIsModalOpen(true);
            }}
          >
            {t("plans.createPlan")}
          </Button>
        )}
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((p) => {
          const subCount = p._count?.subscriptions || 0;
          return (
            <Card
              key={p.id}
              className={!p.active ? "opacity-75 bg-[#F8FAFC]" : ""}
              action={
                canManagePlans ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedPlan(p);
                        setIsModalOpen(true);
                      }}
                      title={t("plans.actions.edit")}
                      className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPlanToDelete(p)}
                      title={t("plans.actions.delete")}
                      className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null
              }
            >
              <div className="flex flex-col justify-between h-40">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[16px] font-bold text-[#0F172A]">{p.name}</h3>
                    <div className="flex items-center gap-1.5">
                      {p.planType === "SESSIONS" && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                          🎟️ {p.sessionCount || 10} {t("plans.sessionsCount")}
                        </span>
                      )}
                      {p.planType === "TIME_SLOT" && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                          🕒 {p.startTime || "13:00"} - {p.endTime || "16:00"}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          p.active
                            ? "bg-[#ECFDF5] text-[#047857]"
                            : "bg-[#F1F5F9] text-[#64748B]"
                        }`}
                      >
                        {p.active ? t("plans.statusActive") : t("plans.statusHidden")}
                      </span>
                    </div>
                  </div>

                  <p className="text-[12px] text-[#64748B] line-clamp-2">
                    {p.description || tLabels.noDesc[language]}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] flex items-end justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-[#64748B]">
                      {p.planType === "SESSIONS"
                        ? tLabels.maxValidity(p.durationDays, p.sessionCount || 10)[language]
                        : p.planType === "TIME_SLOT"
                        ? tLabels.slotValidity(p.durationDays, p.startTime || "13:00", p.endTime || "16:00")[language]
                        : tLabels.duration(p.durationDays)[language]}
                    </div>
                    <div className="text-[20px] font-bold text-[#2563EB] nums mt-0.5">
                      {formatMoney(p.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#64748B] nums">
                      {tLabels.subscribedCount(subCount)[language]}
                    </span>
                    {canManagePlans && (
                      <Button
                        variant={p.active ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.active ? t("plans.actions.deactivate") : t("plans.actions.activate")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Plan Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPlan={selectedPlan}
        onSuccess={fetchPlans}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        title={t("plans.actions.delete")}
        description={tLabels.deleteModalDesc[language]}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setPlanToDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t("plans.actions.delete")}
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[#475569]">
          {planToDelete && tLabels.deleteModalBody(planToDelete.name)[language]}
        </p>
      </Modal>
    </div>
  );
}
