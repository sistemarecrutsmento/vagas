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
          <label>Áreas de interesse <span style="font-weight:400;color:var(--cinza);font-size:12px;">(escolha até 5)</span></label>
          <div id="w2-areas" class="areas-chips"></div>
          <div id="w2-areas-contador" style="margin-top:6px;font-size:12px;color:var(--cinza);">0 de 5 selecionadas</div>
        </div>
        <div class="form-group">
          <label class="check-label"><input type="checkbox" id="w2-politica" required> Li e aceito a <a href="#" onclick="alert('Política de privacidade');return false;" style="color:var(--vinho);font-weight:600;">Política de privacidade</a></label>
        </div>
        <div class="form-group">
          <label class="check-label"><input type="checkbox" id="w2-banco"> Autorizo manter meu perfil no Banco de Talentos por 24 meses para futuras oportunidades.</label>
        </div>
        <div class="form-group">
          <label>Sobre você <span style="font-weight:400;color:var(--cinza);font-size:12px;">(opcional, mas ajuda muito — fale um pouco sobre você, seus objetivos e o que te motiva)</span></label>
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
})();
