"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/business/Button";
import { Card } from "@/components/business/Card";
import { EmptyState } from "@/components/business/EmptyState";
import { formatRelativeTime } from "@/lib/dates";
import { useToast } from "@/components/business/Toast";
import { useTranslation } from "@/lib/i18n";
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Check,
} from "lucide-react";

export default function NotificationsPage() {
  const toast = useToast();
  const { t, language } = useTranslation();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = () => {
    setIsLoading(true);
    fetch(`/api/notifications?unread=${unreadOnly}&pageSize=50`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setAlerts(data.items);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        toast.success(
          language === "ar" ? "تم تحديد الكل كمقروء" : language === "en" ? "All notifications acknowledged" : "Toutes les notifications acquittées",
          ""
        );
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const icons = {
    DANGER: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />,
    WARNING: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
    INFO: <Info className="w-5 h-5 text-[#2563EB] shrink-0" />,
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            {t("notificationsPage.title")}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {t("notificationsPage.subtitle")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={handleMarkAllRead}
          >
            {t("notificationsPage.markAllRead")}
          </Button>
        )}
      </div>

      {/* 2. Filter toggle */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-[10px] border border-[#E2E8F0]">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] font-medium text-[#0F172A]">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="w-4 h-4 text-[#2563EB] rounded border-[#CBD5E1]"
          />
          <span>{t("notificationsPage.filterUnread")} ({unreadCount})</span>
        </label>
      </div>

      {/* 3. Alerts List in Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-[#64748B] text-[14px]">
            {t("notificationsPage.loading")}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<BellRing className="w-8 h-8" />}
            title={t("notificationsPage.emptyTitle")}
            description={t("notificationsPage.emptyDesc")}
          />
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !a.read ? "bg-[#F8FAFC]" : "bg-white hover:bg-[#F8FAFC]"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5">
                    {icons[a.level as "DANGER" | "WARNING" | "INFO"] || icons.INFO}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[14px] font-semibold text-[#0F172A]">
                        {a.title}
                      </h4>
                      {!a.read && (
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block" />
                      )}
                    </div>
                    <p className="text-[13px] text-[#475569] mt-0.5 leading-relaxed">
                      {a.message}
                    </p>
                    <div className="flex items-center gap-3 text-[12px] text-[#64748B] mt-2">
                      <span>{formatRelativeTime(a.createdAt)}</span>
                      {a.member && (
                        <>
                          <span>·</span>
                          <Link
                            href={`/members/${a.member.id}`}
                            className="font-medium text-[#2563EB] hover:underline"
                          >
                            {language === "ar" ? `ملف ${a.member.firstName} ${a.member.lastName}` : language === "en" ? `Profile: ${a.member.firstName} ${a.member.lastName}` : `Dossier de ${a.member.firstName} ${a.member.lastName}`}
                          </Link>
                        </>
                      )}
                      {a.cardUid && (
                        <>
                          <span>·</span>
                          <span className="font-mono-code font-medium">{a.cardUid}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!a.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                    onClick={() => handleMarkAsRead(a.id)}
                  >
                    {language === "ar" ? "تحديد كمقروء" : language === "en" ? "Dismiss" : "Acquitter"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
