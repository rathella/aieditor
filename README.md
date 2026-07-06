# Kure Dataset Builder

A SaaS tool for turning public encyclopedia articles into clean, structured
datasets for AI training. Import a URL, review the extracted content,
manually edit it, and export it as JSON, Markdown, or TXT — all backed by
per-user Firebase Auth + Firestore storage.

> This app extracts and cleans existing article content. It does **not**
> generate articles.

---

## Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript (strict)
- **Styling**: Tailwind CSS + hand-built shadcn/ui-style primitives (Radix UI underneath)
- **Auth**: Firebase Authentication (email/password + Google)
- **Database**: Firestore, scoped per user at `users/{uid}/...`
- **Extraction**: `cheerio`-based readability-style content isolation + custom HTML→Markdown converter

## Architecture

```
src/
  app/
    (auth)/sign-in, sign-up        # Auth pages
    api/                           # API routes (all Firebase-auth protected)
      articles/                    # list, create (import), get/patch/delete, export
      history/                     # list + restore
      style-profile/               # computed corpus-wide style metrics
      settings/                    # per-user app settings
    analyze/[id]/                  # 3-column workspace (info / editor / export)
    dataset/                       # searchable, filterable, paginated article grid
    style-profiles/                # aggregate writing-style analysis
    history/                       # timeline + version restore
    settings/                      # theme, export defaults, parser settings
  components/
    ui/                            # Button, Card, Dialog, Select, etc. (shadcn-style)
    layout/, dashboard/, analyze/, dataset/, style-profiles/, history/, auth/
  lib/
    firebase/                      # client.ts, admin.ts, server-auth.ts, use-auth.tsx
    firestore/queries.ts           # all Firestore reads/writes, scoped by uid
    extraction/                    # fetch → extract → markdown → metrics → quality score
    style-analysis/                # corpus-wide style profile engine
    export/                        # JSON / Markdown / TXT formatters
  types/                           # Article, HistoryEntry, StyleProfile, AppSettings
```

### Data model (Firestore)

```
users/{uid}/articles/{articleId}   # one document per imported article
users/{uid}/history/{entryId}      # every import/edit/export/approve/restore event
users/{uid}/settings/app           # single settings document per user
```

Every API route calls `requireUid(request)` first, which verifies the
`Authorization: Bearer <Firebase ID token>` header via the Admin SDK. All
Firestore access happens server-side through the Admin SDK — the client SDK
is used **only** for Authentication. Firestore Security Rules
(`firestore.rules`) deny all direct client access as a defense-in-depth
measure.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. Enable **Authentication** → Sign-in method → turn on **Email/Password** and **Google**.
3. Enable **Firestore Database** (production mode is fine — rules are provided).
4. Under **Project Settings → General → Your apps**, add a **Web app** and copy the config values.
5. Under **Project Settings → Service Accounts**, click **Generate new private key** — this downloads a JSON file with `project_id`, `client_email`, and `private_key`.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from step 2:

```bash
cp .env.example .env.local
```

The `NEXT_PUBLIC_*` values come from the web app config; `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` come from the service
account JSON (keep the `\n` sequences in the private key literal, wrapped in
quotes).

### 4. Deploy Firestore rules & indexes (optional but recommended)

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`, create an account, and paste an encyclopedia
article URL into the Dashboard to run your first import.

### 6. Deploy

This app deploys cleanly to **Vercel** (recommended — no local build needed,
Vercel builds it for you):

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in the Vercel project settings.
4. Deploy.

---

## Notes on scope & future work

- **Copyright**: this tool extracts publicly available article content.
  Wikipedia and similar CC-BY-SA sources are generally safe with attribution;
  arbitrary sources may carry their own licensing terms. Consider adding a
  source allowlist and a Terms of Service acknowledgment before opening this
  up to external users.
- **SSRF**: the import pipeline fetches whatever URL a signed-in user
  submits. For a public-facing deployment, add IP/hostname filtering
  (block private ranges, cloud metadata endpoints, etc.) before the `fetch`
  call in `lib/extraction/fetch-article.ts`.
- **Billing**: not implemented yet. `Settings` has a placeholder "Future AI
  Provider" section; a Stripe subscription layer would hook in alongside the
  existing per-user Firestore scoping.
- **AI features**: "Generate AI Prompt" and AI provider selection are
  intentionally disabled — the architecture (settings schema, style
  profiles) anticipates them but this build never generates article content.
