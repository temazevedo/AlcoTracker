# AlcoTracker - Implementation Plan

## Project Overview
Android alcohol-tracking app built with Expo (React Native) for personal BAC estimation and drink logging. Inspired by AlcoDroid.

---

## Tech Stack (Decided)

| Category | Choice |
|----------|--------|
| **Framework** | Expo SDK 58 (latest stable) with TypeScript |
| **Navigation** | Expo Router with Native Tabs (`expo-router/native-tabs`) |
| **Database** | Plain `expo-sqlite` with manual versioned migrations |
| **State** | Zustand (profile & settings) |
| **Charts** | `react-native-gifted-charts` + `react-native-svg` |
| **Notifications** | `expo-notifications` (local only) |
| **File/Share** | `expo-file-system`, `expo-sharing`, `expo-document-picker` |
| **i18n** | `expo-intl` / FormatJS |
| **Testing** | Jest (calculation logic) |
| **Package Manager** | npm |
| **Platform** | Android only (no iOS-specific work, but avoid blocking it) |

---

## Navigation Structure

### Native Tabs (4 tabs)
1. **Home** — Current BAC, time to ~0, today's BAC graph, quick-add buttons, "Add Drink", "Start Tracking"
2. **Log** — Browse by day, daily totals, entry list (edit/delete), day notes
3. **Stats** — Weekly/monthly charts (grams, drink count), average per drinking day
4. **Settings** — Profile, drink definitions, notifications, export/import CSV, about/disclaimer

### Stack Screens & Modals (outside tabs)
- Add Drink
- Edit Entry
- Drink Definitions List
- New/Edit Drink Definition
- Start Tracking (night session)
- Session Summary

---

## Data Model (SQLite)

| Table | Columns |
|-------|---------|
| `drink_definitions` | id, name, volume_ml, abv, is_favorite, is_archived, created_at |
| `drink_entries` | id, definition_id (nullable), name_snapshot, volume_ml, abv, grams, consumed_at, session_id (nullable), note, created_at |
| `sessions` | id, start_at, end_at, interval_min, status (active/ended/cancelled), created_at |
| `day_notes` | date (YYYY-MM-DD), note |
| `profile_settings` | weight_kg, sex, units, bac_unit, elimination_rate, disclaimer_accepted_at |

**Notes:**
- Timestamps stored as UTC ISO strings (or epoch ms)
- Local-day boundaries handled correctly in Log/Stats
- Versioned migrations from the start

---

## Core Features

### Drink Definitions
- Pre-seeded: Water/Juice (330ml, 0%), Small beer (200ml, 5%), Can of beer (330ml, 5%), Pint (500ml, 5%), Wine (200ml, 12%), Typical cocktail (150ml, 13%), Shot (40ml, 40%), Spirit serving (50ml, 40%)
- Favorite flag, archive (soft delete)

### Add Drink Flow
- Choose definition (with "Recent" section)
- Set time (default now, editable to past)
- Optional note
- Snapshot: name, volume, ABV stored at entry time (history immutable)

### Quick-Add
- One-tap buttons for most recent distinct drinks

### BAC Calculation (Pure TS Module, Fully Tested)
- **Widmark formula**: BAC (‰) = grams_alcohol / (r × weight_kg) − β × hours_elapsed
  - r = 0.68 (men), 0.55 (women)
  - β = elimination rate (default 0.15 ‰/h, editable)
- Time-stepping every 5 minutes over all entries
- Each drink's contribution added at consumption time
- Elimination only while BAC > 0, never below 0
- Instant absorption initially; structured for future gradual absorption (e.g., linear over 30 min)
- Outputs: current BAC, peak BAC + time, estimated time to ~0, graph series

### Night Sessions with Reminders
- User picks start time, end time, reminder interval (default 30 min)
- Schedule ALL notifications at session start (works when app closed)
- Dedicated Android notification channel
- Notification: "Did you have a drink? Tap to log it."
- Actions: "Add last drink" (repeats most recent entry at current time), "Open app"
- Request POST_NOTIFICATIONS permission (Android 13+) on first session start
- Stop early / extend / edit interval → cancel & reschedule remaining
- Drinks logged during session linked to it
- Session Summary: total grams, drink count, peak BAC + time, estimated time to ~0
- UI note: battery saver may delay notifications; exact-alarm permission optional

### Stats
- Weekly & monthly views: total grams, drink count, average per drinking day
- Bar charts per day (week) or week (month)

### Export / Import
- Export full log + definitions as CSV via Android share sheet
- Import from CSV with validation, duplicate detection, preview of rows to add

---

## Non-Functional Requirements

- **i18n**: English strings in translation layer (FormatJS), ready for pt-PT
- **Theming**: Light/dark following system setting
- **Offline-only**: No analytics, no tracking, no data leaves device except explicit export
- **Accessibility**: Readable font sizes, sufficient contrast, content descriptions on buttons
- **Disclaimer**: First launch (must accept) + in Settings — estimates approximate, never use for driving decisions

---

## Implementation Order (Step-by-Step)

| Step | Description | Deliverable |
|------|-------------|-------------|
| **a** | Project setup, folder structure, Native Tabs navigation (empty screens) | Runnable Expo app with 4 tabs |
| **b** | Database schema, migrations, seed data, repository functions | SQLite DB with all tables, seed definitions, CRUD repos |
| **c** | BAC calculation module + Jest tests | Pure TS module, 100% test coverage for specified cases |
| **d** | Add Drink, Drink Definitions, Log screen | Full drink entry flow + day browsing |
| **e** | Home screen with BAC graph + quick-add buttons | Real-time BAC display, graph, quick-add |
| **f** | Night sessions & notifications | Session start/stop, scheduled notifications, actions |
| **g** | Stats screen | Weekly/monthly charts + summaries |
| **h** | Export/Import CSV | Share sheet export, validated import with preview |
| **i** | Settings, disclaimer, polish | Profile, definitions management, i18n, theming, a11y |

---

## Folder Structure (Planned)

```
AlcoTracker/
├── app/
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Native tabs layout
│   │   ├── index.tsx            # Home tab
│   │   ├── log.tsx              # Log tab
│   │   ├── stats.tsx            # Stats tab
│   │   └── settings.tsx         # Settings tab
│   ├── add-drink.tsx            # Add Drink modal/screen
│   ├── edit-entry.tsx           # Edit Entry modal
│   ├── drink-definitions.tsx    # Definitions list
│   ├── drink-definition-edit.tsx# New/Edit Definition
│   ├── start-tracking.tsx       # Start Tracking modal
│   └── session-summary.tsx      # Session Summary modal
├── src/
│   ├── db/
│   │   ├── schema.ts            # Table definitions
│   │   ├── migrations/          # Versioned migration files
│   │   ├── repository.ts        # Repository functions
│   │   └── seed.ts              # Default drink definitions
│   ├── bac/
│   │   ├── calculate.ts         # Core BAC algorithm
│   │   ├── types.ts             # TypeScript interfaces
│   │   └── calculate.test.ts    # Jest tests
│   ├── store/
│   │   └── useProfileStore.ts   # Zustand store (profile + settings)
│   ├── i18n/
│   │   ├── index.ts             # FormatJS setup
│   │   └── messages/
│   │       ├── en.json
│   │       └── pt-PT.json       # (placeholder for future)
│   ├── components/
│   │   ├── BACGraph.tsx         # Home screen graph
│   │   ├── QuickAddButtons.tsx  # Home quick-add
│   │   ├── DrinkEntryItem.tsx   # Log list item
│   │   ├── DayNoteInput.tsx     # Day note editor
│   │   └── StatsChart.tsx       # Stats bar charts
│   ├── hooks/
│   │   ├── useDrinks.ts         # Drink entries + definitions
│   │   ├── useSessions.ts       # Night session logic
│   │   └── useBAC.ts            # Current BAC + graph series
│   ├── utils/
│   │   ├── date.ts              # Date helpers (local day boundaries)
│   │   ├── csv.ts               # Export/import CSV logic
│   │   ├── notifications.ts     # Notification scheduling/helpers
│   │   └── units.ts             # Unit conversions (kg/lb, ‰/%)
│   └── constants/
│       └── defaultDrinks.ts     # Seed data constants
├── assets/
│   └── fonts/                   # (if custom fonts needed)
├── package.json
├── tsconfig.json
├── app.json / app.config.ts
├── jest.config.js
└── README.md
```

---

## Dependencies to Install

```bash
# Core
npx create-expo-app@latest AlcoTracker --template blank-typescript
cd AlcoTracker

# Navigation (Expo Router + Native Tabs)
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npx expo install expo-router@latest  # Ensure SDK 58 compatible version

# Database
npx expo install expo-sqlite

# State
npm install zustand

# Charts
npx expo install react-native-svg
npm install react-native-gifted-charts

# Notifications
npx expo install expo-notifications expo-device expo-permissions

# File System / Sharing / Document Picker
npx expo install expo-file-system expo-sharing expo-document-picker

# i18n
npx expo install expo-intl expo-localization
npm install intl-messageformat

# Dev Dependencies
npm install -D jest @types/jest ts-jest @testing-library/react-native
npm install -D @types/react-native @types/react

# TypeScript types for expo modules (usually included)
```

**Note**: Run `npx expo install` for Expo SDK packages to ensure version compatibility. Use `npm install` for non-Expo packages.

---

## Key Implementation Details

### BAC Calculation Module (`src/bac/calculate.ts`)
```typescript
// Types
interface DrinkEntry {
  grams: number;
  consumedAt: Date; // UTC
}

interface Profile {
  weightKg: number;
  sex: 'male' | 'female';
  eliminationRate: number; // ‰/h
}

// Core function
function calculateBACSeries(
  entries: DrinkEntry[],
  profile: Profile,
  options: { stepMinutes: 5; absorptionModel: 'instant' | 'linear30min' }
): BACPoint[] // { time: Date; bac: number }

// Helpers
function getCurrentBAC(series: BACPoint[], now: Date): number
function getPeakBAC(series: BACPoint[]): { bac: number; time: Date } | null
function getTimeToZero(series: BACPoint[], now: Date): number | null // minutes
```

### Jest Test Coverage (`src/bac/calculate.test.ts`)
- Single drink (both sexes)
- Several overlapping drinks
- Gap long enough to reach 0, then drinking again
- Unit conversions (kg/lb, ‰/%)
- Entries logged in the past
- Edge cases: zero weight, zero ABV, future timestamps

### Database Migrations
- `001_initial_schema.sql` — Create all 5 tables + indexes
- `002_seed_definitions.sql` — Insert 8 default drink definitions
- Migration runner in `src/db/migrations.ts` with version tracking in `db_version` table or `profile_settings`

### Notification Scheduling
- On session start: compute all fire times between start_at and end_at at interval_min
- Schedule each with `Notifications.scheduleNotificationAsync` using `trigger: { type: 'date', date: fireDate }`
- Use dedicated channel: `alco-tracker-reminders`
- Action identifiers: `ADD_LAST_DRINK`, `OPEN_APP`
- Handle `Notifications.addNotificationResponseReceivedListener` for background taps

### CSV Format
```
type,definition_id,name,volume_ml,abv,grams,consumed_at,session_id,note
drink_definition,,Water/Juice,330,0,0,,,
drink_entry,1,Small beer,200,5,7.89,2025-01-15T20:30:00Z,1,
day_note,,,,,,2025-01-15,,"Long day"
```

---

## Commands Reference

```bash
# Development
npm run dev              # Start Expo dev server
npm run android          # Build & run on Android device/emulator (dev client)
npm run build:android    # Build production APK/AAB

# Testing
npm test                 # Run Jest tests
npm test -- --watch      # Watch mode

# Database (manual inspection)
adb shell
sqlite3 /data/data/host.exp.exponent/databases/AlcoTracker.db

# Linting/Type-check
npm run lint             # If eslint configured
npx tsc --noEmit         # TypeScript check
```

---

## Open Questions / Assumptions (Resolved)

1. ✅ Expo SDK 58 → `expo-router/native-tabs`
2. ✅ Chart library → `react-native-gifted-charts`
3. ✅ Database → Plain `expo-sqlite` with manual migrations
4. ✅ i18n → `expo-intl` / FormatJS
5. ✅ Package manager → npm

---

## Next Steps

1. **Step a**: Initialize Expo project, configure TypeScript, set up Native Tabs navigation with 4 empty tab screens
2. Review the running app structure before proceeding to database layer

---

*Generated from Plan_prompt.md with user-confirmed tech choices.*