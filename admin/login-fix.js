(function(){
// Logs que o Fabio pode ver abrindo F12 → Console
  console.log('[login] script de login carregou');
  function mostrarStatus(msg, erro) {
    var el = document.getElementById('alert-login');
    if (!el) return;
    el.innerHTML = '<div class="alert ' + (erro?'alert-erro':'alert-ok') + '">' + msg + '</div>';
  }
  async function tentarLogin() {
    console.log('[login] botão clicado');
    var emailEl = document.getElementById('login-email');
    var senhaEl = document.getElementById('login-senha');
    var botao = document.getElementById('btn-entrar');
    if (!emailEl || !senhaEl) { mostrarStatus('Campos não encontrados', true); return; }
    var email = emailEl.value.trim();
    var senha = senhaEl.value;
    if (!senha) { mostrarStatus('Digite a senha', true); return; }
    botao.disabled = true;
    botao.textContent = 'Entrando...';
    try {
      console.log('[login] chamando API...');
      var r = await fetch('https://recrutamento-api-novo.onrender.com/api/admin/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email: email, senha: senha})
      });
      console.log('[login] resposta status', r.status);
      var data = await r.json();
      if (!r.ok || !data.token) {
        mostrarStatus('Erro: ' + (data.erro || 'credenciais inválidas'), true);
        botao.disabled = false; botao.textContent = 'Entrar';
        return;
      }
      console.log('[login] token recebido, salvando...');
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_tipo', data.usuario && data.usuario.tipo || 'admin');
      localStorage.setItem('admin_usuario', JSON.stringify(data.usuario || {}));
      mostrarStatus('Logado! Entrando...', false);
      setTimeout(function(){ location.reload(); }, 200);
    } catch (e) {
      console.error('[login] erro', e);
      mostrarStatus('Erro: ' + (e.message || 'sem conexão'), true);
      botao.disabled = false; botao.textContent = 'Entrar';
    }
  }
  function init() {
    console.log('[login] init() rodou');
    var btn = document.getElementById('btn-entrar');
    var form = document.getElementById('login-form');
    if (btn) btn.addEventListener('click', function(e){ e.preventDefault(); tentarLogin(); });
    if (form) form.addEventListener('submit', function(e){ e.preventDefault(); tentarLogin(); });
    if (senhaEl) senhaEl.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); tentarLogin(); }});
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
