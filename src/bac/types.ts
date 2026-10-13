/**
 * Type definitions for BAC (Blood Alcohol Content) calculation module.
 * Pure TypeScript - no platform dependencies.
 */

export type Sex = 'male' | 'female';
export type AbsorptionModel = 'instant' | 'linear30min';
export type BACUnit = 'promille' | 'percent';

export interface DrinkEntry {
  /** Pure alcohol in grams (pre-calculated: volume_ml * abv * 0.789 / 100) */
  grams: number;
  /** When the drink was consumed (UTC) */
  consumedAt: Date;
}

export interface Profile {
  /** User weight in kilograms */
  weightKg: number;
  /** Biological sex for Widmark factor */
  sex: Sex;
  /** Elimination rate in ‰/hour (beta) */
  eliminationRate: number;
}

export interface BACPoint {
  /** Timestamp of the data point (UTC) */
  time: Date;
  /** BAC value in ‰ (promille) */
  bac: number;
}

export interface PeakBAC {
  /** Peak BAC value in ‰ */
  bac: number;
  /** When the peak occurred (UTC) */
  time: Date;
}

export interface BACSeriesResult {
  /** Time-series BAC points at configured interval */
  series: BACPoint[];
  /** Current BAC at the reference time */
  currentBAC: number;
  /** Peak BAC and when it occurred, null if no entries */
  peakBAC: PeakBAC | null;
  /** Estimated minutes until BAC reaches ~0, null if already zero or no entries */
  timeToZeroMinutes: number | null;
}

export interface CalculateBACOptions {
  /** Time step in minutes for the series (default: 5) */
  stepMinutes: number;
  /** Absorption model (default: 'instant') */
  absorptionModel: AbsorptionModel;
}

// Default calculation options
export const DEFAULT_CALCULATE_OPTIONS: CalculateBACOptions = {
  stepMinutes: 5,
  absorptionModel: 'instant',
};

// Widmark r factors by sex
export const WIDMARK_R_FACTORS: Record<Sex, number> = {
  male: 0.68,
  female: 0.55,
};

// Default elimination rate (‰/h)
export const DEFAULT_ELIMINATION_RATE = 0.15;

// Threshold for "effectively zero" BAC (‰)
export const ZERO_BAC_THRESHOLD = 0.01;