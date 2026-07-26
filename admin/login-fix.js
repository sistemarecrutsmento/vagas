(function(){
  console.log('[login] script carregou, URL:', location.href);

  function mostrarStatus(msg, erro) {
    var el = document.getElementById('alert-login');
    if (!el) {
      // Se a div #alert-login não existe (HTML antigo), cria uma
      var card = document.querySelector('.login-card');
      if (!card) return;
      el = document.createElement('div');
      el.id = 'alert-login';
      var sub = card.querySelector('.sub');
      if (sub) sub.parentNode.insertBefore(el, sub.nextSibling);
      else card.insertBefore(el, card.firstChild);
    }
    el.innerHTML = '<div class="alert ' + (erro?'alert-erro':'alert-ok') + '" style="padding:10px;border-radius:6px;margin-bottom:12px;'+(erro?'background:#fee;color:#c00;border:1px solid #fcc':'background:#dfd;color:#060;border:1px solid #aca')+'">' + msg + '</div>';
  }

  function setBotao(texto, habilitado) {
    var b = document.getElementById('btn-entrar');
    if (!b) {
      // Fallback: procura o botão do form
      b = document.querySelector('#login-form button');
      if (!b) {
        // Último recurso: procura qualquer botão com texto Entrar
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].textContent.match(/Entrar/)) { b = btns[i]; break; }
        }
      }
    }
    if (b) {
      b.disabled = !habilitado;
      b.textContent = texto;
      console.log('[login] botão:', texto, 'disabled:', !habilitado);
    } else {
      console.warn('[login] NÃO ACHEI o botão');
    }
  }

  async function tentarLogin() {
    console.log('[login] tentarLogin() chamado');
    var emailEl = document.getElementById('login-email');
    var senhaEl = document.getElementById('login-senha');
    if (!emailEl || !senhaEl) {
      mostrarStatus('Erro: campos de email/senha não encontrados. Faça Ctrl+Shift+R', true);
      return;
    }
    var email = emailEl.value.trim();
    var senha = senhaEl.value;
    if (!senha) {
      mostrarStatus('Digite a senha', true);
      return;
    }
    mostrarStatus('Entrando...', false);
    setBotao('Entrando...', false);

    // FETCH COM TIMEOUT DE 15s pra não travar
    var controller = new AbortController();
    var timeoutId = setTimeout(function() {
      controller.abort();
      console.warn('[login] timeout 15s atingido');
    }, 15000);

    try {
      var r = await fetch('https://recrutamento-api-novo.onrender.com/api/admin/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email: email, senha: senha}),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log('[login] resposta status:', r.status);
      var data;
      try { data = await r.json(); } catch(e) {
        throw new Error('Resposta não-JSON do servidor (status ' + r.status + ')');
      }
      console.log('[login] resposta:', data);
      if (!r.ok || !data.token) {
        var msgErro = (data && data.erro) ? data.erro : ('Credenciais inválidas (status ' + r.status + ')');
        mostrarStatus('Erro: ' + msgErro, true);
        setBotao('Entrar', true);
        return;
      }
      console.log('[login] token OK, salvando...');
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_tipo', (data.usuario && data.usuario.tipo) || 'admin');
      localStorage.setItem('admin_usuario', JSON.stringify(data.usuario || {}));
      mostrarStatus('Logado! Entrando no painel...', false);
      setBotao('Logado!', false);
      setTimeout(function(){ location.reload(); }, 500);
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('[login] ERRO:', e);
      var msg = 'Erro: ' + (e.name === 'AbortError'
        ? 'Servidor demorou mais de 15s. Render tá "dormindo" — tente de novo em 30s.'
        : (e.message || 'sem conexão'));
      mostrarStatus(msg + ' (se persistir, faça Ctrl+Shift+R)', true);
      setBotao('Entrar', true);
    }
  }

  function init() {
    console.log('[login] init() rodou');
    var btn = document.getElementById('btn-entrar');
    var form = document.getElementById('login-form');
    var senhaEl = document.getElementById('login-senha');

    console.log('[login] elementos:', {btn: !!btn, form: !!form, senha: !!senhaEl});

    if (btn) {
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        console.log('[login] CLICK no botão');
        tentarLogin();
      });
    } else {
      console.warn('[login] btn-entrar não encontrado');
      // Fallback: procura botão Entrar e adiciona listener
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].textContent.match(/Entrar/)) {
          btns[i].addEventListener('click', function(e){
            e.preventDefault();
            console.log('[login] CLICK (fallback) no botão');
            tentarLogin();
          });
          break;
        }
      }
    }
    if (form) {
      form.addEventListener('submit', function(e){
        e.preventDefault();
        console.log('[login] SUBMIT no form');
        tentarLogin();
      });
    }
    if (senhaEl) {
      senhaEl.addEventListener('keydown', function(e){
        if (e.key === 'Enter') {
          e.preventDefault();
          console.log('[login] ENTER na senha');
          tentarLogin();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Garantia extra: roda init() mesmo se DOMContentLoaded já disparou
  setTimeout(init, 100);
})();