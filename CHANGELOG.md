# Changelog

All notable changes to `@dloizides/analytics-web` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-26

### Added

- `createWebVitals(config)` — shared Core Web Vitals reporter (CLS, INP, LCP, FCP, TTFB) replacing the per-portal `reportWebVitals` / `useWebVitalsTracking` copies (OBS-1d "Shared web-vitals in @dloizides/analytics-web"). Sends one `web_vital` event per metric with `{ metric, value, rating, id }`; CLS is rounded to 4 decimals, the rest to whole ms.
- Off by construction (OBS-1 owner Q1 "works when switched off"): `start()` is a no-op when `enabled: false`, when neither a `reporter` nor a non-empty `websiteId` is configured, when `canReport()` returns false, under Do-Not-Track with `respectDoNotTrack: true`, and outside a browser DOM (SSR, React Native). Idempotent: listeners register once.
- Injectable `reporter`; the default forwards to Umami through the guarded `track`.
- The package never names `web-vitals` (a literal `import()` in `dist` would make bundlers resolve it at build time). The app enables metrics with `loadMetrics: () => import('web-vitals')` (`^4 || ^5`); without it `start()` is a no-op. `loadMetrics` is called only after every gate passes.

### Fixed

- `attribution.ts` `getSearch` probes `location` directly (as `getReferrer` probes `document`); the old `window` guard was unreachable and held the 100% coverage gate below threshold.

## [1.0.3] - 2026-09-26

### Changed

- `injectSnippet` sets `script.async = true` instead of `script.defer = true` (ANALYTICS-ASYNC-1 "Analytics tag must never block render"). A script-inserted element is async by spec either way, so runtime behaviour does not change; the source and docs no longer model the `defer` tag that held `DOMContentLoaded` on hand-written pages.

## [1.0.0] - 2026-06-14

### Added

- Initial release. Product-agnostic web analytics layer for the dloizides.com
  portfolio, generalizing the kefi-marketing `track.ts` pattern and the legacy
  BaseClient `UmamiClient`.
- `createAnalytics(config)` — app-facing facade; returns a no-op facade when
  `enabled: false`.
- `track(event, props?)` — guarded never-throws Umami event helper with PII
  redaction.
- `captureAttribution()` / `getAttribution()` / `getRef()` — first-touch
  UTM/ref/referrer attribution via sessionStorage.
- `injectSnippet(opts)` / `isSnippetInjected(id)` — Umami `<script>` injection
  for SPAs without a static HTML template.
- `sanitizeProps(props)` — PII redaction helper.
- Full type + constant surface.
