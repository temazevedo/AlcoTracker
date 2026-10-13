/**
 * BAC Calculation Tests
 *
 * Comprehensive test suite for the Widmark formula implementation.
 * Target: 100% coverage of src/bac/calculate.ts
 */

import {
  calculateBACSeries,
  getCurrentBAC,
  getPeakBAC,
  getTimeToZero,
  calculateBAC,
  promilleToPercent,
  percentToPromille,
  poundsToKg,
  kgToPounds,
  calculateGrams,
} from './calculate';
import {
  WIDMARK_R_FACTORS,
  ZERO_BAC_THRESHOLD,
  DEFAULT_ELIMINATION_RATE,
  DrinkEntry,
  Profile,
  CalculateBACOptions,
} from './types';

// Test utilities
const createEntry = (grams: number, hoursAgo: number): DrinkEntry => ({
  grams,
  consumedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
});

const createEntryAt = (grams: number, date: Date): DrinkEntry => ({
  grams,
  consumedAt: date,
});

const defaultProfile: Profile = {
  weightKg: 70,
  sex: 'male',
  eliminationRate: DEFAULT_ELIMINATION_RATE,
};

const femaleProfile: Profile = {
  weightKg: 60,
  sex: 'female',
  eliminationRate: DEFAULT_ELIMINATION_RATE,
};

const defaultOptions: Partial<CalculateBACOptions> = {
  stepMinutes: 5,
  absorptionModel: 'instant',
};

describe('WIDMARK_R_FACTORS', () => {
  test('male factor is 0.68', () => {
    expect(WIDMARK_R_FACTORS.male).toBe(0.68);
  });

  test('female factor is 0.55', () => {
    expect(WIDMARK_R_FACTORS.female).toBe(0.55);
  });
});

describe('ZERO_BAC_THRESHOLD', () => {
  test('is 0.01', () => {
    expect(ZERO_BAC_THRESHOLD).toBe(0.01);
  });
});

describe('DEFAULT_ELIMINATION_RATE', () => {
  test('is 0.15', () => {
    expect(DEFAULT_ELIMINATION_RATE).toBe(0.15);
  });
});

describe('calculateGrams', () => {
  test('calculates grams from volume and ABV', () => {
    // 500ml at 5% ABV = 500 * 0.05 * 0.789 = 19.725g
    expect(calculateGrams(500, 5)).toBeCloseTo(19.725, 3);
  });

  test('returns 0 for 0% ABV', () => {
    expect(calculateGrams(330, 0)).toBe(0);
  });

  test('returns 0 for 0 volume', () => {
    expect(calculateGrams(0, 5)).toBe(0);
  });

  test('standard drink: 14g approx', () => {
    // 355ml (12oz) at 5% = ~14g
    expect(calculateGrams(355, 5)).toBeCloseTo(14, 1);
  });
});

describe('Unit conversions', () => {
  test('promilleToPercent: 1‰ = 0.1%', () => {
    expect(promilleToPercent(1)).toBe(0.1);
    expect(promilleToPercent(10)).toBe(1);
    expect(promilleToPercent(0.5)).toBe(0.05);
  });

  test('percentToPromille: 1% = 10‰', () => {
    expect(percentToPromille(1)).toBe(10);
    expect(percentToPromille(0.1)).toBe(1);
    expect(percentToPromille(0.05)).toBe(0.5);
  });

  test('poundsToKg and kgToPounds are inverses', () => {
    const kg = 70;
    const lbs = kgToPounds(kg);
    const backToKg = poundsToKg(lbs);
    expect(backToKg).toBeCloseTo(kg, 5);
  });

  test('poundsToKg: 154 lbs ≈ 70 kg', () => {
    expect(poundsToKg(154)).toBeCloseTo(70, 0); // ~69.85
  });

  test('kgToPounds: 70 kg ≈ 154 lbs', () => {
    expect(kgToPounds(70)).toBeCloseTo(154, 0); // ~154.32
  });
});

describe('calculateBACSeries', () => {
  test('returns empty array for empty entries', () => {
    const series = calculateBACSeries([], defaultProfile);
    expect(series).toEqual([]);
  });

  test('single drink (male): basic calculation', () => {
    // 14g alcohol, 70kg male, r=0.68
    // Peak BAC = 14 / (0.68 * 70) = 0.294‰
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    expect(series.length).toBeGreaterThan(0);
    const peak = Math.max(...series.map(p => p.bac));
    expect(peak).toBeCloseTo(0.294, 2);
  });

  test('single drink (female): higher BAC due to lower r factor', () => {
    // Same 14g, 60kg female, r=0.55
    // Peak BAC = 14 / (0.55 * 60) = 0.424‰
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, femaleProfile, defaultOptions);

    const peak = Math.max(...series.map(p => p.bac));
    expect(peak).toBeCloseTo(0.424, 2);

    // Female peak should be higher than male for same grams/weight ratio
    const maleEntries = [createEntry(14, 0)];
    const maleSeries = calculateBACSeries(maleEntries, defaultProfile, defaultOptions);
    const malePeak = Math.max(...maleSeries.map(p => p.bac));
    expect(peak).toBeGreaterThan(malePeak);
  });

  test('BAC never goes below zero', () => {
    const entries = [createEntry(14, 10)]; // Drink 10 hours ago
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    for (const point of series) {
      expect(point.bac).toBeGreaterThanOrEqual(0);
    }
  });

  test('elimination only while BAC > 0', () => {
    const entries = [createEntry(5, 2)]; // Small drink 2 hours ago
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    // Find first zero point
    const firstZeroIndex = series.findIndex(p => p.bac <= ZERO_BAC_THRESHOLD);
    if (firstZeroIndex !== -1) {
      // All subsequent points should also be zero
      for (let i = firstZeroIndex; i < series.length; i++) {
        expect(series[i].bac).toBeLessThanOrEqual(ZERO_BAC_THRESHOLD);
      }
    }
  });

  test('time steps are at configured interval', () => {
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, defaultProfile, { stepMinutes: 5 });

    for (let i = 1; i < series.length; i++) {
      const diffMs = series[i].time.getTime() - series[i - 1].time.getTime();
      expect(diffMs).toBe(5 * 60 * 1000); // 5 minutes in ms
    }
  });

  test('series starts at first drink time', () => {
    const drinkTime = new Date('2025-01-15T20:00:00Z');
    const entries = [createEntryAt(14, drinkTime)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    expect(series[0].time.getTime()).toBe(drinkTime.getTime());
  });

  test('multiple overlapping drinks: cumulative effect', () => {
    // 3 drinks over 2 hours
    const entries = [
      createEntry(14, 2),  // 2 hours ago
      createEntry(14, 1.5), // 1.5 hours ago
      createEntry(14, 1),   // 1 hour ago
    ];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    const peak = Math.max(...series.map(p => p.bac));
    // Should be higher than single drink (but not 3x due to elimination)
    expect(peak).toBeGreaterThan(0.294);
    expect(peak).toBeLessThan(0.294 * 3);
  });

  test('gap long enough to reach zero, then drinking again', () => {
    // Drink, wait long time, drink again
    const entries = [
      createEntry(14, 10), // 10 hours ago - should be eliminated
      createEntry(14, 0),  // Now
    ];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    // First drink peak should be at the beginning, second peak later
    // Use getPeakBAC for the overall peak (should be second drink)
    const overallPeak = getPeakBAC(series);
    expect(overallPeak).not.toBeNull();
    expect(overallPeak!.bac).toBeCloseTo(0.294, 2);

    // Verify first drink was eliminated by checking BAC at second drink time
    const secondDrinkTime = entries[1].consumedAt;
    const bacAtSecondDrink = getCurrentBAC(series, secondDrinkTime);
    expect(bacAtSecondDrink).toBeLessThan(ZERO_BAC_THRESHOLD);
  });

  test('entries logged in the past are calculated correctly', () => {
    const pastDate = new Date('2025-01-15T20:00:00Z');
    const entries = [createEntryAt(14, pastDate)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    expect(series[0].time.getTime()).toBe(pastDate.getTime());
    const peak = Math.max(...series.map(p => p.bac));
    expect(peak).toBeCloseTo(0.294, 2);
  });

  test('future timestamps are ignored', () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours future
    const entries = [
      createEntry(14, 0),      // Now
      createEntryAt(14, futureDate), // Future - should be ignored
    ];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    const peak = Math.max(...series.map(p => p.bac));
    // Should be same as single drink (future ignored)
    expect(peak).toBeCloseTo(0.294, 2);
  });

  test('throws on zero weight', () => {
    const badProfile = { ...defaultProfile, weightKg: 0 };
    const entries = [createEntry(14, 0)];

    expect(() => calculateBACSeries(entries, badProfile)).toThrow('Weight must be greater than zero');
  });

  test('throws on negative weight', () => {
    const badProfile = { ...defaultProfile, weightKg: -70 };
    const entries = [createEntry(14, 0)];

    expect(() => calculateBACSeries(entries, badProfile)).toThrow('Weight must be greater than zero');
  });

  test('throws on negative elimination rate', () => {
    const badProfile = { ...defaultProfile, eliminationRate: -0.1 };
    const entries = [createEntry(14, 0)];

    expect(() => calculateBACSeries(entries, badProfile)).toThrow('Elimination rate cannot be negative');
  });

  test('zero ABV contributes zero BAC', () => {
    const entries = [createEntry(0, 0)]; // 0 grams = 0% ABV
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    for (const point of series) {
      expect(point.bac).toBe(0);
    }
  });
});

describe('getCurrentBAC', () => {
  test('returns 0 for empty series', () => {
    expect(getCurrentBAC([])).toBe(0);
  });

  test('returns BAC at current time', () => {
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);
    const current = getCurrentBAC(series, new Date());

    expect(current).toBeGreaterThan(0);
    expect(current).toBeLessThanOrEqual(Math.max(...series.map(p => p.bac)));
  });

  test('returns 0 for past time when BAC eliminated', () => {
    const entries = [createEntry(5, 10)]; // Small drink, 10 hours ago
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);
    const current = getCurrentBAC(series, new Date());

    expect(current).toBeLessThanOrEqual(ZERO_BAC_THRESHOLD);
  });
});

describe('getPeakBAC', () => {
  test('returns null for empty series', () => {
    expect(getPeakBAC([])).toBeNull();
  });

  test('returns peak BAC and time', () => {
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);
    const peak = getPeakBAC(series);

    expect(peak).not.toBeNull();
    expect(peak!.bac).toBeCloseTo(0.294, 2);
    expect(peak!.time).toBeInstanceOf(Date);
  });

  test('correctly identifies peak in multi-drink scenario', () => {
    const entries = [
      createEntry(14, 2),
      createEntry(14, 1),
      createEntry(14, 0.5),
    ];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);
    const peak = getPeakBAC(series);

    expect(peak).not.toBeNull();
    // Peak should be at or near the last drink time
    const lastDrinkTime = entries[entries.length - 1].consumedAt.getTime();
    const peakTime = peak!.time.getTime();
    expect(Math.abs(peakTime - lastDrinkTime)).toBeLessThan(30 * 60 * 1000); // Within 30 min
  });
});

describe('getTimeToZero', () => {
  test('returns null for empty series', () => {
    expect(getTimeToZero([])).toBeNull();
  });

  test('returns 0 when already at zero', () => {
    const entries = [createEntry(1, 10)]; // Tiny drink, long ago
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);
    const timeToZero = getTimeToZero(series, new Date());

    expect(timeToZero).toBe(0);
  });

  test('returns positive minutes for active BAC', () => {
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);
    const timeToZero = getTimeToZero(series, new Date());

    expect(timeToZero).toBeGreaterThan(0);
    // Roughly: 0.294‰ / 0.15‰/h = ~2 hours = ~120 min
    expect(timeToZero).toBeGreaterThan(60);
    expect(timeToZero).toBeLessThan(300);
  });

  test('decreases as time passes', () => {
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    const now = new Date();
    const timeNow = getTimeToZero(series, now);
    const timeLater = getTimeToZero(series, new Date(now.getTime() + 30 * 60 * 1000)); // 30 min later

    expect(timeNow).not.toBeNull();
    expect(timeLater).not.toBeNull();
    expect(timeLater!).toBeLessThan(timeNow!);
  });
});

describe('calculateBAC (convenience function)', () => {
  test('returns full result object', () => {
    const entries = [createEntry(14, 0)];
    const result = calculateBAC(entries, defaultProfile, defaultOptions);

    expect(result).toHaveProperty('series');
    expect(result).toHaveProperty('currentBAC');
    expect(result).toHaveProperty('peakBAC');
    expect(result).toHaveProperty('timeToZeroMinutes');
    expect(result.series).toBeInstanceOf(Array);
    expect(typeof result.currentBAC).toBe('number');
    expect(result.peakBAC).toHaveProperty('bac');
    expect(result.peakBAC).toHaveProperty('time');
    expect(typeof result.timeToZeroMinutes).toBe('number');
  });
});

describe('Edge cases', () => {
  test('handles very small drinks (below zero threshold)', () => {
    const entries = [createEntry(0.4, 0)]; // 0.4g - below 0.01‰ threshold
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    const peak = Math.max(...series.map(p => p.bac));
    // Below threshold gets clamped to 0
    expect(peak).toBe(0);
  });

  test('handles small drinks (above zero threshold)', () => {
    const entries = [createEntry(1, 0)]; // 1g - above threshold
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    const peak = Math.max(...series.map(p => p.bac));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeGreaterThanOrEqual(ZERO_BAC_THRESHOLD);
  });

  test('handles very large drinks', () => {
    const entries = [createEntry(100, 0)]; // 100g (extreme)
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    const peak = Math.max(...series.map(p => p.bac));
    expect(peak).toBeGreaterThan(2); // Very high
  });

  test('handles many drinks over long period', () => {
    const entries: DrinkEntry[] = [];
    for (let i = 0; i < 20; i++) {
      entries.push(createEntry(10, i * 0.5)); // 20 drinks over 10 hours
    }
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    expect(series.length).toBeGreaterThan(0);
    const peak = Math.max(...series.map(p => p.bac));
    expect(peak).toBeGreaterThan(0);
  });

  test('profile with custom elimination rate', () => {
    const fastElimination: Profile = {
      ...defaultProfile,
      eliminationRate: 0.30, // Double rate
    };
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, fastElimination, defaultOptions);

    const peak = Math.max(...series.map(p => p.bac));
    expect(peak).toBeCloseTo(0.294, 2); // Peak same, but eliminates faster

    const timeToZero = getTimeToZero(series, new Date());

    const normalSeries = calculateBACSeries(entries, defaultProfile, defaultOptions);
    const normalTimeToZero = getTimeToZero(normalSeries, new Date());

    // Faster elimination should reach zero sooner
    expect(timeToZero).not.toBeNull();
    expect(normalTimeToZero).not.toBeNull();
    expect(timeToZero!).toBeLessThan(normalTimeToZero!);
  });

  test('BAC points have correct time ordering', () => {
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    for (let i = 1; i < series.length; i++) {
      expect(series[i].time.getTime()).toBeGreaterThan(series[i - 1].time.getTime());
    }
  });

  test('all BAC values are finite numbers', () => {
    const entries = [createEntry(14, 0)];
    const series = calculateBACSeries(entries, defaultProfile, defaultOptions);

    for (const point of series) {
      expect(typeof point.bac).toBe('number');
      expect(isFinite(point.bac)).toBe(true);
      expect(point.bac).not.toBeNaN();
    }
  });
});