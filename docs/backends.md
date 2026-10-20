# Data backends and HTTP contract

The default backend is browser localStorage. Supabase Auth/PostgREST and custom HTTP adapters are also implemented; select one with `VITE_DATA_SOURCE`. These instructions describe configuration, not the live deployment state.

## What is already backend-shaped

- UI code only touches `AuthRepo` / `AppRepo` / `ProfileRepo` (`src/data/repositories.ts`).
  Domain data stays behind repository interfaces; device preferences use dedicated utilities.
- `VITE_DATA_SOURCE=local` (default) keeps everything as-is. `supabase` switches
  every screen to `src/data/supabase/` (live Supabase Auth + PostgREST, anon key).
  `http` switches to `src/data/http/` for a custom REST backend (needs `VITE_API_URL`).
- `supabase/schema.sql` mirrors every prototype store as real tables with RLS.

## Backend configuration

1. Create the Supabase project. Run `supabase/schema.sql` in the SQL editor.
2. Auth: Authentication → Providers → enable **Google** with your Google Cloud
   OAuth client ID + secret, and add `http://localhost:3000/discover` (plus the
   production URL later) under URL Configuration → Redirect URLs.
   Then set `VITE_DATA_SOURCE=supabase`, `VITE_SUPABASE_URL`, and
   `VITE_SUPABASE_ANON_KEY` in `.env` and restart.
   Note: Supabase Auth issues fresh UUID identities, so the cloud database starts
   empty — prototype ids (`user-1`, `google-<sub>`) do not transfer. Migrate rows
   to the new ids at finalize time using an explicit migration.
3. Images: prototype screenshots are ~500KB data URLs. Move them to a Supabase
   Storage bucket and store public URLs in `screenshots` / `image_url`.
4. Implement the endpoint contract (thin server or Supabase Edge Functions):
   - `GET /auth/session` → `{ user }` (401 when signed out)
   - `POST /auth/signin {email, password}` → `{ user, token }`
   - `POST /auth/signup {name, email, password}` → `{ user, token }` (existing email, case-insensitive → 409 `{ message }` naming the clash, never a second account)
   - `POST /auth/google {accessToken}` → `{ user, token, picture? }`.
     Server MUST fetch Google userinfo itself and match verified email → account.
     Never trust client-sent claims.
   - `POST /auth/signout` → 204 · `PATCH /auth/name {name}` → `{ user }`
   - `POST /auth/recover {email}` → 204 (sends reset email, link lands on `/signin?mode=recovery`)
   - `PATCH /auth/password {password}` → `{ user }` (current session only)
   - `GET /apps?query=&category=&limit=&offset=` → `{ apps }` (server fills
     `viewer_has_voted` / `comments_count` from the session)
   - `GET /apps/:id` → `{ app }` · `POST /apps` → `{ app }`
     · `PATCH /apps/:id` → `{ app }` (owner only) · `DELETE /apps/:id` → 204
   - `POST /apps/:id/vote` → `{ app }` (toggle)
   - `GET /apps/:id/voters` → `{ voters }` (profiles of upvoters, any order)
   - `GET /apps/:id/comments` → `{ comments }` (flat, `parent_id` nests replies)
   - `POST /apps/:id/comments {body, parentId?}` → `{ comment }`
   - `POST /apps/:id/comments/:commentId/like` → `{ comment }` (toggle)
   - `GET /comments/likers?ids=a,b` → `{ likers: { [commentId]: userId[] } }` (powers like notifications)
   - `DELETE /apps/:id/comments/:commentId` → 204 (author only, replies cascade)
   - `GET /milestones` → `{ milestones }` (newest first)
   - `POST /milestones {body, appId?}` → `{ milestone }`
   - `POST /milestones/:id/cheer` → `{ milestone }` (toggle)
   - `GET /profiles` → `{ profiles }` · `GET /profiles/:id` → `{ profile }`
   - `GET /profiles/by-name/:name` → `{ profile }` (404 → null)
   - `POST /profiles/ensure {id, email, name}` → `{ profile }`
   - `PATCH /profiles/:id` → `{ profile }` (owner only)
   - Errors as `{ message }` with proper HTTP status (404 drives not-found UI).
5. For the custom server option, set `VITE_DATA_SOURCE=http` and `VITE_API_URL=https://<your-api>` in `.env`.
6. Review the rate-limit, vote-guard, authorship, and constraint migrations in `supabase/`. Configure Auth CAPTCHA and provider settings in the target environment. Verify policies with authenticated and unauthorized requests before releasing.

## SQL changes

Review `supabase/schema.sql` and each migration header. Apply migrations in dependency order, not an assumed alphabetical order: legacy profile-claim support must precede its retirement in `migration_drop_claim.sql`; counter and vote protections must be applied in their intended sequence. For an existing database, inspect what is already applied and back up first. Do not blindly rerun all files after the consolidated schema.

## Local demo boundaries

Local Google account claims and browser password storage are demo behavior. Production identity verification and authorization belong in Supabase or the custom server. Local demo IDs are not interchangeable with Supabase UUID identities.

See [setup](setup.md) for environment configuration and [runbook](runbook.md) for backup/recovery.
