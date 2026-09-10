import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { HeatmapBucket } from "@/server/services/dashboard";

interface HeatmapProps {
  buckets?: HeatmapBucket[];
  className?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({ buckets = [], className }) => {
  const [hovered, setHovered] = useState<HeatmapBucket | null>(null);

  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const slotLabels = [
    "06–08", "08–10", "10–12", "12–14", "14–16", "16–18",
    "18–20", "20–22", "22–24", "00–02", "02–04", "04–06"
  ];

  function getCellColor(count: number): string {
    if (count === 0) return "bg-[#F1F5F9]";
    if (count <= 4) return "bg-[#DBEAFE]";
    if (count <= 9) return "bg-[#93C5FD]";
    if (count <= 14) return "bg-[#3B82F6]";
    return "bg-[#1D4ED8]";
  }

  // Create a 7x12 matrix from buckets
  const matrix: (HeatmapBucket | null)[][] = Array.from({ length: 7 }, () =>
    Array(12).fill(null)
  );

  for (const b of buckets) {
    if (b.dayIndex >= 0 && b.dayIndex < 7 && b.slotIndex >= 0 && b.slotIndex < 12) {
      matrix[b.dayIndex][b.slotIndex] = b;
    }
  }

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[500px]">
          {/* Days rows */}
          <div className="flex flex-col gap-1.5">
            {matrix.map((row, dayIdx) => (
              <div key={dayIdx} className="flex items-center gap-2">
                <span className="w-8 text-[12px] font-medium text-[#64748B] text-right shrink-0">
                  {dayLabels[dayIdx]}
                </span>
                <div className="flex items-center gap-1.5 flex-1">
                  {row.map((bucket, slotIdx) => {
                    const count = bucket?.count || 0;
                    return (
                      <div
                        key={slotIdx}
                        onMouseEnter={() =>
                          setHovered(
                            bucket || {
                              dayIndex: dayIdx,
                              slotIndex: slotIdx,
                              dayLabel: dayLabels[dayIdx],
                              slotLabel: slotLabels[slotIdx],
                              count: 0,
                            }
                          )
                        }
                        onMouseLeave={() => setHovered(null)}
                        className={cn(
                          "flex-1 h-7 min-w-[24px] max-w-[36px] rounded-[6px] transition-transform duration-100 hover:scale-110 cursor-pointer shadow-xs",
                          getCellColor(count)
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Slot labels */}
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 shrink-0" />
            <div className="flex items-center gap-1.5 flex-1 text-[11px] text-[#94A3B8]">
              {slotLabels.map((slot, idx) => (
                <div key={idx} className="flex-1 text-center truncate">
                  {idx % 2 === 0 ? slot.split("–")[0] + "h" : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip bar and legend */}
      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-[12px]">
        <div className="text-[#0F172A] font-medium h-5 flex items-center">
          {hovered ? (
            <span>
              <strong className="font-semibold">{hovered.dayLabel}</strong> · {hovered.slotLabel} h ·{" "}
              <span className="nums font-bold text-[#2563EB]">{hovered.count}</span> passage
              {hovered.count > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-[#94A3B8]">Survolez un créneau pour voir le détail</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <span className="text-[11px]">Moins</span>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-[#F1F5F9]" />
          <div className="w-3.5 h-3.5 rounded-[3px] bg-[#DBEAFE]" />
          <div className="w-3.5 h-3.5 rounded-[3px] bg-[#93C5FD]" />
          <div className="w-3.5 h-3.5 rounded-[3px] bg-[#3B82F6]" />
          <div className="w-3.5 h-3.5 rounded-[3px] bg-[#1D4ED8]" />
          <span className="text-[11px]">Plus</span>
        </div>
      </div>
    </div>
  );
};
