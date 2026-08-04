/* Preview visual do antigo Admin — sem login/token e sem gravação real. */
(function () {
  'use strict';
  window.__ADMIN_PREVIEW__ = true;
  // O token é somente virtual nesta aba; nada é salvo no navegador.
  const nativeGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key) {
    if (key === 'admin_token') return 'preview-mode';
    return nativeGetItem.call(this, key);
  };
  const realFetch = window.fetch.bind(window);

  const candidatos = [
    { id: 363, candidatura_id: 225, candidato_id: 363, candidato_nome: 'Mariana Oliveira', nome: 'Mariana Oliveira', email: 'mariana.demo@example.com', vaga_titulo: 'Analista de Recursos Humanos', titulo: 'Analista de Recursos Humanos', status: 'em_andamento', etapa_atual: 2, cidade: 'Ribeirão Preto', estado: 'SP', criada_em: '2026-07-28T10:00:00Z' },
    { id: 364, candidatura_id: 226, candidato_id: 364, candidato_nome: 'Lucas Santos', nome: 'Lucas Santos', email: 'lucas.demo@example.com', vaga_titulo: 'Assistente Administrativo', titulo: 'Assistente Administrativo', status: 'em_andamento', etapa_atual: 3, cidade: 'Sertãozinho', estado: 'SP', criada_em: '2026-07-29T14:30:00Z' },
    { id: 365, candidatura_id: 227, candidato_id: 365, candidato_nome: 'Ana Paula Costa', nome: 'Ana Paula Costa', email: 'ana.demo@example.com', vaga_titulo: 'Analista de Recursos Humanos', titulo: 'Analista de Recursos Humanos', status: 'em_andamento', etapa_atual: 4, cidade: 'Ribeirão Preto', estado: 'SP', criada_em: '2026-07-30T09:15:00Z' }
  ];
  const vagas = [
    { id: 407, titulo: 'Analista de Recursos Humanos', empresa: 'VagasIO Demo', cidade: 'Ribeirão Preto', estado: 'SP', area: 'Recursos Humanos', status: 'publicada', total_geral: 2, em_analise: 2, contratados: 0, reprovados: 0 },
    { id: 408, titulo: 'Assistente Administrativo', empresa: 'VagasIO Demo', cidade: 'Sertãozinho', estado: 'SP', area: 'Administrativo', status: 'publicada', total_geral: 1, em_analise: 1, contratados: 0, reprovados: 0 },
    { id: 409, titulo: 'Coordenador de Operações', empresa: 'VagasIO Demo', cidade: 'Ribeirão Preto', estado: 'SP', area: 'Operações', status: 'pausada', total_geral: 0, em_analise: 0, contratados: 0, reprovados: 0 }
  ];
  const agora = Date.now();
  const entrevistas = [
    { id: 1, candidatura_id: 226, candidato_nome: 'Lucas Santos', vaga_titulo: 'Assistente Administrativo', etapa: 3, data_hora: new Date(agora + 86400000).toISOString(), status: 'agendada', tipo: 'online', link_reuniao: 'https://meet.google.com/preview-demo' },
    { id: 2, candidatura_id: 227, candidato_nome: 'Ana Paula Costa', vaga_titulo: 'Analista de Recursos Humanos', etapa: 4, data_hora: new Date(agora + 172800000).toISOString(), status: 'confirmada', tipo: 'presencial' }
  ];

  const candidatura = c => ({
    id: c.candidatura_id || c.id,
    candidato_id: c.candidato_id || c.id,
    vaga_id: c.vaga_id || 407,
    status: c.status || 'em_andamento',
    etapa_atual: Number(c.etapa_atual || 2),
    candidato: { id: c.candidato_id || c.id, nome: c.candidato_nome || c.nome, email: c.email, cidade: c.cidade, estado: c.estado, telefone: '(16) 99999-0000', sobre_voce: 'Profissional com experiência e interesse em crescer junto com a equipe.' },
    vaga: { id: c.vaga_id || 407, titulo: c.vaga_titulo || c.titulo, empresa: 'VagasIO Demo', etapas: [{nome:'Inscrição'},{nome:'Triagem'},{nome:'RH'},{nome:'Gestor'},{nome:'Proposta'},{nome:'Coleta de Documentos'},{nome:'Contratação'}] },
    historico: [{ etapa: 0, status: 'inscrito', comentario: 'Candidatura recebida', criado_em: c.criada_em || new Date().toISOString() }, { etapa: Number(c.etapa_atual || 2), status: 'em_andamento', comentario: 'Candidato em avaliação', criado_em: new Date().toISOString() }],
    entrevistas: entrevistas.filter(e => e.candidatura_id === (c.candidatura_id || c.id)),
    documentos: [],
    proposta: null
  });

  function response(data, status) {
    return new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const nome = document.getElementById('aside-user-nome');
    const email = document.getElementById('aside-user-empresa');
    const avatar = document.getElementById('aside-user-avatar');
    if (nome) nome.textContent = 'Fabio Júnior';
    if (email) email.textContent = 'Modo visual';
    if (avatar) avatar.textContent = 'FJ';
  });

  window.fetch = async function (input, options) {
    const raw = typeof input === 'string' ? input : input.url;
    if (!raw || !raw.includes('/api/admin/')) return realFetch(input, options);
    const u = new URL(raw, location.href);
    const path = u.pathname;
    const id = Number((path.match(/\/(?:candidatura|candidatos|vagas)\/(\d+)/) || [])[1] || 0);
    if (path.endsWith('/login')) return response({ token: 'preview-mode', usuario: { nome: 'Fabio Júnior', email: 'preview@vagasio.com.br' } });
    if (path.endsWith('/dashboard')) return response({ admin: { nome: 'Fabio Júnior', email: 'preview@vagasio.com.br' }, kpis: { vagas_ativas: 2, total_candidatos: 3, processos_ativos: 3, entrevistas_agendadas: 2, candidatos_novos_7d: 3, deltas: { vagas: 12, candidatos: 25, processos: 18, entrevistas: 8 } }, etapas: {1:3,2:2,3:1,4:1,5:0,6:0,7:0}, etapas_labels:['Inscrição','Triagem','RH','Gestor','Proposta','Coleta Docs','Contratação'], conversao:{ atual: 18, historico:[8,10,12,14,16,18] }, proximas_entrevistas: entrevistas, vagas_mais_candidatos: vagas.slice(0,2).map(v=>({...v,total_candidatos:v.total_geral})), atividades_recentes:[{texto:'inscricao',candidato:'Mariana Oliveira',vaga:'Analista de Recursos Humanos',quando:new Date(agora-3600000).toISOString()},{texto:'avancar',candidato:'Lucas Santos',vaga:'Assistente Administrativo',quando:new Date(agora-7200000).toISOString()},{texto:'entrevista',candidato:'Ana Paula Costa',vaga:'Analista de Recursos Humanos',quando:new Date(agora-10800000).toISOString()}], kpis_secundarios:{taxa_documentacao:62,tempo_medio_contratacao:18,taxa_aprovacao:34,taxa_desligamento:4,vagas_encerradas:1,empresas_ativas:4} });
    if (path.endsWith('/vagas-com-candidaturas')) return response({ vagas: vagas.filter(v => v.total_geral > 0) });
    if (/\/vagas\/\d+\/candidaturas$/.test(path)) { const vid = id || 407; return response({ vaga: vagas.find(v=>v.id===vid) || vagas[0], candidaturas: candidatos.filter(c => (vid===407 ? c.vaga_titulo.includes('Recursos') : true)) }); }
    if (path.endsWith('/vagas')) return response({ vagas });
    if (path.endsWith('/candidatos')) return response({ candidatos, total: candidatos.length });
    if (path.endsWith('/equipe')) return response({ recrutadores:[{id:1,nome:'Fabio Júnior',email:'preview@vagasio.com.br',ativo:true}], empresas:[{id:1,nome:'VagasIO Demo',email_principal:'preview@vagasio.com.br',qtd_vagas:3}], empresaUsuarios:[] });
    if (path.endsWith('/entrevistas')) return response({ entrevistas });
    if (path.includes('/candidatura/')) { const c = candidatos.find(x => (x.candidatura_id || x.id) === id) || candidatos[0]; return response({ candidatura: candidatura(c) }); }
    if (path.includes('/entrevista') || path.includes('/documento') || path.includes('/status')) return response({ ok: true, preview: true });
    return response({ ok: true, preview: true });
  };
})();
