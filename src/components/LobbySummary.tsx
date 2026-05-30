import React, { useState } from "react";
import { Player, OptimalIntervalResult } from "../types";
import { formatTimeLabel } from "../utils/scheduler";
import { MinecraftAvatar } from "./MinecraftAvatar";
import { Calendar, Award, Copy, Check, Clock, TrendingUp, HelpCircle } from "lucide-react";

interface LobbySummaryProps {
  players: Player[];
  duration: number;
  onDurationChange: (duration: number) => void;
  optimalIntervals: OptimalIntervalResult[];
}

export function LobbySummary({ players, duration, onDurationChange, optimalIntervals }: LobbySummaryProps) {
  const [copied, setCopied] = useState(false);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number>(0);

  const bestOption = optimalIntervals[selectedOptionIdx] || null;

  // Format Copy-To-Clipboard text
  const handleCopyAnnouncement = () => {
    if (!bestOption) return;
    
    // Get attending players
    const activeNames = players
      .filter(p => {
        // Did they fit this entire block?
        return p.intervals.some(interval => {
          return interval.start <= bestOption.start + 0.001 && interval.end >= bestOption.end - 0.001;
        });
      })
      .map(p => p.name);

    const missingNames = players
      .filter(p => !activeNames.includes(p.name))
      .map(p => p.name);

    const emojiHeader = "🎮⛏️ **MINECRAFT СЕССИЯ В ВОСКРЕСЕНЬЕ** ⛏️🎮\n";
    const timeBody = `⏰ **Время**: ${formatTimeLabel(bestOption.start)} — ${formatTimeLabel(bestOption.end)} (${duration} ч.)\n`;
    const playersBody = `👥 **Смогут зайти (${activeNames.length}/${players.length})**: ${activeNames.join(", ")}\n`;
    const missingBody = missingNames.length > 0 ? `⚠️ **Не успевают**: ${missingNames.join(", ")}\n` : "✅ **Собрались Абсолютно Все!**\n";
    const footer = "\nПогнали выживать! Подтвердите плюсом в ответ 👍";

    const textToCopy = `${emojiHeader}${timeBody}${playersBody}${missingBody}${footer}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  return (
    <div className="bg-[#14161c] border border-white/5 p-6 rounded-xl shadow-2xl space-y-6" id="session-summary-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-sans text-xl font-bold text-white uppercase italic tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#7CFF4D] animate-bounce" />
            Оптимальный сеанс игры
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Алгоритм проанализировал расписание и определил золотое сечение сквада.
          </p>
        </div>

        {/* Target Session Duration selector */}
        <div className="flex items-center gap-2 bg-[#0c0d10] p-1.5 rounded-lg border border-white/5">
          <span className="text-xs font-mono font-bold text-slate-500 px-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#7CFF4D]" /> Сессия:
          </span>
          {[1.5, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              onClick={() => {
                onDurationChange(d);
                setSelectedOptionIdx(0); // reset to top choice
              }}
              id={`duration-btn-${d}`}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                duration === d
                  ? "bg-[#7CFF4D] text-black shadow-md scale-105"
                  : "text-slate-400 hover:bg-[#14161c]"
              }`}
            >
              {d === 1.5 ? "1.5ч" : `${d}ч`}
            </button>
          ))}
        </div>
      </div>

      {players.length === 0 ? (
        <div className="bg-[#0c0d10] p-10 rounded-xl text-center border border-white/5">
          <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 font-sans text-sm">Добавьте участников, чтобы рассчитать оптимальное время сеанса.</p>
        </div>
      ) : optimalIntervals.length === 0 ? (
        <div className="bg-amber-950/10 border border-amber-500/10 p-6 rounded-xl text-center">
          <p className="text-amber-400 font-sans text-sm font-bold">
            Упс! Ни у кого нет общих пересечений на {duration} ч.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Попробуйте уменьшить длительность сессии или скорректировать интервалы.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main diamond block recommendation (Left columns) */}
          <div className="lg:col-span-7 bg-[#0c0d10] rounded-xl p-5 border border-[#7CFF4D]/20 flex flex-col justify-between relative overflow-hidden" id="best-interval-details">
            
            {/* Visual accent */}
            <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] select-none pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 8 8">
                <rect width="8" height="8" fill="#7CFF4D" />
              </svg>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase bg-[#7CFF4D] text-black rounded">
                  ВАРИАНТ № {selectedOptionIdx + 1}
                </span>
                {selectedOptionIdx === 0 && (
                  <span className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase bg-white/10 text-[#7CFF4D] border border-[#7CFF4D]/30 rounded flex items-center gap-1">
                    👑 Лучший Выбор
                  </span>
                )}
              </div>

              {/* Time display */}
              <div className="space-y-1">
                <h2 className="font-mono text-3xl sm:text-4xl font-black text-white italic tracking-tighter" id="highlighted-time-interval">
                  {formatTimeLabel(bestOption.start)} — {formatTimeLabel(bestOption.end)}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Общая длительность непрерывной игры: {duration} ч.
                </p>
              </div>

              {/* Attending stats */}
              <div className="bg-[#14161c] p-3.5 rounded-lg border border-white/5 space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider">
                  Свободные участники ({bestOption.maxCount} игрока полностью готовы):
                </span>
                
                {/* List names of players free during this full interval */}
                <div className="flex flex-wrap gap-2 pt-1" id="full-ready-friends-list">
                  {players.map((p) => {
                    // Check if player fully covers this interval
                    const isFullyAvailable = p.intervals.some(interval => {
                      return interval.start <= bestOption.start + 0.001 && interval.end >= bestOption.end - 0.001;
                    });

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold font-mono transition-all duration-150 ${
                          isFullyAvailable
                            ? "bg-[#7CFF4D]/10 border-[#7CFF4D]/25 text-[#7CFF4D]"
                            : "bg-[#0c0d10] border-white/5 text-slate-500/30 line-through opacity-30"
                        }`}
                      >
                        <MinecraftAvatar name={p.name} size={18} />
                        <span>{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopyAnnouncement}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-sans font-black uppercase text-xs tracking-wider italic rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer ${
                  copied
                    ? "bg-white text-black"
                    : "bg-[#7CFF4D] hover:bg-[#a1ff84] text-black hover:shadow-[#7CFF4D]/10"
                }`}
                id="copy-telegram-announcement-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" /> Скопировано!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" /> Скопировать анонс для мессенджера (МГНОВЕННО)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Alternatives panel (Right columns) */}
          <div className="lg:col-span-5 space-y-3" id="alternative-proposals-panel">
            <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest px-1">
              <TrendingUp className="w-4 h-4 text-[#7CFF4D]" /> Альтернативы:
            </span>
            
            <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
              {optimalIntervals.slice(0, 4).map((interval, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOptionIdx(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    selectedOptionIdx === idx
                      ? "bg-[#1a1c23] border-[#7CFF4D]/60 text-white shadow-xl shadow-[#7CFF4D]/5 animate-pulse"
                      : "bg-[#0c0d10] border-white/5 hover:border-white/10 text-slate-300"
                  }`}
                  id={`alternative-option-${idx}`}
                >
                  <div className="space-y-1">
                    <span className="font-mono text-base font-bold flex items-center gap-1.5">
                      {formatTimeLabel(interval.start)} — {formatTimeLabel(interval.end)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-sans block">
                      Совместимость: <strong className="text-[#7CFF4D]">{interval.maxCount} чел.</strong> могут зайти свободно
                    </span>
                  </div>
                  
                  {/* Score badge */}
                  <div className={`px-2 py-1 rounded text-2xs font-mono font-bold ${
                    selectedOptionIdx === idx
                      ? "bg-[#7CFF4D] text-black"
                      : "bg-[#14161c] text-[#7CFF4D] border border-[#7CFF4D]/10"
                  }`}>
                    {idx === 0 ? "ТОП" : `ВАРИАНТ ${idx + 1}`}
                  </div>
                </button>
              ))}
            </div>
            
            <p className="text-[10px] text-slate-500 font-sans px-2">
              * Алгоритм автоматической оптимизации производит подбор, максимизирующий непрерывное присутствие без лобби-разрывов.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
