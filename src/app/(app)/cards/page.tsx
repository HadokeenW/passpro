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
} from "lucide-react";

import { getCachedData, setCachedData, invalidateCache } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";

export default function CardsPage() {
  const toast = useToast();
  const { t, language } = useTranslation();
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

    const onInvalidate = (e: Event) => {
      const customEvent = e as CustomEvent<{ prefixes?: string[] }>;
      const prefixes = customEvent.detail?.prefixes;
      if (!prefixes || prefixes.length === 0 || prefixes.some((p) => p.includes("card"))) {
        fetchCards();
      }
    };

    window.addEventListener("passpro:cache-invalidate", onInvalidate);
    return () => window.removeEventListener("passpro:cache-invalidate", onInvalidate);
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
        invalidateCache(["/api/cards", "/api/dashboard", "/api/members"]);
        toast.success(
          action === "BLOCK"
            ? language === "ar" ? "تم حظر البطاقة" : language === "en" ? "Card blocked" : "Badge bloqué"
            : language === "ar" ? "تم إلغاء حظر البطاقة" : language === "en" ? "Card unblocked" : "Badge débloqué",
          uid
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
        invalidateCache(["/api/cards", "/api/dashboard", "/api/members"]);
        toast.success(
          language === "ar" ? "تم حذف البطاقة" : language === "en" ? "Card removed" : "Badge retiré",
          cardToDelete
        );
        fetchCards();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCardToDelete(null);
    }
  };

  const filterOptions = [
    { label: t("cards.filters.all"), value: "all", count: counts.total },
    { label: t("cards.filters.active"), value: "active", count: counts.active },
    { label: t("cards.filters.blocked"), value: "blocked", count: counts.blocked },
  ];

  const tLabels = {
    kpiAllCtx: { fr: "Identifiants enregistrés", en: "Registered credentials", ar: "البطاقات المسجلة" },
    kpiActiveCtx: { fr: "En circulation chez les membres", en: "Active in member circulation", ar: "بحوزة المشتركين النشطين" },
    kpiBlockedCtx: { fr: "Perte, vol ou exclusion", en: "Lost, stolen or suspended", ar: "ضياع، سرقة أو منع" },
    deleteModalDesc: {
      fr: "Cette action retire définitivement la carte du stock.",
      en: "This permanently removes the card from inventory.",
      ar: "هذا الإجراء يحذف البطاقة نهائياً من المخزون.",
    },
    deleteModalBody: (uid: string) => ({
      fr: `Êtes-vous certain de vouloir supprimer le badge ${uid} du parc ? Les historiques de passages conserveront son identifiant texte.`,
      en: `Are you sure you want to remove card ${uid} from the inventory? Passages history will retain its text identifier.`,
      ar: `هل أنت متأكد من رغبتك في حذف البطاقة ${uid} من النظام؟ سيحتفظ سجل الدخول برقم البطاقة للأرشفة.`,
    }),
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            {t("cards.title")}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {t("cards.subtitle")}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAssignModalOpen(true)}
        >
          {t("cards.scanCard")}
        </Button>
      </div>

      {/* 2. Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label={t("cards.filters.all")}
          value={counts.total}
          context={tLabels.kpiAllCtx[language]}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <KpiCard
          label={t("cards.kpiActive")}
          value={counts.active}
          context={tLabels.kpiActiveCtx[language]}
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <KpiCard
          label={t("cards.kpiBlocked")}
          value={counts.blocked}
          context={tLabels.kpiBlockedCtx[language]}
          variant="alert"
          icon={<Ban className="w-5 h-5" />}
        />
      </div>

      {/* 3. Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
        <SearchInput
          placeholder={t("cards.searchPlaceholder")}
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
            {t("cards.loading")}
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-8 h-8" />}
            title={t("cards.emptyTitle")}
            description={t("cards.emptyDesc")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">{t("cards.table.uid")}</th>
                  <th className="px-4">{t("cards.table.member")}</th>
                  <th className="px-4">{t("cards.table.assignedAt")}</th>
                  <th className="px-4 text-center">{t("cards.table.status")}</th>
                  <th className="px-5 text-right">{t("cards.table.actions")}</th>
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
                        <span className="text-[12px] text-[#94A3B8]">{t("cards.kpiUnassigned")}</span>
                      )}
                    </td>
                    <td className="px-4 text-[#64748B] nums">{formatDateTime(c.createdAt)}</td>
                    <td className="px-4 text-center">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleBlock(c.uid, c.status)}
                          title={c.status === "BLOCKED" ? t("cards.actions.unblock") : t("cards.actions.block")}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                        >
                          {c.status === "BLOCKED" ? (
                            <ShieldCheck className="w-4 h-4 text-[#059669]" />
                          ) : (
                            <Ban className="w-4 h-4 text-[#DC2626]" />
                          )}
                        </button>
                        <button
                          onClick={() => setCardToDelete(c.uid)}
                          title={t("cards.actions.delete")}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
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
            {language === "ar" ? (
              <>
                عرض <span className="font-semibold text-[#0F172A] nums">{cards.length}</span> من أصل{" "}
                <span className="font-semibold text-[#0F172A] nums">{total}</span>
              </>
            ) : language === "en" ? (
              <>
                Showing <span className="font-semibold text-[#0F172A] nums">{cards.length}</span> of{" "}
                <span className="font-semibold text-[#0F172A] nums">{total}</span>
              </>
            ) : (
              <>
                Affichage de <span className="font-semibold text-[#0F172A] nums">{cards.length}</span> sur{" "}
                <span className="font-semibold text-[#0F172A] nums">{total}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="px-2 font-medium nums">{page}</span>
            <button
              disabled={page * 15 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
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
        title={t("cards.actions.delete")}
        description={tLabels.deleteModalDesc[language]}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setCardToDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDeleteCard}>
              {t("common.delete")}
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[#475569]">
          {cardToDelete && tLabels.deleteModalBody(cardToDelete)[language]}
        </p>
      </Modal>
    </div>
  );
}
