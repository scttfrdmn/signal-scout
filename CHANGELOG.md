# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2026-03-24

### Added
- Feedback button in header — opens a pre-labelled GitHub issue in a new tab (closes #18)

## [0.3.1] - 2026-03-23

### Fixed
- Switch pipeline auth from `Authorization: Bearer` to `X-Api-Key` header — Clerk v7 intercepts Bearer tokens before they reach the route handler
- Update `PIPELINE_API_URL` to canonical production domain (`enso-pipeline.vercel.app`) — deployment-specific URLs are Vercel-protected

## [0.3.0] - 2026-03-23

### Added
- Vercel Analytics (`@vercel/analytics/next`) — page view tracking across all routes (closes #12)

### Infrastructure
- Clerk production instance upgrade instructions posted to #10
- Custom domain setup instructions posted to #11

## [0.2.0] - 2026-03-23

### Added
- Scan history persisted to Neon database; survives page refresh (closes #4)
- Result statuses (Pursuing/Watch/Passed) and pipeline-sent state persisted via `PATCH /api/scans/[id]` (closes #5)
- Result deduplication within a scan by company name (closes #7)
- No-results message when scan completes with zero matches (closes #9)
- Retry button on pipeline send failure (closes #9)

### Changed
- Upgraded Anthropic model from `claude-opus-4-5` to `claude-opus-4-6` (closes #8)

### Known Issues
- Scout → Pipeline send not verified end-to-end (#6)

## [0.1.0] - 2026-03-23

### Fixed
- Removed debug email display from /unauthorized page (closes #1)
- Removed /sign-up from public proxy routes (no sign-up page exists)

### Known Issues
- Scan history not persisted to database (in-memory only)
- Result status (Pursuing/Watch/Passed) not persisted to database
- Scout → Pipeline send not verified end-to-end
- Result deduplication across scans not yet implemented

## [0.0.1] - 2026-03-23

### Added
- Next.js 15 application scaffold (App Router, Turbopack, TypeScript, Tailwind)
- Clerk authentication with Google OAuth, restricted to @playgroundlogic.co and @enso.co
- Route group protection via `(protected)/layout.tsx` — domain check using `currentUser()`
- `/unauthorized` page for blocked users with sign-out action
- Neon Postgres database with Drizzle ORM (`scans` table)
- Scanner UI: sidebar with focus area input, run scan button, live scan log, scan history
- Streaming SSE scan route (`/api/scan`) — Anthropic API with `web_search_20250305` tool
- Discovery prompt (`buildDiscoveryPrompt`) encoding 7 targeted searches across brand/business publications
- Result cards with company name, opportunity, signal, why ENSO, decision maker, source, urgency
- Pursuing / Watch / Passed status toggles on result cards
- Send to Pipeline action (`/api/send-to-pipeline`) — server-side proxy with Bearer token auth
- Pipeline API client (`src/lib/pipeline.ts`)
- Visual style: Bebas Neue + DM Mono typography, ENSO brand orange (#e8490f), warm neutral palette
- Original reference JSX preserved in `_reference/`
