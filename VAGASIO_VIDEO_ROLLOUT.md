# VagasIO video-call rollout (gated)

This branch integrates the isolated WebRTC signaling test without exposing it to production users.

## Flags and access
- Backend: `VAGASIO_VIDEO_CALLS=1` (default is disabled).
- Internal allowlist: `VAGASIO_VIDEO_INTERNAL_USER_IDS` and/or `VAGASIO_VIDEO_INTERNAL_EMAILS`.
- Signaling URL: `VAGASIO_VIDEO_SIGNAL_URL`; accepted only when it is `wss://`.
- Endpoint: authenticated `GET /api/video/config`. When disabled or the user is not allowlisted it returns generic `404` (no feature discovery). It accepts candidate, empresa, admin and recrutador tokens, then applies the allowlist.
- Client helper is inert unless explicitly imported by a gated internal page.

No production Render service or production branch was modified. Do not set these variables on production until the validation report is approved.

## Validation matrix
| Area | Result | Evidence / remaining work |
|---|---|---|
| Default-off behavior | PASS by code review | `404` without flag; no client import/UI |
| Auth and role checks | PASS by code review | Existing HS256 middleware; only known portal roles |
| Internal allowlist | PASS by code review | ID/email exact match, case-normalized email |
| Room isolation / max 2 | BLOCKED | Must run against isolated signaling service with two authenticated test accounts |
| Token expiry/reuse | BLOCKED | Signaling service must validate short-lived, single-use room tokens; current legacy test service is not sufficient |
| Simultaneous calls / reconnect | BLOCKED | Requires two-device/browser test run |
| Mobile/desktop | BLOCKED | Requires real-device matrix and camera/mic permission tests |
| Existing portal regression | PASS by scope | No existing UI or production routes changed |

## Security review
Fixed in this integration: default-off discovery, authenticated config access, role restriction, internal allowlist, no-store response, `wss://` enforcement, generic denial responses, and no secrets in client code.

Release blockers: the isolated signaling service must be upgraded to bind room tokens to both authenticated users, enforce expiry and single-use, reject replay, rate-limit joins/messages, validate message sizes/types, and add origin checks. Until those controls and the device/auth matrix pass, this branch must not be merged or released.
