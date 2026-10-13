/**
 * Default drink definitions for AlcoTracker.
 * Matches the seed data in migration 002_seed_definitions.sql
 */

export interface DefaultDrinkDefinition {
  name: string;
  volume_ml: number;
  abv: number;
  is_favorite: boolean;
}

export const DEFAULT_DRINK_DEFINITIONS: readonly DefaultDrinkDefinition[] = [
  { name: 'Water/Juice', volume_ml: 330, abv: 0.0, is_favorite: true },
  { name: 'Small beer', volume_ml: 200, abv: 5.0, is_favorite: true },
  { name: 'Can of beer', volume_ml: 330, abv: 5.0, is_favorite: true },
  { name: 'Pint', volume_ml: 500, abv: 5.0, is_favorite: false },
  { name: 'Wine', volume_ml: 200, abv: 12.0, is_favorite: true },
  { name: 'Typical cocktail', volume_ml: 150, abv: 13.0, is_favorite: false },
  { name: 'Shot', volume_ml: 40, abv: 40.0, is_favorite: false },
  { name: 'Spirit serving', volume_ml: 50, abv: 40.0, is_favorite: false },
] as const;

// Helper to calculate grams of pure alcohol
export function calculateGrams(volume_ml: number, abv: number): number {
  // Pure alcohol density: 0.789 g/ml
  // grams = volume_ml * (abv / 100) * 0.789
  return volume_ml * (abv / 100) * 0.789;
}

// Pre-calculated grams for default drinks
export const DEFAULT_DRINK_GRAMS = DEFAULT_DRINK_DEFINITIONS.map((d) => ({
  ...d,
  grams: calculateGrams(d.volume_ml, d.abv),
}));