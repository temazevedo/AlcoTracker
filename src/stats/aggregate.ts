/**
 * Stats aggregation utilities for weekly and monthly views.
 * Pure TypeScript - no platform dependencies.
 */

import { DrinkEntryRow } from '@/db/schema';

export interface DayStat {
  date: string;           // YYYY-MM-DD (local)
  label: string;          // "Mon", "Tue", etc.
  grams: number;
  drinkCount: number;
  isDrinkingDay: boolean;
}

export interface WeekStat {
  weekStart: string;      // YYYY-MM-DD (Monday)
  label: string;          // "Jan 1-7", "Week 1", etc.
  grams: number;
  drinkCount: number;
  isDrinkingWeek: boolean;
}

export interface WeeklyStats {
  days: DayStat[];
  totalGrams: number;
  totalDrinks: number;
  drinkingDays: number;
  avgGramsPerDrinkingDay: number;
  avgDrinksPerDrinkingDay: number;
}

export interface MonthlyStats {
  weeks: WeekStat[];
  totalGrams: number;
  totalDrinks: number;
  drinkingWeeks: number;
  avgGramsPerDrinkingWeek: number;
  avgDrinksPerDrinkingWeek: number;
}

/**
 * Get the local date string (YYYY-MM-DD) from a UTC ISO string
 */
function getLocalDateString(utcString: string): string {
  const date = new Date(utcString);
  return date.toISOString().split('T')[0];
}

/**
 * Get day label (Mon, Tue, etc.) from YYYY-MM-DD date string
 */
function getDayLabel(dateStr: string): string {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(5, 7), 10) - 1;
  const day = parseInt(dateStr.substring(8, 10), 10);
  const date = new Date(Date.UTC(year, month, day));
  return date.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });
}

/**
 * Get week label (e.g., "Jan 1-7") from week start date (Monday)
 */
export function getWeekLabel(weekStartStr: string): string {
  const year = parseInt(weekStartStr.substring(0, 4), 10);
  const month = parseInt(weekStartStr.substring(5, 7), 10) - 1;
  const day = parseInt(weekStartStr.substring(8, 10), 10);
  const start = new Date(Date.UTC(year, month, day));
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const monthStr = start.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' });
  const dayStart = start.getUTCDate();
  const dayEnd = end.getUTCDate();
  return `${monthStr} ${dayStart}-${dayEnd}`;
}

/**
 * Get Monday of the week for a given date (YYYY-MM-DD)
 */
export function getWeekStart(dateStr: string): string {
  // Parse as UTC to avoid timezone issues
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(5, 7), 10) - 1; // 0-indexed
  const day = parseInt(dateStr.substring(8, 10), 10);
  const date = new Date(Date.UTC(year, month, day));
  
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust so Monday = 0 offset
  const monday = new Date(date.getTime() + diff * 24 * 60 * 60 * 1000);
  return monday.toISOString().split('T')[0];
}

/**
 * Generate the last N days including today (YYYY-MM-DD strings, newest first)
 */
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  for (let i = 0; i < n; i++) {
    const date = new Date(utcToday.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

/**
 * Generate the last N weeks (Monday start dates, newest first)
 */
export function getLastNWeeks(n: number): string[] {
  const weeks: string[] = [];
  // Use UTC to find the most recent Monday
  const today = new Date();
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const day = utcToday.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(utcToday.getTime() + diff * 24 * 60 * 60 * 1000);

  for (let i = 0; i < n; i++) {
    const monday = new Date(thisMonday.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    weeks.push(monday.toISOString().split('T')[0]);
  }
  return weeks;
}

/**
 * Aggregate entries into weekly stats (7 days including today)
 */
export function getWeeklyStats(entries: DrinkEntryRow[]): WeeklyStats {
  const last7Days = getLastNDays(7).reverse(); // Oldest first for display
  const dayMap = new Map<string, DayStat>();

  // Initialize all days with zero values
  for (const dateStr of last7Days) {
    dayMap.set(dateStr, {
      date: dateStr,
      label: getDayLabel(dateStr),
      grams: 0,
      drinkCount: 0,
      isDrinkingDay: false,
    });
  }

  // Aggregate entries
  for (const entry of entries) {
    const localDate = getLocalDateString(entry.consumed_at);
    const day = dayMap.get(localDate);
    if (day) {
      day.grams += entry.grams;
      day.drinkCount += 1;
      day.isDrinkingDay = true;
    }
  }

  const days = Array.from(dayMap.values());

  const totalGrams = days.reduce((sum, d) => sum + d.grams, 0);
  const totalDrinks = days.reduce((sum, d) => sum + d.drinkCount, 0);
  const drinkingDays = days.filter(d => d.isDrinkingDay).length;
  const avgGramsPerDrinkingDay = drinkingDays > 0 ? totalGrams / drinkingDays : 0;
  const avgDrinksPerDrinkingDay = drinkingDays > 0 ? totalDrinks / drinkingDays : 0;

  return {
    days,
    totalGrams,
    totalDrinks,
    drinkingDays,
    avgGramsPerDrinkingDay,
    avgDrinksPerDrinkingDay,
  };
}

/**
 * Aggregate entries into monthly stats (4 weeks)
 */
export function getMonthlyStats(entries: DrinkEntryRow[]): MonthlyStats {
  const last4Weeks = getLastNWeeks(4).reverse(); // Oldest first for display
  const weekMap = new Map<string, WeekStat>();

  // Initialize all weeks with zero values
  for (const weekStart of last4Weeks) {
    weekMap.set(weekStart, {
      weekStart,
      label: getWeekLabel(weekStart),
      grams: 0,
      drinkCount: 0,
      isDrinkingWeek: false,
    });
  }

  // Aggregate entries
  for (const entry of entries) {
    const localDate = getLocalDateString(entry.consumed_at);
    const weekStart = getWeekStart(localDate);
    const week = weekMap.get(weekStart);
    if (week) {
      week.grams += entry.grams;
      week.drinkCount += 1;
      week.isDrinkingWeek = true;
    }
  }

  const weeks = Array.from(weekMap.values());

  const totalGrams = weeks.reduce((sum, w) => sum + w.grams, 0);
  const totalDrinks = weeks.reduce((sum, w) => sum + w.drinkCount, 0);
  const drinkingWeeks = weeks.filter(w => w.isDrinkingWeek).length;
  const avgGramsPerDrinkingWeek = drinkingWeeks > 0 ? totalGrams / drinkingWeeks : 0;
  const avgDrinksPerDrinkingWeek = drinkingWeeks > 0 ? totalDrinks / drinkingWeeks : 0;

  return {
    weeks,
    totalGrams,
    totalDrinks,
    drinkingWeeks,
    avgGramsPerDrinkingWeek,
    avgDrinksPerDrinkingWeek,
  };
}

/**
 * Format grams for display
 */
export function formatGrams(grams: number): string {
  if (grams >= 100) return `${grams.toFixed(0)}g`;
  if (grams >= 10) return `${grams.toFixed(1)}g`;
  return `${grams.toFixed(2)}g`;
}

/**
 * Format number for display
 */
export function formatNumber(num: number): string {
  if (num >= 100) return num.toFixed(0);
  if (num >= 10) return num.toFixed(1);
  return num.toFixed(2);
}