# Tasks

The backlog for the hackathon. One task = one person = one branch = one PR.

This file is the **spec** of each task. **Who does what and the status live in GitHub Issues** (one issue per task, same ID in the title), so nobody edits this file to claim work and there are no merge conflicts.

How to take a task:

1. Pick an open issue whose dependencies are closed (or that can start with mock data).
2. Assign it to yourself on GitHub, then create the branch, e.g. `feat/t2-map-view`.
3. Stay inside the **Folders** column. Anything outside it needs approval from Alberto.
4. Open the PR with `Closes #<issue number>` so the issue closes on merge.

---

## Pillar A: urgent restroom map (highest priority)

| ID  | Task                                                                                                                                                                                                                 | Folders                                                                                   | New deps allowed | Depends on                    |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :--------------- | :---------------------------- |
| T1  | **Restroom dataset.** Script that downloads Kraków toilets from the Overpass API (`amenity=toilets`) and writes a static GeoJSON. Types, parsing and a confidence level (`verified`, `osm`, `unknown`) per restroom. | `scripts/`, `public/data/`, `src/lib/restrooms/`, `src/types/restroom.ts`                 | none             | -                             |
| T2  | **Map view.** MapLibre map in the restroom-map screen showing restrooms colored by confidence, the user position, and a "Simulate location: Rynek Główny" switch (GPS fails indoors at the venue).                   | `src/components/features/restroom-map/`, `src/hooks/useGeolocation.ts`                    | `maplibre-gl`    | T1 (use mock data until then) |
| T3  | **Emergency flow.** "I need a restroom now" picks the nearest restroom by walking time and draws the walking route. Target: under 3 seconds from tap to route. Route handler proxies OpenRouteService.               | `src/app/api/walking-route/`, `src/lib/routing/`, `src/components/features/restroom-map/` | none             | T1, T2                        |
| T4  | **Isochrones.** 2 / 4 / 6 minute walking rings around the user (OpenRouteService isochrones through a route handler).                                                                                                | `src/app/api/isochrones/`, `src/lib/routing/`, `src/components/features/restroom-map/`    | none             | T2                            |
| T5  | **Access card.** Full-screen card that asks staff to let the user use the restroom, Polish by default, switchable to English. Large text, works offline.                                                             | `src/components/features/access-card/`, `src/app/access-card/`                            | none             | -                             |

## Pillar B: menu reader

| ID  | Task                                                                                                                                                                                                       | Folders                                                                                            | New deps allowed       | Depends on     |
| :-- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :--------------------- | :------------- |
| T6  | **Local profile.** Screen where the user marks trigger foods and needs. Stored only on the device (`localStorage`), with typed read/write helpers. No account.                                             | `src/components/features/profile/`, `src/app/profile/`, `src/lib/profile/`, `src/types/profile.ts` | none                   | -              |
| T7  | **Menu photo capture.** Take or upload a photo of a menu, preview it, send it to the analysis endpoint, show a loading state (vision calls take 3-6 s).                                                    | `src/components/features/menu-reader/`                                                             | none                   | -              |
| T8  | **Menu analysis endpoint.** Route handler that sends the photo to the Gemini API and returns structured JSON: dishes, likely ingredients, EU allergens. Validate the response. Cache by image hash.        | `src/app/api/menu-analysis/`, `src/lib/menu-analysis/`, `src/types/menu.ts`                        | `@google/genai`, `zod` | -              |
| T9  | **Profile matching.** Pure function that crosses the analysed menu with the local profile and returns a traffic light per dish with the reason ("contains garlic, which you marked"). Unit tests required. | `src/lib/menu-matching/`, `src/components/features/menu-reader/`                                   | none                   | T6, T8 (types) |

## Cross-cutting

| ID  | Task                                                                                                                               | Folders                             | New deps allowed | Depends on |
| :-- | :--------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------- | :--------------- | :--------- |
| T10 | **Offline mode.** Precache the restroom GeoJSON and the access card; verify the app works in airplane mode after one online visit. | `src/app/sw.ts`, `src/app/serwist/` | none             | T1, T5     |
| T11 | **Deploy.** Vercel project with env vars, HTTPS URL tested on a real phone (camera and GPS need HTTPS).                            | (no code)                           | none             | -          |
| T12 | **Pitch and video.** Script, slides, demo video. Starts at hour 1, not at the end.                                                 | (no code)                           | none             | -          |

## Out of scope (roadmap slide only)

Forum and community, peer matching, specialist posts, RAG assistant, medication reminders, user accounts and sync.
