import React, { useState } from "react";
import { Player, TimeSlotAnalysis } from "../types";
import { MinecraftAvatar } from "./MinecraftAvatar";
import { formatTimeLabel, TOTAL_SLOTS, slotToHours } from "../utils/scheduler";
import { Users, Filter, CheckCircle2, XCircle } from "lucide-react";

interface HeatmapViewProps {
  players: Player[];
  slotAnalysis: TimeSlotAnalysis[];
  optimalStart?: number;
  optimalEnd?: number;
}

export function HeatmapView({ players, slotAnalysis, optimalStart, optimalEnd }: HeatmapViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Helper check if slot is within current optimal highlight
  const isSlotInOptimalRange = (slotIdx: number) => {
    if (optimalStart === undefined || optimalEnd === undefined) return false;
    const hour = slotToHours(slotIdx);
    return hour >= optimalStart - 0.001 && hour < optimalEnd - 0.001;
  };

  const activeAnalysis = selectedSlot !== null ? slotAnalysis[selectedSlot] : null;

  return (
    <div className="bg-[#14161c] border border-white/5 p-6 rounded-xl shadow-2xl space-y-6" id="heatmap-view-container">
      
      {/* Title & Stats HUD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
        <div>
          <h3 className="font-sans text-xl font-bold text-white uppercase italic tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7CFF4D]" />
            Сетка онлайна сквада
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Наглядная тепловая карта пересечений свободного времени всех участников.
          </p>
        </div>
        
        {/* Key indicator */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-[#7CFF4D]/30 border border-[#7CFF4D]/40 rounded" />
            <span>Свободный слот</span>
          </div>
          {optimalStart !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#7CFF4D]/10 border-2 border-dashed border-[#7CFF4D] rounded animate-pulse" />
              <span className="text-[#7CFF4D] font-bold">Оптимальное окно</span>
            </div>
          )}
        </div>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl" id="no-players-placeholder">
          <p className="text-slate-500 font-sans text-sm">Добавьте участников, чтобы построить синергию времени!</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Main comparative grid panel */}
          <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-800">
            <div className="min-w-[768px] space-y-2 select-none">
              
              {/* Timeline marker headers */}
              <div className="flex items-center">
                <div className="w-40 pr-4 shrink-0 text-right text-xs font-bold text-slate-500 font-mono uppercase tracking-widest">
                  УЧАСТНИК
                </div>
                <div className="flex-1 flex justify-between text-[10px] text-slate-500 font-mono px-0.5 font-bold uppercase tracking-widest">
                  <span>00:00</span>
                  <span>03:00</span>
                  <span>06:00</span>
                  <span>09:00</span>
                  <span>12:00</span>
                  <span>15:00</span>
                  <span>18:00</span>
                  <span>21:00</span>
                  <span>24:00</span>
                </div>
              </div>

              {/* Individual Rows */}
              {players.map((player) => (
                <div key={player.id} className="flex items-center group/row" id={`heatmap-row-${player.id}`}>
                  {/* Player header */}
                  <div className="w-40 pr-4 shrink-0 flex items-center gap-2 justify-end">
                    <MinecraftAvatar name={player.name} size={28} className="border border-white/5" />
                    <span
                      className="text-xs font-semibold truncate max-w-[100px] font-sans"
                      style={{ color: player.color }}
                      title={player.name}
                    >
                      {player.name}
                    </span>
                  </div>

                  {/* Player 48 grid slots */}
                  <div className="flex-1 h-7 flex bg-[#0c0d10] border border-white/5 rounded-md overflow-hidden relative">
                    {Array.from({ length: TOTAL_SLOTS }).map((_, slotIdx) => {
                      const hour = slotToHours(slotIdx);
                      const isAvailable = player.intervals.some(interval => {
                        return hour >= interval.start - 0.001 && hour < interval.end - 0.001;
                      });
                      
                      const isOptimal = isSlotInOptimalRange(slotIdx);

                      return (
                        <div
                          key={slotIdx}
                          className={`flex-1 border-r border-[#14161c] relative group transition-all duration-150 ${
                            isAvailable 
                              ? "opacity-90 cursor-pointer" 
                              : "opacity-10 cursor-pointer"
                          }`}
                          style={{
                            backgroundColor: isAvailable ? player.color : "transparent",
                          }}
                          onPointerOver={() => setSelectedSlot(slotIdx)}
                          onClick={() => setSelectedSlot(slotIdx)}
                          title={`${player.name}: ${formatTimeLabel(hour)} - ${isAvailable ? "Свободен" : "Занят"}`}
                        >
                          {/* Inner overlay highlighting optimal selected range */}
                          {isOptimal && (
                            <div className="absolute inset-0 border-t-2 border-b-2 border-dashed border-[#7CFF4D] bg-[#7CFF4D]/15" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="h-4" /> {/* spacing */}

              {/* AGGREGATED HEAT BAR ROW */}
              <div className="flex items-center border-t border-white/5 pt-3">
                <div className="w-40 pr-4 shrink-0 text-right text-xs font-black text-[#7CFF4D] font-mono tracking-wider italic uppercase">
                  СИНЕРГИЯ СКВАДА
                </div>
                
                {/* 48 accumulated blocks */}
                <div className="flex-1 h-9 flex bg-[#0c0d10] border border-white/10 rounded-md overflow-hidden" id="aggregate-heatbar-grid">
                  {slotAnalysis.map((analysis, slotIdx) => {
                    const isOptimal = isSlotInOptimalRange(slotIdx);
                    
                    // Heat score mapping (consistent neon Minecraft green style)
                    const ratio = players.length > 0 ? analysis.count / players.length : 0;
                    
                    // Minecraft themed gold and green scale
                    let bgStyle = { backgroundColor: "transparent" };
                    if (analysis.count > 0) {
                      if (ratio === 1) {
                        bgStyle = { backgroundColor: "#7CFF4D" }; // 100% XP green!
                      } else if (ratio >= 0.7) {
                        bgStyle = { backgroundColor: "#5ec13b" }; // High synergy
                      } else if (ratio >= 0.4) {
                        bgStyle = { backgroundColor: "#3a7f23" }; // Medium synergy
                      } else {
                        bgStyle = { backgroundColor: "#224f14" }; // Low synergy
                      }
                    }

                    return (
                      <div
                        key={slotIdx}
                        className={`flex-1 border-r border-[#14161c] cursor-pointer relative flex items-center justify-center transition-all ${
                          selectedSlot === slotIdx ? "ring-2 ring-[#7CFF4D] z-10 scale-y-110" : ""
                        }`}
                        style={{
                          ...bgStyle,
                          opacity: analysis.count === 0 ? 0.05 : 0.95
                        }}
                        onPointerOver={() => setSelectedSlot(slotIdx)}
                        onClick={() => setSelectedSlot(slotIdx)}
                      >
                        {/* Show count number only on block hover or if ratio is high */}
                        {analysis.count > 0 && (
                          <span className="text-[9px] font-black text-black pointer-events-none select-none font-mono">
                            {analysis.count}
                          </span>
                        )}
                        
                        {/* Highlight optimal window range */}
                        {isOptimal && (
                          <div className="absolute inset-0 border-t-2 border-b-2 border-white bg-white/10" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Details Card on Hover / Clicking individual slots */}
          <div className="bg-[#0c0d10] p-4 rounded-lg border border-white/5 text-sm">
            {activeAnalysis ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="slot-detail-badge">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-[#7CFF4D]/10 text-[#7CFF4D] border border-[#7CFF4D]/25 font-mono font-bold rounded text-xs">
                    {formatTimeLabel(activeAnalysis.time)} - {formatTimeLabel(activeAnalysis.time + 0.5)}
                  </span>
                  <div className="text-slate-300 font-sans">
                     Планы сквада: <strong className="text-[#7CFF4D] font-bold">{activeAnalysis.count}</strong> из <strong>{players.length}</strong> игроков
                  </div>
                </div>
                
                {/* Micro listing avatars of who is free/busy */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {players.map(p => {
                    const isFreed = activeAnalysis.availablePlayers.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all ${
                          isFreed 
                            ? "bg-[#7CFF4D]/10 text-[#7CFF4D] border border-[#7CFF4D]/20" 
                            : "bg-red-950/10 text-red-500/40 border border-red-500/10 line-through"
                        }`}
                      >
                        <MinecraftAvatar name={p.name} size={14} />
                        <span>{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs text-center flex items-center justify-center gap-2 py-1 uppercase tracking-wider font-bold">
                <Filter className="w-4 h-4 text-slate-600 animate-pulse" />
                Наведите курсор на сетку, чтобы увидеть поимённый список свободных игроков!
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
