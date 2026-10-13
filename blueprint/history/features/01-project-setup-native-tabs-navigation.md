# Feature: Project setup & Native Tabs navigation

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/project-setup-native-tabs-navigation
**Base commit:** 0528619 (chore: establish Blueprint project baseline)
**Completed commit:** (to be filled after commit)
**Spec SHA-256:** d65fce44d13f4f6336d8bca7c5f0c2449b883aadda504e106c6d7618bc06f2cc
**Spec bytes:** 5361

---

## Goal

Initialize the Expo project structure for AlcoTracker, configure TypeScript, and set up Expo Router with 4 native tab screens (Home, Log, Stats, Settings) as empty placeholders. Deliver a runnable app with working tab navigation.

---

## In scope

- Rename project from `2_Project` to `AlcoTracker` in `package.json` and `app.json`
- Configure Expo Router with native tabs (`expo-router/native-tabs`)
- Create tab layout at `src/app/(tabs)/_layout.tsx` with 4 tabs
- Create 4 tab screen placeholders:
  - `src/app/(tabs)/index.tsx` — Home tab
  - `src/app/(tabs)/log.tsx` — Log tab
  - `src/app/(tabs)/stats.tsx` — Stats tab
  - `src/app/(tabs)/settings.tsx` — Settings tab
- Update root layout `src/app/_layout.tsx` to use tabs navigator
- Ensure TypeScript strict mode works
- Verify app runs with `npm run dev` and shows 4 working tabs

---

## Out of scope

- Any database, BAC calculation, or business logic (Feature 2+)
- Actual UI content for tabs (Feature 4, 5, 7, 9)
- Drink definitions, add drink flow, log entries (Feature 4)
- Notifications, sessions, stats charts, export/import (Features 6-8)
- i18n, theming, disclaimer, polish (Feature 9)

---

## Build steps (all completed)

### Step 1: Rename project identity
**Files:** `package.json`, `app.json`
**Done when:** `npm run dev` starts without errors; app shows "AlcoTracker" in Expo dev tools.
✅ Completed

### Step 2: Create tab navigation structure
**Files:** `src/app/(tabs)/_layout.tsx` (new), `src/app/_layout.tsx` (modify)
**Done when:** App loads with native bottom tab bar showing 4 tabs.
✅ Completed

### Step 3: Create 4 tab screen placeholders
**Files (new):**
- `src/app/(tabs)/index.tsx` — Home: "Home" title, centered text "Home — BAC & Quick Add"
- `src/app/(tabs)/log.tsx` — Log: "Log" title, centered text "Log — Daily Entries"
- `src/app/(tabs)/stats.tsx` — Stats: "Stats" title, centered text "Stats — Weekly/Monthly"
- `src/app/(tabs)/settings.tsx` — Settings: "Settings" title, centered text "Settings — Profile & Preferences"
**Done when:** Tapping each tab shows its placeholder screen with correct title.
✅ Completed

### Step 4: Verify TypeScript and lint pass
**Commands:** `npx tsc --noEmit`, `npm run lint`
**Done when:** Both commands exit 0 with no errors.
✅ Completed

---

## Files changed

| File | Type | Notes |
|------|------|-------|
| `package.json` | modify | Project name to `alco-tracker`, added eslint deps |
| `package-lock.json` | modify | Dependency lockfile updates |
| `app.json` | modify | Name `AlcoTracker`, slug `alco-tracker`, scheme `alco-tracker` |
| `src/app/_layout.tsx` | modify | Stack with `headerShown: false` |
| `src/app/(tabs)/_layout.tsx` | create | Native tabs navigator with 4 screens |
| `src/app/(tabs)/index.tsx` | create | Home tab placeholder |
| `src/app/(tabs)/log.tsx` | create | Log tab placeholder |
| `src/app/(tabs)/stats.tsx` | create | Stats tab placeholder |
| `src/app/(tabs)/settings.tsx` | create | Settings tab placeholder |
| `eslint.config.js` | create | ESLint config (auto-generated) |
| `src/app/index.tsx` | delete | Old Expo template home screen |

---

## Verification

- **TypeScript:** `npx tsc --noEmit` — ✅ passes
- **Lint:** `npm run lint` (eslint-config-expo@58) — ✅ passes

No unit tests (no logic in this feature). Test command (`npm test`) not yet configured — will be added in Feature 3.

---

## Quality gates

| Gate | Policy | Result |
|------|--------|--------|
| Audit | manual | Not requested |
| Independent review | when-sensitive | Not sensitive — skipped |
| Check | manual | Not requested |
| Try guide | when-testable | App runs with 4 tabs — see Try It Now |

---

## Try it now

```bash
npm run dev
```

Open in Expo Go, Android emulator, or iOS simulator. Verify:
1. App launches with bottom tab bar showing 4 tabs: Home, Log, Stats, Settings
2. Each tab shows its placeholder screen with title and subtitle
3. Tab switching works smoothly with native tab bar animations

---

## Notes

- Expo SDK upgraded from 57 to 58 during implementation (all packages at ~58.x)
- Used `--legacy-peer-deps` for `react-native-reanimated@4.7.0` / `react-native@0.88.0-rc.4` peer conflict (known SDK 58 RC issue)
- No providers added yet (Theme, i18n, etc.) — will be added in Feature 9
- Tab icons not yet added — can be added in Feature 9 polish