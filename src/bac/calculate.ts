/**
 * BAC (Blood Alcohol Content) Calculation Module
 *
 * Pure TypeScript implementation of the Widmark formula with time-stepping.
 * No platform dependencies - fully testable in isolation.
 *
 * Formula: BAC(‰) = grams / (r × weight_kg) − β × hours_elapsed
 * - r = 0.68 (male), 0.55 (female)
 * - β = elimination rate in ‰/h
 * - Time-stepping: 5 minutes (configurable)
 * - Instant absorption model initially
 * - Elimination only while BAC > 0, never below 0
 */

import {
  DrinkEntry,
  Profile,
  BACPoint,
  PeakBAC,
  BACSeriesResult,
  CalculateBACOptions,
  DEFAULT_CALCULATE_OPTIONS,
  WIDMARK_R_FACTORS,
  ZERO_BAC_THRESHOLD,
} from './types';

/**
 * Calculate the BAC time series for a list of drink entries.
 *
 * @param entries - Array of drink entries with grams and consumption time
 * @param profile - User profile (weight, sex, elimination rate)
 * @param options - Calculation options (step interval, absorption model)
 * @returns Array of BAC points at each time step
 */
export function calculateBACSeries(
  entries: DrinkEntry[],
  profile: Profile,
  options: Partial<CalculateBACOptions> = {}
): BACPoint[] {
  const opts = { ...DEFAULT_CALCULATE_OPTIONS, ...options };

  if (entries.length === 0) {
    return [];
  }

  // Validate inputs
  if (profile.weightKg <= 0) {
    throw new Error('Weight must be greater than zero');
  }
  if (profile.eliminationRate < 0) {
    throw new Error('Elimination rate cannot be negative');
  }

  // Sort entries by consumption time (ascending)
  const sortedEntries = [...entries].sort((a, b) =>
    a.consumedAt.getTime() - b.consumedAt.getTime()
  );

  // Get Widmark r factor
  const r = WIDMARK_R_FACTORS[profile.sex];
  const beta = profile.eliminationRate; // ‰/h
  const stepMs = opts.stepMinutes * 60 * 1000; // Convert minutes to milliseconds

  // Determine time range: from first drink to estimated zero
  const firstDrinkTime = sortedEntries[0].consumedAt.getTime();

  // Estimate when BAC reaches zero to set end time
  // Rough estimate: max BAC / (beta per minute) + buffer
  const totalGrams = sortedEntries.reduce((sum, e) => sum + e.grams, 0);
  const maxPossibleBAC = totalGrams / (r * profile.weightKg);
  const hoursToZero = maxPossibleBAC / beta;
  const estimatedZeroTime = firstDrinkTime + hoursToZero * 60 * 60 * 1000 + 60 * 60 * 1000; // +1 hour buffer

  // Generate time series
  const series: BACPoint[] = [];
  let currentTime = firstDrinkTime;

  while (currentTime <= estimatedZeroTime) {
    const currentDate = new Date(currentTime);
    let bac = calculateBACAtTime(sortedEntries, profile, r, beta, currentDate);

    // Clamp to zero
    if (bac < ZERO_BAC_THRESHOLD) {
      bac = 0;
    }

    series.push({ time: currentDate, bac });

    // If BAC is zero and we've passed the last drink, we can stop
    if (bac === 0 && currentTime > sortedEntries[sortedEntries.length - 1].consumedAt.getTime()) {
      // Add one more zero point for completeness, then break
      const nextTime = currentTime + stepMs;
      if (nextTime > estimatedZeroTime) break;
    }

    currentTime += stepMs;
  }

  return series;
}

/**
 * Calculate BAC at a specific point in time.
 * Uses Widmark formula with instant absorption.
 *
 * @param entries - Sorted drink entries
 * @param profile - User profile
 * @param r - Widmark factor
 * @param beta - Elimination rate (‰/h)
 * @param targetTime - Time to calculate BAC for
 * @returns BAC in ‰
 */
function calculateBACAtTime(
  entries: DrinkEntry[],
  profile: Profile,
  r: number,
  beta: number,
  targetTime: Date
): number {
  const targetMs = targetTime.getTime();
  let totalBAC = 0;

  for (const entry of entries) {
    const drinkMs = entry.consumedAt.getTime();

    // Skip drinks consumed after target time
    if (drinkMs > targetMs) continue;

    // Hours elapsed since this drink
    const hoursElapsed = (targetMs - drinkMs) / (1000 * 60 * 60);

    // Widmark formula: BAC = grams / (r * weight) - beta * hours
    const drinkBAC = entry.grams / (r * profile.weightKg) - beta * hoursElapsed;

    // Only add positive contribution
    if (drinkBAC > 0) {
      totalBAC += drinkBAC;
    }
  }

  return Math.max(0, totalBAC);
}

/**
 * Get current BAC at a specific time from a pre-calculated series.
 *
 * @param series - Pre-calculated BAC time series
 * @param now - Reference time (default: now)
 * @returns Current BAC in ‰
 */
export function getCurrentBAC(series: BACPoint[], now: Date = new Date()): number {
  if (series.length === 0) return 0;

  const nowMs = now.getTime();

  // Find the closest point in the series
  let closest = series[0];
  let minDiff = Math.abs(series[0].time.getTime() - nowMs);

  for (const point of series) {
    const diff = Math.abs(point.time.getTime() - nowMs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }

  return closest.bac;
}

/**
 * Get peak BAC from a pre-calculated series.
 *
 * @param series - Pre-calculated BAC time series
 * @returns Peak BAC value and timestamp, or null if empty
 */
export function getPeakBAC(series: BACPoint[]): PeakBAC | null {
  if (series.length === 0) return null;

  let peak = series[0];
  for (const point of series) {
    if (point.bac > peak.bac) {
      peak = point;
    }
  }

  return { bac: peak.bac, time: peak.time };
}

/**
 * Get estimated time until BAC reaches effectively zero.
 *
 * @param series - Pre-calculated BAC time series
 * @param now - Reference time (default: now)
 * @returns Minutes until BAC ≤ threshold, or null if already zero/empty
 */
export function getTimeToZero(series: BACPoint[], now: Date = new Date()): number | null {
  if (series.length === 0) return null;

  const nowMs = now.getTime();

  // Find current BAC index
  let currentIndex = 0;
  for (let i = 0; i < series.length; i++) {
    if (series[i].time.getTime() <= nowMs) {
      currentIndex = i;
    } else {
      break;
    }
  }

  const currentBAC = series[currentIndex].bac;
  if (currentBAC <= ZERO_BAC_THRESHOLD) return 0;

  // Find first point after now where BAC <= threshold
  for (let i = currentIndex + 1; i < series.length; i++) {
    if (series[i].bac <= ZERO_BAC_THRESHOLD) {
      const diffMs = series[i].time.getTime() - nowMs;
      return Math.round(diffMs / (1000 * 60)); // Convert to minutes
    }
  }

  // If never reaches zero in series, estimate from last known rate
  if (series.length > currentIndex + 1) {
    const lastPoint = series[series.length - 1];
    const lastBAC = lastPoint.bac;
    if (lastBAC > 0) {
      // Estimate using elimination rate
      const hoursToZero = lastBAC / WIDMARK_R_FACTORS['male']; // rough estimate
      return Math.round(hoursToZero * 60);
    }
  }

  return null;
}

/**
 * Convert BAC from ‰ (promille) to % (percent).
 * 1‰ = 0.1%
 */
export function promilleToPercent(promille: number): number {
  return promille / 10;
}

/**
 * Convert BAC from % (percent) to ‰ (promille).
 * 1% = 10‰
 */
export function percentToPromille(percent: number): number {
  return percent * 10;
}

/**
 * Convert weight from pounds to kilograms.
 */
export function poundsToKg(pounds: number): number {
  return pounds * 0.45359237;
}

/**
 * Convert weight from kilograms to pounds.
 */
export function kgToPounds(kg: number): number {
  return kg / 0.45359237;
}

/**
 * Calculate pure alcohol grams from volume and ABV.
 * Formula: grams = volume_ml * (abv / 100) * 0.789
 * 0.789 = density of ethanol (g/ml)
 */
export function calculateGrams(volume_ml: number, abv: number): number {
  return volume_ml * (abv / 100) * 0.789;
}

/**
 * Create a BACSeriesResult from entries and profile.
 * Convenience function that calculates everything at once.
 */
export function calculateBAC(
  entries: DrinkEntry[],
  profile: Profile,
  options: Partial<CalculateBACOptions> = {},
  now: Date = new Date()
): BACSeriesResult {
  const series = calculateBACSeries(entries, profile, options);
  const currentBAC = getCurrentBAC(series, now);
  const peakBAC = getPeakBAC(series);
  const timeToZeroMinutes = getTimeToZero(series, now);

  return {
    series,
    currentBAC,
    peakBAC,
    timeToZeroMinutes,
  };
}