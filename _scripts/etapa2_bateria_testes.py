#!/usr/bin/env python3
"""Bateria de testes Etapa 2 - Seguranca. Roda apos deploy do Fabio."""
import requests, json, time, sys, base64

BASE = "https://recrutamento-api-novo.onrender.com"
TEST_EMAIL = "fabio08dejesusjunior@gmail.com"
TEST_SENHA = "089339"
results = []

def test(name, fn):
    print(f"  [{name}] ... ", end="", flush=True)
    try:
        ok, detail = fn()
        if ok:
            print("✅")
            results.append(('PASS', name, ''))
        else:
            print(f"❌ {detail}")
            results.append(('FAIL', name, detail))
    except Exception as e:
        print(f"💥 {e}")
        results.append(('ERROR', name, str(e)))

def t1_refresh_existe():
    r = requests.post(f"{BASE}/api/auth/refresh", json={}, timeout=15)
    return r.status_code == 400, f"status={r.status_code}, body={r.text[:200]}"

def t2_logout_existe():
    r = requests.post(f"{BASE}/api/auth/logout", json={}, timeout=15)
    return r.status_code == 400, f"status={r.status_code}"

def t3_404_json():
    r = requests.get(f"{BASE}/api/rota-inexistente-12345", timeout=15)
    if 'application/json' in r.headers.get('Content-Type', ''):
        return True, ''
    return False, f"CT={r.headers.get('Content-Type')}, body={r.text[:100]}"

def t4_x_powered_by_ausente():
    r = requests.get(f"{BASE}/api/saude", timeout=15)
    if 'X-Powered-By' in r.headers:
        return False, f"X-Powered-By presente: {r.headers.get('X-Powered-By')}"
    return True, ''

def t5_server_header_ausente():
    r = requests.get(f"{BASE}/api/saude", timeout=15)
    if 'Server' in r.headers:
        return False, f"Server presente: {r.headers.get('Server')}"
    return True, ''

def t6_login_admin_2fa():
    r = requests.post(f"{BASE}/api/admin/login",
                      json={"email": TEST_EMAIL, "senha": TEST_SENHA}, timeout=15)
    if not r.ok or not r.json().get('requer_2fa'):
        return False, "2FA nao requerido"
    return True, ''

def t7_rate_limit_2fa():
    statuses = []
    for i in range(7):
        r = requests.post(f"{BASE}/api/admin/2fa/verificar",
                         json={"codigo_id": "fake", "codigo": str(i)}, timeout=15)
        statuses.append(r.status_code)
    if 429 in statuses:
        return True, f"statuses={statuses}"
    return False, f"nao bloqueou: {statuses}"

def t8_retry_after():
    for i in range(15):
        r = requests.post(f"{BASE}/api/admin/2fa/verificar",
                         json={"codigo_id": "fake", "codigo": str(i)}, timeout=15)
        if r.status_code == 429:
            if 'Retry-After' in r.headers:
                return True, f"Retry-After={r.headers['Retry-After']}"
            return False, "Retry-After ausente"
    return False, "nao foi bloqueado"

def t9_cors_bloqueia():
    r = requests.get(f"{BASE}/api/saude",
                    headers={"Origin": "https://evil.com"}, timeout=15)
    if 'Access-Control-Allow-Origin' in r.headers:
        return False, f"allow evil: {r.headers.get('Access-Control-Allow-Origin')}"
    return True, ''

def t10_sql_injection():
    r = requests.post(f"{BASE}/api/admin/login",
                     json={"email": "admin@x.com' OR '1'='1", "senha": "x"}, timeout=15)
    return r.status_code in [400, 401], f"status={r.status_code}"

def t11_jwt_alg_none():
    h = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').rstrip(b'=').decode()
    p = base64.urlsafe_b64encode(b'{"email":"admin@x","tipo":"admin","exp":9999999999}').rstrip(b'=').decode()
    fake = f"{h}.{p}."
    r = requests.get(f"{BASE}/api/admin/dashboard",
                    headers={"Authorization": f"Bearer {fake}"}, timeout=15)
    return r.status_code == 401, f"status={r.status_code}"

def t12_logout_invalido():
    r = requests.post(f"{BASE}/api/auth/logout",
                     json={"refreshToken": "fake_invalid_token_xyz"}, timeout=15)
    return r.status_code in [400, 401], f"status={r.status_code}"

def main():
    print(f"\n==========================================")
    print(f"🧪 BATERIA ETAPA 2 — {BASE}")
    print(f"==========================================\n")

    test("T1: /api/auth/refresh existe", t1_refresh_existe)
    test("T2: /api/auth/logout existe", t2_logout_existe)
    test("T3: 404 retorna JSON", t3_404_json)
    test("T4: X-Powered-By ausente", t4_x_powered_by_ausente)
    test("T5: Server header ausente", t5_server_header_ausente)
    test("T6: Login admin retorna 2FA", t6_login_admin_2fa)
    test("T7: Rate limit 2FA", t7_rate_limit_2fa)
    test("T8: Retry-After header", t8_retry_after)
    test("T9: CORS bloqueia evil", t9_cors_bloqueia)
    test("T10: SQL injection bloqueado", t10_sql_injection)
    test("T11: JWT alg=none bloqueado", t11_jwt_alg_none)
    test("T12: Logout com token invalido", t12_logout_invalido)

    passed = sum(1 for r in results if r[0] == 'PASS')
    failed = sum(1 for r in results if r[0] in ['FAIL', 'ERROR'])

    print(f"\n==========================================")
    print(f"📊 RESULTADO: {passed} passou, {failed} falhou de {len(results)}")
    print(f"==========================================")
    if failed > 0:
        print("\n❌ Detalhes:")
        for status, name, detail in results:
            if status != 'PASS':
                print(f"  {status}: {name} — {detail}")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())