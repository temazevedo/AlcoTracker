# Feature: BAC calculation module + Jest tests

**From build-plan:** feature 3
**Build attempt:** 1
**Branch:** feature/bac-calculation-module-jest-tests
**Base commit:** 112579b (fix: database migration - use execAsync with full SQL block)
**Completed commit:** (to be filled after commit)
**Spec SHA-256:** 1e205575856040f1434fdfa5061985fce1c174e12957f93a4bcc67b2ad5cdc76
**Spec bytes:** 8968

---

## Goal

Implement the pure TypeScript Widmark formula BAC calculation module with 5-minute time-stepping, instant absorption model, and helper functions (current BAC, peak BAC, time to zero). Set up Jest with ts-jest and achieve 100% test coverage for specified cases.

---

## In scope

- Install Jest, ts-jest, @testing-library/react-native as dev dependencies
- Configure Jest for TypeScript/Expo (`jest.config.js`)
- Create BAC calculation types in `src/bac/types.ts`
- Implement core Widmark formula in `src/bac/calculate.ts`:
  - `calculateBACSeries(entries, profile, options)` — returns time-series BAC points
  - `getCurrentBAC(series, now)` — current BAC at a given time
  - `getPeakBAC(series)` — peak BAC value and timestamp
  - `getTimeToZero(series, now)` — estimated minutes until BAC reaches ~0
- Create comprehensive test suite in `src/bac/calculate.test.ts` covering all specified cases
- Add `npm test` script to package.json

---

## Out of scope

- UI components for BAC display (Feature 5)
- Home screen graph integration (Feature 5)
- Night sessions & notifications (Feature 6)
- Stats charts (Feature 7)
- Any database operations (uses Feature 2 repository types only)

---

## Build steps (all completed)

### Step 1: Install Jest and testing dependencies
**Files:** `package.json`, `package-lock.json`
✅ Completed — installed via `npm install -D jest @types/jest ts-jest @testing-library/react-native @testing-library/jest-native --legacy-peer-deps` and `npx expo install jest-expo -- --legacy-peer-deps`

### Step 2: Configure Jest
**Files:** `jest.config.js` (new), `package.json` (modify scripts)
✅ Completed — `preset: 'ts-jest'`, coverage thresholds at 100%, `npm test` script added

### Step 3: Create BAC types
**Files:** `src/bac/types.ts` (new)
✅ Completed — interfaces for DrinkEntry, Profile, BACPoint, BACSeriesResult, etc.

### Step 4: Implement core BAC calculation
**Files:** `src/bac/calculate.ts` (new)
✅ Completed — Widmark formula with 5-min time-stepping, instant absorption, helpers

### Step 5: Write comprehensive tests
**Files:** `src/bac/calculate.test.ts` (new)
✅ Completed — 46 tests covering all specified cases, 100% coverage

### Step 6: Verify TypeScript, lint, and tests pass
**Commands:** `npx tsc --noEmit`, `npm run lint`, `npm test`
✅ Completed — all pass

---

## Files changed

| File | Type | Notes |
|------|------|-------|
| `package.json` | modify | Added test deps, test script |
| `package-lock.json` | modify | Dependency lockfile updates |
| `tsconfig.json` | modify | Added jest types |
| `jest.config.js` | create | Jest config (ts-jest preset) |
| `src/bac/types.ts` | create | TypeScript interfaces for BAC module |
| `src/bac/calculate.ts` | create | Core Widmark formula implementation |
| `src/bac/calculate.test.ts` | create | 46 tests, 100% coverage |

---

## Verification

- **TypeScript:** `npx tsc --noEmit` — ✅ passes
- **Lint:** `npm run lint` — ✅ passes (no errors)
- **Tests:** `npm test` — ✅ 46 passed, 100% coverage on `src/bac/calculate.ts`

---

## Quality gates

| Gate | Policy | Result |
|------|--------|--------|
| Audit | manual | Not requested |
| Independent review | when-sensitive | Not sensitive — skipped |
| Check | manual | Not requested |
| Try guide | when-testable | Test suite runs — see Try It Now |

---

## Try it now

```bash
npm test
```

Verify:
1. All 46 tests pass
2. Coverage report shows 100% for `src/bac/calculate.ts` (branches, functions, lines, statements)
3. No TypeScript or lint errors

---

## Notes

- Used `--legacy-peer-deps` for test dependencies due to SDK 58 RC peer conflicts
- Jest config uses `ts-jest` preset (not `jest-expo`) since BAC module is pure TypeScript
- Coverage thresholds enforced at 100% for the BAC module
- Formula: BAC(‰) = grams / (r × weight_kg) − β × hours_elapsed
  - r = 0.68 (male), 0.55 (female)
  - β = elimination rate (‰/h, default 0.15)
  - Time-stepping: 5 minutes
  - Elimination only while BAC > 0, never below 0
- Module structured for future `linear30min` absorption model
- All math in ‰ (promille); UI layer handles ‰ ↔ % display conversion