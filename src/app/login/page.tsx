"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/business/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = customUser || username;
    const p = customPass || password;

    if (!u.trim() || !p) {
      setError("Veuillez saisir votre identifiant et mot de passe");
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
        throw new Error(data.error?.message || "Identifiants invalides");
      }

      toast.success("Connexion réussie", `Bienvenue, ${data.user.name}`);

      if (data.user.role === "ACCESS_GUARD") {
        router.push("/access");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Identifiants invalides");
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
    <div className="min-h-screen bg-[#EEF2F7] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      {/* Outer Curved Container with Vibrant Blue Gradient */}
      <div className="w-full max-w-[1040px] bg-gradient-to-br from-[#0052D4] via-[#246BFD] to-[#3B82F6] rounded-[36px] sm:rounded-[42px] p-6 sm:p-10 lg:p-14 shadow-[0_30px_70px_rgba(0,82,212,0.22)] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 min-h-[580px]">
        {/* Abstract organic curve shapes matching reference design */}
        <div className="absolute -bottom-28 -left-28 w-[380px] h-[380px] rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute top-1/2 -left-12 w-[260px] h-[260px] rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -top-32 right-1/3 w-[340px] h-[340px] rounded-full bg-blue-400/25 blur-3xl pointer-events-none" />

        {/* 1. Left Welcome Content */}
        <div className="flex-1 text-white relative z-10 text-center lg:text-left py-4">
          <h1 className="text-[34px] sm:text-[46px] font-black tracking-widest leading-tight uppercase">
            WELCOME
          </h1>
          <h2 className="text-[12.5px] sm:text-[14px] font-extrabold uppercase tracking-[0.2em] text-white/90 mt-2">
            PASSPro · GESTION DE SALLE & ACCÈS RFID
          </h2>
          <p className="text-white/80 text-[14px] sm:text-[15px] leading-relaxed max-w-[380px] mt-4 font-normal mx-auto lg:mx-0">
            Plateforme tout-en-un pour la gestion de vos adhérents, formules d'abonnements, encaissements et contrôle d'accès en temps réel.
          </p>
        </div>

        {/* 2. Right Floating White Card (Sign in) */}
        <div className="w-full lg:w-[450px] bg-white rounded-[28px] p-7 sm:p-9 shadow-2xl relative z-10 shrink-0 text-left">
          <div className="mb-6">
            <h3 className="text-[28px] sm:text-[32px] font-black text-[#0F172A] tracking-tight">
              Sign in
            </h3>
            <p className="text-[13px] text-[#64748B] mt-1">
              Veuillez saisir vos identifiants pour continuer
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] text-[13px] text-[#DC2626] mb-4 flex items-center gap-2 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            {/* User Name input */}
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="User Name"
                required
                autoFocus
                className="w-full h-12 px-4 rounded-[14px] border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            {/* Password input with SHOW/HIDE toggle */}
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full h-12 pl-4 pr-16 rounded-[14px] border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[12px] font-bold text-[#2563EB] hover:text-[#1D4ED8] tracking-wider uppercase select-none transition-colors"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            {/* Checkbox row: Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-blue-200 cursor-pointer"
                />
                <span className="text-[13px] font-medium text-[#475569]">
                  Remember me
                </span>
              </label>
              <span
                onClick={() => setDemoAccount("admin")}
                className="text-[12px] font-medium text-[#64748B] hover:text-[#2563EB] cursor-pointer transition-colors"
              >
                Forgot Password?
              </span>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-3 bg-gradient-to-r from-[#0052D4] to-[#2563EB] hover:from-[#0047B8] hover:to-[#1D4ED8] text-white font-bold rounded-[14px] shadow-lg shadow-blue-500/25 transition-all text-[15px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Quick 1-click Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#94A3B8] mb-2.5">
              Comptes de démonstration (1 clic) :
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount("reception")}
                className="p-2 text-left bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-[10px] transition-all group cursor-pointer"
              >
                <div className="text-[11.5px] font-bold text-[#0F172A] group-hover:text-[#2563EB]">
                  Réception
                </div>
                <div className="text-[10px] text-[#64748B]">reception</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("manager")}
                className="p-2 text-left bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-[10px] transition-all group cursor-pointer"
              >
                <div className="text-[11.5px] font-bold text-[#0F172A] group-hover:text-[#2563EB]">
                  Manager
                </div>
                <div className="text-[10px] text-[#64748B]">manager</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("admin")}
                className="p-2 text-left bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-[10px] transition-all group cursor-pointer"
              >
                <div className="text-[11.5px] font-bold text-[#0F172A] group-hover:text-[#2563EB]">
                  Admin
                </div>
                <div className="text-[10px] text-[#64748B]">admin</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
