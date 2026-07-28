// Vagas.io — Analytics Client v1 (Fase 14)
// Fire-and-forget: erros NUNCA bloqueiam o fluxo principal.
(function() {
  'use strict';

  const API = 'https://recrutamento-api-novo.onrender.com';

  /**
   * Registra um evento de analytics de forma não-bloqueante.
   * @param {string} evento  — nome do evento (deve estar na lista permitida)
   * @param {object} [opts]  — vaga_id, candidatura_id, sessao_id, metadata
   */
  function track(evento, opts) {
    opts = opts || {};
    if (typeof fetch !== 'function') return;

    var body = { evento: evento };
    if (opts.vaga_id)        body.vaga_id        = opts.vaga_id;
    if (opts.candidatura_id) body.candidatura_id = opts.candidatura_id;
    if (opts.sessao_id)      body.sessao_id      = opts.sessao_id;
    if (opts.anonimo_id)     body.anonimo_id     = opts.anonimo_id;
    if (opts.metadata)       body.metadata       = opts.metadata;

    // Token do candidato ou empresa (jamais enviado em metadata)
    var token = localStorage.getItem('candidato_token')
             || localStorage.getItem('empresa_token');
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    fetch(API + '/api/analytics/eventos', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    }).catch(function() { /* silencioso — nunca bloqueia o fluxo */ });
  }

  // Expõe globalmente
  window.vagiasTrack = track;
})();
