/* Certus Academy V1 — guides only. Real video lessons and approved product captures can be attached in a later content release. */
window.CERTUS_ACADEMY_DATA = [
  {
    id: 'primeiro-acesso', image: './assets/academy/gestao-desktop.png', imageAlt: 'Tela de visão geral do Portal de Gestão', category: 'Primeiros passos', title: 'Entrar e conhecer o Portal de Gestão',
    summary: 'Entenda o acesso individual e como localizar os módulos disponíveis ao seu perfil.', audience: ['Administrador titular', 'Gerente', 'RH', 'Supervisor'], minutes: 3,
    flow: ['Entre com sua conta', 'Confira seu perfil', 'Abra o módulo'],
    sections: [
      { title: 'Antes de começar', text: ['Tenha o endereço do portal e a conta individual que a empresa liberou para você. Gestores entram com e-mail e senha; o identificador da academia é usado no Portal do Colaborador, não no acesso de gestão.'] },
      { title: 'Passo a passo', steps: [
        ['Acesse o portal', 'Abra a página do Certus e informe o e-mail e a senha da sua própria conta.'],
        ['Confira quem está conectado', 'No cabeçalho, confirme o nome da empresa e o seu perfil. O menu e as ações disponíveis mudam conforme as permissões da conta.'],
        ['Use o menu lateral', 'Escolha o módulo que quer consultar. Em telas menores, use o botão de menu para abrir a navegação e feche-a depois de selecionar uma área.']
      ]},
      { title: 'Importante', note: 'Não compartilhe sua senha. Se uma opção não aparecer, peça ao administrador titular para conferir o perfil e as filiais autorizadas da sua conta.' }
    ]
  },
  {
    id: 'cadastro-funcionario', image: './assets/academy/tour-funcionarios.png', imageAlt: 'Tela de Funcionários', category: 'Pessoas e acessos', title: 'Cadastrar um funcionário',
    summary: 'Inclua a pessoa na empresa e confira a filial, o departamento e a jornada vinculada.', audience: ['Administrador titular', 'RH'], minutes: 5,
    flow: ['Funcionários', 'Novo cadastro', 'Revise o vínculo'],
    sections: [
      { title: 'Quem pode cadastrar', text: ['O cadastro de funcionários está disponível para o administrador titular e para o perfil de RH. Confira os dados fornecidos pela empresa antes de salvar.'] },
      { title: 'Passo a passo', steps: [
        ['Abra Funcionários', 'No menu do Portal de Gestão, entre em Funcionários e toque em Novo cadastro.'],
        ['Preencha os dados solicitados', 'Informe os dados do cadastro nos campos apresentados. Evite criar uma segunda ficha para uma pessoa que já aparece na busca.'],
        ['Revise os vínculos', 'Selecione a filial e, quando aplicável, o departamento e a jornada corretos. A lista disponível depende dos cadastros da empresa e das suas permissões.'],
        ['Salve e confira a lista', 'Depois de salvar, localize o nome na tabela e confirme filial, jornada e status. Para acesso ao portal, use a ação Criar acesso se ela estiver disponível.']
      ]},
      { title: 'Dica', note: 'A ficha do funcionário e a conta de acesso ao portal são itens relacionados, mas não são a mesma coisa. Confira se o colaborador realmente precisa de acesso antes de criar uma conta.' }
    ]
  },
  {
    id: 'acesso-colaborador', image: './assets/academy/tour-acessos.png', imageAlt: 'Tela de acessos de funcionários', category: 'Pessoas e acessos', title: 'Liberar acesso ao Portal do Colaborador',
    summary: 'Crie ou confira a conta individual vinculada ao cadastro do funcionário.', audience: ['Administrador titular', 'RH'], minutes: 4,
    flow: ['Localize a ficha', 'Criar acesso', 'Confira o vínculo'],
    sections: [
      { title: 'Passo a passo', steps: [
        ['Localize a ficha do funcionário', 'Abra Funcionários e pesquise pelo nome ou matrícula. Confira que a pessoa ainda não tem acesso ativo.'],
        ['Inicie a criação do acesso', 'Na linha da pessoa, selecione Criar acesso. Se a ação não aparecer, confirme seu perfil e se o funcionário já tem uma conta vinculada.'],
        ['Revise as informações', 'Confira os campos e o vínculo com o funcionário antes de confirmar. Siga as instruções apresentadas pelo próprio portal para entregar o primeiro acesso com segurança.'],
        ['Confirme o resultado', 'Volte à lista de funcionários e verifique a coluna Acesso ao portal. A pessoa deve usar as próprias credenciais no Portal do Colaborador.']
      ]},
      { title: 'Segurança', note: 'Não envie senha em grupo nem publique credenciais. Se precisar redefinir um acesso, use a função de gestão autorizada e entregue a senha inicial por um canal seguro.' }
    ]
  },
  {
    id: 'jornadas', image: './assets/academy/tour-jornadas.png', imageAlt: 'Tela de jornadas', category: 'Jornadas e escalas', title: 'Configurar uma jornada por dia da semana',
    summary: 'Cadastre horários diários, intervalos e confira a carga líquida semanal antes de atribuir a jornada.', audience: ['Administrador titular', 'RH'], minutes: 6,
    flow: ['Jornadas', 'Horários por dia', 'Revise a carga semanal'],
    sections: [
      { title: 'Passo a passo', steps: [
        ['Abra Jornadas', 'No menu, entre em Jornadas e selecione Nova jornada. Dê um nome que ajude a equipe a identificar o grupo ou turno.'],
        ['Configure cada dia', 'Para cada dia de trabalho, informe início, término e intervalo. Desmarque Dia de trabalho nos dias de descanso. O sistema aceita horários distintos por dia.'],
        ['Confira as regras aplicáveis', 'Revise o enquadramento noturno e a regra de compensação/banco de horas com base nos documentos vigentes da empresa. Não use o sistema para presumir uma exceção legal ou coletiva.'],
        ['Revise a prévia', 'Confira a carga semanal líquida calculada e corrija horários ou intervalos inconsistentes antes de salvar.'],
        ['Atribua com cuidado', 'Depois de salvar, vincule a jornada somente às pessoas e filiais para as quais ela foi conferida.']
      ]},
      { title: 'Atenção', note: 'A prévia é uma conferência de cadastro, não uma validação jurídica do contrato. Confirme jornada, descansos e instrumentos aplicáveis com o RH responsável.' }
    ]
  },
  {
    id: 'terminal-compartilhado', image: './assets/academy/tour-terminal-compartilhado.png', imageAlt: 'Terminal compartilhado', category: 'Registro de ponto', title: 'Preparar e usar o terminal compartilhado',
    summary: 'Confira autorização do aparelho e filial antes de iniciar as marcações no terminal.', audience: ['Administrador titular', 'RH', 'Colaborador'], minutes: 4,
    flow: ['Autorize o aparelho', 'Vincule a filial', 'Siga a tela do terminal'],
    sections: [
      { title: 'Para a gestão', steps: [
        ['Abra Terminais e dispositivos', 'No Portal de Gestão, confira os dispositivos autorizados. A criação ou autorização de aparelho depende do seu perfil.'],
        ['Confira filial e status', 'Verifique se o terminal está associado à filial correta e aparece ativo antes de disponibilizá-lo à equipe.'],
        ['Abra o terminal', 'Use Abrir o terminal compartilhado no aparelho fixo autorizado e siga a configuração apresentada na tela.']
      ]},
      { title: 'Para o colaborador', steps: [
        ['Identifique-se no terminal', 'Siga as instruções exibidas e conclua a confirmação de identidade solicitada.'],
        ['Confira o retorno', 'Aguarde a confirmação na tela antes de sair. Se houver mensagem de erro ou pendência, avise a gestão; não repita várias vezes sem conferir o estado da marcação.']
      ]},
      { title: 'Dica', note: 'Use somente o aparelho e a filial autorizados para esse terminal. Não compartilhe PINs ou credenciais de outra pessoa.' }
    ]
  },
  {
    id: 'ajustes-ponto', image: './assets/academy/tour-ajustes.png', imageAlt: 'Tela de solicitações de ajuste', category: 'Ajustes e justificativas', title: 'Solicitar e analisar um ajuste de ponto',
    summary: 'Veja o fluxo do pedido do colaborador até a decisão registrada pela gestão.', audience: ['Colaborador', 'Administrador titular', 'Gerente', 'RH'], minutes: 5,
    flow: ['Abra a solicitação', 'Anexe justificativa', 'Acompanhe a decisão'],
    sections: [
      { title: 'Para o colaborador', steps: [
        ['Abra seu Portal do Colaborador', 'Entre em Solicitar ajuste e escolha o tipo correspondente ao que precisa corrigir.'],
        ['Informe o dia e explique o motivo', 'Preencha os campos solicitados e escreva uma justificativa objetiva. Anexe documento ou imagem quando for necessário e permitido.'],
        ['Acompanhe o status', 'Consulte o histórico de solicitações. Se a gestão pedir mais informações, responda pelo fluxo indicado no portal.']
      ]},
      { title: 'Para a gestão', steps: [
        ['Abra Solicitações de ajuste', 'Use a busca e o filtro de status para localizar o pedido. Confira colaborador, data, tipo, justificativa e anexo.'],
        ['Analise e registre uma nota', 'Selecione Analisar, escolha a decisão e escreva a nota obrigatória que explique o encaminhamento.'],
        ['Confira o resultado', 'A decisão entra na trilha de auditoria. A marcação original é preservada; retificações aprovadas deixam de integrar os cálculos conforme as regras do sistema.']
      ]},
      { title: 'Importante', note: 'Não aprove um pedido sem conferir os dados e o documento anexado. Um pedido enviado não significa que a alteração já foi aprovada.' }
    ]
  },
  {
    id: 'espelho-e-simbolos', image: './assets/academy/tour-registros-de-ponto.png', imageAlt: 'Tela de registros de ponto', category: 'Registro de ponto', title: 'Consultar o espelho e entender os símbolos',
    summary: 'Abra as marcações de uma pessoa e diferencie origem off-line de lançamento manual.', audience: ['Administrador titular', 'Gerente', 'RH', 'Supervisor'], minutes: 4,
    flow: ['Registros de ponto', 'Selecione a pessoa', 'Confira origem e estado'],
    sections: [
      { title: 'Passo a passo', steps: [
        ['Abra Registros de ponto', 'Pesquise o colaborador ou filtre pela filial e selecione a pessoa para abrir o espelho mensal.'],
        ['Escolha o período', 'Navegue até a data que quer conferir. Leia as marcações, a jornada prevista, o status e as observações exibidas para cada dia.'],
        ['Confira os indicadores', 'Uma marca com # identifica origem off-line; confira nos detalhes o aparelho e o estado da marca. Um * identifica lançamento manual ou ajuste. Consulte o estado e os detalhes do registro antes de interpretar ou agir.'],
        ['Use o histórico para investigar', 'Se notar divergência, confira o registro original, a solicitação relacionada e a trilha de auditoria. Não trate o símbolo isolado como decisão sobre um pedido.']
      ]},
      { title: 'Importante', note: 'A origem da marcação e o estado de validação são informações diferentes. Se um registro estiver pendente ou em revisão, respeite o status mostrado e não o considere confirmado por causa do símbolo.' }
    ]
  },
  {
    id: 'uso-offline', image: './assets/academy/tour-terminal-compartilhado.png', imageAlt: 'Terminal compartilhado demonstrativo', category: 'Continuidade e sincronização', title: 'O que acontece quando a internet cai',
    summary: 'Entenda a diferença entre o terminal compartilhado e o Portal do Colaborador em fluxos sem conexão.', audience: ['Administrador titular', 'Gerente', 'RH', 'Colaborador'], minutes: 4,
    flow: ['Identifique o aparelho', 'Confira a pendência', 'Verifique após reconectar'],
    sections: [
      { title: 'Durante a falta de conexão', text: ['Algumas rotinas podem continuar off-line, mas o comportamento depende do fluxo e do aparelho. O terminal compartilhado e o celular pessoal não têm o mesmo processo de conferência.'] },
      { title: 'Depois que a conexão voltar', steps: [
        ['Confira o próprio aparelho', 'No terminal compartilhado, as marcas elegíveis podem ser enviadas ao servidor quando a conexão retorna e passam pelas validações previstas. No celular pessoal, uma marca off-line pode permanecer pendente de revisão.'],
        ['Leia símbolo e status juntos', 'O # indica origem off-line; confira nos detalhes se veio do terminal compartilhado ou de aparelho pessoal. O * identifica lançamento manual ou ajuste. Confira também o status apresentado no histórico ou espelho.'],
        ['Não repita a marcação às cegas', 'Se a marca não aparecer ou estiver pendente, aguarde a sincronização e peça à gestão para conferir o histórico antes de tentar novamente.']
      ]},
      { title: 'Privacidade', note: 'A área off-line usa dados locais necessários ao fluxo. Não apague dados do navegador nem troque de aparelho enquanto houver uma pendência sem orientação da gestão.' }
    ]
  },
  {
    id: 'relatorios', image: './assets/academy/tour-relatorios.png', imageAlt: 'Tela de relatórios', category: 'Relatórios', title: 'Gerar e baixar relatórios',
    summary: 'Filtre registros por período e filial e escolha o formato disponível para conferência.', audience: ['Administrador titular', 'Gerente', 'RH', 'Supervisor'], minutes: 4,
    flow: ['Relatórios', 'Filial e período', 'Gerar e exportar'],
    sections: [
      { title: 'Passo a passo', steps: [
        ['Abra Relatórios', 'Escolha o relatório de registros de ponto ou o registro mensal em PDF, conforme a finalidade.'],
        ['Defina o escopo', 'Selecione a filial quando necessário e informe datas válidas. Confira se o período corresponde ao que quer revisar.'],
        ['Gere e confira o resultado', 'Selecione Gerar relatório e revise os dados exibidos antes de exportar. O CSV pode ser aberto em planilhas; o PDF é adequado para leitura e impressão.'],
        ['Baixe o documento mensal', 'O PDF mensal coletivo fica disponível somente depois do fechamento completo do mês, a partir do dia 1º do mês seguinte.']
      ]},
      { title: 'Atenção', note: 'O arquivo exportado reflete os dados e permissões disponíveis no momento da consulta. Revise o período e a filial antes de compartilhar.' }
    ]
  },
  {
    id: 'abrir-chamado', image: './assets/academy/tour-ajuda.png', imageAlt: 'Portal de Ajuda', category: 'Suporte', title: 'Abrir um chamado e acompanhar a resposta',
    summary: 'Envie uma descrição clara, anexe evidências permitidas e acompanhe a conversa na Central de Suporte.', audience: ['Administrador titular', 'Gerente'], minutes: 3,
    flow: ['Ajuda', 'Novo chamado', 'Acompanhe as respostas'],
    sections: [
      { title: 'Passo a passo', steps: [
        ['Abra Ajuda', 'No menu do Portal de Gestão, selecione Ajuda e depois Novo chamado.'],
        ['Descreva o que aconteceu', 'Informe um assunto, escolha a categoria, explique o comportamento observado e diga o que já tentou. Inclua data e módulo para facilitar a análise.'],
        ['Anexe uma evidência, se necessário', 'Você pode anexar até 5 arquivos, com no máximo 20 MB por arquivo e 50 MB no total por chamado. Evite incluir senhas, documentos pessoais desnecessários ou dados de outros funcionários.'],
        ['Acompanhe pela lista', 'O protocolo e o status aparecem em Meus chamados. Abra o chamado para ler a resposta e continuar a conversa.']
      ]},
      { title: 'Dica', note: 'A Central de Suporte e a Certus Academy se complementam: consulte primeiro os guias; se a dúvida continuar, abra um chamado com o contexto necessário.' }
    ]
  }
];
