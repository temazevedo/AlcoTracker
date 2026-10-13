# Feature: Home screen with BAC graph & quick-add

**From build-plan:** feature 5
**Build attempt:** 1
**Branch:** feature/home-screen-bac-graph-quick-add
**Base commit:** 70915ba (feat: add drink, drink definitions & log screen)
**Completed commit:** (to be filled after commit)
**Spec SHA-256:** 6d2a273e5ff083cc601078724db136f5694a1913c4c269306cadba9b0daac2eb
**Spec bytes:** 7644

---

## Goal

Implement the Home screen with real-time BAC display, current BAC + time to zero, today's BAC line graph using react-native-gifted-charts, quick-add buttons for recent drinks, and "Add Drink" / "Start Tracking" actions.

---

## In scope

- Install `react-native-gifted-charts` and `react-native-svg` for line chart
- Create BAC graph component using `react-native-gifted-charts` LineChart
- Implement real-time BAC display that updates every minute
- Show current BAC (‰), time to ~0, peak BAC + time
- Today's BAC line graph (time on X-axis, BAC ‰ on Y-axis, peak marker)
- Quick-add buttons for most recent distinct drinks (up to 4)
- "Add Drink" and "Start Tracking" primary actions
- Connect to BAC calculation module (Feature 3) and repository (Feature 2)
- Real-time updates using `setInterval` (every 60 seconds)
- System light/dark theme support

---

## Out of scope

- Night sessions & notifications (Feature 6)
- Stats charts (Feature 7)
- Export/Import CSV (Feature 8)
- Settings UI, i18n, theming, disclaimer (Feature 9)
- Profile settings management (Feature 9)

---

## Build steps (all completed)

### Step 1: Install chart dependencies
**Files:** `package.json`, `package-lock.json`
✅ Completed — installed via `npx expo install react-native-svg` and `npm install react-native-gifted-charts --legacy-peer-deps`

### Step 2: Create BAC graph component
**Files:** `src/components/BACGraph.tsx` (new)
✅ Completed — LineChart with time (X) vs BAC ‰ (Y), peak marker, time-to-zero line

### Step 3: Create quick-add buttons component
**Files:** `src/components/QuickAddButtons.tsx` (new)
✅ Completed — Horizontal scrollable recent drink buttons (max 4)

### Step 4: Integrate BAC calculation and real-time updates
**Files:** `src/hooks/useBAC.ts` (create), `src/app/(tabs)/index.tsx` (modify)
✅ Completed — `useBAC` hook fetches today's entries + profile, calls `calculateBAC`, updates every 60s

### Step 5: Wire up quick-add navigation with pre-selection
**Files:** `src/components/QuickAddButtons.tsx` (modify), `src/app/add-drink.tsx` (modify)
✅ Completed — QuickAddButtons `onPress` → router.push("/add-drink", params: { preselectedDrinkId })

### Step 6: Verify TypeScript, lint, and tests pass
**Commands:** `npx tsc --noEmit`, `npm run lint`, `npm test`
✅ Completed — all pass

---

## Files changed

| File | Type | Notes |
|------|------|-------|
| `package.json` | modify | Added chart dependencies |
| `package-lock.json` | modify | Dependency lockfile updates |
| `src/hooks/useBAC.ts` | create | Real-time BAC data hook (60s interval) |
| `src/components/BACGraph.tsx` | create | LineChart with peak marker, time-to-zero line |
| `src/components/QuickAddButtons.tsx` | create | Horizontal scrollable recent drink buttons |
| `src/app/(tabs)/index.tsx` | modify | Home screen with BAC card, graph, quick-add, actions |
| `src/app/add-drink.tsx` | modify | Accept `preselectedDrinkId` param for quick-add |

---

## Verification

- **TypeScript:** `npx tsc --noEmit` — ✅ passes
- **Lint:** `npm run lint` — ✅ passes (0 errors, 21 warnings)
- **Tests:** `npm test` — ✅ 46 passed, 100% coverage on BAC module

---

## Quality gates

| Gate | Policy | Result |
|------|--------|--------|
| Audit | manual | Not requested |
| Independent review | when-sensitive | Not sensitive — skipped |
| Check | manual | Not requested |
| Try guide | when-testable | App runs with BAC graph — see Try It Now |

---

## Try it now

```bash
npm run dev
```

Open in Expo Go, Android emulator, or iOS simulator. Verify:

1. **Home screen** shows BAC card with current BAC, peak BAC, time to zero
2. **BAC graph** displays today's BAC line chart with peak marker and time-to-zero reference line
3. **Quick-add buttons** show up to 4 recent distinct drinks
4. **Tapping quick-add button** opens Add Drink screen with drink pre-selected
5. **Real-time updates** — BAC values update every 60 seconds automatically
6. **Light/dark theme** — graph and UI adapt to system theme

---

## Notes

- **Dependencies:** `react-native-svg` (via `npx expo install`), `react-native-gifted-charts` (via `npm install --legacy-peer-deps`)
- **Real-time updates:** `useBAC` hook uses `setInterval` (60s) with cleanup on unmount
- **Data flow:** `useBAC` → `getTodaysEntries()` + `getProfile()` → `calculateBAC()` → BACGraph + BAC card
- **Quick-add navigation:** Uses `router.push("/add-drink", { params: { preselectedDrinkId } })`
- **Theme support:** Graph colors adapt to light/dark mode via `useColorScheme`