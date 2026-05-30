import React from "react";
import { Sparkles, Gamepad2 } from "lucide-react";

export function MinecraftHeader() {
  // Array of funny Minecraft Motd (Message of the Day) captions in Russian
  const motds = [
    "Опять крипер взорвал сундуки!",
    "Не копай прямо под себя!",
    "Готовим энергетики на воскресенье...",
    "Кто взял мои алмазы из печки?!",
    "Не забудь переплавить железо!",
    "Редстоун-схемы загружены на 100%",
    "Устраиваем сейшн без душных опросов!",
    "Пора строить автоматическую ферму тростника!",
  ];

  // Pick deterministic random MOTD based on today's minutes or static
  const randomMotd = motds[Math.floor(new Date().getMinutes() % motds.length)];

  return (
    <div className="relative overflow-hidden bg-[#0c0d10] border-b border-white/10 py-6 px-6 sm:px-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4" id="minecraft-hud-header">
      
      {/* Visual background subtle grid simulating gravel/bedrock tiles */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
        <svg width="40" height="40" viewBox="0 0 8 8">
          <rect width="8" height="8" fill="#FFFFFF" />
          <rect x="0" y="0" width="4" height="4" fill="#000000" />
          <rect x="4" y="4" width="4" height="4" fill="#000000" />
        </svg>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {/* Game Block Icon Container in neon theme */}
        <div className="w-12 h-12 bg-[#1a1c23] rounded-lg shadow-lg border border-white/10 flex items-center justify-center animate-pulse shrink-0">
          <Gamepad2 className="w-7 h-7 text-[#7CFF4D] stroke-[2.5]" />
        </div>

        <div>
          <h1 className="font-sans text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
            Sunday Craft<span className="text-[#7CFF4D]">Sync</span>
            <span className="text-[10px] non-italic bg-[#7CFF4D]/10 text-[#7CFF4D] border border-[#7CFF4D]/30 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest leading-none">
              v1.2.0
            </span>
          </h1>
          
          {/* Funny Russian Minecraft MOTD ticker */}
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7CFF4D] shrink-0" />
            <span className="animate-fade-in truncate select-none italic text-slate-400">
              « {randomMotd} »
            </span>
          </div>
        </div>
      </div>

      {/* Group Info HUD Display */}
      <div className="flex flex-col sm:items-end text-xs font-mono text-slate-400 relative z-10 bg-[#14161c] p-2.5 rounded-lg border border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#7CFF4D] rounded-full animate-ping" />
          <span className="font-bold text-white uppercase tracking-wider">СЕРВЕР: ГОТОВ К ИГРЕ</span>
        </div>
        <span className="text-[10px] mt-1 text-slate-500 font-bold uppercase tracking-widest">Планирование: Каждое Воскресенье</span>
      </div>

    </div>
  );
}
