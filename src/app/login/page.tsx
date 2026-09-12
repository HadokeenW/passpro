"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/business/Toast";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/desktop/LanguageSelector";
import {
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  UserCheck,
} from "lucide-react";

const APP_SLIDES = [
  {
    image: "/screenshots/dashboard.png",
    badge: "Tableau de Bord",
    title: {
      fr: "Conçu pour votre salle",
      en: "Designed for Gyms & Clubs",
      ar: "مصمم لإدارة الصالات الرياضية",
    },
    sub: {
      fr: "Suivez les passages, gérez vos adhérents et encaissements en temps réel, où que vous soyez !",
      en: "See the analytics and grow your gym data in real time, from anywhere!",
      ar: "تابع الدخول عبر البوابات وأدر المشتركين والاشتراكات في الوقت الفعلي ومن أي مكان!",
    },
  },
  {
    image: "/screenshots/members.png",
    badge: "Gestion Adhérents",
    title: {
      fr: "Fiches adhérents 360°",
      en: "Member 360° Management",
      ar: "ملفات المشتركين والاشتراكات",
    },
    sub: {
      fr: "Enrôlement express, assignation instantanée de badges RFID et historique complet.",
      en: "Express onboarding, instant RFID card assignment, and complete access records.",
      ar: "تسجيل فوري، ربط بطاقات RFID وسجل كامل لجميع العمليات والاشتراكات.",
    },
  },
  {
    image: "/screenshots/access-logs.png",
    badge: "Contrôle d'Accès",
    title: {
      fr: "Journal des passages en direct",
      en: "Real-Time Access Logs",
      ar: "سجل الدخول المباشر للبوابات",
    },
    sub: {
      fr: "Vérification instantanée au badge avec alertes visuelles, sonores et blocage automatique.",
      en: "Instant RFID badge validation with sound alerts and automated gate release.",
      ar: "تحقق لحظي من البطاقات مع تنبيهات صوتية ومرئية وتحكم تلقائي بالبوابات.",
    },
  },
  {
    image: "/screenshots/kiosk.png",
    badge: "Borne Autonome",
    title: {
      fr: "Borne d'accès plein écran",
      en: "Dedicated Turnstile Kiosk",
      ar: "شاشة البوابة الذاتية",
    },
    sub: {
      fr: "Interface dédiée aux tourniquets et barrières pour un flux d'entrée ultra-fluide.",
      en: "High-speed full-screen interface dedicated to automatic turnstiles and gates.",
      ar: "واجهة سريعة كاملة الشاشة مخصصة للتحكم الآلي وتفويج الدخول السلس.",
    },
  },
];

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { t, language } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % APP_SLIDES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const tLabels = {
    designedFor: {
      fr: "Conçu pour votre salle",
      en: "Designed for Individuals & Clubs",
      ar: "مصمم لإدارة الصالات الرياضية",
    },
    designedSub: {
      fr: "Suivez les passages, gérez vos adhérents et encaissements en temps réel, où que vous soyez !",
      en: "See the analytics and grow your data remotely, from anywhere!",
      ar: "تابع الدخول عبر البوابات وأدر المشتركين والاشتراكات في الوقت الفعلي ومن أي مكان!",
    },
    emailLabel: {
      fr: "Identifiant ou Email",
      en: "Email address",
      ar: "اسم المستخدم أو البريد",
    },
    passwordLabel: {
      fr: "Mot de passe",
      en: "Password",
      ar: "كلمة المرور",
    },
    resetPassword: {
      fr: "Mot de passe oublié ?",
      en: "Reset Password",
      ar: "نسيت كلمة المرور؟",
    },
    rememberPassword: {
      fr: "Mémoriser cette session",
      en: "Remember Password",
      ar: "تذكر كلمة المرور",
    },
    loginBtn: {
      fr: "Se connecter",
      en: "Login",
      ar: "تسجيل الدخول",
    },
    noAccount: {
      fr: "Pas encore de compte ?",
      en: "Don't have an account?",
      ar: "ليس لديك حساب؟",
    },
    contactAdmin: {
      fr: "Contacter l'administrateur",
      en: "Sign up",
      ar: "تواصل مع الإدارة",
    },
    demoAccess: {
      fr: "Accès rapide Démo",
      en: "Authorize with Demo",
      ar: "دخول سريع تجريبي",
    },
    errRequired: {
      fr: "Veuillez saisir votre identifiant et mot de passe",
      en: "Please enter your username and password",
      ar: "يرجى إدخال اسم المستخدم وكلمة المرور",
    },
    errInvalid: {
      fr: "Identifiants invalides",
      en: "Invalid credentials",
      ar: "بيانات الدخول غير صحيحة",
    },
    toastSuccess: {
      fr: "Connexion réussie",
      en: "Login successful",
      ar: "تم تسجيل الدخول بنجاح",
    },
    welcome: (name: string) => ({
      fr: `Bienvenue, ${name}`,
      en: `Welcome, ${name}`,
      ar: `مرحباً، ${name}`,
    }),
    roleReception: { fr: "Réception", en: "Reception", ar: "الاستقبال" },
    roleManager: { fr: "Manager", en: "Manager", ar: "مدير" },
    roleAdmin: { fr: "Admin", en: "Admin", ar: "مسؤول" },
  };

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = customUser || username;
    const p = customPass || password;

    if (!u.trim() || !p) {
      setError(tLabels.errRequired[language]);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || tLabels.errInvalid[language]);
      }

      toast.success(tLabels.toastSuccess[language], tLabels.welcome(data.user.name)[language]);

      if (data.user.role === "ACCESS_GUARD") {
        router.push("/access");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || tLabels.errInvalid[language]);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoAccount = (u: string) => {
    setUsername(u);
    setPassword("passpro2026");
    handleLogin(undefined, u, "passpro2026");
  };

  return (
    <div className="min-h-screen bg-[#E5EAF2] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans relative select-none">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <LanguageSelector theme="light" variant="compact" />
      </div>

      {/* Main Split Card */}
      <div className="w-full max-w-[1060px] bg-white rounded-[26px] sm:rounded-[32px] shadow-[0_20px_60px_rgba(15,23,42,0.09)] overflow-hidden flex flex-col lg:flex-row min-h-[580px] lg:min-h-[640px] relative border border-[#E2E8F0]/80">
        {/* ========================================================================= */}
        {/* 1. LEFT PANEL: Faceted Vibrant Blue Hero with Inset Dashboard Window     */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[50%] bg-gradient-to-br from-[#1E52F3] via-[#2463F8] to-[#0A3ECC] relative p-8 sm:p-11 lg:p-13 flex flex-col justify-between overflow-hidden text-white min-h-[420px] lg:min-h-auto">
          {/* Subtle Geometric / Faceted Crystal Overlay Planes */}
          <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay">
            <svg viewBox="0 0 500 500" className="w-full h-full object-cover">
              <polygon points="0,0 260,0 120,320 0,200" fill="rgba(255,255,255,0.4)" />
              <polygon points="260,0 500,0 500,280 280,180" fill="rgba(255,255,255,0.2)" />
              <polygon points="120,320 280,180 500,280 400,500 0,500" fill="rgba(0,0,0,0.25)" />
              <polygon points="0,200 120,320 0,500" fill="rgba(0,0,0,0.15)" />
              <polygon points="280,180 500,280 500,500 400,500" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>

          {/* Top: Logo Icon & Header Text */}
          <div className="relative z-10">
            {/* Logo Mark: Minimalist rounded icon with letter P */}
            <div className="w-10 h-10 rounded-[12px] bg-white text-[#1E52F3] flex items-center justify-center font-black text-[20px] shadow-md shadow-blue-900/30 mb-6 sm:mb-8">
              <span className="relative -top-0.5">P</span>
            </div>

            <h1 className="text-[25px] sm:text-[31px] font-semibold text-white tracking-tight leading-tight max-w-[360px] transition-all duration-300">
              {APP_SLIDES[currentSlide].title[language]}
            </h1>
            <p className="text-white/85 text-[13px] sm:text-[14px] leading-relaxed max-w-[340px] mt-2.5 font-normal transition-all duration-300 min-h-[44px]">
              {APP_SLIDES[currentSlide].sub[language]}
            </p>

            {/* Pagination / Slide indicator (Clickable Dash + Dots) */}
            <div className="flex items-center gap-1.5 mt-4">
              {APP_SLIDES.map((slide, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                    currentSlide === idx
                      ? "w-6 bg-white shadow-sm"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={slide.badge}
                  title={slide.badge}
                />
              ))}
            </div>
          </div>

          {/* Bottom Right: Peeking Real App Screenshots Window */}
          <div className="relative mt-8 lg:mt-0 z-10 translate-x-4 sm:translate-x-6 lg:translate-x-8 translate-y-3 sm:translate-y-4 lg:translate-y-6">
            {/* Floating Feature Badge */}
            <div className="absolute -top-3 right-8 sm:right-14 z-30 flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-white/60 text-[#0F172A] text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#1E52F3] font-semibold">{APP_SLIDES[currentSlide].badge}</span>
            </div>

            {/* Inset Window Container */}
            <div className="w-[320px] sm:w-[390px] lg:w-[450px] bg-[#0F172A] rounded-tl-[20px] shadow-2xl overflow-hidden border-t border-l border-white/35 flex flex-col">
              {/* Window Header */}
              <div className="bg-[#0B1329] px-3.5 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-[11px] font-medium text-slate-300 ml-2 font-mono">
                    PASSPro • {APP_SLIDES[currentSlide].badge}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {currentSlide + 1} / {APP_SLIDES.length}
                  </span>
                </div>
              </div>

              {/* Crossfading Real App Screenshot Container */}
              <div className="relative w-full h-[205px] sm:h-[240px] lg:h-[270px] bg-slate-900 overflow-hidden">
                {APP_SLIDES.map((slide, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      currentSlide === idx
                        ? "opacity-100 z-10 pointer-events-auto"
                        : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img
                      src={slide.image}
                      alt={slide.badge}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. RIGHT PANEL: Clean Crisp White Auth Form                              */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[50%] bg-white p-7 sm:p-10 lg:p-14 flex flex-col justify-center">
          <div className="max-w-[380px] w-full mx-auto">
            {/* Heading */}
            <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#0F172A] tracking-tight mb-7">
              {tLabels.loginBtn[language] === "Se connecter" ? "Connexion" : "Login"}
            </h2>

            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[13px] text-[#DC2626] mb-5 flex items-center gap-2 animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              {/* Email / Username */}
              <div>
                <label className="block text-[13px] font-medium text-[#475569] mb-1.5">
                  {tLabels.emailLabel[language]}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@mail.com"
                  required
                  autoFocus
                  className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#CBD5E1] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">
                    {tLabels.passwordLabel[language]}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      toast.info(
                        language === "ar" ? "إعادة تعيين كلمة المرور" : "Réinitialisation",
                        language === "ar"
                          ? "اتصل بالمسؤول أو استخدم أحد حسابات التجربة السريعة أدناه."
                          : "Contactez l'administrateur ou utilisez les comptes de démonstration rapide ci-dessous."
                      );
                    }}
                    className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
                  >
                    {tLabels.resetPassword[language]}
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full h-[46px] pl-3.5 pr-10 rounded-[10px] border border-[#CBD5E1] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Password Checkbox */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-blue-200 cursor-pointer"
                  />
                  <span className="text-[13px] font-medium text-[#475569]">
                    {tLabels.rememberPassword[language]}
                  </span>
                </label>
              </div>

              {/* Main Submit Button (Solid Royal Blue pill) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[48px] mt-2 bg-[#2557EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-[10px] shadow-sm shadow-blue-600/20 active:scale-[0.99] transition-all text-[15px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{tLabels.loginBtn[language]}</span>
                )}
              </button>
            </form>

            {/* Don't have an account */}
            <div className="text-center text-[13px] text-[#64748B] mt-5">
              <span>{tLabels.noAccount[language]} </span>
              <button
                type="button"
                onClick={() => {
                  toast.info(
                    language === "ar" ? "إنشاء حساب" : "Nouveau compte",
                    language === "ar"
                      ? "يتطلب إنشاء حساب جديد تدخل مسؤول النادي عبر لوحة الإعدادات."
                      : "La création de compte opérateur s'effectue par l'administrateur dans les paramètres."
                  );
                }}
                className="text-[#2563EB] font-medium hover:underline cursor-pointer"
              >
                {tLabels.contactAdmin[language]}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <div className="relative flex justify-center text-[12px]">
                <span className="bg-white px-3 text-[#94A3B8] font-medium">or</span>
              </div>
            </div>

            {/* Secondary Option: 1-Click Demo Logins */}
            <div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoAccount("reception")}
                  className="h-[44px] flex flex-col items-center justify-center bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[10px] transition-all cursor-pointer group"
                >
                  <span className="text-[12px] font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                    {tLabels.roleReception[language]}
                  </span>
                  <span className="text-[9.5px] text-[#94A3B8]">reception</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("manager")}
                  className="h-[44px] flex flex-col items-center justify-center bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[10px] transition-all cursor-pointer group"
                >
                  <span className="text-[12px] font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                    {tLabels.roleManager[language]}
                  </span>
                  <span className="text-[9.5px] text-[#94A3B8]">manager</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("admin")}
                  className="h-[44px] flex flex-col items-center justify-center bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[10px] transition-all cursor-pointer group"
                >
                  <span className="text-[12px] font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                    {tLabels.roleAdmin[language]}
                  </span>
                  <span className="text-[9.5px] text-[#94A3B8]">admin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

