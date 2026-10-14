# Build Plan

List the features that make up your project, high level and in rough build order.
Keep each item to one line; the details come later in `/feature`.
Plain bullets are fine. When both planning docs are ready, run `/overview`.
It adds tracking numbers and checkboxes to your feature list before generating
the project overview.

Run `/feature` to spec the next unchecked item, or `/feature 2` to pick one.
Keep completed items checked and append new features as the project grows.
Do not renumber completed features; their archived specs refer to those IDs.

Scaffolding the app and prototyping its look are pre-build steps, not features.
Start with your first real slice of functionality.

## Your features

- [X] 1. **Project setup & Native Tabs navigation** — Initialize Expo project structure, configure TypeScript, set up Expo Router with 4 native tab screens (Home, Log, Stats, Settings) as empty placeholders. Runnable app with tab navigation.
- [X] 2. **Database schema, migrations & seed data** — Create SQLite schema (5 tables), versioned migration runner, seed 8 default drink definitions, repository functions for CRUD operations.
- [X] 3. **BAC calculation module + Jest tests** — Pure TypeScript Widmark formula implementation with 5-min time-stepping, instant absorption model, helper functions (current BAC, peak BAC, time to zero). 100% test coverage for specified cases.
- [X] 4. **Add Drink, Drink Definitions & Log screen** — Drink definitions list (add/edit/archive/favorite), Add Drink flow (pick definition, set time, note, snapshot), Log screen (browse by day, daily totals, entry list with edit/delete, day notes).
- [X] 5. **Home screen with BAC graph & quick-add** — Real-time BAC display, current BAC + time to zero, today's BAC line graph (react-native-gifted-charts), quick-add buttons for recent drinks, "Add Drink" and "Start Tracking" actions.
- [X] 6. **Night sessions & notifications** — Session start/stop/extend UI, schedule all notifications at start (date triggers), dedicated Android channel, notification actions ("Add last drink", "Open app"), POST_NOTIFICATIONS permission handling, session summary screen.
- [X] 7. **Stats screen** — Weekly & monthly views, bar charts (grams per day for week, grams per week for month), totals and averages per drinking day.
- [ ] 8. **Export/Import CSV** — Export full log + definitions via Android share sheet, import with validation, duplicate detection, preview of rows to add.
- [ ] 9. **Settings, disclaimer & polish** — Profile settings (weight, sex, units, elimination rate), drink definitions management, notification preferences, i18n (FormatJS en/pt-PT), theming (system light/dark), accessibility, disclaimer dialog (first launch + Settings), final UI polish.