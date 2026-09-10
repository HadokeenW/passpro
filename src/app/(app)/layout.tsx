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
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";

import { getCachedData, setCachedData, prewarmRoute, prewarmAllCoreRoutes } from "@/lib/cache";

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
  const cachedMe = getCachedData<any>("/api/auth/me");
  const [user, setUser] = useState<UserInfo | null>(() => cachedMe?.user || null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState(() => !cachedMe?.user);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prevPathRef = useRef(pathname);

  // Smooth route transition indicator
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setIsNavigating(true);
      const timer = setTimeout(() => setIsNavigating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

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
          setTimeout(() => prewarmAllCoreRoutes(), 300);
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
          setIsSearchOpen(true);
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
      label: "Exploitation",
      items: [
        { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
        { href: "/access", label: "Borne d'accès", icon: ScanLine, isExternal: true },
        { href: "/access-logs", label: "Journal des passages", icon: History },
      ],
    },
    {
      label: "Gestion",
      items: [
        { href: "/members", label: "Adhérents", icon: Users },
        { href: "/subscriptions", label: "Abonnements", icon: CalendarCheck },
        { href: "/plans", label: "Formules", icon: Tags },
        { href: "/cards", label: "Cartes RFID", icon: CreditCard },
      ],
    },
    {
      label: "Finances",
      items: [{ href: "/payments", label: "Caisse", icon: Receipt }],
    },
    ...(user?.role === "RECEPTIONIST"
      ? []
      : [
          {
            label: "Système",
            items: [{ href: "/settings", label: "Paramètres", icon: Settings }],
          },
        ]),
  ];

  const getBreadcrumbs = () => {
    if (pathname === "/") return "Exploitation / Tableau de bord";
    if (pathname.startsWith("/members/")) return "Gestion / Adhérents / Dossier 360°";
    if (pathname.startsWith("/members")) return "Gestion / Adhérents";
    if (pathname.startsWith("/subscriptions")) return "Gestion / Abonnements";
    if (pathname.startsWith("/plans")) return "Gestion / Formules tarifaires";
    if (pathname.startsWith("/cards")) return "Gestion / Cartes RFID";
    if (pathname.startsWith("/payments")) return "Finances / Caisse";
    if (pathname.startsWith("/access-logs")) return "Exploitation / Journal des passages";
    if (pathname.startsWith("/settings")) return "Système / Paramètres";
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
        <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-[#2563EB] z-[100] animate-pulse shadow-sm shadow-blue-500/50" />
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
                        target="_blank"
                        onClick={() => setMobileMenuOpen(false)}
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
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={() => {
                        router.prefetch(item.href);
                        routePrewarmMap[item.href]?.forEach((url) => prewarmRoute(url));
                      }}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-[16px] text-[13.5px] font-medium transition-all select-none",
                        isActive
                          ? "bg-[#F1F5F9] text-[#0F172A] font-bold shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors",
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
            title="Se déconnecter"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[16px] text-[13.5px] font-medium text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2]/60 transition-all group"
          >
            <LogOut className="w-4 h-4 text-[#94A3B8] group-hover:text-[#DC2626] transition-colors" />
            <span>Déconnexion</span>
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
            <div ref={searchContainerRef} className="relative flex-1 max-w-[340px]">
              <div className="flex items-center text-[#94A3B8] focus-within:text-[#0F172A] transition-colors">
                <Search className="w-4 h-4 mr-2.5 shrink-0 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setIsSearchOpen(true);
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      setIsSearchOpen(false);
                      if (searchResults?.members && searchResults.members.length > 0) {
                        router.push(`/members/${searchResults.members[0].id}`);
                      } else {
                        router.push(`/members?q=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    } else if (e.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                  className="w-full bg-transparent text-[13.5px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                    className="text-[#94A3B8] hover:text-[#0F172A] p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown Palette */}
              {isSearchOpen && (
                <div className="absolute top-9 left-0 w-[380px] bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden text-[#0F172A] animate-in fade-in slide-in-from-top-2 duration-150">
                  {isSearching ? (
                    <div className="p-4 text-center text-[13px] text-[#64748B]">
                      Recherche en cours...
                    </div>
                  ) : !hasSearchResults ? (
                    <div className="p-5 text-center">
                      <p className="text-[13px] font-medium text-[#0F172A]">
                        Aucun résultat pour « {searchQuery} »
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Essayez avec un nom, numéro de téléphone ou UID de carte
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F1F5F9]">
                      {/* Members group */}
                      {searchResults.members.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                            Adhérents ({searchResults.members.length})
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.members.map((m) => {
                              const sub = m.subscriptions?.[0];
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    setIsSearchOpen(false);
                                    router.push(`/members/${m.id}`);
                                  }}
                                  className="w-full text-left p-2 rounded-[10px] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors group"
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
                                        {m.phone || "Sans téléphone"}
                                        {m.cards?.[0] && ` · Badge: ${m.cards[0].uid}`}
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
                                      {sub.status === "ACTIVE" ? "Actif" : "Expiré"}
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
                            Badges RFID ({searchResults.cards.length})
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.cards.map((c) => (
                              <button
                                key={c.uid}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  if (c.member?.id) {
                                    router.push(`/members/${c.member.id}`);
                                  } else {
                                    router.push(`/cards?q=${encodeURIComponent(c.uid)}`);
                                  }
                                }}
                                className="w-full text-left p-2 rounded-[10px] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors group"
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
                                  {c.status}
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
                            Formules ({searchResults.plans.length})
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.plans.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  router.push("/plans");
                                }}
                                className="w-full text-left p-2 rounded-[10px] hover:bg-[#F8FAFC] flex items-center justify-between transition-colors group"
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
                          onClick={() => {
                            setIsSearchOpen(false);
                            router.push(`/members?q=${encodeURIComponent(searchQuery.trim())}`);
                          }}
                          className="w-full py-1.5 px-2 text-center text-[12px] font-semibold text-[#2563EB] hover:underline flex items-center justify-center gap-1"
                        >
                          <span>Voir tous les résultats pour « {searchQuery} »</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
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
                title="Notifications"
              >
                <BellRing className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EA580C] rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-11 w-[380px] bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden text-[#0F172A] animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Popover Header */}
                  <div className="p-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-[#0F172A]">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] rounded-full border border-[#DBEAFE]">
                          {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          title="Tout marquer comme lu"
                          className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:bg-white px-2 py-1 rounded transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Tout lire</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={handleDeleteAllNotifs}
                          title="Supprimer toutes les notifications"
                          className="flex items-center gap-1 text-[11px] font-medium text-[#DC2626] hover:text-[#B91C1C] hover:bg-white px-2 py-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Effacer</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Popover List Body */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F1F5F9]">
                    {isLoadingNotifs ? (
                      <div className="p-8 text-center text-[13px] text-[#64748B]">
                        Chargement des alertes...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-2">
                          <BellRing className="w-5 h-5" />
                        </div>
                        <p className="text-[13px] font-semibold text-[#0F172A]">
                          Aucune notification
                        </p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Toutes les alertes d'accès et d'abonnements sont traitées
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
                                  title="Marquer comme lu"
                                  className="w-6 h-6 rounded flex items-center justify-center text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotif(alert.id, e)}
                                title="Supprimer cette notification"
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
                  <div className="absolute right-0 top-11 w-[240px] bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden text-[#0F172A] animate-in fade-in slide-in-from-top-2 duration-150 p-1.5">
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
                          {user.role === "ADMIN"
                            ? "Administrateur"
                            : user.role === "MANAGER"
                            ? "Responsable"
                            : user.role === "RECEPTIONIST"
                            ? "Réceptionniste"
                            : user.role}
                        </span>
                      </div>
                    </div>

                    {/* Quick navigation actions */}
                    <div className="space-y-0.5 py-1">
                      <Link
                        href="/access"
                        target="_blank"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                      >
                        <ScanLine className="w-4 h-4 text-[#64748B]" />
                        <span>Borne d'accès</span>
                      </Link>
                      {user.role !== "RECEPTIONIST" && (
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#64748B]" />
                          <span>Paramètres</span>
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-[#DC2626]" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* 3. Page Content Area inside the Right Floating Card */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-9 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
