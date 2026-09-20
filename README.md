# FieldWatch

**Offline-first crop pest & disease alerts for smallholder farmers.**
Built for the JetBrains Kotlin Multiplatform Challenge.

A pest outbreak spreads faster than the news of it. FieldWatch makes the
news travel faster than the pest — even where there's no signal.

## The problem

A farmer notices something wrong with their crop — chewed leaves, a
strange yellow streak — and has no fast way to find out what it is or
whether their neighbors are seeing the same thing. By the time word
spreads through word of mouth, an outbreak like fall armyworm or wheat
rust has already moved through the area. Connectivity in smallholder
farming regions is patchy, so most digital tools stop working exactly
when they're needed most: in the field.

## What FieldWatch does

- **Farmers** tap the symptoms they see on their crop and get a ranked
  list of likely causes with a low-cost first action — fully offline, no
  signal needed.
- Each report is saved to the phone immediately and queued in an
  **offline outbox**. When the phone finds a connection, even briefly, it
  syncs automatically.
- **Extension officers** see incoming reports clustered by location, pest,
  and time window. Three or more matching reports near each other
  automatically flag as a potential outbreak.
- The officer confirms or dismisses a cluster and **publishes an
  advisory**, which farmer phones pick up on their next sync — turning an
  individual observation into a community-wide early warning.
- Built for **English and Amharic** with right-context text, aimed first
  at smallholder maize, wheat, and coffee farmers in Ethiopia, but usable
  anywhere connectivity is the constraint.

## Why Kotlin Multiplatform

The entire decision-making core of the app — not just UI, but the actual
logic — is written once in `shared` and runs unmodified on every
platform:

| Shared in `commonMain` | What it does |
|---|---|
| `SymptomEngine` | Matches tapped symptoms to known pest/disease profiles, ranked by overlap |
| `OutbreakDetector` | Clusters sightings by location (haversine distance) and time window to flag outbreaks |
| `Geo` | Great-circle distance math used by the clustering logic |
| `Sighting` / `Advisory` / `PestProfile` models | The exact same data classes used by the Compose UI *and* the Ktor server — one wire format, no duplicated DTOs |
| `Outbox` | The offline-first "save now, send later" sync queue |
| `Strings` | English/Amharic localization |
| Compose UI (`FarmerScreen`, `OfficerScreen`, theme) | The full farmer and officer experience, shared across Android and Desktop |

Roughly **[X]% of the app's Kotlin code is shared** across platforms —
count it with `git ls-files '*.kt' | xargs wc -l` split by `commonMain` vs
platform-specific source sets, and put the real number here before the
pitch.

## Architecture

```
Farmer taps symptoms → SymptomEngine (on-device, offline)
      ↓
Sighting saved to Outbox (always succeeds, no network needed)
      ↓  (whenever connectivity appears)
Outbox.flush() → Ktor server (:server) → same OutbreakDetector
      ↓
Officer dashboard polls /outbreaks → confirms a cluster
      ↓
POST /advisories → published
      ↓
Farmer app pulls /advisories on next sync → warning shown in-app
```

## Features

- [x] Offline-first symptom checker and reporting
- [x] Offline outbox with automatic sync
- [x] Community outbreak clustering (shared, unit-tested logic)
- [x] Extension officer confirm/dismiss/publish workflow
- [x] English + Amharic localization
- [x] Dark / light mode
- [x] Kotlin backend (Ktor) sharing data models with the client
- [ ] Shared AI explainer for advisories (Koog) — *stretch goal, [done/cut] — update before submitting*

## Tech stack

- **Kotlin Multiplatform** — shared business logic, models, and Compose UI
- **Compose Multiplatform** — Android + Desktop UI from one codebase
- **Ktor** — client (sync) and server (in-memory store, REST API)
- **kotlinx.serialization** — shared JSON models between client and server

## Running it

```bash
# Server
./gradlew :server:run

# Desktop app
./gradlew :desktopApp:run

# Android app
./gradlew :androidApp:installDebug
```

Run the shared-logic tests:

```bash
./gradlew :shared:test
```

## What's real vs. placeholder content

The pest symptom lists and remedies are draft content for the demo and
are **not yet verified against a cited agronomic source** (e.g. FAO or
Ethiopian Institute of Agricultural Research guidance) — see
`SeedData.kt`. The app states on-screen that it gives guidance, not a
diagnosis, and that the extension officer makes the final call. Before
any real-world use, the reference data needs sign-off from an actual
agronomist.

## Team

- Yabsra
- Jordan
- Geleta
- Amir

## Built at

JetBrains Kotlin Multiplatform Challenge, [event name], September 2026.
