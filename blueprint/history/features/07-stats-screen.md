# Feature: Stats screen

**From build-plan:** feature 7
**Build attempt:** 1
**Branch:** feature/stats-screen

---

## Goal

Implement the Stats tab with weekly and monthly bar charts showing alcohol consumption patterns. Users can view grams per day for the past week and grams per week for the past month, plus summary cards with totals and averages per drinking day.

---

## Design reference

Not applicable — functional implementation using existing chart library (react-native-gifted-charts) and design system (system light/dark, existing card styles).

---

## In scope

- **Stats tab screen** (`src/app/(tabs)/stats.tsx`): Main entry point, replaces placeholder
- **Weekly view**: Bar chart of grams per day for the past 7 days (including today)
  - X-axis: Day labels (Mon, Tue, Wed, etc.)
  - Y-axis: Grams of pure alcohol
  - Highlight drinking days vs zero days
- **Monthly view**: Bar chart of grams per week for the past 4 weeks
  - X-axis: Week labels (Week 1, Week 2, etc. or date ranges)
  - Y-axis: Grams of pure alcohol
- **Summary cards** (above charts):
  - Total grams (period)
  - Total drinks (period)
  - Average grams per drinking day
  - Average drinks per drinking day
  - Drinking days count / total days
- **Segmented control** to switch between Weekly / Monthly
- **Empty states**: No data message when no entries in period
- **Dark mode support**: Consistent with Home screen theming
- **Accessibility**: Readable fonts, sufficient contrast, content descriptions

---

## Out of scope

- Export/Import CSV (Feature 8)
- Settings, i18n, theming, disclaimer (Feature 9)
- Yearly view or custom date ranges
- Drink-type breakdown (beer/wine/spirits)
- BAC statistics (peak BAC trends, time-to-zero trends)
- Comparison with previous periods

---

## Build loop

- **Review cadence:** `workflow.stepReview: "feature"` — one feature-level review packet after all steps
- **Checkpoint commits:** `workflow.checkpointCommits: "disabled"` — no per-step commits
- **Quality gates:** Manual audit/check, independent review when-sensitive, try-guide when-testable
- **Verify:** TypeScript (`npx tsc --noEmit`) + Lint (`npm run lint`) + Tests (`npm test`) must pass before review

---

## Build steps

### Step 1: Create stats aggregation utilities

**Files:** `src/stats/aggregate.ts` (new)

**Changes:**
- `getWeeklyStats(entries: DrinkEntryRow[]): WeeklyStats` — Aggregate entries into 7-day buckets (today + 6 previous days)
- `getMonthlyStats(entries: DrinkEntryRow[]): MonthlyStats` — Aggregate entries into 4-week buckets
- Types: `WeeklyStats`, `MonthlyStats` with:
  - `days: DayStat[]` / `weeks: WeekStat[]` — Per-bucket data
  - `totalGrams: number`
  - `totalDrinks: number`
  - `drinkingDays: number` (days/weeks with > 0 grams)
  - `avgGramsPerDrinkingDay: number`
  - `avgDrinksPerDrinkingDay: number`

**Done when:** Unit tests pass for aggregation logic with various entry distributions.

---

### Step 2: Create bar chart component

**Files:** `src/components/BarChart.tsx` (new)

**Changes:**
- Reusable bar chart using `react-native-gifted-charts` `BarChart`
- Props: `data: { label: string; value: number; isDrinkingDay?: boolean }[]`, `width`, `height`, `maxValue?`
- Theming: Dark/light mode support matching BACGraph
- Drinking days highlighted (primary color), zero days muted
- Y-axis labels, X-axis labels, grid lines
- Empty state: "No data for this period"

**Done when:** Component renders correctly with test data in both themes.

---

### Step 3: Create summary cards component

**Files:** `src/components/StatsSummaryCards.tsx` (new)

**Changes:**
- Row of 4 summary cards (or 2x2 grid):
  1. Total grams (period)
  2. Total drinks (period)
  3. Avg grams/drinking day
  4. Avg drinks/drinking day
- Each card: Large value + label, themed background
- Handle zero drinking days (show "—" for averages)

**Done when:** Cards display correct values for test data.

---

### Step 4: Implement Stats screen with segmented control

**Files:** `src/app/(tabs)/stats.tsx` (modify), `src/components/StatsSegmentedControl.tsx` (new)

**Changes:**
- Fetch all entries via `getEntriesByDateRange` (last 28 days for monthly, last 7 for weekly)
- State: `view: 'weekly' | 'monthly'`
- Segmented control to switch views
- Show appropriate chart + summary cards for selected view
- Loading state while fetching
- Error state with retry

**Done when:** Stats tab shows working weekly/monthly views with real data.

---

### Step 5: Add repository helper for stats queries

**Files:** `src/db/repository.ts` (modify)

**Changes:**
- `getEntriesForStats(lookbackDays: number): RepositoryResult<DrinkEntryRow[]>` — Get entries for last N days (28 for monthly)
- Or reuse existing `getEntriesByDateRange` with calculated dates

**Done when:** Stats screen can fetch required data efficiently.

---

### Step 6: Verify TypeScript, lint, and tests pass

**Commands:** `npx tsc --noEmit`, `npm run lint`, `npm test`

**Done when:** All three commands exit 0 with no errors.

---

## Files / areas

| File | Type | Notes |
|------|------|-------|
| `src/stats/aggregate.ts` | create | Stats aggregation logic |
| `src/components/BarChart.tsx` | create | Reusable bar chart component |
| `src/components/StatsSummaryCards.tsx` | create | Summary cards row/grid |
| `src/components/StatsSegmentedControl.tsx` | create | Weekly/Monthly toggle |
| `src/app/(tabs)/stats.tsx` | modify | Main Stats tab screen |
| `src/db/repository.ts` | modify | Add stats query helper |

---

## Data / contracts

### DrinkEntry (from Feature 2)

```typescript
interface DrinkEntryRow {
  id: number;
  definition_id: number | null;
  name_snapshot: string;
  volume_ml: number;
  abv: number;
  grams: number;              // Pure alcohol grams
  consumed_at: string;        // ISO8601 UTC
  session_id: number | null;
  note: string | null;
  created_at: string;
}
```

### Aggregation Types

```typescript
interface DayStat {
  date: string;           // YYYY-MM-DD (local)
  label: string;          // "Mon", "Tue", etc.
  grams: number;
  drinkCount: number;
  isDrinkingDay: boolean;
}

interface WeekStat {
  weekStart: string;      // YYYY-MM-DD (Monday)
  label: string;          // "Jan 1-7", "Week 1", etc.
  grams: number;
  drinkCount: number;
  isDrinkingWeek: boolean;
}

interface WeeklyStats {
  days: DayStat[];
  totalGrams: number;
  totalDrinks: number;
  drinkingDays: number;
  avgGramsPerDrinkingDay: number;
  avgDrinksPerDrinkingDay: number;
}

interface MonthlyStats {
  weeks: WeekStat[];
  totalGrams: number;
  totalDrinks: number;
  drinkingWeeks: number;
  avgGramsPerDrinkingWeek: number;
  avgDrinksPerDrinkingWeek: number;
}
```

### Repository Functions

- `getEntriesByDateRange(startDate, endDate)` — Existing, returns entries for date range
- `getEntriesForStats(lookbackDays)` — New helper, convenience for stats screen

---

## Testing

- Unit tests for `aggregate.ts`: weekly/monthly aggregation with various entry patterns (empty, single day, multiple days, gaps)
- Component tests for `BarChart.tsx` and `StatsSummaryCards.tsx` (render with mock data)
- Integration test: Stats screen loads entries, renders charts, switches views
- Jest test command (`npm test`) already configured

---

## Notes for the AI

- Use `react-native-gifted-charts` `BarChart` (already installed, used by BACGraph)
- Follow existing theming pattern: `useColorScheme`, dark/light colors
- Week starts on Monday (ISO 8601) for consistency
- Date handling: Use local dates for bucketing (not UTC) to match user's calendar
- Reuse existing `getEntriesByDateRange` — calculate start/end dates in screen/component
- Chart data format: `{ value: number; label: string; x: number }` for X-axis positioning
- Empty state: Show friendly message when no entries in period
- Performance: Fetch once, compute both weekly/monthly from same data

---

## Open questions

1. **Week start day**: Monday (ISO 8601) or Sunday? (Default: Monday)
2. **Monthly view**: 4 calendar weeks (28 days) or calendar month? (Default: 4 weeks = 28 days for simplicity)
3. **Zero-value bars**: Show as thin line or hidden? (Default: show as muted thin bar)
4. **Navigation**: Any drill-down from bar to day detail? (Out of scope for MVP)

---

## Verification evidence

- ✅ `npx tsc --noEmit` — passes
- ✅ `npm run lint` — passes (0 errors)
- ✅ `npm test` — 59 passed (13 new stats tests + 46 existing)
- ✅ Features 1-6 complete (tabs, database, BAC calc, drink/log, home graph, sessions)
- ✅ `react-native-gifted-charts` + `react-native-svg` installed
- ✅ Repository has `getEntriesByDateRange` for date-based queries
- ✅ Stats tab placeholder exists at `src/app/(tabs)/stats.tsx`
- ✅ BACGraph component demonstrates chart library usage patterns

---

## Files changed in this build

### New files
- `src/stats/aggregate.ts`
- `src/stats/aggregate.test.ts`
- `src/components/BarChart.tsx`
- `src/components/StatsSummaryCards.tsx`
- `src/components/StatsSegmentedControl.tsx`
- `src/app/(tabs)/stats.tsx` (replaced placeholder)

### Modified files
- `src/db/repository.ts` (added `getEntriesForStats`)
- `blueprint/build-plan.md` (checked off feature 7)
- `blueprint/context/project-overview.md` (updated source hash)

---

## Completion metadata

**Completed:** 2026-10-14
**Branch:** feature/stats-screen
**Base commit:** (to be filled at commit)
**Work commit:** (to be filled at commit)
**Verified spec SHA-256:** 6dba7e0e6e10d2c73d47327baabe6b9fd2818b91ba5f341f12807e7de27412d1