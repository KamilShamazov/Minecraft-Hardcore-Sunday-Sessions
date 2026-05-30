import React, { useState, useRef, useEffect } from "react";
import { TimeInterval } from "../types";
import { slotToHours, formatTimeLabel, TOTAL_SLOTS } from "../utils/scheduler";
import { Flame, Clock, Moon, Sun, Trash2, Sliders } from "lucide-react";

interface TimelineGridProps {
  intervals: TimeInterval[];
  onChange: (intervals: TimeInterval[]) => void;
  primaryColor?: string;
}

export function TimelineGrid({ intervals, onChange, primaryColor = "#7CFF4D" }: TimelineGridProps) {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [dragAction, setDragAction] = useState<"add" | "remove" | null>(null); // "add" to select, "remove" to clear
  const gridRef = useRef<HTMLDivElement>(null);

  // Convert current state of intervals to a boolean array of 48 slots
  const [slots, setSlots] = useState<boolean[]>(new Array(TOTAL_SLOTS).fill(false));

  useEffect(() => {
    const nextSlots = new Array(TOTAL_SLOTS).fill(false);
    intervals.forEach(interval => {
      const startSlot = Math.round(interval.start * 2);
      const endSlot = Math.round(interval.end * 2);
      for (let s = startSlot; s < endSlot; s++) {
        if (s >= 0 && s < TOTAL_SLOTS) {
          nextSlots[s] = true;
        }
      }
    });
    setSlots(nextSlots);
  }, [intervals]);

  // Convert boolean slots array back to intervals list (combining continuous true blocks)
  const syncSlotsToIntervals = (newSlots: boolean[]) => {
    const newIntervals: TimeInterval[] = [];
    let start: number | null = null;

    for (let s = 0; s <= TOTAL_SLOTS; s++) {
      const isSlotActive = s < TOTAL_SLOTS ? newSlots[s] : false;
      
      if (isSlotActive && start === null) {
        start = s;
      } else if (!isSlotActive && start !== null) {
        newIntervals.push({
          start: slotToHours(start),
          end: slotToHours(s)
        });
        start = null;
      }
    }
    onChange(newIntervals);
  };

  const handlePointerDown = (slotIdx: number, e: React.PointerEvent) => {
    // Only capture primary click/touch
    if (e.button !== 0) return;
    
    setIsMouseDown(true);
    setDragStartSlot(slotIdx);
    const mode = !slots[slotIdx] ? "add" : "remove";
    setDragAction(mode);

    const nextSlots = [...slots];
    nextSlots[slotIdx] = mode === "add";
    setSlots(nextSlots);
    
    // Lock pointer capture to element
    if (gridRef.current) {
      gridRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isMouseDown || dragStartSlot === null || dragAction === null) return;

    // Determine which slot is under the pointer
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const widthPerSlot = rect.width / TOTAL_SLOTS;
    let currentSlot = Math.floor(x / widthPerSlot);
    currentSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, currentSlot));

    const nextSlots = [...slots];
    const minSlot = Math.min(dragStartSlot, currentSlot);
    const maxSlot = Math.max(dragStartSlot, currentSlot);

    for (let s = minSlot; s <= maxSlot; s++) {
      nextSlots[s] = dragAction === "add";
    }

    setSlots(nextSlots);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isMouseDown) {
      setIsMouseDown(false);
      setDragStartSlot(null);
      setDragAction(null);
      syncSlotsToIntervals(slots);
      
      if (gridRef.current) {
        gridRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  // Preset utilities
  const applyPreset = (preset: "morning" | "noon" | "evening" | "night" | "allday" | "clear") => {
    let nextSlots = new Array(TOTAL_SLOTS).fill(false);
    
    if (preset === "morning") {
      // 09:00 - 13:00 (slots 18 to 26)
      for (let s = 18; s < 26; s++) nextSlots[s] = true;
    } else if (preset === "noon") {
      // 12:00 - 17:00 (slots 24 to 34)
      for (let s = 24; s < 34; s++) nextSlots[s] = true;
    } else if (preset === "evening") {
      // 17:00 - 21:00 (slots 34 to 42)
      for (let s = 34; s < 42; s++) nextSlots[s] = true;
    } else if (preset === "night") {
      // 20:00 - 24:00 (slots 40 to 48)
      for (let s = 40; s < 48; s++) nextSlots[s] = true;
    } else if (preset === "allday") {
      // 10:00 - 23:00 (slots 20 to 46)
      for (let s = 20; s < 46; s++) nextSlots[s] = true;
    } else if (preset === "clear") {
      nextSlots = new Array(TOTAL_SLOTS).fill(false);
    }

    setSlots(nextSlots);
    syncSlotsToIntervals(nextSlots);
  };

  // Convert decimal to precise input-friendly format
  const decimalToTimeString = (dec: number) => {
    const h = Math.floor(dec);
    const m = Math.round((dec - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Convert time input string back to decimal hours
  const timeStringToDecimal = (val: string): number => {
    const [h, m] = val.split(":").map(Number);
    return h + m / 60;
  };

  // Add a precise manual interval from select boxes
  const [manualStart, setManualStart] = useState("12:00");
  const [manualEnd, setManualEnd] = useState("16:00");

  const handleAddManual = () => {
    const startDec = timeStringToDecimal(manualStart);
    const endDec = timeStringToDecimal(manualEnd);
    if (startDec >= endDec) return;

    const nextSlots = [...slots];
    const sStart = Math.round(startDec * 2);
    const sEnd = Math.round(endDec * 2);

    for (let s = sStart; s < sEnd; s++) {
      if (s >= 0 && s < TOTAL_SLOTS) {
        nextSlots[s] = true;
      }
    }

    setSlots(nextSlots);
    syncSlotsToIntervals(nextSlots);
  };

  return (
    <div className="bg-[#14161c] border border-white/5 p-5 rounded-xl shadow-2xl space-y-5 animate-fade-in" id="timeline-selector-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-sans text-lg font-bold text-white uppercase italic tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#7CFF4D]" />
            Свободное время в воскресенье
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Зажми левую кнопку мыши и проведи по сетке, чтобы отметить или стереть часы. Можно выбрать несколько!
          </p>
        </div>
        
        {/* Quick Clear */}
        <button
          onClick={() => applyPreset("clear")}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 hover:border-red-500 bg-red-950/10 hover:bg-red-950/30 text-red-400 text-xs font-mono font-bold rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Сбросить всё
        </button>
      </div>

      {/* Visual Timeline Painter Wrapper */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-slate-500 font-mono select-none px-1 uppercase tracking-widest font-bold">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00 (Полдень)</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>24:00</span>
        </div>

        {/* The Grid */}
        <div
          ref={gridRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative h-12 w-full flex bg-[#0c0d10] rounded-lg border border-white/5 select-none touch-none overflow-hidden cursor-crosshair shadow-inner"
          style={{ pointerEvents: "auto" }}
        >
          {slots.map((isActive, idx) => {
            const hour = slotToHours(idx);
            const isHourStart = idx % 2 === 0;
            const hourLabel = Math.floor(hour);
            
            return (
              <div
                key={idx}
                id={`timeline-slot-${idx}`}
                onPointerDown={(e) => handlePointerDown(idx, e)}
                className={`flex-1 flex flex-col justify-between border-r border-[#14161c] transition-colors duration-150 relative ${
                  isActive
                    ? "bg-[#7CFF4D]/30 hover:bg-[#7CFF4D]/50"
                    : isHourStart
                    ? "bg-white/[0.02] hover:bg-white/[0.08]"
                    : "bg-transparent hover:bg-white/[0.05]"
                }`}
                title={`${formatTimeLabel(hour)} - ${formatTimeLabel(hour + 0.5)}`}
              >
                {/* Visual grid ticker lines */}
                <div className={`w-full h-1.5 ${isHourStart ? "bg-white/10" : "bg-white/5"}`} />
                
                {/* Subtle hour lines */}
                {isHourStart && (
                  <span className="absolute bottom-0 left-0.5 text-[8px] scale-90 font-mono text-slate-600 font-bold select-none pointer-events-none">
                    {hourLabel}
                  </span>
                )}
                
                {/* Top indicator of active slot */}
                {isActive && (
                  <div className="w-full h-0.5 bg-[#7CFF4D] animate-pulse absolute top-0 left-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Toolbars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
        
        {/* Presets */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#7CFF4D]" /> Раунды & шаблоны:
          </label>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => applyPreset("morning")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1c23] hover:bg-white/5 text-slate-300 border border-white/5 hover:border-[#7CFF4D]/30 rounded-lg transition-all"
            >
              <Sun className="w-3.5 h-3.5 text-yellow-400" />
              Утро (09:00 - 13:00)
            </button>
            <button
              onClick={() => applyPreset("noon")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1c23] hover:bg-white/5 text-slate-300 border border-white/5 hover:border-[#7CFF4D]/30 rounded-lg transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-[#7CFF4D]" />
              День (12:00 - 17:00)
            </button>
            <button
              onClick={() => applyPreset("evening")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1c23] hover:bg-white/5 text-slate-300 border border-white/5 hover:border-[#7CFF4D]/30 rounded-lg transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Вечер (17:00 - 21:00)
            </button>
            <button
              onClick={() => applyPreset("night")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1c23] hover:bg-white/5 text-slate-300 border border-white/5 hover:border-[#7CFF4D]/30 rounded-lg transition-all"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Ночь (20:00 - 24:00)
            </button>
            <button
              onClick={() => applyPreset("allday")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#7CFF4D]/10 hover:bg-[#7CFF4D]/20 text-[#7CFF4D] border border-[#7CFF4D]/25 hover:border-[#7CFF4D]/50 rounded-lg transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              Весь день свободен
            </button>
          </div>
        </div>

        {/* Manual Time Ranges Inputs */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#7CFF4D]" /> Точный диапазон:
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-mono">С</span>
              <input
                type="time"
                value={manualStart}
                step="1800" // 30 mins
                onChange={(e) => setManualStart(e.target.value)}
                className="bg-[#0c0d10] text-slate-200 border border-white/5 px-2 py-1 rounded-md text-xs font-mono focus:border-[#7CFF4D] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-mono">До</span>
              <input
                type="time"
                value={manualEnd}
                step="1800" // 30 mins
                onChange={(e) => setManualEnd(e.target.value)}
                className="bg-[#0c0d10] text-slate-200 border border-white/5 px-2 py-1 rounded-md text-xs font-mono focus:border-[#7CFF4D] focus:outline-none"
              />
            </div>
            <button
              onClick={handleAddManual}
              className="px-3 py-1.5 bg-[#7CFF4D] hover:bg-[#a1ff84] text-black font-black uppercase text-xs rounded-md shadow transition-all active:scale-95 cursor-pointer ml-auto tracking-wider"
            >
              Добавить
            </button>
          </div>
          {intervals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider self-center mr-1">Твои интервалы:</span>
              {intervals.map((interval, i) => (
                <span
                  key={i}
                  className="bg-[#7CFF4D]/15 border border-[#7CFF4D]/35 text-[#7CFF4D] font-mono text-[10.5px] px-2.5 py-0.5 rounded-full font-bold"
                >
                  {formatTimeLabel(interval.start)} - {formatTimeLabel(interval.end)}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
