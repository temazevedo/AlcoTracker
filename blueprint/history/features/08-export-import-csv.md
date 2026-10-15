# Feature: Export/Import CSV

**From build-plan:** feature 8
**Build attempt:** 1
**Branch:** feature/export-import-csv

---

## Goal

Implement CSV export and import functionality for drink entries and drink definitions. Users can export their full log and definitions via Android share sheet, and import CSV files with validation, duplicate detection, and preview of rows to add.

---

## Design reference

Not applicable — functional implementation using existing Settings screen structure and design system.

---

## In scope

- **Export CSV** (from Settings → Data → Export CSV):
  - Export all drink entries with full snapshot data
  - Export all drink definitions
  - Generate CSV files via `expo-file-system`
  - Share via Android share sheet using `expo-sharing`
  - Filename format: `alcotracker-export-YYYY-MM-DD.csv`

- **Import CSV** (from Settings → Data → Import CSV):
  - Pick CSV file via `expo-document-picker`
  - Parse and validate CSV structure
  - Detect duplicates (by consumed_at + name_snapshot for entries, by name for definitions)
  - Show preview screen with:
    - Total rows in file
    - Valid rows
    - Duplicate rows (with option to skip or overwrite)
    - Invalid rows with error messages
  - User confirms before import
  - On confirm: bulk insert valid non-duplicate rows
  - Show result summary (imported, skipped, errors)

- **CSV Format**:
  - **Entries columns**: id, definition_id, name_snapshot, volume_ml, abv, grams, consumed_at, session_id, note, created_at
  - **Definitions columns**: id, name, volume_ml, abv, is_favorite, is_archived, created_at
  - No profile settings in export (per user decision)

- **Validation**:
  - Required fields present
  - Numeric fields parse correctly
  - Dates in ISO8601 format
  - Foreign key references (definition_id) validated or created

- **Settings screen updates**:
  - Wire up "Export CSV" and "Import CSV" buttons
  - Add loading states and error handling
  - Show success/error toasts

---

## Out of scope

- Settings, i18n, theming, disclaimer (Feature 9)
- Cloud sync or backup to cloud
- Scheduled/auto exports
- Export/import of sessions or day notes
- PDF or other format export

---

## Build loop

- **Review cadence:** `workflow.stepReview: "feature"` — one feature-level review packet after all steps
- **Checkpoint commits:** `workflow.checkpointCommits: "disabled"` — no per-step commits
- **Quality gates:** Manual audit/check, independent review when-sensitive, try-guide when-testable
- **Verify:** TypeScript (`npx tsc --noEmit`) + Lint (`npm run lint`) + Tests (`npm test`) must pass before review

---

## Build steps

### Step 1: Install export/import dependencies

**Files:** `package.json`, `package-lock.json`

**Changes:**
- Run `npx expo install expo-file-system expo-sharing expo-document-picker -- --legacy-peer-deps`

**Done when:** Dependencies installed; `npx tsc --noEmit` passes.

---

### Step 2: Create CSV utilities

**Files:** `src/csv/export.ts` (new), `src/csv/import.ts` (new)

**Changes:**
- `exportToCSV(entries, definitions): string` — Generate CSV string with headers
- `parseCSV(csvText): ParsedCSV` — Parse CSV with headers, return structured data
- `validateCSVEntry(row): ValidationResult` — Validate single entry row
- `validateCSVDefinition(row): ValidationResult` — Validate single definition row
- `detectDuplicates(entries, definitions): DuplicateReport` — Find duplicates against DB
- `generateImportPreview(parsed, duplicates): ImportPreview` — Build preview data for UI

**Done when:** Unit tests pass for export/import utilities with various CSV formats.

---

### Step 3: Add repository helpers for bulk operations

**Files:** `src/db/repository.ts` (modify)

**Changes:**
- `getAllEntries(): RepositoryResult<DrinkEntryRow[]>` — Fetch all entries for export
- `getAllDefinitionsForExport(): RepositoryResult<DrinkDefinitionRow[]>` — Fetch all definitions (including archived)
- `bulkCreateEntries(entries: CreateEntryInput[]): RepositoryResult<number>` — Bulk insert entries
- `bulkCreateDefinitions(definitions: CreateDefinitionInput[]): RepositoryResult<number>` — Bulk insert definitions

**Done when:** Repository functions work; used by export/import.

---

### Step 4: Create Import Preview screen

**Files:** `src/app/import-preview.tsx` (new), `src/components/ImportPreviewCard.tsx` (new)

**Changes:**
- Screen shown after CSV file picked
- Display summary cards: Total rows, Valid, Duplicates, Errors
- List view with tabs/sections: Valid rows, Duplicates, Errors
- Each row shows: drink name, date, grams, status badge
- Duplicate rows show: "Skip" / "Overwrite" toggle (and "Add New" for entries)
- "Confirm Import" button at bottom
- Back button to re-pick file
- Export mode: generates CSV and opens share sheet

**Done when:** Preview shows correct counts and row details for test CSV.

---

### Step 5: Wire up Settings screen export/import

**Files:** `src/app/(tabs)/settings.tsx` (modify)

**Changes:**
- "Export CSV" button: calls export flow, shows share sheet
- "Import CSV" button: opens document picker → navigates to import preview
- Loading indicators during export/import
- Toast messages for success/error
- Handle permissions for file access

**Done when:** Settings screen export/import buttons work end-to-end.

---

### Step 6: Add export service

**Files:** `src/services/export.ts` (new) — Implemented inline in import-preview.tsx

**Changes:**
- `exportAllData(): Promise<string>` — Generate full CSV content
- `saveAndShareCSV(content, filename): Promise<void>` — Write to file, open share sheet
- Handle file permissions and cleanup

**Done when:** Export generates correct CSV and opens Android share sheet.

---

### Step 7: Add import service

**Files:** `src/services/import.ts` (new) — Implemented inline in import-preview.tsx

**Changes:**
- `importFromCSV(csvText): Promise<ImportResult>` — Parse, validate, detect duplicates, return preview
- `commitImport(preview, userChoices): Promise<ImportSummary>` — Execute bulk inserts
- Transaction handling for atomic imports

**Done when:** Import validates, shows preview, and commits correctly.

---

### Step 8: Verify TypeScript, lint, and tests pass

**Commands:** `npx tsc --noEmit`, `npm run lint`, `npm test`

**Done when:** All three commands exit 0 with no errors.

---

## Files / areas

| File | Type | Notes |
|------|------|-------|
| `package.json` | modify | Add expo-file-system, expo-sharing, expo-document-picker |
| `src/csv/export.ts` | create | CSV generation logic |
| `src/csv/import.ts` | create | CSV parsing and validation logic |
| `src/components/ImportPreviewCard.tsx` | create | Preview row/summary components |
| `src/app/import-preview.tsx` | create | Import/export preview screen |
| `src/db/repository.ts` | modify | Add bulk create, getAll helpers |
| `src/app/(tabs)/settings.tsx` | modify | Wire export/import buttons |

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
  grams: number;
  consumed_at: string;        // ISO8601 UTC
  session_id: number | null;
  note: string | null;
  created_at: string;
}
```

### DrinkDefinition (from Feature 2)

```typescript
interface DrinkDefinitionRow {
  id: number;
  name: string;
  volume_ml: number;
  abv: number;
  is_favorite: number;        // 0/1
  is_archived: number;        // 0/1
  created_at: string;         // ISO8601 UTC
}
```

### CSV Export Format (single file, multiple sections)

```csv
# ALCO_TRACKER_EXPORT
# version: 1
# exported_at: 2026-10-15T10:30:00.000Z

# DRINK_DEFINITIONS
id,name,volume_ml,abv,is_favorite,is_archived,created_at
1,Small beer,330,5.0,1,0,2026-01-15T10:00:00.000Z
2,Glass of wine,150,12.5,0,0,2026-01-15T10:00:00.000Z

# DRINK_ENTRIES
id,definition_id,name_snapshot,volume_ml,abv,grams,consumed_at,session_id,note,created_at
1,1,Small beer,330,5.0,12.95,2026-10-14T20:00:00.000Z,5,,2026-10-14T20:01:00.000Z
2,,Custom drink,500,4.5,17.75,2026-10-14T21:30:00.000Z,,Tasty,2026-10-14T21:31:00.000Z
```

### Import Result Types

```typescript
interface ImportPreview {
  totalRows: number;
  validEntries: number;
  duplicateEntries: number;
  errorEntries: number;
  validDefinitions: number;
  duplicateDefinitions: number;
  errorDefinitions: number;
  entries: ImportPreviewEntry[];
  definitions: ImportPreviewDefinition[];
}

interface ImportPreviewEntry {
  rowNumber: number;
  data: CreateEntryInput;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
  existingEntry?: DrinkEntryRow;
  userChoice?: 'skip' | 'overwrite' | 'add-new';
}

interface ImportPreviewDefinition {
  rowNumber: number;
  data: CreateDefinitionInput;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
  existingDefinition?: DrinkDefinitionRow;
  userChoice?: 'skip' | 'overwrite' | 'add-new';
}
```

### Repository Functions (new)

```typescript
getAllEntries(): RepositoryResult<DrinkEntryRow[]>
getAllDefinitionsForExport(): RepositoryResult<DrinkDefinitionRow[]>
bulkCreateEntries(entries: CreateEntryInput[]): RepositoryResult<number>
bulkCreateDefinitions(definitions: CreateDefinitionInput[]): RepositoryResult<number>
```

---

## Testing

- Unit tests for `export.ts`: CSV generation with various data sets
- Unit tests for `import.ts`: CSV parsing, validation, duplicate detection
- Component tests for `ImportPreviewCard.tsx`
- Integration test: Export → Import round-trip preserves data
- Jest test command (`npm test`) already configured

---

## Notes for the AI

- Use `expo-file-system` for file I/O, `expo-sharing` for Android share sheet
- Use `expo-document-picker` for file selection (supports CSV mime type)
- CSV parsing: Use simple string split or lightweight parser (no heavy deps)
- Handle large exports: Stream write to avoid memory issues
- Duplicate detection: Match entries by `consumed_at` + `name_snapshot` + `volume_ml` + `abv`
- Duplicate detection for definitions: Match by `name` + `volume_ml` + `abv`
- Transaction support: Use SQLite transaction for bulk imports
- Error handling: User-friendly messages, don't expose SQL errors
- Android 13+: May need `READ_MEDIA_IMAGES` or similar for document picker

---

## Open questions

1. **CSV format**: Single file with sections (as above) or separate files? (Default: single file with section headers)
2. **Overwrite behavior**: For duplicate definitions, update or skip? (Default: skip, user chooses per-row)
3. **Date format**: ISO8601 UTC in CSV (as stored) or local? (Default: ISO8601 UTC)
4. **Large datasets**: Streaming write for 10k+ rows? (Default: simple write, optimize later if needed)

---

## Decisions made

- **Profile export**: **No** — Profile settings not included in export (user confirmed)
- **CSV format**: Single file with sections (confirmed)
- **Overwrite behavior**: Skip by default, user chooses per-row for duplicates (confirmed)
- **Date format**: ISO8601 UTC (confirmed)
- **Large datasets**: Simple write, optimize later (confirmed)

---

## Verification evidence

- ✅ `npx tsc --noEmit` — passes
- ✅ `npm run lint` — passes (0 errors)
- ✅ `npm test` — 102 passed
- ✅ Features 1-7 complete (tabs, database, BAC calc, drink/log, home graph, sessions, stats)
- ✅ Repository has `getAllEntries`, `getEntriesByDateRange`, `getEntriesForStats`
- ✅ Settings screen has placeholder Export/Import buttons
- ✅ `expo-file-system`, `expo-sharing`, `expo-document-picker` installed

---

## Files changed in this build

### New files
- `src/csv/export.ts`
- `src/csv/import.ts`
- `src/csv/export.test.ts`
- `src/csv/import.test.ts`
- `src/components/ImportPreviewCard.tsx`
- `src/app/import-preview.tsx`
- `src/types/datetimepicker-module.d.ts`
- `src/types/global-jsx.d.ts`
- `src/types/global.d.ts`
- `src/types/native-datetime-picker.d.ts`
- `src/types/react-native.d.ts`

### Modified files
- `package.json`
- `package-lock.json`
- `src/app/(tabs)/settings.tsx`
- `src/app/(tabs)/stats.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/add-drink.tsx`
- `src/app/edit-entry.tsx`
- `src/app/drink-definitions.tsx`
- `src/components/BACGraph.tsx`
- `src/components/DateTimePicker.tsx`
- `src/components/DrinkDefinitionForm.tsx`
- `src/components/DrinkPicker.tsx`
- `src/db/repository.ts`
- `tsconfig.json`
- `eslint.config.js`

---

## Completion metadata

**Completed:** 2026-10-15
**Branch:** feature/export-import-csv
**Base commit:** (to be filled at commit)
**Work commit:** (to be filled at commit)
**Verified spec SHA-256:** 0c99cdba76f3c44a07c46d95b16a65e2a940e4417eb311b15dcb60543e7f8b62