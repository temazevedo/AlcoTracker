/**
 * Stats Aggregation Tests
 */

import { getWeeklyStats, getMonthlyStats, getWeekStart, DayStat, WeekStat } from './aggregate';

// Helper to create a mock DrinkEntryRow
const createEntry = (grams: number, consumedAt: string): any => ({
  grams,
  consumed_at: consumedAt,
});

describe('getWeeklyStats', () => {
  test('returns zero stats for empty entries', () => {
    const result = getWeeklyStats([]);
    expect(result.days).toHaveLength(7);
    expect(result.totalGrams).toBe(0);
    expect(result.totalDrinks).toBe(0);
    expect(result.drinkingDays).toBe(0);
    expect(result.avgGramsPerDrinkingDay).toBe(0);
    expect(result.avgDrinksPerDrinkingDay).toBe(0);
    // All days should be non-drinking days
    for (const day of result.days) {
      expect(day.isDrinkingDay).toBe(false);
      expect(day.grams).toBe(0);
      expect(day.drinkCount).toBe(0);
    }
  });

  test('aggregates single entry on today', () => {
    const today = new Date().toISOString().split('T')[0];
    const entries = [createEntry(14, today + 'T20:00:00.000Z')];
    const result = getWeeklyStats(entries);

    expect(result.totalGrams).toBe(14);
    expect(result.totalDrinks).toBe(1);
    expect(result.drinkingDays).toBe(1);
    expect(result.avgGramsPerDrinkingDay).toBe(14);
    expect(result.avgDrinksPerDrinkingDay).toBe(1);

    const todayStat = result.days.find(d => d.date === today);
    expect(todayStat).toBeDefined();
    expect(todayStat!.isDrinkingDay).toBe(true);
    expect(todayStat!.grams).toBe(14);
    expect(todayStat!.drinkCount).toBe(1);
  });

  test('aggregates multiple entries on same day', () => {
    const today = new Date().toISOString().split('T')[0];
    const entries = [
      createEntry(14, today + 'T18:00:00.000Z'),
      createEntry(10, today + 'T20:00:00.000Z'),
      createEntry(6, today + 'T22:00:00.000Z'),
    ];
    const result = getWeeklyStats(entries);

    expect(result.totalGrams).toBe(30);
    expect(result.totalDrinks).toBe(3);
    expect(result.drinkingDays).toBe(1);
    expect(result.avgGramsPerDrinkingDay).toBe(30);
    expect(result.avgDrinksPerDrinkingDay).toBe(3);
  });

  test('aggregates entries across multiple days', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const entries = [
      createEntry(14, todayStr + 'T20:00:00.000Z'),
      createEntry(10, yesterday + 'T19:00:00.000Z'),
    ];
    const result = getWeeklyStats(entries);

    expect(result.totalGrams).toBe(24);
    expect(result.totalDrinks).toBe(2);
    expect(result.drinkingDays).toBe(2);
    expect(result.avgGramsPerDrinkingDay).toBe(12);
    expect(result.avgDrinksPerDrinkingDay).toBe(1);
  });

  test('handles entries outside the 7-day window', () => {
    const today = new Date();
    const eightDaysAgo = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const entries = [
      createEntry(14, todayStr + 'T20:00:00.000Z'),
      createEntry(20, eightDaysAgo + 'T20:00:00.000Z'), // Should be ignored
    ];
    const result = getWeeklyStats(entries);

    expect(result.totalGrams).toBe(14); // Only today's entry counted
    expect(result.totalDrinks).toBe(1);
  });

  test('days are ordered oldest to newest', () => {
    const result = getWeeklyStats([]);
    // First day should be 6 days ago, last should be today
    const today = new Date().toISOString().split('T')[0];
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    expect(result.days[0].date).toBe(sixDaysAgo);
    expect(result.days[6].date).toBe(today);
  });
});

describe('getMonthlyStats', () => {
  test('returns zero stats for empty entries', () => {
    const result = getMonthlyStats([]);
    expect(result.weeks).toHaveLength(4);
    expect(result.totalGrams).toBe(0);
    expect(result.totalDrinks).toBe(0);
    expect(result.drinkingWeeks).toBe(0);
    expect(result.avgGramsPerDrinkingWeek).toBe(0);
    expect(result.avgDrinksPerDrinkingWeek).toBe(0);
  });

  test('getWeekStart correctly calculates Monday', () => {
    // Test various days of the week
    expect(getWeekStart('2025-01-06')).toBe('2025-01-06'); // Monday
    expect(getWeekStart('2025-01-07')).toBe('2025-01-06'); // Tuesday
    expect(getWeekStart('2025-01-08')).toBe('2025-01-06'); // Wednesday
    expect(getWeekStart('2025-01-09')).toBe('2025-01-06'); // Thursday
    expect(getWeekStart('2025-01-10')).toBe('2025-01-06'); // Friday
    expect(getWeekStart('2025-01-11')).toBe('2025-01-06'); // Saturday
    expect(getWeekStart('2025-01-12')).toBe('2025-01-06'); // Sunday
  });

  test('aggregates entries within a week', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = getWeekStart(todayStr);
    
    const entries = [
      createEntry(14, todayStr + 'T18:00:00.000Z'),
      createEntry(10, todayStr + 'T20:00:00.000Z'),
    ];
    const result = getMonthlyStats(entries);

    expect(result.totalGrams).toBe(24);
    expect(result.totalDrinks).toBe(2);
    expect(result.drinkingWeeks).toBe(1);
    expect(result.avgGramsPerDrinkingWeek).toBe(24);
    expect(result.avgDrinksPerDrinkingWeek).toBe(2);

    const thisWeek = result.weeks.find(w => w.weekStart === weekStart);
    expect(thisWeek).toBeDefined();
    expect(thisWeek!.isDrinkingWeek).toBe(true);
    expect(thisWeek!.grams).toBe(24);
    expect(thisWeek!.drinkCount).toBe(2);
  });

  test('aggregates entries across multiple weeks', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = getWeekStart(todayStr);
    const lastWeekStart = getWeekStart(new Date(new Date(todayStr).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    const entries = [
      createEntry(14, todayStr + 'T18:00:00.000Z'),
      createEntry(20, lastWeekStart + 'T19:00:00.000Z'),
    ];
    const result = getMonthlyStats(entries);

    expect(result.totalGrams).toBe(34);
    expect(result.totalDrinks).toBe(2);
    expect(result.drinkingWeeks).toBe(2);
    expect(result.avgGramsPerDrinkingWeek).toBe(17);
    expect(result.avgDrinksPerDrinkingWeek).toBe(1);
  });

  test('handles entries outside the 4-week window', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = getWeekStart(todayStr);
    const fiveWeeksAgo = new Date(new Date(weekStart).getTime() - 5 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const entries = [
      createEntry(14, todayStr + 'T18:00:00.000Z'),
      createEntry(50, fiveWeeksAgo + 'T19:00:00.000Z'), // Should be ignored
    ];
    const result = getMonthlyStats(entries);

    expect(result.totalGrams).toBe(14); // Only this week's entry counted
    expect(result.totalDrinks).toBe(1);
  });

  test('weeks are ordered oldest to newest', () => {
    const result = getMonthlyStats([]);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const thisWeekStart = getWeekStart(todayStr);
    const threeWeeksAgo = new Date(new Date(thisWeekStart).getTime() - 3 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    expect(result.weeks[0].weekStart).toBe(threeWeeksAgo);
    expect(result.weeks[3].weekStart).toBe(thisWeekStart);
  });
});

describe('getWeekLabel', () => {
  // This is tested indirectly through getMonthlyStats
  test('week labels are generated correctly', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = getWeekStart(todayStr);
    
    const entries = [createEntry(14, todayStr + 'T18:00:00.000Z')];
    const result = getMonthlyStats(entries);

    expect(result.weeks[3].label).toMatch(/[A-Za-z]{3} \d+-\d+/); // e.g., "Jan 1-7"
  });
});