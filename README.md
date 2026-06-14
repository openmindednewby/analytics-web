# @dloizides/analytics-web

Product-agnostic web analytics layer for the dloizides.com portfolio. One shared
vehicle so all four product web apps instrument [Umami](https://umami.is/)
analytics identically, satisfying the mandatory `web-app-standards` analytics
baseline.

It generalizes two existing implementations:

- the `kefi-marketing` `src/lib/track.ts` pattern — a guarded, never-throws
  `track()` plus first-touch UTM/ref attribution;
- the legacy `BaseClient` `UmamiClient` — the Umami send shape and PII redaction.

The package **never imports a product, realm, or hardcoded website id**. Each app
supplies its own `websiteId` (from the Umami dashboard) and an `enabled` flag.

## Install

```sh
npm install @dloizides/analytics-web
```

No runtime dependencies. Browser-only (every entry point no-ops under SSR/native
where `window`/`document` are absent).

## Quick start

```ts
import { createAnalytics } from '@dloizides/analytics-web';

// Once, at app bootstrap:
const analytics = createAnalytics({
  websiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID, // per-app id
  enabled: import.meta.env.PROD,                     // off in dev/preview
});

analytics.injectSnippet();      // SPA only — see "Snippet placement" below
analytics.captureAttribution(); // snapshot first-touch UTM/ref/referrer

// At a conversion:
analytics.track('signup_submitted', { plan: 'pro', ...analytics.getAttribution() });
```

When `enabled` is `false`, `createAnalytics` returns a **no-op facade** — every
method is inert and `enabled` is `false` — so call sites never need their own
guards.

## Public API

### `createAnalytics(config): Analytics`

The app-facing facade. `config`:

| field       | type      | default                                       | notes                                  |
| ----------- | --------- | --------------------------------------------- | -------------------------------------- |
| `websiteId` | `string`  | _(required)_                                  | per-app Umami website id               |
| `scriptSrc` | `string`  | `https://analytics.dloizides.com/script.js`   | self-hosted Umami browser script       |
| `enabled`   | `boolean` | `true`                                        | `false` → fully inert no-op facade     |

Returns `{ track, captureAttribution, getAttribution, injectSnippet, enabled }`.

### Standalone helpers

The facade is sugar over these, exported for direct use (e.g. Astro `is:inline`
scripts that can't import a module facade easily):

- `track(event, props?)` — fire a Umami event. Guarded: no-ops under SSR, when
  the snippet is absent (ad-blocker/CSP/dev), and swallows beacon throws. PII-
  looking props are redacted. Never blocks navigation.
- `captureAttribution()` — snapshot `utm_*` + `ref` + `document.referrer` into
  sessionStorage on first touch (first-touch wins; idempotent per session).
- `getAttribution(): Record<string,string>` — read back the snapshot.
- `getRef(): string | undefined` — the `ref` from the snapshot.
- `injectSnippet({ websiteId, scriptSrc? })` — append the Umami
  `<script defer ... data-website-id>` to `<head>`. Idempotent (keyed by id).
- `isSnippetInjected(websiteId)` — whether that snippet is already present.
- `sanitizeProps(props)` — redact PII-looking keys (email/token/password/…).

Plus the `Analytics`, `AnalyticsConfig`, `EventProps`, `UmamiTracker` types and
the `DEFAULT_SCRIPT_SRC` / `ATTRIBUTION_KEY` / `UTM_KEYS` / … constants.

## Snippet placement

Umami needs its `<script>` on the page. There are two placements:

- **Static HTML (Astro marketing, Expo-web exported `index.html`)** — hand-place
  the snippet in the static template (Expo strips `<script>` from React, so it
  must live in the exported HTML / Dockerfile, per the analytics skill's Expo
  gotcha). Then just call `track`/`captureAttribution`; do **not** also call
  `injectSnippet`.
- **SPA without a static template (poueni dashboard / Vite)** — call
  `analytics.injectSnippet()` once at bootstrap.

`isSnippetInjected` / the idempotency of `injectSnippet` make double-injection
during HMR safe.

## License

MIT
