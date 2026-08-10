# VagasIO video rollout test checklist

Run only in the isolated branch/service with synthetic internal accounts.

1. No flag: unauthenticated, candidate, empresa and admin requests all receive generic 404.
2. Flag on: missing, expired or malformed JWT is 401; valid non-allowlisted role receives 404; allowlisted candidate and recruiter receive config; unknown role receives 404.
3. Config URL is `wss://`; response has `Cache-Control: no-store`; no token or secret is returned.
4. Create two rooms and prove SDP/chat never crosses rooms; third peer is rejected.
5. Expired token and replayed token are rejected; token cannot join a different room or role.
6. Two concurrent calls remain isolated; close and reconnect does not grant a second room slot.
7. Chrome/Android Chrome and Safari/iOS permission, mute/camera, network drop/reconnect.
8. Existing candidate/empresa login, candidatura, agenda and chat smoke tests remain green.
