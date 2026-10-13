# Coding Standards

> Your conventions. Edit these once to match your stack. The defaults below
> assume Next.js + TypeScript + Tailwind + Prisma; change or trim anything that
> doesn't fit your project.
>
> Run `/onboard` after installing the Blueprint. It tunes this file to the real
> project stack, along with `AGENTS.md`, `CLAUDE.md` when present,
> `ai-interaction.md`, `.gitignore`, and README placement. Review the result
> before `/overview`.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React / React Native

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks
- Use `StyleSheet.create` for styles (React Native)
- Prefer platform-native components over web-based ones

## Expo / React Native

- File-based routing with Expo Router
- Native tabs for main navigation (`expo-router/native-tabs`)
- Use Expo SDK packages via `npx expo install` for version compatibility
- Platform-specific code in `.android.tsx` / `.ios.tsx` / `.web.tsx` when needed
- No direct DOM access - use React Native APIs

## File Organization

- Routes: `src/app/[route].tsx` (Expo Router file-based)
- Layouts: `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`
- Components: `src/components/[feature]/ComponentName.tsx`
- Database: `src/db/` (schema, migrations, repositories)
- Business logic: `src/bac/`, `src/utils/`, `src/hooks/`
- State: `src/store/` (Zustand stores)
- Types: `src/types/[feature].ts` or co-located with feature
- Constants: `src/constants/`

## Naming

- Components: PascalCase (`DrinkEntryItem.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)
- Database tables: snake_case

## Styling

- React Native `StyleSheet` for all styling
- No Tailwind CSS (not applicable to React Native)
- Use `react-native-gifted-charts` for charts
- Follow system light/dark theme via `useColorScheme`
- No inline styles in JSX - use StyleSheet

## Database

- Use `expo-sqlite` for all database operations
- Versioned SQL migrations from the start (no `db push`)
- Run migrations on app startup
- Keep schema in `src/db/schema.ts` as TypeScript types
- Repository pattern for data access

## Data Fetching & State

- SQLite queries in repository functions
- Zustand for global UI state (profile, settings)
- React Query not needed (local-first, no server sync)
- Validate all inputs with Zod where applicable

## Error Handling

- Use try/catch in async database operations
- Return `{ success, data, error }` pattern from repository functions
- Display user-friendly error messages via toast/alert
- Handle SQLite errors gracefully

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, BAC calculation. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real device or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- **An empty suite should fail, not pass**, so "no tests ran" never looks like "passed".
- **Test files live next to source files** (for example `calculate.test.ts`).
- **Run them via the project's test command** (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding: a TypeScript React Native app uses Jest with `ts-jest`,
`@testing-library/react-native`, and `jest-expo` for Expo modules.
Mock external dependencies (SQLite, Notifications) with `jest.mock()`.

## Device Verification

For UI and integration behavior, prefer real device evidence over reading the
code and assuming it works.

- Device automation is separately opt-in through `/tests browser` (which can use
  Detox or Appium for native). That setup reuses a compatible runner and
  documents the exact command as `Device tests` in `AGENTS.md`.
- When `Device tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, or another claim the test does not observe.
- If no Device tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, device
  screenshots, build output, or manual evidence instead.
- Device tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Device evidence is especially important for flows that tap, type, submit,
  navigate, use notifications, access SQLite, or depend on client-side state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.