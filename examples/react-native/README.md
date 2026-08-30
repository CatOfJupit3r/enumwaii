# Field Desk: React Native + Expo + enumwaii

Field Desk is an independently runnable Expo SDK 57 application for Android,
iOS, and web. It uses Expo Router, native React Native controls, AsyncStorage,
and enumwaii in the places where mobile applications routinely lose type
ownership: deep links, persisted preferences, text inputs, navigation params,
and long-lived data from an older app version.

## Run it

From the repository root after `pnpm install`:

```sh
# Start Metro and choose Android, iOS, or web interactively
pnpm --filter @enumwaii/example-react-native start

# Open a specific host
pnpm --filter @enumwaii/example-react-native android
pnpm --filter @enumwaii/example-react-native ios
pnpm --filter @enumwaii/example-react-native web
```

The web command is the quickest device-free tour. Android requires Android
Studio or a compatible physical client; iOS requires macOS with Xcode or a
compatible physical client. The project uses Expo's managed workflow and does
not check generated `android/` or `ios/` directories into the repository.

## Product tour

- **Field queue** renders a responsive native dispatch console. Its filter is a
  branded `DispatchStage`, and the controls are generated from `.values`.
- **Persisted filter** writes the member directly to AsyncStorage. Members are
  already strings, so no serializer or wrapper object is required. Hydration
  distinguishes an absent preference (`default`) from stale or corrupt data
  (`fallback`) before updating React state.
- **Incident cards** use exhaustive `derive` presentation metadata and an
  array-valued `deriveTo` transition graph. The resolved stage intentionally
  derives to an empty terminal array.
- **New field report** uses ordinary React Native `TextInput` and `Pressable`
  controls. The priority text remains an external string until submit-time
  validation produces a branded `ReportPriority`.
- **Boundary lab** reads `useLocalSearchParams()`, which can yield a string,
  repeated `string[]`, or `undefined`. Valid, malformed, missing, and repeated
  queries remain visibly distinct.
- **Persistence lab** can write a valid raw string, inject the obsolete value
  `ARCHIVED`, or remove the preference to exercise all hydration policies on a
  real device.

With a development build or compatible client, the boundary route can also be
opened as a native deep link:

```text
enumwaii://boundary?stage=ON_SITE
enumwaii://boundary?stage=ARCHIVED
enumwaii://boundary?stage=DISPATCHED&stage=ON_SITE
```

## Boundary policy

| Input source           | Missing value                 | Known value             | Malformed or repeated value        |
| ---------------------- | ----------------------------- | ----------------------- | ---------------------------------- |
| Expo Router query      | `UNASSIGNED` nil-only default | Strictly parsed member  | Rejected unless fallback is chosen |
| AsyncStorage filter    | `UNASSIGNED` nil-only default | Hydrated branded member | Explicit `UNASSIGNED` recovery     |
| Native report priority | Rejected                      | Strictly parsed member  | Rejected with an inline form error |

AsyncStorage is intentionally used only for a non-sensitive UI preference. It
is unencrypted storage and should not hold credentials or secrets.

## Source layout

- `src/domain/dispatch.ts` owns both declarations, branded domain types,
  presentation metadata, transitions, fixtures, parsing policies, and report
  validation.
- `src/persistence/stage-preference.ts` is a small injected storage boundary
  that can be tested without a device or a custom wrapper schema.
- `src/hooks/use-stage-preference.ts` connects that boundary to real
  AsyncStorage and exposes loading, recovery, and write failures to the UI.
- `src/components/` contains ordinary native controls and a controlled report
  form.
- `src/app/` contains the Expo Router stack, queue, report, and deep-link
  boundary routes.
- `__tests__/` covers domain behavior, valid/missing/corrupt persistence,
  native interactions through React Native Testing Library, and initial deep
  links through Expo Router's in-memory test router.
- `src/type-contract.test-d.ts` proves raw strings and foreign enumwaii members
  cannot enter the dispatch domain.

## Commands and CI

```sh
pnpm --filter @enumwaii/example-react-native test
pnpm --filter @enumwaii/example-react-native test:watch
pnpm --filter @enumwaii/example-react-native test:types
pnpm --filter @enumwaii/example-react-native test:dependencies
pnpm --filter @enumwaii/example-react-native build
```

Tests use Expo's `jest-expo` preset, React Native Testing Library 14, and Expo
Router's testing library. The build command performs a production Metro web
export, providing a device-free compatibility gate for the real application.
`expo install --check` separately verifies that native package versions match
Expo SDK 57.
