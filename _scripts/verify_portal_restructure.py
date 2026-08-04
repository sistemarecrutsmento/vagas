#!/usr/bin/env python3
"""Read-only checks for the active Empresa portal restructuring.
No network, database, or dependency installation is required.
"""
from pathlib import Path
import re, sys

ROOT = Path(__file__).resolve().parents[1]
front = ROOT / 'vagas' / 'empresa'
api = ROOT / 'recrutamento-api' / 'src'
checks = []
def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))

server = (api / 'server.js').read_text()
auth = (api / 'auth.js').read_text()
extra = (api / 'routes' / 'empresa_extra.js').read_text()
app = (front / 'app.js').read_text()
analisar = (front / 'analisar.html').read_text()
invite = (front / 'convite.html').read_text()

check('invitation migration', (api / 'migrations' / '012_convites_empresa.js').exists())
check('invitation endpoints', all(x in server for x in (
    "app.get('/api/empresa/convites'", "app.post('/api/empresa/convites'",
    "app.get('/api/empresa/convite/:token'", "app.post('/api/empresa/convite/:token/aceitar'")))
check('invitation token hashing', 'token_hash' in server and 'hashConviteToken' in server)
url_start = server.find('function conviteFrontendUrl')
url_end = server.find("app.get('/api/empresa/convites'")
check('trusted invitation frontend base', 'req.headers.origin' not in server[url_start:url_end])
check('notification endpoints', all(x in server for x in (
    "app.get('/api/empresa/notificacoes'", "app.patch('/api/empresa/notificacoes/:id/lida'",
    "app.post('/api/empresa/notificacoes/lidas'")))
check('notification UI wired', 'abrirNotificacoes' in app and 'data-notif-all' in app)
check('tenant access filters', 'revogado_em IS NULL' in extra and 'empresa_id' in extra)
check('analisar response shape compatibility', 'data.candidatura || data' in analisar)
check('analisar HTML escaping', 'escapeHtml(e.observacoes)' in analisar and 'escapeHtml(nome)' in analisar)
check('invite HTML escaping', 'function esc' in invite and 'esc(convite.nome)' in invite)
check('viewer middleware present', 'function requireEmpresaViewer' in auth)
check('active company access recheck', 'ensureEmpresaAccessAtivo' in auth and 'u.ativo = true AND e.ativo = true' in auth)

# Active Empresa pages should not call SaaS /api/admin endpoints. The legacy
# redirect/auth helper is intentionally excluded because it handles old tokens.
for path in sorted(list(front.glob('*.html')) + list(front.glob('*.js'))):
    text = path.read_text()
    check(f'no SaaS API in {path.name}', '/api/admin/' not in text and '../admin/' not in text)

failed = [x for x in checks if not x[1]]
for name, ok, detail in checks:
    print(('OK  ' if ok else 'FAIL') + ' ' + name + (f' — {detail}' if detail else ''))
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)} checks passed')
sys.exit(1 if failed else 0)
