# Changelog

All notable changes to `@dloizides/analytics-web` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
