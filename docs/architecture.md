# Architecture

CodeCanvas is a React 18, TypeScript, and Vite app styled with Tailwind CSS v4. It uses Phosphor icons, locally bundled Nunito/Fredoka fonts, and `react-markdown` with GFM for documentation. Backend selection happens at build/startup through `VITE_DATA_SOURCE`.

## Project structure

```text
src/
  pages/        Main router, Store shell, Login, Landing, About, route helpers
  components/   Shared controls, cards, views, markdown, dialogs, notifications
  auth/         Session provider and local account definitions
  data/         Repository contracts, factory, local/Supabase/HTTP adapters
  utils/        URLs, markdown imports, ranking, time, palettes, notifications
  styles/       Tailwind theme, shared utilities, notebook canvas
supabase/       Database schema and incremental migrations
public/         Static assets and font-only cache worker
docs/           Maintained setup, architecture, backend, UI, and operations docs
soundEffects/   Bundled notification and vote audio
```

## Routes

`src/pages/routes.ts` defines route constants; `Main.tsx` selects public/authenticated pages, and `Store.tsx` selects authenticated views.

| Route                            | Behavior                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| `/`                              | Sends signed-out visitors to `/landing`, signed-in users to `/discover`  |
| `/landing`, `/about`             | Public introduction and team information                                 |
| `/signin`                        | Email/password, Google, signup, recovery; signed-in users go to Discover |
| `/discover`                      | Search/filter projects and submit projects                               |
| `/apps/:id`                      | Project details and owner editing                                        |
| `/developers`, `/developers/:id` | Developer directory and profile                                          |
| `/profile`                       | Current user's profile                                                   |
| `/feed`                          | Milestone posts, cheers, and comments                                    |
| `/community`                     | Compatibility entry for Feed                                             |
| `/leaderboard`                   | Ranked developers and projects                                           |
| `/settings`                      | Password, website palette, sound, local demo reset                       |

## Data and authentication

UI domain operations use `AuthRepo`, `AppRepo`, and `ProfileRepo` from `src/data/repositories.ts`, instantiated by `src/data/factory.ts`.

- `local` (default): browser localStorage accounts, profiles, and project/activity data for demonstrations.
- `supabase`: Supabase Auth plus PostgREST/RPCs. Configure the public endpoint and anon key; authorization belongs in database policies/RPCs.
- `http`: adapter for an independently implemented REST server; see [backends](backends.md).

Keep repository methods compatible across all three adapters. Device preferences, notification read state, sounds, and public GitHub/Google integrations use their own utilities; they are separate from domain repository storage.

Supabase Google login uses a provider redirect to `/discover`. Email/password supports signup, signin, password updates, and recovery to `/signin?mode=recovery`. Turnstile is configured through its public site key when the backend requires CAPTCHA. Local Google handling is demo behavior and must not be treated as server verification.

## Product behavior

- Projects include a validated URL, description, category, collaborators, optional screenshots, and Markdown docs. Owners can edit/delete their projects.
- Feedback supports nested replies and likes; Feed uses milestones and cheers.
- Notifications derive from repository activity and device read/arrival state.
- Developer ranking combines project votes with a 20-point bonus per published project; project ranking uses votes.
- Profiles support avatar and theme choices; Settings stores the site palette on the profile and device.
- Project docs prefer submitted content; otherwise public GitHub repository URLs can supply a README. Publishing allows 50,000 characters of docs; individual repository Markdown files allow 200KB for preview/download.

## UI and validation

Use the [shared component and responsive layout conventions](ui-audit.md). `design.md` and `agent.md` remain root-level implementation companions.

Tests are colocated as `src/**/*.test.ts`; see the root [command reference](../README.md). Build and typecheck are separate checks. Database policy integration, provider dashboards, and production deployment behavior require verification against their configured environments. Separate admin applications are outside this repository's validation scope.
