import React from "react";
import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";

interface BadgeRFIDProps {
  memberName: string;
  uid: string;
  status: "ACTIVE" | "BLOCKED" | "UNASSIGNED";
  className?: string;
}

export const BadgeRFID: React.FC<BadgeRFIDProps> = ({
  memberName,
  uid,
  status,
  className,
}) => {
  const isBlocked = status === "BLOCKED";

  return (
    <div
      className={cn(
        "relative w-[320px] h-[202px] rounded-[12px] p-5 text-white overflow-hidden select-none shadow-[0_4px_12px_rgba(15,23,42,0.12)] border border-[rgba(255,255,255,0.15)] flex flex-col justify-between",
        className
      )}
      style={{
        background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
      }}
    >
      {/* RFID Wave Pattern in top-right */}
      <div className="absolute top-4 right-4 pointer-events-none opacity-20">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="64" cy="0" r="18" stroke="white" strokeWidth="2.5" />
          <circle cx="64" cy="0" r="32" stroke="white" strokeWidth="2.5" />
          <circle cx="64" cy="0" r="46" stroke="white" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Static diagonal sheen reflection */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
        }}
      />

      {/* Header: Member Name & PASSPro Chip Logo */}
      <div className="relative z-10">
        <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-blue-200 opacity-80">
          PASSPro Card
        </div>
        <div className="text-[16px] font-semibold text-white tracking-wide mt-1 truncate max-w-[210px]">
          {memberName || "CARTE EN STOCK"}
        </div>
      </div>

      {/* Chip visual indicator */}
      <div className="relative z-10 w-10 h-7 rounded-[4px] bg-[#E2E8F0] opacity-90 border border-white/40 flex items-center justify-center">
        <div className="w-6 h-4 border border-black/20 rounded-[2px] grid grid-cols-2 gap-0.5 p-0.5">
          <div className="bg-black/10 rounded-[1px]" />
          <div className="bg-black/10 rounded-[1px]" />
        </div>
      </div>

      {/* Footer: UID & Pill */}
      <div className="relative z-10 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-blue-200 opacity-75 mb-0.5">
            UID RFID
          </div>
          <div className="text-[14px] font-semibold font-mono-code text-white tracking-[0.12em]">
            {uid}
          </div>
        </div>

        <div>
          <StatusPill status={status} />
        </div>
      </div>

      {/* Blocked state overlay */}
      {isBlocked && (
        <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
          <div className="w-full bg-[#DC2626] text-white py-1.5 px-4 text-center font-bold text-[13px] tracking-[0.15em] shadow-md transform -rotate-6 uppercase">
            CARTE BLOQUÉE
          </div>
        </div>
      )}
    </div>
  );
};
