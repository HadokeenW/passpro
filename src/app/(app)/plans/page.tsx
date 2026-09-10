"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { PlanModal } from "@/components/business/PlanModal";
import { Modal } from "@/components/business/Modal";
import { useToast } from "@/components/business/Toast";
import { formatMoney } from "@/lib/money";
import { Tags, Plus, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";

export default function PlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(console.error);
  }, []);

  const canManagePlans = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  const fetchPlans = () => {
    setIsLoading(true);
    fetch("/api/plans?includeInactive=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleActive = async (plan: any) => {
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !plan.active }),
      });
      if (res.ok) {
        toast.success(
          plan.active ? "Formule désactivée" : "Formule activée",
          `La formule ${plan.name} est maintenant ${plan.active ? "masquée à la vente" : "disponible à la vente"}`
        );
        fetchPlans();
      } else {
        const d = await res.json();
        toast.error("Erreur", d.error?.message || "Impossible de modifier la formule");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau", "Impossible de contacter le serveur");
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      const res = await fetch(`/api/plans/${planToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Suppression refusée", data.error?.message || "Impossible de supprimer");
      } else {
        toast.success("Formule supprimée", `La formule a été retirée`);
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
            Formules tarifaires
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Paramétrez l'offre d'abonnements, les tarifs et les durées d'accès
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
            Créer une formule
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
                      title="Modifier"
                      className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPlanToDelete(p)}
                      title="Supprimer"
                      className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
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
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        p.active
                          ? "bg-[#ECFDF5] text-[#047857]"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      {p.active ? "Disponible" : "Désactivée"}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#64748B] line-clamp-2">
                    {p.description || "Aucune description renseignée."}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] flex items-end justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-[#64748B]">
                      Durée : {p.durationDays} jour{p.durationDays > 1 ? "s" : ""}
                    </div>
                    <div className="text-[20px] font-bold text-[#2563EB] nums mt-0.5">
                      {formatMoney(p.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#64748B] nums">
                      {subCount} souscrit{subCount > 1 ? "s" : ""}
                    </span>
                    {canManagePlans && (
                      <Button
                        variant={p.active ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.active ? "Désactiver" : "Activer"}
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
        title="Supprimer la formule"
        description="Cette action est irréversible."
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setPlanToDelete(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[#475569]">
          Êtes-vous certain de vouloir supprimer définitivement la formule{" "}
          <strong>{planToDelete?.name}</strong> ? Si des abonnements y sont associés,
          la suppression sera refusée et vous devrez la désactiver à la place.
        </p>
      </Modal>
    </div>
  );
}
