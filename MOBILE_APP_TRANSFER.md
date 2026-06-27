# Hint Mobile App Transfer

This repo is now prepared to wrap the existing Hint React product app with Capacitor for iOS and Android.

## Current approach

- Keep the working Vite/React product app as the source of truth.
- Use Capacitor to package the built web app into native iOS and Android shells.
- Keep routes rooted at `/` inside the app.
- Use `VITE_API_BASE_URL` for native API calls because mobile WebViews cannot use the Vite `/api` proxy.

## Setup

Install workspace dependencies with the project package manager, then create native projects:

```sh
pnpm install
pnpm --filter @workspace/hint run mobile:build
pnpm --filter @workspace/hint run mobile:add:ios
pnpm --filter @workspace/hint run mobile:add:android
pnpm --filter @workspace/hint run mobile:sync
```

Open native projects:

```sh
pnpm --filter @workspace/hint run mobile:ios
pnpm --filter @workspace/hint run mobile:android
```

Root-level aliases are also available:

```sh
pnpm mobile:build
pnpm mobile:sync
pnpm mobile:ios
pnpm mobile:android
```

## Current native project status

The Capacitor native shells have been generated and synced:

- `artifacts/hint/ios`
- `artifacts/hint/android`

The current web build is copied into:

- `artifacts/hint/ios/App/App/public`
- `artifacts/hint/android/app/src/main/assets/public`

## Local native build requirements

This machine currently cannot compile native binaries until the platform toolchains are installed/configured.

iOS needs full Xcode selected, not only Command Line Tools:

```sh
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
cd artifacts/hint/ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
```

Android needs a Java runtime and Android SDK/Android Studio:

```sh
cd artifacts/hint/android
./gradlew assembleDebug
```

## Required mobile env

Create `artifacts/hint/.env.mobile` from `artifacts/hint/.env.mobile.example` and set:

```sh
VITE_API_BASE_URL=https://your-deployed-api.example.com
```

Then build with that env loaded by your shell or CI.

## Feature status

The current app behavior remains in React and should transfer directly:

- App dashboard
- Daily card reveal persistence
- Tarot Room
- Animal Tarot
- Sky Deck
- Astrology
- Collection and rare unlock animation
- Local profile/settings
- Local saved readings and collection state

## Native work still needed

- Replace placeholder API URL with the deployed API server.
- Add store-grade app icons/splash assets in Xcode and Android Studio.
- Move daily reward anti-cheat to the backend. Local storage prevents normal redraws, but cannot defeat device time changes.
