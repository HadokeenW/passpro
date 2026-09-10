"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { SearchInput } from "@/components/business/SearchInput";
import { FilterPills } from "@/components/business/FilterPills";
import { StatusPill } from "@/components/business/StatusPill";
import { EmptyState } from "@/components/business/EmptyState";
import { MemberModal } from "@/components/business/MemberModal";
import { Users, UserPlus, ChevronLeft, ChevronRight, CreditCard, Download } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { downloadCsv } from "@/lib/csv";

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMembers = () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "15",
      filter,
      q: search,
    });

    fetch(`/api/members?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setMembers(data.items);
          setTotal(data.total);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [page, filter, search]);

  const filterOptions = [
    { label: "Tous", value: "all" },
    { label: "Actifs", value: "active" },
    { label: "Inactifs", value: "inactive" },
    { label: "Cartes bloquées", value: "blocked" },
  ];

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`/api/members?pageSize=1000&filter=${filter}&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      const items = data.items || members;
      const headers = [
        "Nom",
        "Prénom",
        "Téléphone",
        "Email",
        "Badge RFID",
        "Formule",
        "Statut Abonnement",
        "Échéance",
        "Date Inscription",
      ];
      const rows = items.map((m: any) => {
        const sub = m.currentSubscription;
        return [
          m.lastName,
          m.firstName,
          m.phone || "",
          m.email || "",
          m.activeCard?.uid || "",
          sub?.planName || "Aucun",
          sub?.status === "ACTIVE"
            ? "Actif"
            : sub?.status === "EXPIRING_SOON"
            ? "Expire bientôt"
            : sub?.status || "Inactif",
          sub?.endDate ? formatDate(sub.endDate) : "",
          formatDate(m.createdAt),
        ];
      });
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      downloadCsv(`adherents-${dateStr}`, headers, rows);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            Adhérents
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Répertoire des membres, abonnements et attribution des badges
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Exporter CSV
          </Button>
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Créer un adhérent
          </Button>
        </div>
      </div>

      {/* 2. Toolbar: Search + FilterPills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
        <SearchInput
          placeholder="Rechercher par nom, téléphone, badge..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-[320px]"
        />
        <FilterPills
          options={filterOptions}
          value={filter}
          onChange={(val) => {
            setFilter(val);
            setPage(1);
          }}
        />
      </div>

      {/* 3. Table in Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
            Chargement des adhérents...
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Aucun adhérent trouvé"
            description="Modifiez vos filtres de recherche ou créez un nouvel adhérent."
            action={
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Créer un adhérent
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">Adhérent</th>
                  <th className="px-4">Coordonnées</th>
                  <th className="px-4">Abonnement actuel</th>
                  <th className="px-4">Badge RFID</th>
                  <th className="px-4">Échéance</th>
                  <th className="px-5 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {members.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => router.push(`/members/${m.id}`)}
                    className="h-12 hover:bg-[#F8FAFC] transition-colors cursor-pointer group select-none text-[13px]"
                  >
                    <td className="px-5 font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="px-4 text-[#64748B]">
                      {m.phone || m.email || "—"}
                    </td>
                    <td className="px-4 text-[#0F172A] font-medium">
                      {m.subscription ? m.subscription.planName : "—"}
                    </td>
                    <td className="px-4">
                      {m.card ? (
                        <div className="inline-flex items-center gap-1.5 font-mono-code text-[12px] font-medium text-[#475569]">
                          <CreditCard className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{m.card.uid}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#94A3B8]">Aucun badge</span>
                      )}
                    </td>
                    <td className="px-4 text-[#64748B] nums">
                      {m.subscription ? formatDate(m.subscription.endDate) : "—"}
                    </td>
                    <td className="px-5 text-right">
                      <StatusPill
                        status={
                          m.card?.status === "BLOCKED"
                            ? "BLOCKED"
                            : m.subscription?.status || "NO_SUBSCRIPTION"
                        }
                      />
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
            Affichage de <span className="font-semibold text-[#0F172A] nums">{members.length}</span> sur{" "}
            <span className="font-semibold text-[#0F172A] nums">{total}</span> adhérents
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

      {/* Creation Modal */}
      <MemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMembers}
      />
    </div>
  );
}
