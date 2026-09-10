"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/business/Card";
import { SearchInput } from "@/components/business/SearchInput";
import { FilterPills } from "@/components/business/FilterPills";
import { StatusPill } from "@/components/business/StatusPill";
import { EmptyState } from "@/components/business/EmptyState";
import { formatDateTime } from "@/lib/dates";
import { History, ChevronLeft, ChevronRight, Check, X } from "lucide-react";

export default function AccessLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "25",
      decision,
      q: search,
    });

    fetch(`/api/access/logs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setLogs(data.items);
          setTotal(data.total);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, decision, search]);

  const decisionOptions = [
    { label: "Tous les passages", value: "all" },
    { label: "Autorisés", value: "granted" },
    { label: "Refusés", value: "denied" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
          Journal d'audit des passages
        </h1>
        <p className="text-[14px] text-[#64748B] mt-0.5">
          Historique exhaustif et horodaté des scans effectués aux bornes d'accès
        </p>
      </div>

      {/* 2. Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
        <SearchInput
          placeholder="Rechercher par UID, adhérent, borne..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-[320px]"
        />
        <FilterPills
          options={decisionOptions}
          value={decision}
          onChange={(val) => {
            setDecision(val);
            setPage(1);
          }}
        />
      </div>

      {/* 3. Table in Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
            Chargement de l'historique des passages...
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8" />}
            title="Aucun passage enregistré"
            description="Aucun scan ne correspond à vos filtres de recherche."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-5">Date & Heure</th>
                  <th className="px-4">Adhérent</th>
                  <th className="px-4">Badge UID</th>
                  <th className="px-4">Borne</th>
                  <th className="px-4">Source</th>
                  <th className="px-4">Motif / Statut</th>
                  <th className="px-5 text-right">Décision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {logs.map((log) => {
                  const isGranted = log.decision === "GRANTED";
                  return (
                    <tr key={log.id} className="h-12 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 font-medium text-[#0F172A] nums">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 font-semibold text-[#0F172A]">
                        {log.member ? (
                          <Link
                            href={`/members/${log.member.id}`}
                            className="hover:text-[#2563EB] hover:underline"
                          >
                            {log.member.firstName} {log.member.lastName}
                          </Link>
                        ) : (
                          <span className="text-[#94A3B8] font-normal">Badge non assigné</span>
                        )}
                      </td>
                      <td className="px-4 font-mono-code text-[#475569] font-medium">
                        {log.cardUid}
                      </td>
                      <td className="px-4 text-[#64748B]">{log.kioskName}</td>
                      <td className="px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono-code bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                          {log.source}
                        </span>
                      </td>
                      <td className="px-4 text-[#64748B]">{log.reason}</td>
                      <td className="px-5 text-right">
                        <StatusPill status={log.decision} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="h-12 px-5 border-t border-[#F1F5F9] flex items-center justify-between text-[13px] text-[#64748B]">
          <div>
            Affichage de <span className="font-semibold text-[#0F172A] nums">{logs.length}</span> sur{" "}
            <span className="font-semibold text-[#0F172A] nums">{total}</span> passages
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
              disabled={page * 25 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded flex items-center justify-center border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
