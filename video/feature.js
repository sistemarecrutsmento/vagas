/* VagasIO video-call rollout client guard.
 * No page imports this module until the server-side flag and internal allowlist are enabled.
 */
export async function loadVagasIOVideoConfig(apiBase, token) {
  const r = await fetch(`${apiBase}/api/video/config`, {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
  });
  if (!r.ok) return { enabled: false };
  const c = await r.json();
  return c.enabled === true && typeof c.signalUrl === 'string' ? c : { enabled: false };
}
