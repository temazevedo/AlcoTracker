# AlcoTracker - Project Overview

<!-- blueprint:source-hash 10eef960832c007dee3abb3c3bfcac0d0a7d57b051441af8245dc50e00909cfe -->

> Android alcohol-tracking app for personal BAC estimation and drink logging, inspired by AlcoDroid. Fully offline, privacy-first, single-device.

## Problem

Users want to track alcohol consumption, see real-time BAC estimates, understand drinking patterns, and receive reminders during drinking sessions — all without cloud dependencies, accounts, or data leaving their device.

## Users

- **Individual Android users** — Personal awareness, health monitoring, or harm reduction. Single-user, local-first, no accounts or sync. Not for medical, legal, or law-enforcement use.

## Usage model

- **Scale**: Single user, single device. Low data volume (hundreds of entries/year).
- **Operation**: Offline-only. Internet only for optional EAS updates or manual APK install.
- **Trust**: Trusted user (self). No adversarial input.
- **Tenancy**: Single-tenant (one user per device).
- **Security**: No auth needed. Data never leaves device except explicit CSV export.
- **Compliance**: None. Not a medical device. Disclaimer required.
- **Availability**: Must work fully offline. Notifications must fire when app is closed.
- **Non-requirements**: No cloud sync, no multi-device, no server, no analytics, no social features, no iOS-specific polish (but don't block iOS).

## Features

The MVP feature set in build order:

1. **Project setup & Native Tabs navigation** — Runnable Expo app with 4 native tab screens (Home, Log, Stats, Settings) as empty placeholders.
2. **Database schema, migrations & seed data** — SQLite schema (5 tables), versioned migration runner, 8 default drink definitions, repository functions for CRUD.
3. **BAC calculation module + Jest tests** — Pure TypeScript Widmark formula with 5-min time-stepping, instant absorption model, helpers (current BAC, peak BAC, time to zero). 100% test coverage.
4. **Add Drink, Drink Definitions & Log screen** — Drink definitions CRUD (add/edit/archive/favorite), Add Drink flow (pick definition, set time, note, immutable snapshot), Log screen (browse by day, daily totals, entry edit/delete, day notes).
5. **Home screen with BAC graph & quick-add** — Real-time BAC display, current BAC + time to zero, today's BAC line chart, quick-add buttons for recent drinks, "Add Drink" and "Start Tracking" actions.
6. **Night sessions & notifications** — Session start/stop/extend UI, schedule all notifications at start (date triggers), dedicated Android channel, actions ("Add last drink", "Open app"), POST_NOTIFICATIONS permission, session summary.
7. **Stats screen** — Weekly & monthly views, bar charts (grams/day for week, grams/week for month), totals and averages per drinking day.
8. **Export/Import CSV** — Export full log + definitions via Android share sheet, import with validation, duplicate detection, preview.
9. **Settings, disclaimer & polish** — Profile settings (weight, sex, units, elimination rate), drink definitions management, notification preferences, i18n (FormatJS en/pt-PT), theming (system light/dark), accessibility, disclaimer dialog (first launch + Settings), final UI polish.

## Data model

### DrinkDefinition

- `id` (integer, PK) — Auto-increment
- `name` (text) — Display name (e.g., "Small beer")
- `volume_ml` (integer) — Volume in milliliters
- `abv` (real) — Alcohol by volume percentage (e.g., 5.0)
- `is_favorite` (integer, 0/1) — Quick-access flag
- `is_archived` (integer, 0/1) — Soft delete
- `created_at` (text, ISO8601 UTC) — Creation timestamp

### DrinkEntry

- `id` (integer, PK) — Auto-increment
- `definition_id` (integer, FK nullable) — Links to DrinkDefinition, nullable for custom entries
- `name_snapshot` (text) — Drink name at entry time (immutable history)
- `volume_ml` (integer) — Volume at entry time
- `abv` (real) — ABV at entry time
- `grams` (real) — Pure alcohol grams (volume_ml × abv × 0.789 / 100)
- `consumed_at` (text, ISO8601 UTC) — When the drink was consumed
- `session_id` (integer, FK nullable) — Links to Session if logged during night session
- `note` (text, nullable) — Optional user note
- `created_at` (text, ISO8601 UTC) — Entry creation timestamp

### Session

- `id` (integer, PK) — Auto-increment
- `start_at` (text, ISO8601 UTC) — Session start time
- `end_at` (text, ISO8601 UTC) — Session end time
- `interval_min` (integer) — Reminder interval in minutes (default 30)
- `status` (text) — 'active' | 'ended' | 'cancelled'
- `created_at` (text, ISO8601 UTC) — Creation timestamp

### DayNote

- `date` (text, PK, YYYY-MM-DD) — Local date
- `note` (text) — Free-form note for the day

### ProfileSettings

- `weight_kg` (real) — User weight in kilograms
- `sex` (text) — 'male' | 'female' (determines Widmark r factor: 0.68 / 0.55)
- `units` (text) — 'metric' | 'imperial' (display preference)
- `bac_unit` (text) — 'promille' | 'percent' (display: ‰ or %)
- `elimination_rate` (real) — β in ‰/h (default 0.15)
- `disclaimer_accepted_at` (text, ISO8601 UTC nullable) — Timestamp of disclaimer acceptance

> **Lock shapes**: DrinkEntry snapshot fields (name_snapshot, volume_ml, abv, grams) are immutable — later definition edits don't affect history. Session links entries via session_id. ProfileSettings is a singleton row.

## Tech stack

- **Expo SDK 58 + TypeScript** — Framework and runtime
- **Expo Router + Native Tabs (`expo-router/native-tabs`)** — File-based routing, native bottom tabs
- **expo-sqlite** — Local SQLite database with manual versioned migrations
- **Zustand** — Global UI state (profile, settings)
- **react-native-gifted-charts + react-native-svg** — Line chart (Home BAC graph), bar charts (Stats)
- **expo-notifications** — Local scheduled notifications with Android channel, actions
- **expo-file-system, expo-sharing, expo-document-picker** — CSV export via share sheet, import via document picker
- **expo-intl / FormatJS** — i18n translation layer (en, pt-PT ready)
- **Jest + ts-jest** — Unit tests for BAC calculation logic
- **npm** — Package manager
- **Android primary** — No iOS-specific work, but avoid blocking iOS

## Monetization

Not monetized. Personal/open-source project. No ads, no subscriptions, no data collection.

## UI/UX

- **Native tabs** (4): Home, Log, Stats, Settings
- **Stack screens/modals**: Add Drink, Edit Entry, Drink Definitions, New/Edit Definition, Start Tracking, Session Summary
- **Theming**: System light/dark via `useColorScheme`
- **Home**: Current BAC (‰), time to ~0, today's BAC line chart (time vs BAC), peak marker, quick-add buttons, primary actions
- **Log**: Day list with totals, entry list with edit/delete, day note input
- **Stats**: Weekly/monthly bar charts, summary cards (total grams, drink count, avg/drinking day)
- **Settings**: Profile form, definitions management, notification prefs, export/import, about/disclaimer
- **Accessibility**: Readable fonts, sufficient contrast, content descriptions on buttons
- **Disclaimer**: First-launch modal (must accept) + Settings entry — estimates approximate, never use for driving decisions

## Deployment

- **Target**: Android (APK/AAB)
- **Build**: `npx expo run:android --variant release` or EAS `eas build -p android`
- **Start**: `npx expo start` (dev), native app launch (production)
- **Env vars**: None required (fully offline)
- **Database**: Local SQLite file on device
- **Health check**: N/A (offline app)
- **Domain**: N/A

## Open questions

None — both plans are aligned. No contradictions found between project-plan.md and build-plan.md.