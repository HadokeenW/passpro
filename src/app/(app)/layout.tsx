"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/dates";
import {
  LayoutDashboard,
  ScanLine,
  History,
  Users,
  CalendarCheck,
  Tags,
  CreditCard,
  Receipt,
  BellRing,
  Settings,
  LogOut,
  Search,
  ExternalLink,
  Check,
  CheckCheck,
  Trash2,
  X,
  User,
  UserPlus,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";

import { getCachedData, setCachedData, prewarmRoute, prewarmAllCoreRoutes } from "@/lib/cache";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/desktop/LanguageSelector";
import { MemberOnboardingWizardModal } from "@/components/business/MemberOnboardingWizardModal";

const routePrewarmMap: Record<string, string[]> = {
  "/": ["/api/dashboard/metrics", "/api/dashboard/heatmap", "/api/dashboard/activity?limit=15"],
  "/members": ["/api/members?page=1&pageSize=15&filter=all&q="],
  "/subscriptions": ["/api/subscriptions?page=1&pageSize=15&status=all"],
  "/cards": ["/api/cards?page=1&pageSize=15&status=all&q="],
  "/payments": ["/api/payments?page=1&pageSize=15&period=today"],
  "/access-logs": ["/api/access/logs?page=1&pageSize=25&decision=all&q="],
  "/plans": ["/api/plans?includeInactive=true"],
};

interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  isExternal?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, isRTL, language } = useTranslation();
  const cachedMe = getCachedData<any>("/api/auth/me");
  const [user, setUser] = useState<UserInfo | null>(() => cachedMe?.user || null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState(() => !cachedMe?.user);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prevPathRef = useRef(pathname);

  const tLayout = {
    logoutTitle: { fr: "Se déconnecter", en: "Sign out", ar: "تسجيل الخروج" },
    searching: { fr: "Recherche en cours...", en: "Searching...", ar: "جاري البحث..." },
    noResults: (q: string) => ({
      fr: `Aucun résultat pour « ${q} »`,
      en: `No results for "${q}"`,
      ar: `لا توجد نتائج لـ « ${q} »`,
    }),
    searchHint: {
      fr: "Essayez avec un nom, numéro de téléphone ou UID de carte",
      en: "Try searching by name, phone number, or card UID",
      ar: "جرب البحث بالاسم، رقم الهاتف أو معرّف البطاقة",
    },
    membersCount: (c: number) => ({
      fr: `Adhérents (${c})`,
      en: `Members (${c})`,
      ar: `الأعضاء (${c})`,
    }),
    cardsCount: (c: number) => ({
      fr: `Badges RFID (${c})`,
      en: `RFID Badges (${c})`,
      ar: `بطاقات RFID (${c})`,
    }),
    plansCount: (c: number) => ({
      fr: `Formules (${c})`,
      en: `Plans (${c})`,
      ar: `الاشتراكات (${c})`,
    }),
    noPhone: { fr: "Sans téléphone", en: "No phone", ar: "بدون هاتف" },
    badgePrefix: { fr: "Badge :", en: "Badge:", ar: "البطاقة:" },
    active: { fr: "Actif", en: "Active", ar: "نشط" },
    expired: { fr: "Expiré", en: "Expired", ar: "منتهي" },
    viewAllResults: (q: string) => ({
      fr: `Voir tous les résultats pour « ${q} »`,
      en: `View all results for "${q}"`,
      ar: `عرض جميع النتائج لـ « ${q} »`,
    }),
    markRead: { fr: "Marquer comme lu", en: "Mark as read", ar: "تحديد كمقروء" },
    deleteNotif: { fr: "Supprimer cette notification", en: "Delete notification", ar: "حذف هذا الإشعار" },
    roles: {
      ADMIN: { fr: "Administrateur", en: "Admin", ar: "مدير النظام" },
      MANAGER: { fr: "Manager", en: "Manager", ar: "مدير" },
      RECEPTIONIST: { fr: "Réception", en: "Reception", ar: "استقبال" },
      ACCESS_GUARD: { fr: "Agent d'accès", en: "Access Guard", ar: "حارس بوابة" },
    },
  };

  // Smooth route transition indicator
  useEffect(() => {
    setIsNavigating(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const handleNavigate = (href: string) => {
    setMobileMenuOpen(false);
    if (pathname !== href) {
      setIsNavigating(true);
      setTimeout(() => setIsNavigating(false), 1000);
    }
  };

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    members: any[];
    cards: any[];
    plans: any[];
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notifications Popover State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // User Profile Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Universal Express Onboarding Wizard State (F2 shortcut)
  const [isOnboardWizardOpen, setIsOnboardWizardOpen] = useState(false);
  const isOnboardWizardOpenRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openOnboardWizard = () => {
    searchInputRef.current?.blur();
    setIsSearchOpen(false);
    setIsOnboardWizardOpen(true);
  };

  useEffect(() => {
    isOnboardWizardOpenRef.current = isOnboardWizardOpen;
    if (isOnboardWizardOpen) {
      searchInputRef.current?.blur();
      setIsSearchOpen(false);
    }
  }, [isOnboardWizardOpen]);

  // Global custom event so any page (like /members "+ Nouvel adhérent") can open the universal wizard
  useEffect(() => {
    const handleOpenOnboard = () => openOnboardWizard();
    window.addEventListener("passpro:open-onboarding", handleOpenOnboard);
    return () => window.removeEventListener("passpro:open-onboarding", handleOpenOnboard);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 shortcut to open onboarding modal
      if (e.key === "F2") {
        e.preventDefault();
        openOnboardWizard();
        return;
      }

      // / or Ctrl+K / Cmd+K shortcut to quickly focus the global search bar
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInputActive =
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable;

      if (
        (e.key === "/" && !isInputActive) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for RFID scans while in management mode to automatically navigate to member
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).electronAPI?.onManagementRfidScan) return;

    const cleanup = (window as any).electronAPI.onManagementRfidScan(async (data: { uid: string }) => {
      // CRITICAL: If the F2 onboarding modal or any dialog modal is open, DO NOT touch search or navigate!
      if (
        isOnboardWizardOpenRef.current ||
        (typeof document !== "undefined" && document.querySelector('[role="dialog"]'))
      ) {
        return;
      }

      if (!data?.uid) return;
      const cleanUid = data.uid.trim().toUpperCase();

      try {
        const res = await fetch(`/api/cards/${encodeURIComponent(cleanUid)}`);
        if (res.ok) {
          const cardData = await res.json();
          if (cardData?.member && !cardData.member.deletedAt) {
            setSearchQuery(`${cardData.member.firstName} ${cardData.member.lastName}`);
            setIsSearchOpen(false);
            searchInputRef.current?.blur();
            router.push(`/members/${cardData.member.id}`);
            return;
          }
        }
      } catch (err) {
        console.error("Management RFID scan error:", err);
      }
    });

    return () => cleanup?.();
  }, [router]);

  // Fetch user info and unread notifications count
  const fetchUnreadCount = () => {
    fetch("/api/notifications?unread=true&pageSize=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
        } else {
          setUser(data.user);
          setCachedData("/api/auth/me", data);
          fetchUnreadCount();
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setIsLoadingUser(false));

    const interval = setInterval(() => {
      if (user) fetchUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Click outside handlers for popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Global Search with debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          setSearchResults(data);
          if (typeof document !== "undefined" && document.activeElement === searchInputRef.current) {
            setIsSearchOpen(true);
          }
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch notifications list when opening popover
  const fetchNotifications = () => {
    setIsLoadingNotifs(true);
    fetch("/api/notifications?pageSize=15")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setNotifications(data.items);
          if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingNotifs(false));
  };

  const handleToggleNotif = () => {
    if (!isNotifOpen) {
      fetchNotifications();
    }
    setIsNotifOpen(!isNotifOpen);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        const target = notifications.find((n) => n.id === id);
        if (target && !target.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAllNotifs = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error(err);
      router.push("/login");
    }
  };

  const navGroups: NavGroup[] = [
    {
      label: t("nav.exploitation"),
      items: [
        { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
        { href: "/access", label: t("nav.kiosk"), icon: ScanLine, isExternal: true },
        { href: "/access-logs", label: t("nav.accessLogs"), icon: History },
      ],
    },
    {
      label: t("nav.management"),
      items: [
        { href: "/members", label: t("nav.members"), icon: Users },
        { href: "/subscriptions", label: t("nav.subscriptions"), icon: CalendarCheck },
        { href: "/plans", label: t("nav.plans"), icon: Tags },
        { href: "/cards", label: t("nav.cards"), icon: CreditCard },
      ],
    },
    {
      label: t("nav.finances"),
      items: [{ href: "/payments", label: t("nav.payments"), icon: Receipt }],
    },
    ...(user?.role === "RECEPTIONIST"
      ? []
      : [
          {
            label: t("nav.system"),
            items: [{ href: "/settings", label: t("nav.settings"), icon: Settings }],
          },
        ]),
  ];

  const getBreadcrumbs = () => {
    if (pathname === "/") return t("breadcrumbs.dashboard");
    if (pathname.startsWith("/members/")) return t("breadcrumbs.memberDetail");
    if (pathname.startsWith("/members")) return t("breadcrumbs.members");
    if (pathname.startsWith("/subscriptions")) return t("breadcrumbs.subscriptions");
    if (pathname.startsWith("/plans")) return t("breadcrumbs.plans");
    if (pathname.startsWith("/cards")) return t("breadcrumbs.cards");
    if (pathname.startsWith("/payments")) return t("breadcrumbs.payments");
    if (pathname.startsWith("/access-logs")) return t("breadcrumbs.accessLogs");
    if (pathname.startsWith("/settings")) return t("breadcrumbs.settings");
    return "PASSPro";
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasSearchResults =
    searchResults &&
    (searchResults.members.length > 0 ||
      searchResults.cards.length > 0 ||
      searchResults.plans.length > 0);

  return (
    <div className="h-screen max-h-screen bg-[#EEF2F7] p-3 sm:p-4 lg:p-5 flex gap-4 lg:gap-5 overflow-hidden font-sans relative">
      {/* Instant route transition indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#3B82F6] z-[100] animate-nav-bar shadow-sm shadow-blue-500/40" />
      )}

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 1. Left Floating Sidebar Card */}
      <aside
        className={cn(
          "w-[240px] lg:w-[250px] bg-white rounded-[26px] border border-[#E2E8F0]/80 shadow-[0_10px_35px_rgba(15,23,42,0.035)] p-5 flex flex-col justify-between shrink-0 transition-all duration-300 z-40",
          "fixed md:relative inset-y-3 left-3 md:inset-auto md:left-auto",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-[110%] md:translate-x-0"
        )}
      >
        {/* Mobile close button (hidden on desktop) */}
        <div className="flex items-center justify-end px-1 md:hidden mb-2 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#94A3B8] hover:text-[#0F172A] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action: Nouvel Adhérent (F2) */}
        <div className="mb-3 px-1">
          <button
            onClick={openOnboardWizard}
            className="w-full flex items-center justify-between gap-2 py-2 px-3 rounded-[12px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-[12.5px] shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-white" />
              <span>{t("members.newMember") || "Nouvel adhérent"}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono text-white/90">
              F2
            </span>
          </button>
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 overflow-y-auto space-y-4 py-1 pr-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#94A3B8] select-none">
                {group.label}
              </div>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href) && !item.isExternal;
                  const Icon = item.icon;

                  if (item.isExternal) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.href === "/access" ? undefined : "_blank"}
                        onClick={(e) => {
                          setMobileMenuOpen(false);
                          if (item.href === "/access" && typeof window !== "undefined" && (window as any).electronAPI?.openKioskWindow) {
                            e.preventDefault();
                            (window as any).electronAPI.openKioskWindow();
                          }
                        }}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-[16px] text-[13.5px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" />
                          <span>{item.label}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#94A3B8]" />
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => handleNavigate(item.href)}
                      onMouseEnter={() => {
                        router.prefetch(item.href);
                        routePrewarmMap[item.href]?.forEach((url) => prewarmRoute(url));
                      }}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-[16px] text-[13.5px] font-medium transition-all duration-150 select-none active:scale-[0.98]",
                        isActive
                          ? "bg-[#F1F5F9] text-[#0F172A] font-bold shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors duration-150",
                            isActive ? "text-[#0F172A]" : "text-[#94A3B8]"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom: Logout */}
        <div className="pt-3 border-t border-[#F1F5F9] shrink-0">
          <button
            onClick={handleLogout}
            title={tLayout.logoutTitle[language]}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[16px] text-[13.5px] font-medium text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2]/60 transition-all group"
          >
            <LogOut className="w-4 h-4 text-[#94A3B8] group-hover:text-[#DC2626] transition-colors" />
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>

      {/* 2. Right Floating Main Content Card */}
      <div className="flex-1 bg-white rounded-[28px] border border-[#E2E8F0]/80 shadow-[0_10px_35px_rgba(15,23,42,0.035)] flex flex-col overflow-hidden min-w-0">
        {/* Top Header inside Main Card */}
        <header className="px-6 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#F1F5F9] shrink-0 gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F5F9]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Inline Minimal Search */}
            <div
              ref={searchContainerRef}
              onClick={() => {
                searchInputRef.current?.focus();
                if (searchQuery.trim()) {
                  setIsSearchOpen(true);
                }
              }}
              className="relative flex-1 max-w-[340px] cursor-text"
            >
              <div className="flex items-center text-[#94A3B8] focus-within:text-[#0F172A] transition-colors">
                <Search className="w-4 h-4 mr-2.5 rtl:mr-0 rtl:ml-2.5 shrink-0 text-[#94A3B8]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("nav.searchPlaceholder")}
                  value={searchQuery}
                  onFocus={() => {
                    if (typeof window !== "undefined" && (window as any).electronAPI?.setManagementMode) {
                      (window as any).electronAPI.setManagementMode(true);
                    }
                    if (searchQuery.trim()) {
                      setIsSearchOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      if (typeof window !== "undefined" && (window as any).electronAPI?.setManagementMode) {
                        (window as any).electronAPI.setManagementMode(false);
                      }
                    }, 250);
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim()) {
                      setIsSearchOpen(true);
                    } else {
                      setIsSearchOpen(false);
                    }
                  }}
                  onKeyDown={async (e) => {
                    const q = (e.currentTarget.value || searchQuery).trim();
                    if (e.key === "Enter" && q) {
                      e.preventDefault();
                      setIsSearchOpen(false);
                      searchInputRef.current?.blur();

                      // 1. If we already have live results, navigate to first member match
                      if (searchResults?.members && searchResults.members.length > 0) {
                        router.push(`/members/${searchResults.members[0].id}`);
                        return;
                      }
                      if (searchResults?.cards && searchResults.cards.length > 0 && searchResults.cards[0].member) {
                        router.push(`/members/${searchResults.cards[0].member.id}`);
                        return;
                      }

                      // 2. Immediate query (for RFID card scan which submits Enter instantly)
                      try {
                        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
                        if (res.ok) {
                          const data = await res.json();
                          if (data?.members && data.members.length > 0) {
                            router.push(`/members/${data.members[0].id}`);
                            return;
                          }
                          if (data?.cards && data.cards.length > 0 && data.cards[0].member) {
                            router.push(`/members/${data.cards[0].member.id}`);
                            return;
                          }
                        }
                      } catch (err) {
                        console.error("Fast search on Enter error:", err);
                      }

                      // 3. Fallback: filter members page
                      router.push(`/members?q=${encodeURIComponent(q)}`);
                    } else if (e.key === "Escape") {
                      setIsSearchOpen(false);
                      searchInputRef.current?.blur();
                    }
                  }}
                  className="w-full bg-transparent text-[13.5px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none pr-1 rtl:pr-0 rtl:pl-1 cursor-text"
                />

                {/* Keyboard Shortcut Indicator / Clear Button */}
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                      searchInputRef.current?.focus();
                    }}
                    className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1 shrink-0 select-none pointer-events-none">
                    <kbd className="hidden sm:inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10.5px] font-mono font-medium text-[#94A3B8] bg-[#F1F5F9] border border-[#E2E8F0] rounded-[5px] shadow-2xs">
                      /
                    </kbd>
                  </div>
                )}
              </div>

              {/* Search Results Dropdown Palette */}
              {isSearchOpen && (
                <div className="absolute top-9 left-0 w-[380px] bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden text-[#0F172A] animate-in fade-in slide-in-from-top-2 duration-150">
                  {isSearching ? (
                    <div className="p-4 text-center text-[13px] text-[#64748B]">
                      {tLayout.searching[language]}
                    </div>
                  ) : !hasSearchResults ? (
                    <div className="p-5 text-center">
                      <p className="text-[13px] font-medium text-[#0F172A]">
                        {tLayout.noResults(searchQuery)[language]}
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {tLayout.searchHint[language]}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F1F5F9]">
                      {/* Members group */}
                      {searchResults.members.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                            {tLayout.membersCount(searchResults.members.length)[language]}
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.members.map((m) => {
                              const sub = m.subscriptions?.[0];
                              return (
                                <button
                                  key={m.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsSearchOpen(false);
                                    router.push(`/members/${m.id}`);
                                  }}
                                  onClick={() => {
                                    setIsSearchOpen(false);
                                    router.push(`/members/${m.id}`);
                                  }}
                                  className="w-full text-left rtl:text-right p-2 rounded-[10px] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-[11px] shrink-0">
                                      {m.firstName[0]}
                                      {m.lastName[0]}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[13px] font-semibold text-[#0F172A] group-hover:text-[#2563EB] truncate">
                                        {m.firstName} {m.lastName}
                                      </div>
                                      <div className="text-[11px] text-[#64748B] truncate">
                                        {m.phone || tLayout.noPhone[language]}
                                        {m.cards?.[0] && ` · ${tLayout.badgePrefix[language]} ${m.cards[0].uid}`}
                                      </div>
                                    </div>
                                  </div>
                                  {sub && (
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                        sub.status === "ACTIVE"
                                          ? "bg-[#ECFDF5] text-[#047857]"
                                          : "bg-[#FEF2F2] text-[#DC2626]"
                                      }`}
                                    >
                                      {sub.status === "ACTIVE" ? tLayout.active[language] : tLayout.expired[language]}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cards group */}
                      {searchResults.cards.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                            {tLayout.cardsCount(searchResults.cards.length)[language]}
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.cards.map((c) => (
                              <button
                                key={c.uid}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setIsSearchOpen(false);
                                  if (c.member?.id) {
                                    router.push(`/members/${c.member.id}`);
                                  } else {
                                    router.push(`/cards?q=${encodeURIComponent(c.uid)}`);
                                  }
                                }}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  if (c.member?.id) {
                                    router.push(`/members/${c.member.id}`);
                                  } else {
                                    router.push(`/cards?q=${encodeURIComponent(c.uid)}`);
                                  }
                                }}
                                className="w-full text-left rtl:text-right p-2 rounded-[10px] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors group cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-[#64748B]" />
                                  <span className="font-mono-code font-bold text-[12px] text-[#0F172A] group-hover:text-[#2563EB]">
                                    {c.uid}
                                  </span>
                                  {c.member && (
                                    <span className="text-[12px] text-[#64748B]">
                                      → {c.member.firstName} {c.member.lastName}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    c.status === "ACTIVE"
                                      ? "bg-[#ECFDF5] text-[#047857]"
                                      : c.status === "BLOCKED"
                                      ? "bg-[#FEF2F2] text-[#DC2626]"
                                      : "bg-[#F1F5F9] text-[#64748B]"
                                  }`}
                                >
                                  {c.status === "ACTIVE" ? tLayout.active[language] : c.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Plans group */}
                      {searchResults.plans.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                            {tLayout.plansCount(searchResults.plans.length)[language]}
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.plans.map((p) => (
                              <button
                                key={p.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setIsSearchOpen(false);
                                  router.push("/plans");
                                }}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  router.push("/plans");
                                }}
                                className="w-full text-left rtl:text-right p-2 rounded-[10px] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors group cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Tags className="w-4 h-4 text-[#64748B]" />
                                  <span className="text-[13px] font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                                    {p.name}
                                  </span>
                                  <span className="text-[11px] text-[#64748B]">
                                    ({p.durationDays}j)
                                  </span>
                                </div>
                                <span className="text-[12px] font-bold text-[#2563EB] nums">
                                  {p.price.toLocaleString("fr-FR")} DA
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer quick link */}
                      <div className="p-2 bg-[#F8FAFC]">
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setIsSearchOpen(false);
                            router.push(`/members?q=${encodeURIComponent(searchQuery.trim())}`);
                          }}
                          onClick={() => {
                            setIsSearchOpen(false);
                            router.push(`/members?q=${encodeURIComponent(searchQuery.trim())}`);
                          }}
                          className="w-full py-1.5 px-2 text-center text-[12px] font-semibold text-[#2563EB] hover:underline flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>{tLayout.viewAllResults(searchQuery)[language]}</span>
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Language, Notifications & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Language Selector */}
            <LanguageSelector theme="light" variant="compact" />

            {/* Notification Bell with Dropdown Popover */}
            <div ref={notifContainerRef} className="relative">
              <button
                onClick={handleToggleNotif}
                className={cn(
                  "relative w-9 h-9 flex items-center justify-center rounded-full transition-colors",
                  isNotifOpen
                    ? "bg-[#F1F5F9] text-[#0F172A]"
                    : "text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                )}
                title={t("nav.notifications")}
              >
                <BellRing className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EA580C] rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 top-11 w-[380px] bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden text-[#0F172A] animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Popover Header */}
                  <div className="p-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-[#0F172A]">
                        {t("nav.notifications")}
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] rounded-full border border-[#DBEAFE]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          title={t("nav.markAllRead")}
                          className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:bg-white px-2 py-1 rounded transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{t("nav.markAllRead")}</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={handleDeleteAllNotifs}
                          title={t("nav.deleteAll")}
                          className="flex items-center gap-1 text-[11px] font-medium text-[#DC2626] hover:text-[#B91C1C] hover:bg-white px-2 py-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t("nav.deleteAll")}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Popover List Body */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F1F5F9]">
                    {isLoadingNotifs ? (
                      <div className="p-8 text-center text-[13px] text-[#64748B]">
                        {t("common.loading")}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-2">
                          <BellRing className="w-5 h-5" />
                        </div>
                        <p className="text-[13px] font-semibold text-[#0F172A]">
                          {t("nav.noNotifications")}
                        </p>
                      </div>
                    ) : (
                      notifications.map((alert) => {
                        const isExpiredOrBlocked =
                          alert.type?.includes("EXPIRED") ||
                          alert.type?.includes("BLOCKED") ||
                          alert.type?.includes("DENIED");
                        const isExpiring = alert.type?.includes("EXPIRING");

                        return (
                          <div
                            key={alert.id}
                            className={cn(
                              "p-3 hover:bg-[#F8FAFC] transition-colors flex items-start justify-between gap-3 group",
                              !alert.read ? "bg-[#F0F7FF]/50" : ""
                            )}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              {/* Severity indicator dot */}
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                  !alert.read
                                    ? isExpiredOrBlocked
                                      ? "bg-[#DC2626]"
                                      : isExpiring
                                      ? "bg-[#D97706]"
                                      : "bg-[#2563EB]"
                                    : "bg-[#CBD5E1]"
                                )}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h4
                                    className={cn(
                                      "text-[12px] truncate",
                                      !alert.read
                                        ? "font-bold text-[#0F172A]"
                                        : "font-medium text-[#475569]"
                                    )}
                                  >
                                    {alert.title}
                                  </h4>
                                </div>
                                <p className="text-[12px] text-[#64748B] mt-0.5 line-clamp-2">
                                  {alert.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#94A3B8]">
                                  <span>{formatDateTime(alert.createdAt)}</span>
                                  {alert.member && (
                                    <>
                                      <span>·</span>
                                      <Link
                                        href={`/members/${alert.member.id}`}
                                        onClick={() => setIsNotifOpen(false)}
                                        className="text-[#2563EB] hover:underline font-medium truncate"
                                      >
                                        {alert.member.firstName} {alert.member.lastName}
                                      </Link>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Row Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                              {!alert.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(alert.id, e)}
                                  title={tLayout.markRead[language]}
                                  className="w-6 h-6 rounded flex items-center justify-center text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotif(alert.id, e)}
                                title={tLayout.deleteNotif[language]}
                                className="w-6 h-6 rounded flex items-center justify-center text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar - Peach / Terracotta matching screenshot with Dropdown */}
            {user && (
              <div ref={profileContainerRef} className="relative shrink-0">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  title={`${user.name} (${user.role})`}
                  className={cn(
                    "w-8 h-8 rounded-full bg-[#E5B69F] text-[#432314] font-bold text-[12px] flex items-center justify-center shadow-xs select-none cursor-pointer transition-all shrink-0 focus:outline-none",
                    isProfileOpen ? "ring-2 ring-[#2563EB]/40 scale-105" : "hover:opacity-90"
                  )}
                >
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 top-11 w-[240px] bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden text-[#0F172A] animate-in fade-in slide-in-from-top-2 duration-150 p-1.5">
                    {/* User Identity Header */}
                    <div className="p-3 bg-[#F8FAFC] rounded-[12px] mb-1">
                      <div className="text-[13px] font-bold text-[#0F172A] truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate mt-0.5 font-mono">
                        @{user.username}
                      </div>
                      <div className="mt-2">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                          {tLayout.roles[user.role as keyof typeof tLayout.roles]?.[language] || user.role}
                        </span>
                      </div>
                    </div>

                    {/* Quick navigation actions */}
                    <div className="space-y-0.5 py-1">
                      <Link
                        href="/access"
                        target={typeof window !== "undefined" && (window as any).electronAPI?.openKioskWindow ? undefined : "_blank"}
                        onClick={(e) => {
                          setIsProfileOpen(false);
                          if (typeof window !== "undefined" && (window as any).electronAPI?.openKioskWindow) {
                            e.preventDefault();
                            (window as any).electronAPI.openKioskWindow();
                          }
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                      >
                        <ScanLine className="w-4 h-4 text-[#64748B]" />
                        <span>{t("nav.kiosk")}</span>
                      </Link>
                      {user.role !== "RECEPTIONIST" && (
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#64748B]" />
                          <span>{t("nav.settings")}</span>
                        </Link>
                      )}
                    </div>

                    <div className="h-[1px] bg-[#F1F5F9] my-1" />

                    {/* Logout button */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors text-left rtl:text-right"
                    >
                      <LogOut className="w-4 h-4 text-[#DC2626]" />
                      <span>{t("nav.logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* 3. Page Content Area inside the Right Floating Card */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-9 space-y-6">
          <div key={pathname} className="page-enter space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Universal F2 Onboarding Wizard Modal */}
      <MemberOnboardingWizardModal
        isOpen={isOnboardWizardOpen}
        onClose={() => setIsOnboardWizardOpen(false)}
        onSuccess={() => {
          routePrewarmMap[pathname]?.forEach((url) => prewarmRoute(url));
        }}
      />
    </div>
  );
}
