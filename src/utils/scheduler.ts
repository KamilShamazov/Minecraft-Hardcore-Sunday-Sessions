import { Player, TimeSlotAnalysis, OptimalIntervalResult } from "../types";

export const TOTAL_SLOTS = 48; // 24 hours * 2 slots per hour

// Helper to convert slot index to decimal hours
export function slotToHours(slot: number): number {
  return slot / 2;
}

// Helper to convert decimal hours to slot index
export function hoursToSlot(hours: number): number {
  return Math.round(hours * 2);
}

// Helper to format decimal hours to HH:MM format
export function formatTimeLabel(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Checks if a given hour decimal falls inside any of the player's intervals.
 * To make it inclusive of end points for UI, we check: start <= time < end
 */
export function isPlayerAvailableAt(player: Player, hour: number): boolean {
  return player.intervals.some(interval => {
    // Add small epsilon to prevent floating point issues
    return hour >= interval.start - 0.001 && hour < interval.end - 0.001;
  });
}

/**
 * Analyzes the availability of all players across all 48 half-hour slots.
 */
export function analyzeTimeSlots(players: Player[]): TimeSlotAnalysis[] {
  const analysis: TimeSlotAnalysis[] = [];
  
  for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
    const time = slotToHours(slot);
    const availablePlayers: string[] = [];
    
    players.forEach(p => {
      if (isPlayerAvailableAt(p, time)) {
        availablePlayers.push(p.id);
      }
    });

    analysis.push({
      time,
      timeLabel: formatTimeLabel(time),
      availablePlayers,
      count: availablePlayers.length,
    });
  }

  return analysis;
}

/**
 * Finds the optimal continuous game windows of length `durationHours`.
 * Evaluates all windows to maximize overlapping players, penalizing gaps or drops.
 */
export function findOptimalIntervals(
  players: Player[],
  durationHours: number
): OptimalIntervalResult[] {
  if (players.length === 0) return [];
  
  const slotCount = Math.round(durationHours * 2);
  const analysis = analyzeTimeSlots(players);
  const results: OptimalIntervalResult[] = [];

  // Slide a window of size `slotCount` from slot 0 to (48 - slotCount)
  for (let startSlot = 0; startSlot <= TOTAL_SLOTS - slotCount; startSlot++) {
    const endSlot = startSlot + slotCount;
    const windowSlots = analysis.slice(startSlot, endSlot);
    
    // Find players who are available for the ENTIRE duration
    const alwaysAvailableIds = players
      .filter(p => {
        return windowSlots.every(slot => slot.availablePlayers.includes(p.id));
      })
      .map(p => p.id);

    // Find players available for AT LEAST part of the duration
    const partiallyAvailableIds = Array.from(
      new Set(windowSlots.flatMap(slot => slot.availablePlayers))
    );

    // Score calculation:
    // Core idea: We want to maximize the "always available" players,
    // but also give fractional points for people who can play part of the time.
    // Score = (always_count * 10) + (average_present * 2)
    const averagePresentCount = 
      windowSlots.reduce((sum, slot) => sum + slot.count, 0) / slotCount;
    
    const alwaysCount = alwaysAvailableIds.length;
    const score = alwaysCount * 10 + averagePresentCount * 2;

    results.push({
      start: slotToHours(startSlot),
      end: slotToHours(endSlot),
      playerIds: partiallyAvailableIds, // Players who can attend at least some part
      maxCount: alwaysCount, // Guaranteed concurrent players
      score
    });
  }

  // Sort by score descending, then by early start time
  return results
    .filter(r => r.playerIds.length > 0)
    .sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.1) {
        return b.score - a.score;
      }
      return a.start - b.start; // prefer earlier schedules if scores are identical
    });
}
