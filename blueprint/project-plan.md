# Project Plan

> One of the two planning docs you provide. Use as much detail as the project
> needs, including rationale, constraints, examples, edge cases, and explicit
> exclusions that should guide later feature work. Draft it directly, develop it
> through any AI conversation, or optionally run `/discovery` for a guided deep
> planning session. The content is always yours to direct. When it is filled in,
> run `/overview` to generate the project overview from this plus `build-plan.md`.

## 1. Problem - What problem are we solving?

Android alcohol-tracking app for personal BAC (Blood Alcohol Content) estimation and drink logging. Inspired by AlcoDroid. Users want to track their alcohol consumption, see real-time BAC estimates, understand their drinking patterns, and have reminders during drinking sessions — all offline, private, and without cloud dependencies.

## 2. Users - Who is this for?

Individual Android users who want to track their alcohol consumption for personal awareness, health monitoring, or harm reduction. Not for medical, legal, or law-enforcement use. Single-user, local-first, no accounts or sync.

## 3. Features - What does the MVP need?

- **Drink Definitions**: Pre-seeded library of common drinks (beer, wine, spirits, cocktails, water/juice) with volume and ABV. User can add/edit/favorite/archive definitions.
- **Add Drink Flow**: Pick a definition (with "Recent" section), set consumption time (default now, editable to past), optional note. Stores immutable snapshot at entry time.
- **Quick-Add**: One-tap buttons for most recent distinct drinks on Home screen.
- **BAC Calculation**: Widmark formula with time-stepping (5-min intervals). Outputs current BAC, peak BAC + time, estimated time to ~0, graph series. Pure TypeScript module, fully tested with Jest.
- **Log Screen**: Browse by day, daily totals (grams, count), entry list with edit/delete, day notes.
- **Home Screen**: Current BAC, time to ~0, today's BAC graph, quick-add buttons, "Add Drink", "Start Tracking".
- **Night Sessions**: User picks start/end time and reminder interval. Schedules all notifications at session start (works when app closed). Dedicated Android notification channel. Actions: "Add last drink", "Open app". Session summary with totals, peak BAC, time to zero.
- **Stats Screen**: Weekly & monthly views — total grams, drink count, average per drinking day. Bar charts (day for week, week for month).
- **Export/Import CSV**: Export full log + definitions via Android share sheet. Import with validation, duplicate detection, preview.
- **Settings**: Profile (weight, sex, units), drink definitions management, notifications, export/import, about/disclaimer.
- **i18n**: English strings in FormatJS translation layer, ready for pt-PT.
- **Theming**: Light/dark following system setting.
- **Disclaimer**: First launch (must accept) + in Settings — estimates approximate, never use for driving decisions.

## 4. Data - What are we storing?

SQLite tables (local device only):

| Table | Columns |
|-------|---------|
| `drink_definitions` | id, name, volume_ml, abv, is_favorite, is_archived, created_at |
| `drink_entries` | id, definition_id (nullable), name_snapshot, volume_ml, abv, grams, consumed_at, session_id (nullable), note, created_at |
| `sessions` | id, start_at, end_at, interval_min, status (active/ended/cancelled), created_at |
| `day_notes` | date (YYYY-MM-DD), note |
| `profile_settings` | weight_kg, sex, units, bac_unit, elimination_rate, disclaimer_accepted_at |

- Timestamps stored as UTC ISO strings (or epoch ms)
- Local-day boundaries handled correctly in Log/Stats
- Versioned migrations from the start

## 5. Tech - What stack are we using?

| Category | Choice |
|----------|--------|
| **Framework** | Expo SDK 58 with TypeScript |
| **Navigation** | Expo Router with Native Tabs (`expo-router/native-tabs`) |
| **Database** | Plain `expo-sqlite` with manual versioned migrations |
| **State** | Zustand (profile & settings) |
| **Charts** | `react-native-gifted-charts` + `react-native-svg` |
| **Notifications** | `expo-notifications` (local only) |
| **File/Share** | `expo-file-system`, `expo-sharing`, `expo-document-picker` |
| **i18n** | `expo-intl` / FormatJS |
| **Testing** | Jest (calculation logic) |
| **Package Manager** | npm |
| **Platform** | Android primary (no iOS-specific work, but avoid blocking it) |

## 6. Monetize - How will this make money?

Not monetized. Personal/open-source project. No ads, no subscriptions, no data collection.

## 7. UI/UX - How should this look and feel?

- Clean, functional, mobile-first Android Material feel
- Native tabs for primary navigation (Home, Log, Stats, Settings)
- Modals/stack screens for flows (Add Drink, Edit Entry, Start Tracking, Session Summary)
- System light/dark theme support
- Readable font sizes, sufficient contrast, content descriptions for accessibility
- BAC graph on Home: line chart with time on X-axis, BAC (‰) on Y-axis, peak marker, "time to zero" annotation
- Stats: bar charts (react-native-gifted-charts)
- Disclaimer dialog on first launch and in Settings

## 8. Deployment - Where and how will this ship?

- **Target**: Android (APK/AAB via EAS Build or `npx expo run:android --variant release`)
- **Build command**: `npx expo run:android --variant release` or EAS `eas build -p android`
- **Start command**: `npx expo start` (dev), native app launch (production)
- **Env vars**: None required (fully offline)
- **Database**: Local SQLite file on device
- **Health check**: N/A (offline app)
- **Domain**: N/A

## 9. Usage model and constraints

- **Scale**: Single user, single device. Low data volume (hundreds of entries/year).
- **Operation**: Offline-only, internet-facing only for optional EAS updates or manual APK install.
- **Trust**: Trusted user (self). No adversarial input.
- **Tenancy**: Single-tenant (one user per device).
- **Security**: No auth needed. Data never leaves device except explicit CSV export.
- **Compliance**: None. Not a medical device. Disclaimer required.
- **Availability**: App must work fully offline. Notifications must fire when app is closed.
- **Non-requirements**: No cloud sync, no multi-device, no server, no analytics, no social features, no iOS-specific polish (but don't block iOS).