# Feature: Night sessions & notifications

**From build-plan:** feature 6
**Build attempt:** 1
**Branch:** feature/night-sessions-notifications

---

## Goal

Implement night tracking sessions with scheduled notifications. Users can start a session with a start/end time and reminder interval. All notifications are scheduled at session start (works when app is closed). Notifications have actions: "Add last drink" and "Open app". Session summary shows totals, peak BAC, and estimated time to zero.

---

## Design reference

Not applicable — this is functional implementation, not visual replication.

---

## In scope

- **Start Tracking screen**: Accessible from Home tab ("Start Tracking" button)
  - Input: start time (default now), end time, reminder interval (default 30 min)
  - Validate: end time > start time, interval > 0
  - On start: create Session record, schedule all notifications, update UI
- **Active session display**: Home screen shows session status when active
  - Shows time remaining, next reminder, stop/extend buttons
- **Notifications** (expo-notifications):
  - Dedicated Android channel: "alco-tracker-reminders"
  - Schedule all at session start using date triggers
  - Notification body: "Did you have a drink? Tap to log it."
  - Actions: "Add last drink" (repeats most recent entry), "Open app"
  - Request POST_NOTIFICATIONS permission (Android 13+) on first session start
- **Session control**:
  - Stop early → cancel remaining notifications, mark session ended
  - Extend session → cancel & reschedule remaining notifications
  - Edit interval → cancel & reschedule remaining
- **Session Summary screen**: Shown when session ends
  - Total grams, drink count, peak BAC + time, estimated time to ~0
  - Link to Log screen
- **Permission handling**: Request notification permission on first session start

---

## Out of scope

- Stats charts (Feature 7)
- Export/Import CSV (Feature 8)
- Settings UI, i18n, theming, disclaimer (Feature 9)
- iOS-specific notification handling (Android primary)

---

## Build loop

- **Review cadence:** `workflow.stepReview: "feature"` — one feature-level review packet after all steps
- **Checkpoint commits:** `workflow.checkpointCommits: "disabled"` — no per-step commits
- **Quality gates:** Manual audit/check, independent review when-sensitive, try-guide when-testable
- **Verify:** TypeScript (`npx tsc --noEmit`) + Lint (`npm run lint`) + Tests (`npm test`) must pass before review

---

## Build steps

### Step 1: Install notification dependencies

**Files:** `package.json`, `package-lock.json`

**Changes:**
- Run `npx expo install expo-notifications expo-device expo-permissions`
- Run `npx expo install expo-linear-gradient` (already done for charts)

**Done when:** Dependencies installed; `npx tsc --noEmit` passes.

---

### Step 2: Create notification service

**Files:** `src/services/notifications.ts` (new)

**Changes:**
- `scheduleSessionNotifications(sessionId, startAt, endAt, intervalMin)` — schedule all notifications at session start using date triggers
- `cancelSessionNotifications(sessionId)` — cancel all notifications for a session
- `rescheduleSessionNotifications(sessionId, newEndAt, newIntervalMin)` — cancel & reschedule remaining
- `setupNotificationChannel()` — create Android channel "alco-tracker-reminders"
- `requestPermissions()` — request POST_NOTIFICATIONS permission (Android 13+)
- Handle notification responses: "Add last drink" and "Open app" actions
- Background listener for notification taps when app is closed/background

**Done when:** Notifications can be scheduled, cancelled, and responses handled.

---

### Step 3: Create session management hook

**Files:** `src/hooks/useSession.ts` (new)

**Changes:**
- `useSession()` hook:
  - State: active session (from repository), loading, error
  - `startSession(startAt, endAt, intervalMin)` — creates session, schedules notifications
  - `stopSession()` — cancels notifications, marks session ended
  - `extendSession(newEndAt)` — reschedules notifications
  - `changeInterval(newIntervalMin)` — reschedules notifications
  - Auto-refresh when app comes to foreground
- Uses repository functions: `createSession`, `getActiveSession`, `endSession`, `cancelSession`, `updateSessionInterval`

**Done when:** Hook manages session lifecycle; Home screen can start/stop/extend sessions.

---

### Step 4: Create Start Tracking screen

**Files:** `src/app/start-tracking.tsx` (modify), `src/components/SessionSetupForm.tsx` (new)

**Changes:**
- Form with: start time (default now), end time, interval (number input, default 30)
- Validation: end > start, interval > 0
- On submit: call `useSession.startSession()`, navigate to Home
- Show current active session if exists (with stop/extend controls)

**Done when:** Can start a session from Home → Start Tracking.

---

### Step 5: Integrate active session into Home screen

**Files:** `src/app/(tabs)/index.tsx` (modify), `src/components/ActiveSessionCard.tsx` (new)

**Changes:**
- `useSession` hook to get active session
- If active session: show `ActiveSessionCard` with:
  - Time remaining, next reminder time
  - "Stop" button → `stopSession()`
  - "Extend" button → modal to set new end time
  - "Change Interval" → modal to set new interval
- If no active session: show "Start Tracking" button (existing)

**Done when:** Home shows active session status with controls.

---

### Step 6: Create Session Summary screen

**Files:** `src/app/session-summary.tsx` (new), `src/components/SessionSummaryCard.tsx` (new)

**Changes:**
- Screen shown when session ends (navigated from Home or notification)
- Fetches session entries via `getEntriesBySession(sessionId)`
- Calculates: total grams, drink count, peak BAC + time (use BAC calc module), estimated time to zero
- "View Log" button → navigates to Log tab filtered to session date
- "Done" button → dismiss to Home

**Done when:** Session summary shows correct stats after session ends.

---

### Step 6: Handle notification actions

**Files:** `src/services/notifications.ts` (modify), `src/app/(tabs)/index.tsx` (modify)

**Changes:**
- "Add last drink" action:
  - Get most recent drink entry via `getRecentDistinctDrinks(1)`
  - Create new entry with same drink at current time via `createEntry`
  - Link to active session if exists
- "Open app" action: navigate to Home tab
- Handle app launch from notification (cold start)

**Done when:** Notification actions work correctly from background/closed app.

---

### Step 7: Verify TypeScript, lint, and tests pass

**Commands:** `npx tsc --noEmit`, `npm run lint`, `npm test`

**Done when:** All three commands exit 0 with no errors.

---

## Files / areas

| File | Type | Notes |
|------|------|-------|
| `package.json` | modify | Add expo-notifications, expo-device, expo-permissions |
| `src/services/notifications.ts` | create | Notification scheduling, channel, permissions, responses |
| `src/hooks/useSession.ts` | create | Session lifecycle management hook |
| `src/components/SessionSetupForm.tsx` | create | Start time, end time, interval form |
| `src/components/ActiveSessionCard.tsx` | create | Active session display with controls |
| `src/components/SessionSummaryCard.tsx` | create | Summary display |
| `src/app/start-tracking.tsx` | modify | Session setup form |
| `src/app/session-summary.tsx` | create | Session summary screen |
| `src/app/(tabs)/index.tsx` | modify | Active session card integration |
| `src/services/notifications.ts` | modify | Notification action handlers |

---

## Data / contracts

### Session (from Feature 2)

```typescript
interface SessionRow {
  id: number;
  start_at: string;      // ISO8601 UTC
  end_at: string;        // ISO8601 UTC
  interval_min: number;  // default 30
  status: 'active' | 'ended' | 'cancelled';
  created_at: string;
}
```

### Notification Contract

- **Channel:** `alco-tracker-reminders` (Android)
- **Trigger:** Date-based (`trigger: { type: 'calendar', ... }`)
- **Body:** "Did you have a drink? Tap to log it."
- **Actions:** `ADD_LAST_DRINK`, `OPEN_APP`
- **Data payload:** `{ sessionId: number }`

### Repository Functions Used (from Feature 2)

```typescript
createSession(input: { start_at, end_at, interval_min })
getActiveSession(): SessionRow | null
endSession(id): SessionRow
cancelSession(id): SessionRow
updateSessionInterval(id, interval_min): SessionRow
getEntriesBySession(sessionId): DrinkEntryRow[]
createEntry({ definition_id, name_snapshot, volume_ml, abv, grams, consumed_at, session_id, note })
getRecentDistinctDrinks(limit): DrinkDefinitionRow[]
```

---

## Testing

- Unit tests for notification scheduling logic (mock expo-notifications)
- Component tests for SessionSetupForm, ActiveSessionCard, SessionSummaryCard
- Integration test: start session → verify notifications scheduled → stop session → verify cancelled
- Jest test command (`npm test`) already configured from Feature 3
- No new test runner setup needed

---

## Notes for the AI

- Use `npx expo install expo-notifications expo-device expo-permissions` for version compatibility
- Android notifications require channel creation before scheduling
- Date triggers work when app is closed; test on physical device
- `expo-notifications` on Android 13+ requires `POST_NOTIFICATIONS` runtime permission
- Schedule all notifications at session start (not incremental) for reliability
- Cancel notifications by identifier when session stops/extends
- `calculateGrams` from repository for "Add last drink" action
- Session summary uses BAC calculation module (Feature 3) for peak BAC/time to zero
- Handle app cold start from notification: check `getLastNotificationResponseAsync()`

---

## Open questions

1. **Exact-alarm permission**: Should we request `SCHEDULE_EXACT_ALARM` for precise timing? (Optional per PLAN.md)
2. **Battery saver warning**: Show warning in session setup about potential delays?
3. **Minimum interval**: Enforce minimum 5 minutes? (PLAN.md says default 30)
4. **Max session duration**: Any limit? (e.g., 24 hours)

---

## Verification evidence

- ✅ `npx tsc --noEmit` — passes
- ✅ `npm run lint` — passes (0 errors)
- ✅ `npm test` — 46 passed, 100% coverage
- ✅ Features 1-5 complete (tabs, database, BAC calc, drink/log, home graph)
- ✅ Repository functions available for sessions and entries
- ✅ BAC calculation module available for session summary
- ✅ `expo-linear-gradient` installed (for charts)
- ✅ `expo-notifications`, `expo-device`, `expo-permissions` installed

---

## Files changed in this build

### New files
- `src/services/notifications.ts`
- `src/hooks/useSession.ts`
- `src/components/SessionSetupForm.tsx`
- `src/components/ActiveSessionCard.tsx`
- `src/components/SessionSummaryCard.tsx`
- `src/components/InlineDateTimePicker.tsx`
- `src/components/NativeDateTimePicker.tsx`
- `src/app/start-tracking.tsx`
- `src/app/session-summary.tsx`
- `src/types/datetimepicker-module.d.ts`

### Modified files
- `package.json`
- `package-lock.json`
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

**Completed:** 2026-10-14
**Branch:** feature/night-sessions-notifications
**Base commit:** (to be filled at commit)
**Work commit:** (to be filled at commit)
**Verified spec SHA-256:** 4770f65581b3b11cd1514af6f9dd2c8364e09171d87651a00f41dfa65a93cf8b