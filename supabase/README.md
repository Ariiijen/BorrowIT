# BorrowIT Supabase Setup

`migrations/20260928000000_initial_schema.sql` is the deployable schema. `schema.sql` is its readable reference. The demo seed is disabled by default because auth users must be created through Supabase Auth first.

## Environment

Set these in the root `.env` for local development and as deployment environment variables in production:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
```

Never put a service-role key or database password in a `VITE_` variable. `.env` is ignored by Git; `.env.example` should contain placeholders only.

## Deploy the database

Run from the repository root. `supabase login` opens a browser for the access token; `db push` may prompt for the database password in the terminal. Do not share either secret in chat or put it in `.env`.

```powershell
npx supabase login
npx supabase link --project-ref ochnoukkrlubgmdpgqgo
npx supabase db push
npx supabase gen types typescript --project-id ochnoukkrlubgmdpgqgo --schema public | Set-Content -Encoding utf8 src/types/database.ts
```

Alternatively, copy the contents of `migrations/20260928000000_initial_schema.sql` into Supabase Dashboard → SQL Editor and run it once. Do not run both paths against the same fresh project.

## Google OAuth

1. In Google Cloud Console, create or select a project and configure the OAuth consent screen with the BorrowIT app name and support email.
2. Go to APIs & Services → Credentials → Create Credentials → OAuth client ID. Choose **Web application**.
3. Under **Authorized JavaScript origins**, add `http://localhost:5173` and the production site origin, for example `https://borrowit.example.edu`.
4. Under **Authorized redirect URIs**, add the callback URL shown by Supabase for the project. The default is `https://ochnoukkrlubgmdpgqgo.supabase.co/auth/v1/callback`.
5. Copy the Google Client ID and Client Secret into Supabase Dashboard → Authentication → Sign In / Providers → Google, enable Google, and save.
6. Use the `openid email profile` scopes (Supabase requests these profile scopes for Google sign-in).
7. In Supabase Dashboard → Authentication → URL Configuration, set the production **Site URL** and add both `http://localhost:5173/**` and the production callback target, such as `https://borrowit.example.edu/**`, under **Redirect URLs**.

The Google Client Secret belongs only in the Supabase provider settings, never in the frontend `.env`. Newly created Google accounts receive the safe default `Borrower` role.

## Verification

- Open `/` and check the landing page at 375px, 768px, and 1280px widths.
- Register with email; with email confirmation enabled, verify the link before logging in. If confirmation is disabled in Supabase Auth settings, registration can establish a session immediately.
- Log in with email/password and test the password recovery link.
- Enable Google as above and test sign-in with an account not already registered.
- Create borrower, lender, and admin test accounts; verify that RLS limits reads even when a request is made directly through the Supabase client.
- Sign out, then sign into a different account in the same browser and verify no previous account data remains in the UI.
