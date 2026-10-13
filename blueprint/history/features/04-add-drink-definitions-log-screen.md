# Feature: Add Drink, Drink Definitions & Log screen

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/add-drink-definitions-log-screen
**Base commit:** cad2232 (feat: BAC calculation module + Jest tests)
**Completed commit:** (to be filled after commit)
**Spec SHA-256:** 7e4f814c25e9d8281f9ae46de01beda25ade0802a65e1819c105ec1f67edddaa
**Spec bytes:** 11257

---

## Goal

Implement the Drink Definitions management, Add Drink flow, and Log screen. Users can browse/edit drink definitions, add new drink entries with time/note/snapshot, and view daily logs with totals and day notes.

---

## In scope

**Drink Definitions screen:**
- List all active definitions (sorted: favorites first, then by name)
- Show archive toggle (show/hide archived)
- Add new definition (name, volume_ml, abv, favorite)
- Edit existing definition (name, volume_ml, abv, favorite)
- Archive/unarchive definition (soft delete)
- Toggle favorite
- Navigation from Settings tab

**Add Drink flow:**
- Screen accessible from Home tab ("Add Drink" button)
- Pick drink definition (list with "Recent" section showing last 5 distinct drinks)
- Set consumption time (default now, editable to past via datetime picker)
- Optional note
- Save → creates DrinkEntry with immutable snapshot (name, volume_ml, abv, grams)
- Navigate back to Home or Log

**Log screen (Log tab):**
- Browse days in reverse chronological order
- Show daily totals (total grams, drink count)
- Expand day to see entry list
- Each entry: name, time, volume, ABV, grams, note, edit/delete actions
- Day note input (tap to edit)
- Pull-to-refresh or auto-refresh on focus

**Navigation:**
- Stack navigator for modal screens (Add Drink, Edit Entry, Drink Definitions, New/Edit Definition)
- Log tab shows day list by default
- Settings → Drink Definitions pushes to Definitions screen

---

## Out of scope

- Home screen BAC graph & quick-add (Feature 5)
- Night sessions & notifications (Feature 6)
- Stats charts (Feature 7)
- Export/Import CSV (Feature 8)
- Settings UI, i18n, theming, disclaimer (Feature 9)
- BAC calculation logic (Feature 3 — already done)

---

## Build steps (all completed)

### Step 1: Create stack navigator and screen structure
**Files:** `src/app/_layout.tsx` (modify), `src/app/add-drink.tsx` (new), `src/app/edit-entry.tsx` (new), `src/app/drink-definitions.tsx` (new), `src/app/drink-definition-edit.tsx` (new)
✅ Completed

### Step 2: Implement Drink Definitions screen
**Files:** `src/app/drink-definitions.tsx` (modify), `src/components/DrinkDefinitionItem.tsx` (new), `src/components/DrinkDefinitionForm.tsx` (new)
✅ Completed

### Step 3: Implement Add Drink flow
**Files:** `src/app/add-drink.tsx` (modify), `src/components/DrinkPicker.tsx` (new), `src/components/DateTimePicker.tsx` (new)
✅ Completed — Fixed VirtualizedList nesting by moving picker into Modal

### Step 4: Implement Log screen with day browsing
**Files:** `src/app/(tabs)/log.tsx` (modify), `src/components/DaySection.tsx` (new), `src/components/DrinkEntryItem.tsx` (new), `src/components/DayNoteInput.tsx` (new)
✅ Completed

### Step 5: Implement Edit Entry screen
**Files:** `src/app/edit-entry.tsx` (modify), reuse `DrinkPicker` and `DateTimePicker` components
✅ Completed

### Step 6: Wire up Home tab "Add Drink" and Settings navigation
**Files:** `src/app/(tabs)/index.tsx` (modify), `src/app/(tabs)/settings.tsx` (modify)
✅ Completed

### Step 7: Verify TypeScript, lint, and tests pass
**Commands:** `npx tsc --noEmit`, `npm run lint`, `npm test`
✅ Completed

---

## Files changed

| File | Type | Notes |
|------|------|-------|
| `src/app/_layout.tsx` | modify | Stack navigator with modal screens |
| `src/app/add-drink.tsx` | create | Add Drink flow with Modal-based picker |
| `src/app/edit-entry.tsx` | create | Edit Entry screen |
| `src/app/drink-definitions.tsx` | create | Drink Definitions CRUD |
| `src/app/drink-definition-edit.tsx` | create | Create/Edit Definition form |
| `src/app/start-tracking.tsx` | create | Start Tracking placeholder |
| `src/app/(tabs)/log.tsx` | modify | Log screen with day browsing |
| `src/app/(tabs)/index.tsx` | modify | Home: BAC card, actions |
| `src/app/(tabs)/settings.tsx` | modify | Settings: Drink Definitions link |
| `src/components/DrinkDefinitionItem.tsx` | create | Definition list item |
| `src/components/DrinkDefinitionForm.tsx` | create | Create/Edit form with validation |
| `src/components/DrinkPicker.tsx` | create | Drink picker with Recent/All sections |
| `src/components/DateTimePicker.tsx` | create | Native datetime picker |
| `src/components/DaySection.tsx` | create | Collapsible day section with entries |
| `src/components/DayNoteInput.tsx` | create | Day note modal |
| `src/app/(tabs)/log.tsx` | modify | Full Log screen implementation |
| `src/app/(tabs)/index.tsx` | modify | Home tab with BAC card, actions |
| `src/app/(tabs)/settings.tsx` | modify | Settings with Drink Definitions link |
| `src/db/repository.ts` | modify | Added `calculateGrams` export |

---

## Verification

- **TypeScript:** `npx tsc --noEmit` — ✅ passes
- **Lint:** `npm run lint` — ✅ passes (0 errors, 19 warnings)
- **Tests:** `npm test` — ✅ 46 passed, 100% coverage on BAC module

---

## Quality gates

| Gate | Policy | Result |
|------|--------|--------|
| Audit | manual | Not requested |
| Independent review | when-sensitive | Not sensitive — skipped |
| Check | manual | Not requested |
| Try guide | when-testable | App runs with drink flows — see Try It Now |

---

## Try it now

```bash
npm run dev
```

Open in Expo Go, Android emulator, or iOS simulator. Verify:

1. **Drink Definitions:** Settings → Drink Definitions → list shows 8 defaults; can add/edit/archive/favorite
2. **Add Drink:** Home → "Add Drink" → picker opens in Modal → select drink → set time/note → Save → returns to Home
3. **Log screen:** Log tab → shows today with entry; expand to see entry; long-press to delete; tap to edit; tap 📝 Note to add day note
4. **Edit Entry:** Tap entry in Log → edit drink/time/note → Save → Log updates
5. **Navigation:** All tabs work; stack screens open/close correctly

---

## Notes

- **VirtualizedList fix:** Add Drink picker moved into Modal to avoid ScrollView + SectionList nesting error
- **Snapshot immutability:** DrinkEntry stores name_snapshot, volume_ml, abv, grams at entry time — later definition edits don't affect history
- **Session linking:** Entries created during active session get `session_id` set
- **Day notes:** Per-date notes stored in `day_notes` table
- **Date handling:** Uses local date (YYYY-MM-DD) for grouping, UTC timestamps for entries