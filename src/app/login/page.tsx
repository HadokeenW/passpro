"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/business/Button";
import { Field } from "@/components/business/Field";
import { useToast } from "@/components/business/Toast";
import { Lock, Shield, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-[12px] bg-[#2563EB] flex items-center justify-center text-white shadow-md mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <div className="text-[24px] font-bold text-[#0F172A] tracking-tight">
            PASS<span className="text-[#2563EB]">Pro</span>
          </div>
          <p className="text-[14px] text-[#64748B] mt-1">
            Gestion de club & Contrôle d'accès RFID
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
          <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">
            Connexion opérateur
          </h2>

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] text-[13px] text-[#DC2626] mb-4">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="flex flex-col gap-4">
            <Field
              label="Identifiant"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: admin, manager, reception"
              autoFocus
              required
            />

            <Field
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Se connecter
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-2.5">
              Comptes de démonstration (1 clic) :
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount("reception")}
                className="p-2 text-left bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-[6px] transition-colors"
              >
                <div className="text-[12px] font-semibold text-[#0F172A]">Réception</div>
                <div className="text-[10px] text-[#64748B]">reception</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("manager")}
                className="p-2 text-left bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-[6px] transition-colors"
              >
                <div className="text-[12px] font-semibold text-[#0F172A]">Manager</div>
                <div className="text-[10px] text-[#64748B]">manager</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("admin")}
                className="p-2 text-left bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-[6px] transition-colors"
              >
                <div className="text-[12px] font-semibold text-[#0F172A]">Admin</div>
                <div className="text-[10px] text-[#64748B]">admin</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[12px] text-[#94A3B8]">
          PASSPro On-Premise · Mini-PC LAN Edition
        </div>
      </div>
    </div>
  );
}
