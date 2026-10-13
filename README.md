# AlcoTracker

Android alcohol-tracking app built with Expo (React Native) for personal BAC estimation and drink logging. Inspired by AlcoDroid.

## Commands

- **Dev server**: `npm run dev` (starts Expo dev server)
- **Android**: `npm run android` (build & run on Android device/emulator)
- **iOS**: `npm run ios` (build & run on iOS simulator)
- **Web**: `npm run web` (start web preview)
- **Lint**: `npm run lint`
- **Type-check**: `npx tsc --noEmit`
- **Test**: `npm test` (Jest - not yet configured)

## Tech Stack

- **Framework**: Expo SDK 57 with TypeScript
- **Navigation**: Expo Router with Native Tabs
- **Database**: expo-sqlite with manual versioned migrations
- **State**: Zustand (profile & settings)
- **Charts**: react-native-gifted-charts + react-native-svg
- **Notifications**: expo-notifications (local only)
- **i18n**: expo-intl / FormatJS
- **Testing**: Jest (planned for calculation logic)

## Project Structure

```
src/
├── app/                 # Expo Router file-based routes
├── db/                  # SQLite schema, migrations, repositories
├── bac/                 # BAC calculation module (pure TS, tested)
├── store/               # Zustand stores
├── i18n/                # FormatJS translation setup
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks
├── utils/               # Date, CSV, notifications, units helpers
└── constants/           # Seed data, defaults
```

## Development

```bash
npm install
npm run dev
```

Open the app in Expo Go, Android emulator, or iOS simulator.