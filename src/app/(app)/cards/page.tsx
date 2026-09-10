"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { KpiCard } from "@/components/business/KpiCard";
import { SearchInput } from "@/components/business/SearchInput";
import { FilterPills } from "@/components/business/FilterPills";
import { StatusPill } from "@/components/business/StatusPill";
import { EmptyState } from "@/components/business/EmptyState";
import { CardAssignModal } from "@/components/business/CardAssignModal";
import { Modal } from "@/components/business/Modal";
import { useToast } from "@/components/business/Toast";
import { formatDateTime } from "@/lib/dates";
import {
  CreditCard,
  Plus,
  Ban,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";

import { getCachedData, setCachedData } from "@/lib/cache";

export default function CardsPage() {
  const toast = useToast();
  const initialCacheKey = "/api/cards?page=1&pageSize=15&status=all&q=";
  const initialData = getCachedData<any>(initialCacheKey);

  const [cards, setCards] = useState<any[]>(() => initialData?.items || []);
  const [counts, setCounts] = useState(() => initialData?.counts || { active: 0, blocked: 0, unassigned: 0, total: 0 });
  const [total, setTotal] = useState(() => initialData?.total || 0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(() => !initialData);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const fetchCards = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "15",
      status: statusFilter,
      q: search,
    });
    const url = `/api/cards?${params.toString()}`;
    const cached = getCachedData<any>(url);

    if (cached) {
      setCards(cached.items || []);
      setTotal(cached.total || 0);
      if (cached.counts) setCounts(cached.counts);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setCards(data.items);
          setTotal(data.total);
          if (data.counts) setCounts(data.counts);
          setCachedData(url, data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCards();
  }, [page, statusFilter, search]);

  const handleToggleBlock = async (uid: string, currentStatus: string) => {
    const action = currentStatus === "BLOCKED" ? "UNBLOCK" : "BLOCK";
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(uid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(
          action === "BLOCK" ? "Badge bloqué" : "Badge débloqué",
          `Le badge ${uid} a été mis à jour`
        );
        fetchCards();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(cardToDelete)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Badge retiré", `Le badge ${cardToDelete} a été sorti du parc`);
        fetchCards();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCardToDelete(null);
    }
  };

  const filterOptions = [
    { label: "Toutes", value: "all", count: counts.total },
    { label: "Actives", value: "active", count: counts.active },
    { label: "Bloquées", value: "blocked", count: counts.blocked },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            Parc de cartes RFID
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Inventaire des badges 13,56 MHz, attributions et blocages d'accès
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAssignModalOpen(true)}
        >
          Scanner un badge
        </Button>
      </div>

      {/* 2. Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total des badges"
          value={counts.total}
          context="Identifiants enregistrés"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <KpiCard
          label="Badges actifs"
          value={counts.active}
          context="En circulation chez les membres"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <KpiCard
          label="Badges bloqués"
          value={counts.blocked}
          context="Perte, vol ou exclusion"
          variant="alert"
          icon={<Ban className="w-5 h-5" />}
        />
      </div>

      {/* 3. Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
        <SearchInput
          placeholder="Rechercher par UID ou adhérent..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-[320px]"
        />
        <FilterPills
          options={filterOptions}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        />
      </div>

      {/* 4. Table in Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
            Chargement des badges RFID...
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-8 h-8" />}
            title="Aucun badge trouvé"
            description="Aucun badge RFID ne correspond aux critères de recherche."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">UID Badge</th>
                  <th className="px-4">Adhérent assigné</th>
                  <th className="px-4">Dernier passage</th>
                  <th className="px-4">Enregistré le</th>
                  <th className="px-4 text-center">Statut</th>
                  <th className="px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {cards.map((c) => (
                  <tr key={c.uid} className="h-12 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 font-mono-code font-semibold text-[#0F172A]">
                      {c.uid}
                    </td>
                    <td className="px-4">
                      {c.member ? (
                        <Link
                          href={`/members/${c.member.id}`}
                          className="font-medium text-[#0F172A] hover:text-[#2563EB] hover:underline"
                        >
                          {c.member.firstName} {c.member.lastName}
                        </Link>
                      ) : (
                        <span className="text-[12px] text-[#94A3B8]">Stock (non attribué)</span>
                      )}
                    </td>
                    <td className="px-4 text-[#64748B] nums">
                      {c.lastSeenAt ? formatDateTime(c.lastSeenAt) : "Jamais"}
                    </td>
                    <td className="px-4 text-[#64748B] nums">{formatDateTime(c.createdAt)}</td>
                    <td className="px-4 text-center">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleBlock(c.uid, c.status)}
                          title={c.status === "BLOCKED" ? "Débloquer" : "Bloquer"}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                        >
                          {c.status === "BLOCKED" ? (
                            <ShieldCheck className="w-4 h-4 text-[#059669]" />
                          ) : (
                            <Ban className="w-4 h-4 text-[#DC2626]" />
                          )}
                        </button>
                        <button
                          onClick={() => setCardToDelete(c.uid)}
                          title="Supprimer du parc"
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="h-12 px-5 border-t border-[#F1F5F9] flex items-center justify-between text-[13px] text-[#64748B]">
          <div>
            Affichage de <span className="font-semibold text-[#0F172A] nums">{cards.length}</span> sur{" "}
            <span className="font-semibold text-[#0F172A] nums">{total}</span> badges
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium nums">{page}</span>
            <button
              disabled={page * 15 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Creation / Assignment Modal */}
      <CardAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={fetchCards}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        title="Sortie de parc"
        description="Cette action retire définitivement la carte du stock."
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setCardToDelete(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteCard}>
              Supprimer la carte
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[#475569]">
          Êtes-vous certain de vouloir supprimer le badge{" "}
          <strong className="font-mono-code">{cardToDelete}</strong> du parc ? Les historiques
          de passages conserveront son identifiant texte.
        </p>
      </Modal>
    </div>
  );
}
