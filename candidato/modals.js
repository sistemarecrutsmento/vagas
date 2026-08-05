// ===== modals.js =====
// Injeta os modais de login e cadastro em todas as páginas
// Garante que abrirModal('login') e abrirModal('cad') funcionem em qualquer lugar

(function() {
  // CSS mínimo dos modais (caso a página não tenha)
  if (!document.getElementById('modals-shared-css')) {
    const style = document.createElement('style');
    style.id = 'modals-shared-css';
    style.textContent = `
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
      .modal-overlay.aberto { display: flex; }
      .modal { background: white; border-radius: 12px; max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
      .modal-large { max-width: 680px; }
      .modal-xlarge { max-width: 980px; }
      .modal-header { padding: 20px 24px; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; gap: 12px; }
      .modal-header h2 { font-size: 20px; color: #722F37; margin: 0; flex: 1; }
      .modal-close { background: transparent; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0 8px; line-height: 1; }
      .modal-close:hover { color: #722F37; }
      .modal-body { padding: 24px; }
      .form-group { margin-bottom: 16px; }
      .form-group label { display: block; font-size: 14px; font-weight: 600; color: #222; margin-bottom: 6px; }
      .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 15px; font-family: inherit; }
      .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #722F37; }
      .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
      .btn { padding: 10px 16px; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; }
      .btn-primary { background: #722F37; color: white; }
      .btn-primary:hover { background: #5C252C; }
      .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .btn-secondary { background: white; color: #722F37; border: 1px solid #722F37; }
      .btn-secondary:hover { background: #fdf2f3; }
      .info-box { background: #fdf2f3; border-left: 4px solid #722F37; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; color: #5C252C; }
      .check-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
      .check-label input { width: auto !important; }
      .wizard-progresso { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
      .wizard-passo { font-size: 12px; color: #999; padding: 4px 10px; border-radius: 12px; background: #f5f5f7; }
      .wizard-passo.ativo { background: #722F37; color: white; }
      .wizard-titulo { font-size: 18px; color: #222; margin: 0 0 8px 0; }
      .wizard-subtitulo { font-size: 14px; color: #666; margin: 0 0 20px 0; }
      .wizard-botoes { display: flex; gap: 12px; justify-content: space-between; margin-top: 24px; }
      .wizard-botoes .btn { flex: 1; }
      .muted { color: #999; font-size: 14px; text-align: center; padding: 12px; }
    `;
    document.head.appendChild(style);
  }

  // HTML do modal de login
  const loginHTML = `
<div class="modal-overlay" id="modal-login">
  <div class="modal">
    <div class="modal-header">
      <h2>Entrar</h2>
      <button class="modal-close" onclick="fecharModal('login')">×</button>
    </div>
    <div class="modal-body">
      <div class="step" id="login-etapa-1">
        <div class="info-box">Acesse sua conta com e-mail e senha.</div>
        <div class="form-group"><label>Seu e-mail</label><input type="email" id="login-email" autocomplete="email"></div>
        <div class="form-group"><label>Senha</label><input type="password" id="login-senha" autocomplete="current-password"></div>
        <button class="btn btn-primary" onclick="loginEntrar(this)">Entrar</button>
      </div>
      <div class="step" id="login-etapa-2" style="display:none !important"></div>
      <p style="text-align:center;margin-top:16px;font-size:14px;">
        Não tem conta? <a href="#" onclick="fecharModal('login');abrirModal('cad');return false;" style="color:#722F37;font-weight:600;">Cadastre-se</a>
      </p>
    </div>
  </div>
</div>`;

  // HTML do modal de cadastro (wizard)
  const cadHTML = `
<div class="modal-overlay" id="modal-cad">
  <div class="modal modal-large">
    <div class="modal-header">
      <div style="flex:1">
        <h2 id="cad-titulo">Cadastre-se</h2>
        <div class="wizard-progresso" id="wizard-progresso">
          <div class="wizard-passo ativo" data-p="1"><span>1</span> Conta</div>
          <div class="wizard-passo" data-p="2"><span>2</span> Dados pessoais</div>
          <div class="wizard-passo" data-p="3"><span>3</span> Endereço</div>
          <div class="wizard-passo" data-p="4"><span>4</span> Escolaridade</div>
          <div class="wizard-passo" data-p="5"><span>5</span> Experiência</div>
        </div>
      </div>
      <button class="modal-close" onclick="fecharModal('cad')">×</button>
    </div>
    <div class="modal-body">
      <div class="wizard-etapa" id="wizard-etapa-1">
        <h3 class="wizard-titulo">Crie sua conta</h3>
        <p class="wizard-subtitulo">É rápido e gratuito. Você poderá se candidatar às vagas imediatamente.</p>
        <div class="form-group"><label>E-mail *</label><input type="email" id="w1-email" placeholder="seu@email.com" autocomplete="email"></div>
        <div class="form-group"><label>Senha * (mínimo 6 caracteres)</label><input type="password" id="w1-senha" placeholder="••••••" minlength="6" autocomplete="new-password"></div>
        <div class="form-group"><label>Confirme sua senha *</label><input type="password" id="w1-senha-conf" placeholder="••••••" minlength="6" autocomplete="new-password"></div>
        <div class="wizard-botoes">
          <button class="btn btn-primary" onclick="wizardProximo()">Continuar</button>
        </div>
      </div>

      <div class="wizard-etapa" id="wizard-etapa-2" style="display:none !important">
        <h3 class="wizard-titulo">Dados pessoais</h3>
        <p class="wizard-subtitulo">Essas informações ajudam os recrutadores a te conhecer melhor.</p>
        <div class="form-group"><label>Nome completo *</label><input type="text" id="w2-nome" autocomplete="name"></div>
        <div class="form-row">
          <div class="form-group"><label>CPF *</label><input type="text" id="w2-cpf" placeholder="000.000.000-00" maxlength="14"></div>
          <div class="form-group"><label>Data de nascimento *</label><input type="date" id="w2-nascimento"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Sexo *</label>
            <select id="w2-sexo">
              <option value="">Selecione...</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div class="form-group"><label>Número do celular *</label><input type="tel" id="w2-celular" placeholder="(00) 00000-0000"></div>
        </div>
        <div class="form-group">
          <label>Precisa de acessibilidade?</label>
          <select id="w2-acessibilidade">
            <option value="">Não</option>
            <option value="cadeirante">Cadeirante</option>
            <option value="deficiencia_visual">Deficiência visual</option>
            <option value="deficiencia_auditiva">Deficiência auditiva</option>
            <option value="mobilidade_reduzida">Mobilidade reduzida</option>
            <option value="outra">Outra</option>
          </select>
        </div>
        <div class="form-group">
          <label>Áreas de interesse <span style="font-weight:400;color:#888;font-size:12px;margin-left:6px;">(escolha até 5)</span></label>
          <div id="w2-areas" class="areas-chips"></div>
          <div id="w2-areas-contador" style="margin-top:6px;font-size:12px;color:#666;">0 de 5 selecionadas</div>
        </div>
        <div class="form-group">
          <label class="check-label"><input type="checkbox" id="w2-politica" required> Li e aceito a <a href="#" onclick="alert('Política de privacidade');return false;" style="color:var(--vinho);font-weight:600;">Política de privacidade</a></label>
        </div>
        <div class="form-group">
          <label class="check-label"><input type="checkbox" id="w2-comunicacoes"> Desejo receber comunicações sobre novas vagas e atualizações.</label>
        </div>
        <div class="form-group">
          <label class="check-label"><input type="checkbox" id="w2-banco"> Autorizo manter meu perfil no Banco de Talentos por 24 meses para futuras oportunidades.</label>
        </div>
        <div class="form-group">
          <label>Sobre você <span style="font-weight:500;color:#374151;font-size:12px;">(fale um pouco sobre você, seus objetivos, qualificações…)</span></label>
          <textarea id="w2-sobre-voce" rows="4" placeholder="Ex: Sou uma pessoa comunicativa, busco minha primeira oportunidade na área administrativa..." style="resize:vertical;"></textarea>
        </div>
        <div class="wizard-botoes">
          <button class="btn btn-secondary" onclick="wizardVoltar()">Voltar</button>
          <button class="btn btn-primary" onclick="wizardProximo()">Continuar</button>
        </div>
      </div>

      <div class="wizard-etapa" id="wizard-etapa-3" style="display:none !important">
        <h3 class="wizard-titulo">Endereço</h3>
        <p class="wizard-subtitulo">Para encontrar vagas perto de você.</p>
        <div class="form-row">
          <div class="form-group"><label>CEP</label><input type="text" id="w3-cep" placeholder="00000-000" maxlength="9"></div>
          <div class="form-group"><label>Cidade *</label><input type="text" id="w3-cidade"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>UF *</label><input type="text" id="w3-estado" maxlength="2" placeholder="BA"></div>
          <div class="form-group"><label>Bairro</label><input type="text" id="w3-bairro"></div>
        </div>
        <div class="form-group"><label>Logradouro</label><input type="text" id="w3-logradouro" placeholder="Rua, avenida..."></div>
        <div class="form-row">
          <div class="form-group"><label>Número</label><input type="text" id="w3-numero"></div>
          <div class="form-group"><label>Complemento</label><input type="text" id="w3-complemento"></div>
        </div>
        <div class="wizard-botoes">
          <button class="btn btn-secondary" onclick="wizardVoltar()">Voltar</button>
          <button class="btn btn-primary" onclick="wizardProximo()">Continuar</button>
        </div>
      </div>

      <div class="wizard-etapa" id="wizard-etapa-4" style="display:none !important">
        <h3 class="wizard-titulo">Escolaridade</h3>
        <p class="wizard-subtitulo">Conte sobre sua formação.</p>
        <div class="form-group">
          <label>Formação *</label>
          <select id="w4-formacao">
            <option value="">Selecione...</option>
            <option value="fundamental">Ensino Fundamental</option>
            <option value="medio">Ensino Médio</option>
            <option value="tecnico">Ensino Técnico</option>
            <option value="superior">Ensino Superior</option>
            <option value="pos">Pós-graduação</option>
            <option value="mestrado">Mestrado</option>
            <option value="doutorado">Doutorado</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Instituição</label><input type="text" id="w4-instituicao" placeholder="Nome da escola/faculdade"></div>
          <div class="form-group"><label>Curso</label><input type="text" id="w4-curso" placeholder="Ex: Administração"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Situação</label>
            <select id="w4-situacao">
              <option value="">Selecione...</option>
              <option value="concluido">Concluído</option>
              <option value="cursando">Cursando</option>
              <option value="trancado">Trancado</option>
            </select>
          </div>
          <div class="form-group"><label>Data de conclusão</label><input type="date" id="w4-conclusao"></div>
        </div>
        <div class="wizard-botoes">
          <button class="btn btn-secondary" onclick="wizardVoltar()">Voltar</button>
          <button class="btn btn-primary" onclick="wizardProximo()">Continuar</button>
        </div>
      </div>

      <div class="wizard-etapa" id="wizard-etapa-5" style="display:none !important">
        <h3 class="wizard-titulo">Experiência profissional</h3>
        <p class="wizard-subtitulo">Adicione suas últimas experiências. Você pode pular se preferir.</p>
        <div class="form-group">
          <label class="check-label"><input type="checkbox" id="w5-primeiro-emprego" onchange="aplicarPrimeiroEmprego()"> Este é meu primeiro emprego (sem experiência anterior)</label>
        </div>
        <div id="w5-lista"><p class="muted">Nenhuma experiência adicionada ainda.</p></div>
        <div class="exp-form" id="w5-exp-form">
          <h4>+ Nova experiência</h4>
          <div class="form-row">
            <div class="form-group"><label>Cargo *</label><input type="text" id="w5-cargo" placeholder="Ex: Auxiliar administrativo"></div>
            <div class="form-group"><label>Empresa *</label><input type="text" id="w5-empresa" placeholder="Nome da empresa"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Início</label><input type="date" id="w5-inicio"></div>
            <div class="form-group"><label>Término</label><input type="date" id="w5-fim"></div>
          </div>
          <div class="form-group">
            <label class="check-label"><input type="checkbox" id="w5-atual"> Emprego atual</label>
          </div>
          <div class="form-group"><label>Atividades exercidas</label><textarea id="w5-descricao" rows="2" placeholder="Descreva brevemente suas atividades"></textarea></div>
          <div class="exp-acoes">
            <button class="btn btn-secondary" type="button" onclick="wizardAddExperiencia()">+ Adicionar</button>
          </div>
        </div>
        <div class="wizard-botoes">
          <button class="btn btn-secondary" onclick="wizardVoltar()">Voltar</button>
          <button class="btn btn-primary" onclick="wizardFinalizar()">Finalizar cadastro</button>
        </div>
      </div>
    </div>
  </div>
</div>`;

  // Insere os modais (só se ainda não existirem)
  function inject() {
    if (!document.getElementById('modal-login')) {
      const div = document.createElement('div');
      div.innerHTML = loginHTML;
      document.body.appendChild(div.firstElementChild);
    }
    if (!document.getElementById('modal-cad')) {
      const div = document.createElement('div');
      div.innerHTML = cadHTML;
      document.body.appendChild(div.firstElementChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // Listener do "primeiro emprego" (chama de novo sempre que o modal for injetado)
  document.addEventListener('change', e => {
    if (e.target && e.target.id === 'w5-primeiro-emprego' && window.aplicarPrimeiroEmprego) {
      window.aplicarPrimeiroEmprego();
    }
  });

  // ===== MODAL DE NOTIFICAÇÕES =====
  // Substitui o alert('Sem notificações no momento') por um modal profissional.
  // Mostra: aguardando ação do candidato (cards urgentes) + timeline mesclada.
  if (!document.getElementById('modals-notif-css')) {
    const notifCss = document.createElement('style');
    notifCss.id = 'modals-notif-css';
    notifCss.textContent = `
      /* ===== NOTIFICAÇÕES — visual profissional ===== */
      .notif-tabs {
        display: flex;
        gap: 0;
        padding: 0 24px;
        border-bottom: 1px solid #e0e0e0;
        background: #fafafa;
      }
      .notif-tab {
        padding: 14px 18px;
        font-size: 14px;
        font-weight: 600;
        color: #888;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: color 0.15s, border-color 0.15s;
      }
      .notif-tab:hover { color: #722F37; }
      .notif-tab.ativo {
        color: #722F37;
        border-bottom-color: #722F37;
      }
      .notif-tab-badge {
        background: #c62828;
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
        line-height: 1.4;
      }
      .notif-body {
        padding: 0;
        max-height: 60vh;
        overflow-y: auto;
        background: #fafafa;
      }
      .notif-section-titulo {
        padding: 18px 24px 10px;
        font-size: 11px;
        font-weight: 700;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .notif-card {
        background: white;
        margin: 0 16px 10px;
        padding: 16px;
        border-radius: 10px;
        border: 1px solid #ececec;
        display: flex;
        gap: 14px;
        align-items: flex-start;
        transition: box-shadow 0.15s, transform 0.1s;
      }
      .notif-card:hover {
        box-shadow: 0 4px 14px rgba(0,0,0,0.06);
        transform: translateY(-1px);
      }
      .notif-card-icone {
        font-size: 22px;
        width: 44px;
        height: 44px;
        background: #fdf2f3;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .notif-card.urgente .notif-card-icone {
        background: #ffebee;
        box-shadow: 0 0 0 4px rgba(198,40,40,0.08);
      }
      .notif-card-conteudo { flex: 1; min-width: 0; }
      .notif-card-titulo {
        font-size: 15px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 4px 0;
      }
      .notif-card-vaga {
        font-size: 12px;
        color: #722F37;
        font-weight: 600;
        background: #fdf2f3;
        padding: 2px 8px;
        border-radius: 10px;
        display: inline-block;
        margin-bottom: 6px;
      }
      .notif-card-desc {
        font-size: 13px;
        color: #555;
        line-height: 1.5;
        margin: 0 0 10px 0;
      }
      .notif-card-link {
        font-size: 13px;
        color: #722F37;
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .notif-card-link:hover { text-decoration: underline; }

      /* Timeline */
      .notif-timeline {
        padding: 8px 16px 18px;
        position: relative;
      }
      .notif-timeline-item {
        display: flex;
        gap: 12px;
        padding: 12px 0;
        position: relative;
      }
      .notif-timeline-item:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 17px;
        top: 36px;
        bottom: -12px;
        width: 2px;
        background: #ececec;
      }
      .notif-timeline-icone {
        width: 36px;
        height: 36px;
        background: white;
        border: 2px solid #ececec;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
        z-index: 1;
      }
      .notif-timeline.contratado .notif-timeline-icone {
        border-color: #2E7D32;
        background: #E8F5E9;
      }
      .notif-timeline.rejeitado .notif-timeline-icone {
        border-color: #C62828;
        background: #FFEBEE;
      }
      .notif-timeline-conteudo {
        flex: 1;
        min-width: 0;
      }
      .notif-timeline-titulo {
        font-size: 14px;
        color: #1a1a1a;
        font-weight: 500;
        margin: 0 0 2px 0;
      }
      .notif-timeline-titulo strong { font-weight: 700; }
      .notif-timeline-meta {
        font-size: 12px;
        color: #888;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .notif-timeline-vaga {
        color: #722F37;
        font-weight: 600;
      }
      .notif-timeline-data::before { content: '·'; margin-right: 8px; color: #ccc; }

      /* Vazio */
      .notif-vazio {
        padding: 60px 24px;
        text-align: center;
        color: #888;
      }
      .notif-vazio-icone {
        font-size: 56px;
        opacity: 0.35;
        margin-bottom: 12px;
      }
      .notif-vazio-titulo {
        font-size: 17px;
        font-weight: 600;
        color: #555;
        margin: 0 0 6px;
      }
      .notif-vazio-sub {
        font-size: 14px;
        color: #999;
        margin: 0;
      }

      /* Loading */
      .notif-loading {
        padding: 60px 24px;
        text-align: center;
        color: #888;
      }
      .notif-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #ececec;
        border-top-color: #722F37;
        border-radius: 50%;
        margin: 0 auto 12px;
        animation: notif-spin 0.8s linear infinite;
      }
      @keyframes notif-spin { to { transform: rotate(360deg); } }

      .notif-rodape {
        padding: 12px 24px;
        border-top: 1px solid #e0e0e0;
        background: #fafafa;
        text-align: right;
        font-size: 12px;
        color: #888;
      }
    `;
    document.head.appendChild(notifCss);
  }

  const notifHTML = `
<div class="modal-overlay" id="modal-notificacoes">
  <div class="modal modal-xlarge">
    <div class="modal-header">
      <h2>🔔 Notificações</h2>
      <button class="modal-close" onclick="fecharModal('notificacoes')">×</button>
    </div>
    <div class="notif-tabs">
      <button class="notif-tab ativo" data-tab="aguardando" onclick="notifTrocarTab('aguardando', this)">
        ⏰ Aguardando ação <span class="notif-tab-badge" id="notif-badge-aguardando" style="display:none">0</span>
      </button>
      <button class="notif-tab" data-tab="atualizacoes" onclick="notifTrocarTab('atualizacoes', this)">
        📰 Atualizações
      </button>
    </div>
    <div class="notif-body" id="notif-body">
      <div class="notif-loading">
        <div class="notif-spinner"></div>
        <div>Carregando notificações…</div>
      </div>
    </div>
    <div class="notif-rodape" id="notif-rodape"></div>
  </div>
</div>`;

  function injectNotif() {
    if (!document.getElementById('modal-notificacoes')) {
      const div = document.createElement('div');
      div.innerHTML = notifHTML;
      document.body.appendChild(div.firstElementChild);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNotif);
  } else {
    injectNotif();
  }

  // Cache em memória (não precisa re-buscar se abrir 2x em sequência)
  let notifCache = null;

  function notifRenderAguardando(lista) {
    const badge = document.getElementById('notif-badge-aguardando');
    if (lista.length === 0) {
      if (badge) badge.style.display = 'none';
      return `<div class="notif-vazio">
        <div class="notif-vazio-icone">🎉</div>
        <p class="notif-vazio-titulo">Tudo em dia!</p>
        <p class="notif-vazio-sub">Você não tem nenhuma ação pendente agora.</p>
      </div>`;
    }
    if (badge) { badge.textContent = lista.length; badge.style.display = ''; }
    let html = '<div class="notif-section-titulo">⏰ Aguardando ação do candidato</div>';
    lista.forEach(n => {
      html += `
        <div class="notif-card urgente">
          <div class="notif-card-icone">${n.icone || '🔔'}</div>
          <div class="notif-card-conteudo">
            ${n.vaga ? `<span class="notif-card-vaga">${escHtml(n.vaga)}</span>` : ''}
            <p class="notif-card-titulo">${escHtml(n.titulo)}</p>
            <p class="notif-card-desc">${escHtml(n.descricao)}</p>
            <a href="${escAttr(n.link)}" class="notif-card-link" onclick="fecharModal('notificacoes')">${escHtml(n.linkTexto || 'Abrir')} →</a>
          </div>
        </div>`;
    });
    return html;
  }

  function notifRenderAtualizacoes(lista) {
    if (lista.length === 0) {
      return `<div class="notif-vazio">
        <div class="notif-vazio-icone">📭</div>
        <p class="notif-vazio-titulo">Sem atualizações ainda</p>
        <p class="notif-vazio-sub">Quando seu processo seletivo avançar, aparece aqui.</p>
      </div>`;
    }
    let html = '<div class="notif-section-titulo">📰 Histórico dos seus processos</div>';
    html += '<div class="notif-timeline">';
    lista.forEach(n => {
      const cls = n.status === 'contratado' ? 'contratado' : (n.status === 'rejeitado' || n.status === 'reprovado' ? 'rejeitado' : '');
      html += `
        <div class="notif-timeline-item">
          <div class="notif-timeline-icone ${cls}">${n.icone || '📌'}</div>
          <div class="notif-timeline-conteudo">
            <p class="notif-timeline-titulo"><strong>${escHtml(n.vaga)}</strong> — ${escHtml(n.mensagem || (n.acao || 'Atualização'))}</p>
            <div class="notif-timeline-meta">
              <span class="notif-timeline-vaga">${n.status ? statusLabel(n.status) : ''}</span>
              <span class="notif-timeline-data">${notifTempo(n.data)}</span>
              ${n.por ? `<span>por ${escHtml(n.por)}</span>` : ''}
            </div>
          </div>
        </div>`;
    });
    html += '</div>';
    return html;
  }

  function statusLabel(s) {
    return ({
      'em_andamento': 'Em andamento',
      'contratado': '🎉 Contratado',
      'rejeitado': 'Rejeitado',
      'reprovado': 'Reprovado',
      'cancelado': 'Cancelado'
    })[s] || s;
  }

  function notifTempo(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const dia = Math.floor(h / 24);
    if (dia < 7) return `há ${dia}d`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escAttr(s) { return escHtml(s); }

  window.notifTrocarTab = function(tab, btn) {
    document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('ativo'));
    if (btn) btn.classList.add('ativo');
    if (!notifCache) return;
    const body = document.getElementById('notif-body');
    if (!body) return;
    if (tab === 'aguardando') body.innerHTML = notifRenderAguardando(notifCache.aguardando);
    else body.innerHTML = notifRenderAtualizacoes(notifCache.atualizacoes);
  };

  window.abrirModalNotificacoes = async function() {
    fecharDrawer();
    // Abre o modal com loading
    const overlay = document.getElementById('modal-notificacoes');
    if (!overlay) return;
    overlay.classList.add('aberto');
    const body = document.getElementById('notif-body');
    body.innerHTML = `<div class="notif-loading"><div class="notif-spinner"></div><div>Carregando notificações…</div></div>`;
    const rodape = document.getElementById('notif-rodape');
    if (rodape) rodape.textContent = '';

    // Reseta tab ativa
    document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('ativo'));
    const tabAg = document.querySelector('.notif-tab[data-tab="aguardando"]');
    if (tabAg) tabAg.classList.add('ativo');

    // Busca
    const token = localStorage.getItem('candidato_token');
    if (!token) {
      body.innerHTML = `<div class="notif-vazio">
        <div class="notif-vazio-icone">🔒</div>
        <p class="notif-vazio-titulo">Você precisa estar logado</p>
        <p class="notif-vazio-sub">Faça login para ver suas notificações.</p>
      </div>`;
      return;
    }
    try {
      const r = await fetch('https://recrutamento-api-novo.onrender.com/api/notificacoes?limit=50', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const raw = await r.json();
      if (!r.ok) throw new Error(raw.erro || 'Erro ' + r.status);
      const notificacoes = Array.isArray(raw.notificacoes) ? raw.notificacoes : [];
      // O endpoint antigo foi substituído pelo feed unificado. Mantemos o
      // modal compatível, separando proposta recebida (ação pendente) do
      // restante do histórico real, sem inventar dados.
      const aguardando = notificacoes.filter(n => n.tipo === 'proposta_enviada').map(n => ({
        icone: '📨',
        vaga: n.mensagem || '',
        titulo: n.titulo || 'Nova proposta recebida',
        descricao: 'Abra sua candidatura para visualizar e responder.',
        link: n.referencia_id ? 'candidatura.html?id=' + encodeURIComponent(n.referencia_id) : 'candidaturas.html',
        linkTexto: 'Ver proposta'
      }));
      const atualizacoes = notificacoes.filter(n => n.tipo !== 'proposta_enviada').map(n => ({
        icone: '📌',
        vaga: n.titulo || 'Atualização do processo',
        mensagem: n.mensagem || n.titulo || 'Nova atualização',
        data: n.criada_em,
        status: ''
      }));
      notifCache = { aguardando, atualizacoes };
      const tabAtualizacoes = document.querySelector('.notif-tab[data-tab="atualizacoes"]');
      if (aguardando.length) {
        body.innerHTML = notifRenderAguardando(aguardando);
      } else {
        if (tabAtualizacoes) tabAtualizacoes.classList.add('ativo');
        const tabAguardando = document.querySelector('.notif-tab[data-tab="aguardando"]');
        if (tabAguardando) tabAguardando.classList.remove('ativo');
        body.innerHTML = notifRenderAtualizacoes(atualizacoes);
      }
      if (rodape) rodape.textContent = `${notificacoes.length} notificação(ões) · Atualizado agora`;
    } catch (e) {
      body.innerHTML = `<div class="notif-vazio">
        <div class="notif-vazio-icone">⚠️</div>
        <p class="notif-vazio-titulo">Não foi possível carregar</p>
        <p class="notif-vazio-sub">${escHtml(e.message)}</p>
      </div>`;
    }
  };
})();
