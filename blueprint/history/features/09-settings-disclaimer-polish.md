# Feature: Settings, disclaimer & polish

**From build-plan:** feature 9
**Build attempt:** 1
**Branch:** feature/settings-disclaimer-polish

---

## Goal

Complete the Settings screen with fully functional profile management, notification preferences, internationalization (i18n) with English and Portuguese (pt-PT), theming support, accessibility improvements, a first-launch disclaimer dialog (also accessible from Settings), and final UI polish across the app.

---

## Design reference

Not applicable — functional implementation using existing design system (system light/dark, existing card styles, existing component patterns).

---

## In scope

- **Profile Settings** (Settings → Profile):
  - Weight (kg) input with validation
  - Sex selection (Male/Female)
  - Units selection (Metric/Imperial)
  - BAC Unit selection (Promille/Percent)
  - Elimination Rate input (‰/h) with validation
  - Persist changes via `updateProfile` repository function

- **Notification Preferences** (Settings → Notifications):
  - Toggle for Session Reminders (enables/disables notification scheduling)
  - Link to Android notification settings for POST_NOTIFICATIONS permission

- **Drink Definitions Management** (Settings → Drinks → Drink Definitions):
  - Already functional — navigate to existing Drink Definitions screen

- **Data Export/Import** (Settings → Data):
  - Already functional — Export CSV, Import CSV

- **Internationalization (i18n)**:
  - Install `expo-intl` and `@formatjs/intl` packages
  - Set up FormatJS with English (en) and Portuguese (pt-PT) locales
  - Extract translatable strings from all screens
  - Language selector in Settings (or follow system locale)
  - Message files: `src/i18n/en.json`, `src/i18n/pt-PT.json`

- **Theming**:
  - System light/dark mode (already via `useColorScheme`)
  - Ensure all screens respect theme consistently
  - Add theme colors to a central `src/theme/colors.ts`

- **Accessibility**:
  - Add `accessibilityLabel` and `accessibilityRole` to interactive elements
  - Ensure sufficient contrast ratios
  - Support dynamic font scaling
  - Screen reader friendly labels

- **Disclaimer Dialog**:
  - First-launch modal (check `disclaimer_accepted_at` in profile)
  - Must accept before using app
  - Text: Estimates are approximate, never use for driving decisions, consult professional for medical/legal advice
  - Accept button calls `acceptDisclaimer()` repository function
  - Settings → About → Disclaimer entry re-opens dialog

- **Final UI Polish**:
  - Consistent spacing, typography, colors across all screens
  - Loading states for async operations
  - Error handling with user-friendly messages
  - Empty states with helpful guidance
  - Consistent header/navigation patterns

---

## Out of scope

- Cloud sync or backup
- Multi-device support
- Social features
- iOS-specific polish (but don't block iOS)
- Advanced notification settings (sound, vibration patterns)
- Custom themes beyond light/dark

---

## Build loop

- **Review cadence:** `workflow.stepReview: "feature"` — one feature-level review packet after all steps
- **Checkpoint commits:** `workflow.checkpointCommits: "disabled"` — no per-step commits
- **Quality gates:** Manual audit/check, independent review when-sensitive, try-guide when-testable
- **Verify:** TypeScript (`npx tsc --noEmit`) + Lint (`npm run lint`) + Tests (`npm test`) must pass before review

---

## Build steps

### Step 1: Install i18n and theme dependencies

**Files:** `package.json`, `package-lock.json`

**Changes:**
- Run `npx expo install expo-localization @formatjs/intl @formatjs/intl-pluralrules @formatjs/intl-relativetimeformat @formatjs/intl-numberformat @formatjs/intl-datetimeformat -- --legacy-peer-deps`

**Done when:** Dependencies installed; `npx tsc --noEmit` passes.

---

### Step 2: Create i18n infrastructure

**Files:** `src/i18n/index.ts` (new), `src/i18n/en.json` (new), `src/i18n/pt-PT.json` (new), `src/i18n/useTranslation.ts` (new)

**Changes:**
- `src/i18n/index.ts`: FormatJS setup, locale detection, message loading
- `src/i18n/useTranslation.ts`: `useTranslation` hook with `t` function
- `src/i18n/en.json`: All English strings
- `src/i18n/pt-PT.json`: All Portuguese (Portugal) strings

**Done when:** Translation hook works; switching locale updates UI text.

---

### Step 3: Create theme system

**Files:** `src/theme/colors.ts` (new), `src/theme/spacing.ts` (new), `src/theme/typography.ts` (new), `src/theme/ThemeContext.tsx` (new), `src/theme/index.ts` (new)

**Changes:**
- Centralized color palette (light/dark)
- Spacing scale
- Typography scale
- Theme provider and hooks

**Done when:** All screens use theme colors/spacing; dark/light modes consistent.

---

### Step 3b: Migrate existing screens to use i18n and theme

**Files:** Multiple screen files

**Changes:**
- Wrap app with i18n provider in `src/app/_layout.tsx`
- Replace hardcoded strings with `t('key')` calls
- Replace hardcoded colors with theme colors
- Priority: Settings, Home, Add Drink, Log, Stats, Start Tracking, Session Summary, Drink Definitions

**Done when:** All user-visible strings use i18n; theme colors used consistently.

---

### Step 4: Implement Profile Settings screen

**Files:** `src/app/profile-settings.tsx` (new), `src/components/ProfileForm.tsx` (new)

**Changes:**
- Form with: Weight (number input), Sex (segmented), Units (segmented), BAC Unit (segmented), Elimination Rate (number input)
- Validation: weight > 0, elimination rate > 0
- Save calls `updateProfile`
- Navigate from Settings → Profile → Weight & Sex / Units / Elimination Rate

**Done when:** Profile settings persist and affect BAC calculations.

---

### Step 5: Implement Notification Preferences

**Files:** Modify `src/app/(tabs)/settings.tsx`

**Changes:**
- Session Reminders toggle functional (enables/disables notification scheduling)
- "Open Android Settings" button for POST_NOTIFICATIONS permission
- Persist preference (could use AsyncStorage or profile)

**Done when:** Toggle enables/disables session reminders; permission handling works.

---

### Step 6: Implement Disclaimer Dialog

**Files:** `src/components/DisclaimerModal.tsx` (new), modify `src/app/_layout.tsx`, modify `src/app/(tabs)/settings.tsx`

**Changes:**
- Modal component with disclaimer text, Accept button
- First-launch check in `_layout.tsx` (reads `disclaimer_accepted_at`)
- Accept button calls `acceptDisclaimer()` then dismisses
- Settings → About → Disclaimer opens same modal
- Prevent app interaction until accepted

**Done when:** First launch shows disclaimer; accept persists; Settings link works.

---

### Step 7: Accessibility improvements

**Files:** Multiple component files

**Changes:**
- Add `accessibilityLabel`, `accessibilityRole`, `accessibilityState` to buttons, inputs, switches
- Ensure contrast ratios (WCAG AA)
- Add `accessibilityHint` where helpful
- Test with TalkBack/VoiceOver

**Done when:** Screen reader navigation works; contrast passes.

---

### Step 8: Final UI Polish & Consistency

**Files:** Multiple screen/component files

**Changes:**
- Standardize header style across screens
- Consistent button styles (primary, secondary, destructive)
- Loading states for all async operations
- Empty states with helpful icons/messages
- Consistent spacing using theme spacing scale
- Error boundaries / error toasts
- Smooth animations/transitions

**Done when:** App feels polished; no visual inconsistencies.

---

### Step 9: Verify TypeScript, lint, and tests pass

**Commands:** `npx tsc --noEmit`, `npm run lint`, `npm test`

**Done when:** All three commands exit 0 with no errors.

---

## Files / areas

| File | Type | Notes |
|------|------|-------|
| `package.json` | modify | Add i18n dependencies |
| `src/i18n/index.ts` | create | i18n provider setup |
| `src/i18n/useTranslation.ts` | create | `useTranslation` hook |
| `src/i18n/en.json` | create | English messages |
| `src/i18n/pt-PT.json` | create | Portuguese (Portugal) messages |
| `src/theme/colors.ts` | create | Light/dark color palette |
| `src/theme/spacing.ts` | create | Spacing scale |
| `src/theme/typography.ts` | create | Typography scale |
| `src/theme/ThemeContext.tsx` | create | Theme provider and hooks |
| `src/theme/index.ts` | create | Theme system exports |
| `src/app/profile-settings.tsx` | create | Profile settings screen |
| `src/components/ProfileForm.tsx` | create | Profile form component |
| `src/components/DisclaimerModal.tsx` | create | Disclaimer modal |
| `src/app/_layout.tsx` | modify | i18n provider, disclaimer check |
| `src/app/(tabs)/settings.tsx` | modify | Wire profile, notifications, disclaimer |
| `src/app/(tabs)/index.tsx` | modify | i18n, theme |
| `src/app/start-tracking.tsx` | modify | i18n, theme |
| `src/app/add-drink.tsx` | modify | i18n, theme |
| `src/app/(tabs)/log.tsx` | modify | i18n, theme |
| `src/app/(tabs)/stats.tsx` | modify | i18n, theme |
| `src/app/drink-definitions.tsx` | modify | i18n, theme |
| `src/app/drink-definition-edit.tsx` | modify | i18n, theme |
| `src/app/edit-entry.tsx` | modify | i18n, theme |
| `src/app/start-tracking.tsx` | modify | i18n, theme |
| `src/app/session-summary.tsx` | modify | i18n, theme |
| `src/components/*` | modify | Accessibility, theme, i18n |

---

## Data / contracts

### ProfileSettings (existing)

```typescript
interface ProfileSettingsRow {
  weight_kg: number;
  sex: 'male' | 'female';
  units: 'metric' | 'imperial';
  bac_unit: 'promille' | 'percent';
  elimination_rate: number;
  disclaimer_accepted_at: string | null;
}
```

### i18n Message Structure

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "close": "Close",
    "loading": "Loading...",
    "error": "Error",
    "confirm": "Confirm",
    "ok": "OK",
    "yes": "Yes",
    "no": "No",
    "skip": "Skip",
    "overwrite": "Overwrite",
    "addNew": "Add New"
  },
  "settings": {
    "title": "Settings",
    "profile": "Profile",
    "notifications": "Notifications",
    "drinks": "Drinks",
    "data": "Data",
    "about": "About",
    "weight": "Weight",
    "sex": "Sex",
    "units": "Units",
    "bacUnit": "BAC Unit",
    "eliminationRate": "Elimination Rate",
    "sessionReminders": "Session Reminders",
    "exportCSV": "Export CSV",
    "importCSV": "Import CSV",
    "disclaimer": "Disclaimer",
    "version": "Version"
  },
  "profile": {
    "title": "Profile Settings",
    "weightLabel": "Weight (kg)",
    "sexLabel": "Sex",
    "male": "Male",
    "female": "Female",
    "unitsLabel": "Units",
    "metric": "Metric",
    "imperial": "Imperial",
    "bacUnitLabel": "BAC Unit",
    "promille": "Promille (‰)",
    "percent": "Percent (%)",
    "eliminationRateLabel": "Elimination Rate (‰/h)",
    "saveSuccess": "Profile saved",
    "saveError": "Failed to save profile",
    "weightRequired": "Weight is required",
    "weightPositive": "Weight must be positive",
    "eliminationRateRequired": "Elimination rate is required",
    "eliminationRatePositive": "Elimination rate must be positive"
  },
  "disclaimer": {
    "title": "Important Disclaimer",
    "text": "This app provides approximate Blood Alcohol Content (BAC) estimates based on the Widmark formula. These estimates are approximations and should never be used to determine fitness to drive or operate machinery. Never drink and drive. Consult a healthcare professional for medical advice. The developers are not responsible for any decisions made based on this app's estimates.",
    "accept": "I Understand & Accept",
    "mustAccept": "You must accept the disclaimer to continue"
  },
  "home": {
    "currentBAC": "Current BAC",
    "timeToZero": "Time to ~0",
    "peakBAC": "Peak BAC",
    "addDrink": "Add Drink",
    "startTracking": "Start Tracking",
    "quickAdd": "Quick Add",
    "today": "Today",
    "noActiveSession": "No active session",
    "startTrackingPrompt": "Start a tracking session to get reminders"
  },
  "addDrink": {
    "title": "Add Drink",
    "selectDrink": "Select a drink",
    "time": "Time",
    "note": "Note (optional)",
    "save": "Save",
    "cancel": "Cancel",
    "drinkRequired": "Please select a drink",
    "saveSuccess": "Drink added",
    "saveError": "Failed to save drink"
  },
  "editEntry": {
    "title": "Edit Entry",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "deleteConfirm": "Are you sure you want to delete this entry?",
    "saveSuccess": "Entry updated",
    "saveError": "Failed to update entry"
  },
  "drinkDefinitions": {
    "title": "Drink Definitions",
    "add": "Add Drink Definition",
    "edit": "Edit",
    "archive": "Archive",
    "favorite": "Favorite",
    "unarchive": "Unarchive",
    "name": "Name",
    "volume": "Volume (ml)",
    "abv": "ABV (%)",
    "favoriteLabel": "Quick add",
    "createSuccess": "Drink definition created",
    "updateSuccess": "Drink definition updated",
    "archiveSuccess": "Drink definition archived",
    "error": "Failed to save"
  },
  "log": {
    "title": "Log",
    "noEntries": "No drinks logged",
    "total": "Total",
    "addFirstDrink": "Add your first drink",
    "dayNote": "Day note",
    "addNote": "Add a note for this day"
  },
  "stats": {
    "title": "Statistics",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "totalGrams": "Total Alcohol",
    "totalDrinks": "Total Drinks",
    "avgPerDrinkingDay": "Avg per Drinking Day",
    "drinkingDays": "Drinking Days",
    "peakDay": "Peak Day",
    "noData": "No data for this period"
  },
  "session": {
    "startTracking": "Start Tracking",
    "startTime": "Start Time",
    "endTime": "End Time",
    "interval": "Reminder Interval (min)",
    "start": "Start",
    "stop": "Stop",
    "extend": "Extend",
    "changeInterval": "Change Interval",
    "timeRemaining": "Time Remaining",
    "nextReminder": "Next Reminder",
    "activeSession": "Active Session",
    "sessionEnded": "Session Ended",
    "extendModalTitle": "Extend Session",
    "intervalModalTitle": "Change Interval",
    "intervalHint": "Minimum 5 min, maximum 480 min (8 hours)",
    "invalidInterval": "Please enter a valid interval",
    "extendError": "New end time must be after current end time"
  },
  "sessionSummary": {
    "title": "Session Summary",
    "totalAlcohol": "Total Alcohol (g)",
    "drinks": "Drinks",
    "peakBAC": "Peak BAC (‰)",
    "timeToZero": "Time to ~0",
    "drinksInSession": "Drinks in Session",
    "viewLog": "View Full Log",
    "done": "Done",
    "noDrinks": "No drinks logged in this session"
  },
  "notifications": {
    "title": "Notifications",
    "sessionReminder": "Time to log a drink?",
    "body": "Did you have a drink? Tap to log it.",
    "addLastDrink": "Add last drink",
    "openApp": "Open app"
  },
  "exportImport": {
    "exportTitle": "Export All Data",
    "exportDesc": "Export all drink entries and definitions to a CSV file via Android share sheet.",
    "importTitle": "Import CSV Data",
    "importDesc": "Select a CSV file to preview and import your drink data and definitions.",
    "exportSuccess": "Export complete",
    "importSuccess": "Imported {entries} entries and {definitions} definitions",
    "exportError": "Export failed",
    "importError": "Import failed",
    "processing": "Processing CSV...",
    "noFile": "No file selected",
    "invalidFile": "Invalid CSV file",
    "preview": "Import Preview",
    "entries": "Entries",
    "definitions": "Definitions",
    "valid": "Valid",
    "duplicates": "Duplicates",
    "errors": "Errors",
    "confirmImport": "Confirm Import",
    "chooseFile": "Choose CSV File"
  },
  "disclaimer": {
    "title": "Important Disclaimer",
    "text": "This app provides approximate Blood Alcohol Content (BAC) estimates based on the Widmark formula. These estimates are approximations and should never be used to determine fitness to drive or operate machinery. Never drink and drive. Consult a healthcare professional for medical advice. The developers are not responsible for any decisions made based on this app's estimates.",
    "accept": "I Understand & Accept",
    "mustAccept": "You must accept the disclaimer to continue"
  },
  "about": {
    "disclaimer": "Disclaimer",
    "version": "Version 1.0.0"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "close": "Close",
    "loading": "Loading...",
    "error": "Error",
    "confirm": "Confirm",
    "ok": "OK",
    "yes": "Yes",
    "no": "No",
    "skip": "Skip",
    "overwrite": "Overwrite",
    "addNew": "Add New",
    "retry": "Retry"
  }
}
```

---

## Testing

- Unit tests for i18n utilities
- Unit tests for profile validation
- Component tests for ProfileForm, DisclaimerModal
- Integration test: disclaimer flow (first launch → accept → persist)
- Integration test: profile changes affect BAC calculation
- Snapshot tests for themed components (light/dark)
- Jest test command (`npm test`) already configured

---

## Notes for the AI

- Use `expo-intl` with FormatJS for i18n (Expo SDK 58 compatible)
- Follow existing `useColorScheme` pattern for theming
- `acceptDisclaimer` already exists in repository
- `updateProfile` supports all profile fields
- Theme should be accessible via React Context or simple export
- Don't block iOS but focus on Android
- Accessibility: test with Android TalkBack

---

## Open questions

1. **Default locale**: Follow system locale or default to English with manual selector in Settings? (Default: system locale, fallback English)
2. **Persistence of notification preference**: Use AsyncStorage or add to profile table? (Default: AsyncStorage for simplicity)
3. **Date/number formatting**: Use FormatJS for all user-facing dates/numbers? (Default: yes)
4. **RTL support**: Not needed for en/pt-PT but consider for future? (Default: not needed now)
5. **Font scaling**: Cap maximum font scale? (Default: follow system, no cap)

---

## Decisions made

- **Profile export**: **No** — Profile settings not included in export (user confirmed)
- **CSV format**: Single file with sections (confirmed)
- **Overwrite behavior**: Skip by default, user chooses per-row (confirmed)
- **Date format**: ISO8601 UTC (confirmed)
- **Large datasets**: Simple write, optimize later (confirmed)
- **Default locale**: Follow system locale, fallback English (default choice)
- **Notification preference storage**: AsyncStorage (default choice)
- **Date/number formatting**: FormatJS for all user-facing (default choice)
- **RTL**: Not needed for en/pt-PT (default choice)
- **Font scaling**: Follow system, no cap (default choice)

---

## Verification evidence

- ✅ `npx tsc --noEmit` — passes
- ✅ `npm run lint` — passes (0 errors)
- ✅ `npm test` — 102 passed
- ✅ Features 1-8 complete
- ✅ Profile repository functions exist (`getProfile`, `updateProfile`, `acceptDisclaimer`)
- ✅ Settings screen exists with placeholder navigation
- ✅ `expo-localization`, `react-intl`, `@formatjs/intl` packages installed
- ✅ i18n message files exist (en, pt-PT)
- ✅ Theme system exists (colors, spacing, typography, context)
- ✅ Disclaimer modal implemented in `_layout.tsx`
- ✅ Settings screen wired to import-preview
- ✅ Profile settings screen implemented
- ✅ Export/Import CSV functional

---

## Files changed in this build

### New files
- `src/i18n/index.tsx`
- `src/i18n/useTranslation.ts`
- `src/i18n/en.json`
- `src/i18n/pt-PT.json`
- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`
- `src/theme/ThemeContext.tsx`
- `src/theme/index.ts`
- `src/app/_layout.styles.ts`

### Modified files
- `package.json`
- `package-lock.json`
- `src/app/_layout.tsx`
- `src/app/_layout.styles.ts`
- `src/app/(tabs)/settings.tsx`
- `src/db/repository.ts` (exported CreateEntryInput, CreateDefinitionInput)
- `src/app/import-preview.tsx`
- `src/components/ImportPreviewCard.tsx`
- `src/app/(tabs)/settings.tsx`
- `src/app/_layout.tsx`

---

## Completion metadata

**Completed:** 2026-10-15
**Branch:** feature/settings-disclaimer-polish
**Base commit:** (to be filled at commit)
**Work commit:** (to be filled at commit)
**Verified spec SHA-256:** 900c9b92442f991af8c881e658a3215aba6589e223901c090f74aa00157fd6e7