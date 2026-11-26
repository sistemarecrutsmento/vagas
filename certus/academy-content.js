/* Certus Academy V3 — deeper learning paths, troubleshooting, glossary and illustrative screenshots. */
window.CERTUS_ACADEMY_DATA = [
  {
    "id": "primeiro-acesso",
    "category": "Primeiros passos",
    "title": "Entrar e conhecer o Portal de Gestão",
    "summary": "Acesse com sua conta individual, identifique seu perfil e encontre os módulos liberados para você.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 4,
    "flow": [
      "Portal de Gestão",
      "Confira empresa e perfil",
      "Abra o módulo"
    ],
    "image": "./assets/academy/gestao-desktop.png",
    "imageAlt": "Visão geral do Portal de Gestão",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Tenha o endereço oficial do Certus e as credenciais da sua própria conta. Se ainda não recebeu um acesso, procure o administrador titular da empresa."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra o endereço do Certus",
            "Acesse o portal pelo endereço usado pela sua empresa. Confira se a página exibida é a área de gestão; não informe sua senha em páginas abertas por links recebidos de desconhecidos."
          ],
          [
            "Entre com a conta individual",
            "Informe o e-mail e a senha associados à sua conta e selecione Entrar. Se sua empresa ativou autenticação em dois fatores, o portal também solicitará o código temporário do seu aplicativo autenticador."
          ],
          [
            "Confira o contexto da sessão",
            "Depois do acesso, leia o nome da empresa e o seu perfil no cabeçalho. Se você tem acesso a mais de uma empresa, confirme qual organização está aberta antes de consultar ou editar dados."
          ],
          [
            "Use o menu para abrir uma área",
            "Escolha Visão geral, Funcionários, Registros de ponto ou outro módulo liberado. No celular, abra o menu pelo botão de navegação e selecione uma área; o conteúdo será carregado na mesma sessão."
          ],
          [
            "Encerre a sessão em aparelho compartilhado",
            "Quando terminar em computador compartilhado, selecione Sair. Não marque para manter conexão em aparelhos que outras pessoas possam usar."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Qual credencial uso para gestão?",
        "answer": "Use o e-mail e a senha da sua conta individual. O identificador da empresa é usado no acesso do Portal do Colaborador, não como substituto do e-mail de gestão."
      },
      {
        "question": "Não vejo um módulo no menu. O que faço?",
        "answer": "A disponibilidade depende do seu perfil e das filiais autorizadas. Peça ao administrador titular para conferir suas permissões; não use a conta de outra pessoa."
      },
      {
        "question": "O acesso pediu um código adicional.",
        "answer": "Se a autenticação em dois fatores estiver ativa, abra o app autenticador vinculado à sua conta e informe o código de seis dígitos atual."
      }
    ],
    "keywords": [
      "login",
      "senha",
      "empresa",
      "perfil",
      "menu",
      "navegação",
      "acesso gestão",
      "dois fatores"
    ],
    "related": [
      "navegar-perfis",
      "seguranca-conta",
      "abrir-chamado"
    ],
    "checks": [
      "A empresa exibida no cabeçalho é a organização que você está consultando.",
      "O perfil controla os módulos e as ações que aparecem para a sua conta."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "A senha não funciona",
        "check": "Confirme o e-mail e se está na área de gestão, não no Portal do Colaborador.",
        "next": "Peça ao administrador titular para iniciar a redefinição oficial; não compartilhe sua senha por mensagem."
      },
      {
        "symptom": "A conta pediu um código e recusou",
        "check": "Verifique se o código tem seis dígitos e ainda está vigente no app autenticador vinculado.",
        "next": "Use o código atual; se perdeu o autenticador, procure o responsável pela recuperação da conta."
      },
      {
        "symptom": "A empresa no cabeçalho não é a esperada",
        "check": "Pode haver mais de uma organização associada à sessão.",
        "next": "Não faça alterações; encerre a sessão e entre na organização correta ou peça acesso ao titular."
      }
    ]
  },
  {
    "id": "navegar-perfis",
    "category": "Primeiros passos",
    "title": "Como encontrar cada área do Certus",
    "summary": "Um mapa rápido dos módulos, com dicas para escolher a tela certa sem confundir cadastro, ponto e relatórios.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 4,
    "flow": [
      "Leia o nome do módulo",
      "Abra o fluxo correspondente",
      "Confira permissões"
    ],
    "image": "./assets/academy/gestao-desktop.png",
    "imageAlt": "Visão geral do Portal de Gestão",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Entre no Portal de Gestão com seu usuário. A navegação mostra somente áreas e ações liberadas para o perfil atual."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Visão geral",
            "Use o painel para acompanhar os números gerais e as marcações recentes. Ele é um resumo, não substitui a conferência do espelho individual."
          ],
          [
            "Funcionários, filiais e jornadas",
            "Funcionários guarda fichas individuais; Filiais organiza unidades e departamentos; Jornadas contém os horários cadastrados. São cadastros relacionados, mas cada um tem sua própria tela."
          ],
          [
            "Registros, ajustes e inconsistências",
            "Registros de ponto abre a seleção de colaborador e seu espelho. Ajustes reúne pedidos enviados para análise. Inconsistências diárias aponta dias com quantidade ímpar de marcações validadas para conferência."
          ],
          [
            "Banco de horas e relatórios",
            "Banco de horas mostra saldos calculados no período consultado e a ação Registrar horas pagas. Relatórios gera arquivos conforme o período e as filiais a que sua conta tem acesso."
          ],
          [
            "Terminais e dispositivos, Configurações e Ajuda",
            "Terminais e dispositivos gerencia aparelhos autorizados conforme as permissões. Configurações reúne dados da empresa e opções de segurança. Ajuda reúne chamados e a Base de Conhecimento; daí você pode abrir a Certus Academy."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Onde encontro a Academy?",
        "answer": "Entre em Ajuda e abra a Base de Conhecimento. Use o botão Abrir Certus Academy; o atalho pode não aparecer na barra lateral."
      },
      {
        "question": "Por que não aparece Configurações ou Terminais?",
        "answer": "Essas telas têm regras próprias de perfil. O administrador titular pode confirmar o acesso adequado sem compartilhar credenciais."
      },
      {
        "question": "Posso usar um módulo para corrigir outro?",
        "answer": "Não presuma que uma alteração em cadastro corrige automaticamente relatórios ou registros. Siga o fluxo específico e confira o resultado na tela correspondente."
      }
    ],
    "keywords": [
      "mapa do sistema",
      "módulos",
      "visão geral",
      "cadastros",
      "onde fica",
      "academy",
      "ajuda"
    ],
    "related": [
      "cadastro-funcionario",
      "jornadas",
      "espelho-e-simbolos",
      "relatorios",
      "abrir-chamado"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "Um módulo sumiu do menu",
        "check": "A área pode estar restrita ao seu perfil ou às filiais autorizadas.",
        "next": "Confirme o perfil da conta e solicite ao titular somente a permissão necessária."
      },
      {
        "symptom": "O menu ficou aberto no celular",
        "check": "A navegação móvel usa um painel lateral/drawer.",
        "next": "Selecione a tela desejada ou feche o menu; confira se o cabeçalho continua mostrando a empresa correta."
      }
    ]
  },
  {
    "id": "cadastro-funcionario",
    "category": "Pessoas e acessos",
    "title": "Cadastrar um funcionário sem duplicar a ficha",
    "summary": "Crie o cadastro individual, confira a matrícula e associe somente os vínculos confirmados pela empresa.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 6,
    "flow": [
      "Funcionários",
      "Novo cadastro",
      "Confira vínculos e status"
    ],
    "image": "./assets/academy/tour-funcionarios.png",
    "imageAlt": "Tela de Funcionários",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Tenha os dados confirmados pela empresa e confira a lista antes de criar uma ficha nova. O cadastro de funcionários é permitido ao administrador titular e ao RH."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Pesquise antes de cadastrar",
            "Abra Funcionários e use a busca por nome, matrícula, cargo ou filial. Confira resultados semelhantes e registros inativos para evitar criar uma segunda ficha da mesma pessoa."
          ],
          [
            "Abra Novo cadastro",
            "Selecione Novo cadastro. Preencha o nome e os demais campos solicitados com dados fornecidos pela empresa. Matrícula e cargo devem corresponder ao registro interno usado pela organização."
          ],
          [
            "Informe CPF somente quando confirmado",
            "O CPF real é necessário para fluxos que dependem de REP-A. Digite o documento oficial; não invente números nem use dados de demonstração em uma empresa real."
          ],
          [
            "Escolha os vínculos disponíveis",
            "No cadastro inicial, selecione a filial, o departamento e a jornada corretos, se já estiverem cadastrados. Se a opção necessária não existir, salve somente quando apropriado e peça ao responsável para criar o cadastro relacionado antes de concluir o vínculo."
          ],
          [
            "Salve e confira o resultado",
            "Confirme a gravação, localize a ficha na lista e revise nome, matrícula, filial, jornada e status. A coluna Acesso ao portal informa separadamente se há uma conta de colaborador vinculada."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Preciso criar um acesso junto com a ficha?",
        "answer": "Não necessariamente. A ficha e o usuário do portal são elementos separados. Crie a conta somente se a pessoa precisa acessar o Portal do Colaborador."
      },
      {
        "question": "O funcionário não aparece na lista de vínculo.",
        "answer": "Confirme se a filial/departamento/jornada existe, se o perfil pode utilizá-la e se a lista foi atualizada. Não selecione uma opção parecida sem validar o vínculo correto."
      },
      {
        "question": "Posso cadastrar CPF de teste?",
        "answer": "Não. Em cadastro real, use apenas o CPF verdadeiro confirmado e autorizado. Dados fictícios devem ficar restritos a ambientes de demonstração."
      }
    ],
    "keywords": [
      "novo funcionário",
      "matrícula",
      "cpf",
      "cargo",
      "filial",
      "departamento",
      "cadastro duplicado"
    ],
    "related": [
      "editar-funcionario",
      "filiais-departamentos",
      "liberar-acesso"
    ],
    "checks": [
      "Revise a pessoa na busca antes de salvar.",
      "Não confunda uma ficha de funcionário com uma conta de acesso."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "A pessoa não aparece na busca",
        "check": "A pesquisa pode estar limitada por filial, status ou termo digitado.",
        "next": "Remova filtros, pesquise pela matrícula e confirme se a ficha já existe antes de criar outra."
      },
      {
        "symptom": "Filial ou jornada necessária não aparece",
        "check": "O cadastro relacionado pode não existir ou não estar disponível para seu perfil.",
        "next": "Confirme primeiro a filial/jornada com RH; não selecione uma opção “parecida”."
      }
    ]
  },
  {
    "id": "editar-funcionario",
    "category": "Pessoas e acessos",
    "title": "Revisar ou atualizar uma ficha de funcionário",
    "summary": "Saiba onde conferir dados, status e mudanças possíveis sem confundir campos pessoais com autenticação.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 5,
    "flow": [
      "Funcionários",
      "Pesquise a ficha",
      "Edite e reconfira"
    ],
    "image": "./assets/academy/tour-funcionarios.png",
    "imageAlt": "Lista de funcionários",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Tenha a correção confirmada pela empresa. Alterações de identidade e status podem afetar processos e devem ser feitas por usuários autorizados."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Encontre a pessoa correta",
            "Abra Funcionários e filtre por nome ou matrícula. Confira filial e cargo na linha antes de selecionar Editar; nomes iguais exigem validação adicional pelo responsável."
          ],
          [
            "Edite os campos disponíveis",
            "Abra Editar e altere somente a informação que foi confirmada. Na tela de edição, confira o status e os dados cadastrais antes de salvar."
          ],
          [
            "Entenda os campos especiais",
            "A troca de CPF real é tratada pelo fluxo de identidade do portal e pode exigir o dado verdadeiro. O campo PIN facial, quando disponível, é um PIN específico; não o confunda com senha da conta."
          ],
          [
            "Salve e valide o cadastro",
            "Depois de salvar, volte à lista, procure novamente a pessoa e confira os valores atualizados. Se houver conta vinculada, valide separadamente se o acesso ainda pertence ao colaborador correto."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Como inativo um cadastro?",
        "answer": "Na ficha Editar, o status pode oferecer Ativo, Inativo ou Afastado. Selecione somente a situação confirmada e verifique o resultado na lista; não use o status para apagar histórico."
      },
      {
        "question": "Alterar nome ou matrícula corrige registros antigos?",
        "answer": "A tela não deve ser tratada como ferramenta para alterar batidas históricas. Registros originais possuem controles próprios e a ficha deve ser mantida conforme o dado cadastral confirmado."
      },
      {
        "question": "O PIN facial é a senha do funcionário?",
        "answer": "Não. A senha da conta é usada para entrar no portal; o PIN facial é uma credencial separada associada ao fluxo de identificação facial."
      }
    ],
    "keywords": [
      "editar cadastro",
      "status funcionário",
      "inativo",
      "afastado",
      "pin facial",
      "cpf",
      "matrícula"
    ],
    "related": [
      "cadastro-funcionario",
      "liberar-acesso",
      "seguranca-conta"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O campo que preciso corrigir não aparece",
        "check": "Alguns dados têm fluxo específico ou são limitados por perfil.",
        "next": "Não tente alterar outro campo como substituto; peça ao titular/RH o caminho autorizado."
      },
      {
        "symptom": "A pessoa continua com acesso após mudar o status",
        "check": "A ficha e a conta de acesso são objetos distintos.",
        "next": "Confira Contas e acessos separadamente e siga o processo autorizado de desativação."
      }
    ]
  },
  {
    "id": "liberar-acesso",
    "category": "Pessoas e acessos",
    "title": "Liberar acesso ao Portal do Colaborador",
    "summary": "Crie uma conta individual vinculada à pessoa e entregue a senha inicial com cuidado.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 5,
    "flow": [
      "Localize o funcionário",
      "Criar acesso",
      "Confirme vínculo e acesso"
    ],
    "image": "./assets/academy/tour-acessos.png",
    "imageAlt": "Tela de acessos de funcionários",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "O funcionário precisa ter ficha ativa. A criação de acesso a partir da ficha está disponível para quem tem permissão de gestão de funcionários."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Confira se já existe um acesso",
            "Abra Funcionários, pesquise a pessoa e veja a coluna Acesso ao portal. Não crie outra conta se o acesso já estiver ativo."
          ],
          [
            "Inicie a criação do acesso correto",
            "Na linha da ficha sem acesso, selecione Criar acesso. Informe o e-mail verdadeiro da pessoa e siga a validação apresentada. Confira o nome e a matrícula antes de confirmar."
          ],
          [
            "Entregue a senha inicial com segurança",
            "Conforme o fluxo, uma senha pode ser definida ou gerada. Se o portal exibir uma senha temporária, ela pode aparecer apenas uma vez: copie e entregue diretamente por canal privado seguro, nunca em grupo ou documento público."
          ],
          [
            "Peça a troca no primeiro acesso",
            "Oriente a pessoa a entrar no Portal do Colaborador e trocar a senha temporária quando o sistema solicitar. A conta é pessoal; não reutilize o mesmo acesso entre colegas."
          ],
          [
            "Confirme o vínculo",
            "Volte à lista e confira Acesso ao portal. Se uma conta existente precisa ser vinculada, o administrador titular pode usar Contas e acessos e verificar cuidadosamente a identidade antes da associação."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Qual endereço uso para entrar como colaborador?",
        "answer": "Use o endereço do Portal do Colaborador e as credenciais individuais que a empresa entregou. O identificador da empresa é solicitado nesse portal; gestores entram pela área de gestão usando e-mail e senha."
      },
      {
        "question": "A senha temporária sumiu da tela.",
        "answer": "Não tente recuperá-la em prints ou mensagens. Peça ao administrador titular para usar o fluxo autorizado de redefinição e entregar uma nova senha por canal seguro."
      },
      {
        "question": "Posso emprestar minha conta para cobrir um turno?",
        "answer": "Não. O acesso é individual e vinculado a uma pessoa. Um registro feito por outra conta pode comprometer a atribuição correta e a segurança do histórico."
      }
    ],
    "keywords": [
      "portal do colaborador",
      "criar acesso",
      "senha inicial",
      "senha temporária",
      "conta funcionário",
      "login"
    ],
    "related": [
      "cadastro-funcionario",
      "seguranca-conta",
      "marcar-ponto"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "A opção Criar acesso não aparece",
        "check": "Pode já haver conta vinculada, a ficha pode não estar ativa ou seu perfil não tem a permissão.",
        "next": "Confira Acesso ao portal e o status; não crie uma segunda conta."
      },
      {
        "symptom": "O colaborador não recebeu a credencial",
        "check": "A senha temporária pode ter sido exibida uma única vez.",
        "next": "Peça redefinição pelo fluxo oficial e entregue diretamente em canal privado seguro."
      }
    ]
  },
  {
    "id": "filiais-departamentos",
    "category": "Organização",
    "title": "Cadastrar filiais e departamentos",
    "summary": "Organize as unidades e os departamentos, confira a localização e entenda por que o Plus Code e o raio importam.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 7,
    "flow": [
      "Filiais",
      "Nova filial",
      "Revise localização e departamento"
    ],
    "image": "./assets/academy/tour-filiais.png",
    "imageAlt": "Tela de Filiais e Departamentos",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Use informações reais da unidade confirmadas pela empresa. Criar uma filial não inicializa automaticamente o REP-A e não substitui sua conferência documental."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Filiais",
            "Selecione Filiais no menu. A tela reúne os estabelecimentos cadastrados e, na mesma área, a lista de departamentos."
          ],
          [
            "Preencha a unidade real",
            "Selecione Nova filial. Informe o nome, endereço e o Plus Code da localização. Um código Plus curto exige um Plus Code completo próximo como referência para o portal converter a localização."
          ],
          [
            "Confira a geolocalização",
            "Defina o raio de marcação permitido dentro dos limites exibidos no formulário (10 a 2000 metros). Revise o ponto no mapa/resultado apresentado; não aumente o raio apenas para ignorar um erro de localização."
          ],
          [
            "Informe dados legais somente com fonte oficial",
            "CNPJ do estabelecimento e local de prestação de serviços devem ser dados verdadeiros. O fluxo REP-A possui inicialização separada; o formulário informa que ela não pode ser revertida."
          ],
          [
            "Cadastre o departamento",
            "Na seção Departamentos, selecione Novo departamento, informe o nome e escolha a filial correspondente. Se o departamento valer para toda a empresa, use Todas as filiais quando for a opção adequada."
          ],
          [
            "Valide os vínculos",
            "Depois de salvar, confira nome, filial, status e os dados de localização. Use a busca/lista de funcionários para confirmar que cada pessoa está associada à unidade pretendida."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Posso usar um endereço aproximado?",
        "answer": "Não trate localização aproximada como dado oficial. Use um Plus Code/local confirmado e revise a posição resultante e o raio apresentado."
      },
      {
        "question": "O que é o Plus Code de referência?",
        "answer": "Ele ajuda a resolver um Plus Code curto na mesma região. O próprio formulário explica que códigos curtos precisam de uma referência completa próxima."
      },
      {
        "question": "Nova filial já fica pronta para REP-A?",
        "answer": "Não. A tela informa que a inicialização é separada e não pode ser revertida. Antes desse passo, confira os dados reais e os requisitos do fluxo com a pessoa responsável."
      }
    ],
    "keywords": [
      "filial",
      "departamento",
      "plus code",
      "geofence",
      "localização",
      "raio de marcação",
      "rep-a"
    ],
    "related": [
      "cadastro-funcionario",
      "jornadas",
      "terminal-compartilhado"
    ],
    "checks": [
      "CNPJ e endereço vêm de fonte oficial da empresa.",
      "A inicialização REP-A é separada e irreversível; confira antes de iniciar."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "Um Plus Code curto não é aceito",
        "check": "O formulário precisa de referência completa próxima para resolver um código curto.",
        "next": "Informe um Plus Code completo confirmado na mesma região e confira o ponto convertido."
      },
      {
        "symptom": "O terminal marca fora da área",
        "check": "A localização/raio da filial ou o aparelho pode não corresponder ao local correto.",
        "next": "Confira o Plus Code, o raio e a filial autorizada; não aumente o raio somente para suprimir o alerta."
      }
    ]
  },
  {
    "id": "acessos-contas",
    "category": "Pessoas e acessos",
    "title": "Entender perfis, contas e filiais autorizadas",
    "summary": "Confira o que os perfis fazem e por que as permissões devem seguir a responsabilidade de cada usuário.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 6,
    "flow": [
      "Contas e acessos",
      "Confira perfil",
      "Revise filiais autorizadas"
    ],
    "image": "./assets/academy/tour-acessos.png",
    "imageAlt": "Tela de Contas e Acessos",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "A tela Contas e acessos é restrita conforme o perfil; criar contas é uma ação do administrador titular."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Contas e acessos",
            "O administrador titular e os perfis autorizados consultam contas da organização. A tabela exibe nome, e-mail, perfil, vínculo com funcionário, estado e filiais autorizadas."
          ],
          [
            "Escolha o perfil pelo trabalho",
            "Gerente, RH, Supervisor e Funcionário têm funções diferentes. O administrador titular controla ações exclusivas, como criar usuários e algumas configurações. Conceda somente o perfil necessário; não eleve permissões para contornar um acesso negado."
          ],
          [
            "Revise as filiais autorizadas",
            "A coluna Filiais autorizadas mostra o escopo daquela conta. Se a pessoa deve atuar em uma unidade específica, o administrador titular pode editar o perfil/filiais conforme a opção disponível e confirmar o resultado."
          ],
          [
            "Desative em vez de compartilhar",
            "Se um acesso não deve continuar ativo, use a ação Desativar quando disponível e de acordo com o processo interno. Não compartilhe a senha do titular nem reutilize uma conta desligada para outra pessoa."
          ],
          [
            "Registre e confira a alteração",
            "Depois de editar, valide o perfil, as unidades e o status apresentados. Peça à pessoa que entre com sua própria conta e confirme que só enxerga as áreas necessárias."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Quem pode criar contas?",
        "answer": "A interface permite ao administrador titular criar contas de acesso. A criação de acesso de funcionário a partir da ficha possui fluxo próprio e também depende das permissões exibidas."
      },
      {
        "question": "Gerente e administrador titular são a mesma coisa?",
        "answer": "Não. O sistema diferencia o administrador titular original e outros perfis de gestão; algumas ações ficam reservadas ao titular."
      },
      {
        "question": "O que significa “Todas” em filiais?",
        "answer": "Indica escopo sem restrição às filiais listadas naquele campo. Confirme se essa abrangência é realmente necessária antes de salvar."
      }
    ],
    "keywords": [
      "contas",
      "acessos",
      "perfis",
      "permissões",
      "filiais autorizadas",
      "administrador titular",
      "usuários"
    ],
    "related": [
      "liberar-acesso",
      "editar-funcionario",
      "seguranca-conta"
    ],
    "checks": [
      "Atribua o menor escopo de acesso necessário.",
      "Nunca compartilhe uma conta entre pessoas."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O usuário vê filiais que não deveria",
        "check": "O escopo autorizado da conta pode estar abrangente.",
        "next": "Peça ao titular para revisar o perfil e as filiais e confirme o resultado depois da gravação."
      },
      {
        "symptom": "Não posso editar a conta do titular",
        "check": "A conta original tem ações reservadas ao próprio titular.",
        "next": "Não use outra conta de administrador como substituto; peça a ação à identidade titular."
      }
    ]
  },
  {
    "id": "jornadas",
    "category": "Jornadas e escalas",
    "title": "Configurar uma jornada por dia da semana",
    "summary": "Preencha início, término e intervalo de cada dia, confira descanso e carga líquida antes de atribuir a escala.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 8,
    "flow": [
      "Jornadas",
      "Horários por dia",
      "Confira a carga semanal"
    ],
    "image": "./assets/academy/tour-jornadas.png",
    "imageAlt": "Tela de Jornadas",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Tenha a jornada aprovada pela empresa e os instrumentos formais aplicáveis ao vínculo. O sistema calcula uma prévia; não valida contrato ou convenção por conta própria."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Jornadas e inicie um cadastro",
            "Selecione Jornadas e depois Nova jornada. Informe um nome que diferencie grupo ou turno e um grupo/turno quando solicitado."
          ],
          [
            "Marque os dias trabalhados",
            "Para cada dia, marque Dia de trabalho nos dias de expediente. Nos dias de descanso, deixe a opção desmarcada. Configure cada dia separadamente; a segunda-feira pode ter horário diferente do sábado."
          ],
          [
            "Informe horário e intervalo",
            "Preencha início, término e intervalo em minutos para cada dia ativo. Confira se o intervalo não excede a duração do período e se a jornada noturna não atravessa a meia-noite sem que isso esteja previsto no vínculo."
          ],
          [
            "Revise regras noturnas",
            "Escolha o regime noturno aplicável apenas se ele corresponde à atividade/vínculo e à documentação confirmada. O portal diferencia opções urbanas, domésticas e rurais; não escolha uma opção apenas para alterar o total calculado."
          ],
          [
            "Configure banco/compensação somente com respaldo",
            "O formulário oferece modos diferentes de compensação e, para os que exigem instrumento formal, confirmação do acordo. Só marque a confirmação quando o documento vigente existir e o RH responsável o tiver conferido."
          ],
          [
            "Leia a carga semanal líquida",
            "Confira a prévia de horas semanais já considerando os intervalos informados. Corrija horários incorretos antes de salvar; a prévia é um apoio de cadastro, não um parecer jurídico."
          ],
          [
            "Salve e atribua com conferência",
            "Após salvar, confira o cartão da jornada, a lista de dias e a carga semanal. Atribua a pessoas e filiais corretas e valide uma ficha de funcionário para garantir que a jornada vinculada é a pretendida."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Por que a carga semanal está diferente?",
        "answer": "Verifique dia a dia início, término, intervalo e quais dias estão marcados como trabalho. Uma alteração de minutos no intervalo muda a carga líquida."
      },
      {
        "question": "Posso deixar intervalo vazio?",
        "answer": "O formulário exige um valor em minutos para cada dia ativo. Use o intervalo correto confirmado para aquele dia; não substitua por zero sem validação."
      },
      {
        "question": "O descanso é sempre domingo?",
        "answer": "Não. O descanso é configurado na jornada. Confira o dia de descanso e as regras do vínculo em vez de presumir domingo."
      },
      {
        "question": "Posso alterar uma jornada depois de atribuí-la?",
        "answer": "Uma alteração pode afetar apuração futura. Confira quais pessoas usam a jornada e valide as consequências antes de salvar uma mudança."
      }
    ],
    "keywords": [
      "jornada",
      "escala",
      "intervalo",
      "carga semanal",
      "descanso",
      "DSR",
      "turno",
      "banco de horas"
    ],
    "related": [
      "escala-12x36",
      "atribuir-jornada",
      "banco-horas"
    ],
    "checks": [
      "Carga semanal é líquida: duração diária menos intervalo.",
      "Descanso e horários podem ser diferentes em cada dia."
    ],
    "note": "A prévia do portal ajuda a detectar inconsistências de preenchimento; a adequação ao contrato, à CLT e a instrumento coletivo deve ser confirmada pelo RH responsável.",
    "ifDifferent": [
      {
        "symptom": "Carga semanal ficou maior ou menor do que o esperado",
        "check": "A soma líquida depende do horário de cada dia, intervalos e dias marcados como trabalho.",
        "next": "Confira cada linha do formulário e a prévia; não altere intervalos apenas para igualar um total esperado."
      },
      {
        "symptom": "Dia de descanso aparece como trabalhado",
        "check": "A marcação Dia de trabalho ou o descanso configurado pode estar incorreto.",
        "next": "Revise a jornada aprovada e só depois corrija o cadastro; confira um dia no espelho."
      }
    ]
  },
  {
    "id": "escala-12x36",
    "category": "Jornadas e escalas",
    "title": "Cadastrar uma escala 12×36 sem perder a referência",
    "summary": "Use o modelo específico, escolha a data e hora de início do ciclo e confira o padrão de alternância antes de atribuir.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 7,
    "flow": [
      "Jornadas",
      "Nova escala 12×36",
      "Confirme início e ciclo"
    ],
    "image": "./assets/academy/tour-jornadas.png",
    "imageAlt": "Formulário de Jornadas",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "A escala deve estar formalmente confirmada para a pessoa e para a atividade. O sistema oferece um cadastro de ciclo, mas não verifica o instrumento legal."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra o modelo correto",
            "Na tela Jornadas, selecione Nova escala 12×36. Não tente representar um ciclo 12×36 como uma jornada semanal comum sem conferir se esse é o fluxo adequado."
          ],
          [
            "Informe nome e grupo",
            "Use um nome identificável e um grupo/turno que diferencie equipes que seguem ciclos diferentes."
          ],
          [
            "Defina a âncora do ciclo",
            "Informe a data de referência e a hora de início conforme a escala aprovada. A data âncora orienta a alternância de dias trabalhados e de descanso; um dia errado desloca o ciclo inteiro."
          ],
          [
            "Configure intervalos exibidos",
            "Preencha intervalo e horários, se o formulário pedir. Use os dados confirmados do turno. Não presuma que a duração do intervalo é igual para todas as equipes."
          ],
          [
            "Revise a prévia do ciclo",
            "Confira as primeiras datas previstas de trabalho e descanso na tela antes de salvar. Compare a data âncora e os próximos dias com o calendário aprovado pela empresa."
          ],
          [
            "Salve e teste a atribuição",
            "Depois de salvar, abra o cadastro da jornada e confira âncora, horário e grupo. Atribua a uma pessoa de cada vez e valide o dia previsto no portal/espelho antes de expandir a mudança."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O que é a data âncora?",
        "answer": "É a referência de início usada para calcular a alternância da escala. Confira a data real e a hora inicial no documento vigente."
      },
      {
        "question": "A prévia está invertida em relação ao calendário.",
        "answer": "Não atribua a escala. Revise a data âncora, hora de início e grupo; se continuar diferente, abra chamado com a captura sem dados pessoais desnecessários."
      },
      {
        "question": "O cadastro 12×36 substitui a conferência do contrato?",
        "answer": "Não. A tela cadastra o ciclo e gera uma prévia; a empresa precisa confirmar que a escala e os termos aplicáveis estão corretos."
      }
    ],
    "keywords": [
      "12x36",
      "12×36",
      "data âncora",
      "ciclo",
      "descanso",
      "escala"
    ],
    "related": [
      "jornadas",
      "atribuir-jornada",
      "espelho-e-simbolos"
    ],
    "checks": [
      "Confira a data âncora antes de salvar.",
      "Compare a prévia com a escala aprovada antes de vincular pessoas."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O ciclo parece começar no dia errado",
        "check": "A data âncora e a hora de início definem a sequência.",
        "next": "Não atribua ainda; compare a âncora e a prévia com o calendário aprovado."
      },
      {
        "symptom": "A jornada está duplicada na lista",
        "check": "Pode haver nomes diferentes para o mesmo ciclo.",
        "next": "Confira âncora, grupo, horários e status antes de criar outra escala."
      }
    ]
  },
  {
    "id": "atribuir-jornada",
    "category": "Jornadas e escalas",
    "title": "Vincular a jornada correta a um funcionário",
    "summary": "Revise a ficha, a filial e o grupo antes de associar o turno cadastrado.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 5,
    "flow": [
      "Confira a jornada cadastrada",
      "Abra Funcionários",
      "Valide o espelho"
    ],
    "image": "./assets/academy/tour-funcionarios.png",
    "imageAlt": "Lista de funcionários",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "A jornada já precisa existir e ter sido conferida. Selecione a pessoa e a filial corretas antes de alterar o vínculo."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Revise a jornada na tela própria",
            "Abra Jornadas e confira nome, dias ativos, intervalos, descanso e carga semanal. Se usar 12×36, valide a data âncora e o ciclo."
          ],
          [
            "Pesquise o funcionário",
            "Abra Funcionários e localize a pessoa pela matrícula, nome e filial. Confirme que a ficha representa a pessoa que deve seguir essa escala."
          ],
          [
            "Edite o vínculo disponível",
            "Selecione Editar e escolha somente as opções liberadas no formulário. Se a edição não mostrar jornada ou se seu perfil não puder alterá-la, solicite ao administrador titular/RH responsável."
          ],
          [
            "Salve e verifique dois lugares",
            "Após salvar, confira a jornada na linha do funcionário e no detalhe da escala. Abra Registros de ponto para conferir a jornada prevista em uma data de referência, lembrando que um cadastro correto não altera marcações originais."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "A jornada não aparece no campo.",
        "answer": "Confirme que a jornada está cadastrada e ativa, que a lista foi recarregada e que seu perfil tem permissão. Não crie uma jornada duplicada como tentativa."
      },
      {
        "question": "A mudança corrigiu o passado?",
        "answer": "Não assuma que alterar o vínculo reescreve dados históricos. Consulte o período e as regras de apuração; use o fluxo de ajuste quando houver uma solicitação legítima."
      }
    ],
    "keywords": [
      "atribuir jornada",
      "vincular jornada",
      "funcionário",
      "escala",
      "horário previsto"
    ],
    "related": [
      "jornadas",
      "escala-12x36",
      "cadastro-funcionario"
    ],
    "checks": [
      "Confira o dia de descanso e a unidade antes de salvar.",
      "Verifique o resultado no espelho sem editar marcações originais."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "A jornada recém-criada não aparece na ficha",
        "check": "A lista pode não ter sido recarregada ou a jornada pode não estar ativa/disponível.",
        "next": "Atualize a tela e confirme cadastro, status e permissões; não duplique a jornada."
      },
      {
        "symptom": "O espelho mostra outra previsão",
        "check": "A pessoa pode estar vinculada a uma jornada diferente ou o período pode usar um vínculo histórico.",
        "next": "Confira ficha, filial e data consultada; não presuma que editar a ficha reescreve o histórico."
      }
    ]
  },
  {
    "id": "marcar-ponto",
    "category": "Portal do Colaborador",
    "title": "Registrar uma marcação pelo Portal do Colaborador",
    "summary": "Confira sua jornada, use sua própria conta e aguarde a confirmação antes de repetir uma tentativa.",
    "audience": [
      "Colaborador",
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 5,
    "flow": [
      "Entre no Portal do Colaborador",
      "Confira a próxima ação",
      "Aguarde a confirmação"
    ],
    "image": "./assets/academy/tour-portal-colaborador.png",
    "imageAlt": "Tela móvel do Portal do Colaborador",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Tenha o identificador da empresa e suas próprias credenciais. O dispositivo precisa atender às permissões de câmera/localização que o fluxo mostrar."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra o Portal do Colaborador",
            "Use o endereço do portal de colaborador, informe o identificador da empresa quando solicitado e entre com seu próprio usuário. Não use o login de gestão."
          ],
          [
            "Confira sua jornada e a próxima ação",
            "Na tela Meu ponto, confira o nome, o horário previsto e a indicação da próxima ação. Se a jornada ou o dia estiver incorreto, fale com a gestão antes de tentar contornar a tela."
          ],
          [
            "Conclua a identificação solicitada",
            "Se o portal solicitar reconhecimento facial, permita a câmera e siga as instruções na tela. Mantenha o rosto visível e centralizado; não use foto de outra pessoa nem compartilhe PIN."
          ],
          [
            "Aguarde a resposta antes de fechar",
            "Espere o portal confirmar a gravação. Confira o histórico e a hora/status exibidos. Não clique várias vezes se a tela estiver carregando; primeiro verifique se a marca já apareceu."
          ],
          [
            "Se estiver sem conexão, anote o que viu",
            "O comportamento offline depende do fluxo e do aparelho. Leia a tela, preserve o acesso e confira a marca posteriormente; a hora local pode não estar confirmada pelo servidor."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Posso registrar ponto pela conta de outra pessoa?",
        "answer": "Não. Cada marcação deve seguir a identificação individual do próprio colaborador."
      },
      {
        "question": "O botão está desabilitado.",
        "answer": "Confira a jornada e as condições indicadas pela tela, como status facial e permissões do aparelho. Se o impedimento persistir, procure a gestão; não altere relógio ou localização do aparelho."
      },
      {
        "question": "A marca não apareceu imediatamente.",
        "answer": "Reabra o histórico e verifique se há pendência ou aviso de conexão. Avise a gestão antes de repetir uma tentativa, para evitar duplicidade."
      }
    ],
    "keywords": [
      "portal colaborador",
      "registrar ponto",
      "marcação",
      "entrada",
      "intervalo",
      "saída",
      "reconhecimento facial"
    ],
    "related": [
      "cadastro-facial",
      "uso-offline",
      "espelho-e-simbolos"
    ],
    "checks": [
      "Confirme a próxima ação antes de marcar.",
      "Aguarde o retorno da tela e confira o histórico."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "Não aparece a próxima ação esperada",
        "check": "O sistema pode estar aguardando evento anterior, autenticação ou dados da jornada.",
        "next": "Confira o histórico e a jornada; não force marcações repetidas."
      },
      {
        "symptom": "A marcação está carregando há muito tempo",
        "check": "A confirmação pode depender da conexão/aparelho.",
        "next": "Confira primeiro o histórico; se não houver resultado, peça à gestão para verificar antes de tentar de novo."
      }
    ]
  },
  {
    "id": "cadastro-facial",
    "category": "Portal do Colaborador",
    "title": "Fazer o primeiro cadastro facial",
    "summary": "Prepare iluminação e câmera, siga o consentimento da tela e confirme o status do cadastro antes de usar o reconhecimento.",
    "audience": [
      "Colaborador",
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 5,
    "flow": [
      "Leia a tela de consentimento",
      "Permita câmera",
      "Confira status cadastrado"
    ],
    "image": "./assets/academy/tour-portal-colaborador.png",
    "imageAlt": "Tela demonstrativa do Portal do Colaborador",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Use o aparelho e a conta da própria pessoa. O fluxo depende de câmera compatível e consentimento; não faça o cadastro em nome de outra pessoa."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra seu acesso individual",
            "Entre no Portal do Colaborador com o identificador e a conta da empresa. Confira que o nome exibido é o seu."
          ],
          [
            "Leia as instruções e o consentimento",
            "Antes de prosseguir, leia o texto exibido sobre reconhecimento facial, uso de imagem e privacidade. Só continue se a pessoa compreender e consentir pelas opções apresentadas."
          ],
          [
            "Prepare a câmera",
            "Use ambiente iluminado, retire objetos que escondam o rosto e posicione a câmera na altura dos olhos. Mantenha o rosto dentro da área indicada e evite movimento brusco."
          ],
          [
            "Conclua as etapas sem trocar de pessoa",
            "Siga a captura do portal até a confirmação. Não fotografe outra pessoa, não mostre uma foto na tela e não repita o processo para contas diferentes."
          ],
          [
            "Verifique o status e a recuperação",
            "Confirme que o portal mostra cadastro concluído. Se precisar atualizar o rosto, peça liberação à gestão pelo processo correto; não tente apagar dados locais ou refazer o cadastro sem autorização."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O navegador não abriu a câmera.",
        "answer": "Confira a permissão de câmera nas configurações do navegador/aparelho e tente novamente em ambiente seguro. Se a câmera estiver ocupada por outro app, feche-o e recarregue a página."
      },
      {
        "question": "O sistema não reconheceu meu rosto.",
        "answer": "Melhore iluminação e enquadramento, limpe a lente e siga o aviso exibido. Se ainda falhar, interrompa as tentativas e peça suporte; não use a foto de outra pessoa."
      },
      {
        "question": "Como atualizo o rosto já cadastrado?",
        "answer": "A atualização depende de autorização da gestão. Peça ao administrador ou gerente para liberar a recaptura quando o fluxo indicar essa opção."
      }
    ],
    "keywords": [
      "cadastro facial",
      "rosto",
      "câmera",
      "privacidade",
      "consentimento",
      "reconhecimento"
    ],
    "related": [
      "marcar-ponto",
      "acessos-contas",
      "seguranca-conta"
    ],
    "checks": [
      "O consentimento deve ser da própria pessoa e independente da senha.",
      "Confira a mensagem de cadastro concluído antes de sair."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "A câmera fica bloqueada",
        "check": "A permissão do navegador pode estar negada ou outro aplicativo está usando a câmera.",
        "next": "Libere a câmera para o domínio correto, feche o outro app e recarregue uma vez."
      },
      {
        "symptom": "A captura não conclui",
        "check": "Iluminação, enquadramento ou movimento podem impedir a leitura.",
        "next": "Siga a instrução visível; se falhar repetidamente, pare e solicite apoio em vez de usar a foto de outra pessoa."
      }
    ]
  },
  {
    "id": "terminal-compartilhado",
    "category": "Registro de ponto",
    "title": "Preparar e usar o terminal compartilhado",
    "summary": "Confira aparelho autorizado, filial e retorno de cada marcação antes de liberar o terminal para a equipe.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 6,
    "flow": [
      "Autorize dispositivo",
      "Confira filial e status",
      "Abra o terminal"
    ],
    "image": "./assets/academy/tour-terminal-compartilhado.png",
    "imageAlt": "Terminal compartilhado demonstrativo",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "O terminal deve ser um aparelho da empresa, autorizado para a filial correta. Não compartilhe credenciais de gestão com os colaboradores."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Confira o cadastro de filial",
            "Antes de autorizar o aparelho, abra Filiais e confirme unidade, localização e raio de marcação. O terminal deve corresponder ao local real de prestação de serviço."
          ],
          [
            "Abra Terminais e dispositivos",
            "No Portal de Gestão, confira dispositivos autorizados. O administrador titular ou RH pode gerenciar dispositivos de acordo com as ações exibidas."
          ],
          [
            "Autorize e identifique o aparelho",
            "Selecione Autorizar dispositivo e associe a filial correta. Use uma descrição que permita à equipe reconhecer o aparelho sem inserir dados pessoais desnecessários."
          ],
          [
            "Abra a tela de terminal",
            "Selecione Abrir o terminal compartilhado no aparelho autorizado e siga a configuração mostrada. Testes de posicionamento devem usar fluxo de teste/demonstração disponibilizado pela tela; não registre batida real como teste."
          ],
          [
            "Instrua os colaboradores",
            "Oriente cada pessoa a seguir as instruções individuais na tela e aguardar a confirmação. Depois, confira uma marca real autorizada no histórico da empresa, respeitando os controles internos."
          ],
          [
            "Se for substituir ou desconectar o aparelho",
            "Use o fluxo oficial de Terminais e dispositivos no portal de gestão e siga a ação disponível. Não apague vínculo ou chave local pelo navegador para tentar resolver o problema; peça orientação ao titular se a opção exigir confirmação."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O terminal está ligado à filial errada.",
        "answer": "Interrompa o uso e peça ao administrador titular/RH para conferir a associação do dispositivo no portal. Não use o aparelho até a unidade estar correta."
      },
      {
        "question": "A equipe vê erro de câmera ou leitura.",
        "answer": "Confira a câmera, iluminação e posição do aparelho. Registre a mensagem de erro sem fotografar dados de terceiros e abra chamado se o problema persistir."
      },
      {
        "question": "Posso limpar armazenamento do navegador para desconectar?",
        "answer": "Não. Para desconectar/substituir, use Terminais e dispositivos no Portal de Gestão; apagar a chave ou vínculo local pode deixar o terminal em estado inconsistente."
      }
    ],
    "keywords": [
      "terminal compartilhado",
      "dispositivo autorizado",
      "filial",
      "terminal",
      "desconectar",
      "chave local"
    ],
    "related": [
      "filiais-departamentos",
      "uso-offline",
      "abrir-chamado"
    ],
    "checks": [
      "Confirme a filial e o status antes do primeiro uso.",
      "Use o fluxo do portal de gestão para desconectar ou substituir o terminal."
    ],
    "note": "Não apague chaves ou vínculos locais do terminal. A gestão deve conduzir a desconexão em Terminais e dispositivos no portal autenticado.",
    "ifDifferent": [
      {
        "symptom": "O leitor fica em modo de configuração",
        "check": "Confira se o dispositivo foi autorizado e se a página aberta é a do terminal.",
        "next": "Peça à gestão para confirmar o cadastro e a filial; não entre com conta de gestor no aparelho compartilhado."
      },
      {
        "symptom": "A pessoa não consegue registrar",
        "check": "Pode haver erro de câmera, filial, localização ou identificação.",
        "next": "Leia a mensagem, confira aparelho/filial e peça à pessoa que aguarde antes de repetir a marca."
      }
    ]
  },
  {
    "id": "terminais-dispositivos",
    "category": "Dispositivos",
    "title": "Autorizar, conferir ou revogar um terminal",
    "summary": "Mantenha a lista de aparelhos atualizada e use o fluxo de gestão para mudanças de vínculo.",
    "audience": [
      "Administrador titular",
      "RH"
    ],
    "minutes": 5,
    "flow": [
      "Terminais e dispositivos",
      "Revise o aparelho",
      "Use ação oficial"
    ],
    "image": "./assets/academy/tour-terminais.png",
    "imageAlt": "Tela de dispositivos autorizados",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Faça mudanças somente nos aparelhos da empresa e nas filiais autorizadas. Ações disponíveis podem variar por perfil."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Terminais e dispositivos",
            "Confira a lista por identificação do terminal, filial, status e último uso. Abra o link para o terminal compartilhado somente no dispositivo correto."
          ],
          [
            "Autorize um aparelho novo",
            "Selecione Autorizar dispositivo, dê um rótulo útil e selecione a filial. Confira a unidade antes de concluir."
          ],
          [
            "Revise o estado antes de agir",
            "A lista diferencia dispositivos ativos e revogados e pode exibir ações como revogar ou criar senha de desconexão, dependendo do perfil. Leia exatamente o rótulo e o diálogo antes de confirmar."
          ],
          [
            "Remova acesso pelo fluxo do portal",
            "Ao trocar aparelho, revogue/autorização conforme a orientação da empresa. Use a função oficial; não limpe chave ou armazenamento local por conta própria."
          ],
          [
            "Confirme a mudança",
            "Atualize a lista e confira status, filial e último uso. Avise os usuários do terminal para deixar de usar aparelhos revogados."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Qualquer gestor pode revogar?",
        "answer": "Ações variam com o perfil; verifique se o botão está disponível para sua conta. Se não estiver, solicite ao administrador titular ou RH autorizado."
      },
      {
        "question": "O que acontece se revogar?",
        "answer": "O aparelho deixa de aparecer como ativo na gestão. Confira o status na lista e siga a instrução da tela para concluir a desconexão física, sem apagar dados locais manualmente."
      },
      {
        "question": "Como troco a filial do terminal?",
        "answer": "Confira as ações disponíveis e a documentação interna da unidade. Se a tela não oferecer alteração direta, peça suporte; não mantenha o terminal ativo na filial incorreta."
      }
    ],
    "keywords": [
      "dispositivo",
      "terminal",
      "revogar",
      "desconectar",
      "autorização",
      "filial"
    ],
    "related": [
      "terminal-compartilhado",
      "filiais-departamentos",
      "uso-offline"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "Um dispositivo aparece como inativo",
        "check": "Pode ter sido revogado ou substituído.",
        "next": "Confira o status e o último uso antes de reutilizar; não apague a chave local."
      },
      {
        "symptom": "Não há botão Autorizar dispositivo",
        "check": "A ação depende do perfil autorizado.",
        "next": "Peça ao administrador titular ou RH com permissão para realizar o cadastro."
      }
    ]
  },
  {
    "id": "ajustes-ponto",
    "category": "Ajustes e justificativas",
    "title": "Solicitar um ajuste de ponto",
    "summary": "Escolha o tipo correto, informe data e justificativa e acompanhe a análise sem presumir aprovação automática.",
    "audience": [
      "Colaborador",
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 6,
    "flow": [
      "Escolha tipo e data",
      "Descreva motivo",
      "Acompanhe status"
    ],
    "image": "./assets/academy/tour-ajustes.png",
    "imageAlt": "Tela de solicitações de ajuste",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Tenha a data, o tipo de ocorrência e a justificativa corretos. O pedido do colaborador não altera a marcação original até passar pelo fluxo de análise aplicável."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Solicitar ajuste",
            "No Portal do Colaborador, escolha Solicitar ajuste. Selecione uma das opções exibidas: correção de horário, retificação de marcação, abono de dia ou abono de horas."
          ],
          [
            "Diferencie correção e retificação",
            "Correção de marcação pede outro horário/tipo para análise. Retificação aponta uma marca original específica a excluir dos cálculos, se aprovada. Confira a descrição e escolha o fluxo que corresponde ao fato; não use retificação apenas para mudar um horário."
          ],
          [
            "Informe data, horário e justificativa",
            "Preencha os campos que surgirem para o tipo escolhido. Escreva o que aconteceu, em que dia e qual informação precisa ser analisada. Para pedido de horas, confira início e fim."
          ],
          [
            "Anexe somente evidência necessária",
            "O portal aceita imagem ou PDF dentro do limite exibido, atualmente até 5 MB por anexo. O documento deve corresponder ao pedido e não incluir dados de outras pessoas sem necessidade."
          ],
          [
            "Envie uma vez e acompanhe",
            "Confirme o resumo e envie. Consulte o histórico para ver Pendente, Revisar, Aprovado ou Recusado. Se a gestão pedir informação, responda pelo fluxo indicado em vez de abrir pedidos duplicados."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O pedido enviado já alterou meu ponto?",
        "answer": "Não necessariamente. O pedido fica sujeito à análise e decisão da gestão. Confira o status e aguarde a resposta."
      },
      {
        "question": "Qual a diferença entre ajustar e retificar?",
        "answer": "Ajuste propõe uma marcação correta a ser analisada; retificação identifica uma marca original específica para possível exclusão dos cálculos após aprovação. Consulte a tela e o RH se não tiver certeza."
      },
      {
        "question": "O arquivo não anexou.",
        "answer": "Confira o formato e o limite exibido, que admite foto/PDF de até 5 MB por arquivo. Se não funcionar, descreva o problema e envie chamado sem anexar documento por um canal inseguro."
      }
    ],
    "keywords": [
      "solicitar ajuste",
      "ajuste",
      "retificação",
      "abono",
      "justificativa",
      "anexo",
      "aprovação"
    ],
    "related": [
      "revisar-ajustes",
      "espelho-e-simbolos",
      "abrir-chamado"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "Escolhi retificação, mas a marca correta não aparece",
        "check": "A lista é preenchida pelas batidas existentes no dia selecionado.",
        "next": "Confira a data e escolha a marca original correta; se não houver marca, retificação pode não ser o tipo aplicável."
      },
      {
        "symptom": "Anexo não é enviado",
        "check": "O campo aceita imagem ou PDF até 5 MB.",
        "next": "Reduza ou converta o arquivo conforme permitido e confirme se os dados de terceiros estão ocultos."
      }
    ]
  },
  {
    "id": "revisar-ajustes",
    "category": "Ajustes e justificativas",
    "title": "Analisar pedidos de ajuste com rastreabilidade",
    "summary": "Filtre a fila, confira dados e anexos e registre uma decisão explicada; o histórico original é preservado.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 7,
    "flow": [
      "Solicitações de ajuste",
      "Confira pedido e anexo",
      "Decida com nota"
    ],
    "image": "./assets/academy/tour-ajustes.png",
    "imageAlt": "Fila de solicitações de ajuste",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "A revisão é uma decisão da gestão. Separe evidência, jornada e marca original antes de escolher um resultado."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Solicitações de ajuste",
            "Use a busca e o filtro de status para localizar a solicitação. Confira nome, tipo, data, justificativa, status e eventual anexo."
          ],
          [
            "Abra a análise do pedido",
            "Selecione Analisar quando a solicitação estiver disponível. Leia o motivo informado e compare com registros, jornada e evidências relevantes para o período."
          ],
          [
            "Escolha a decisão coerente",
            "A tela oferece opções como Aprovar, Recusar ou Revisar/solicitar informação. Se faltarem dados, peça esclarecimento em vez de concluir por suposição."
          ],
          [
            "Escreva uma nota objetiva",
            "A nota é obrigatória. Diga o que foi conferido e por que o pedido foi aceito, recusado ou precisa de informação, sem incluir dado pessoal além do necessário."
          ],
          [
            "Entenda o efeito e confirme",
            "A decisão fica em trilha de auditoria. Uma retificação aprovada retira a marca específica dos cálculos e preserva o registro histórico; uma correção aprovada segue o fluxo corretivo. Confira o espelho depois de salvar."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Posso aprovar sem anexo?",
        "answer": "A análise depende do tipo de pedido e das evidências aplicáveis. Se faltarem elementos necessários, use o estado de revisão e peça informação."
      },
      {
        "question": "A marca original desaparece quando aprovo uma retificação?",
        "answer": "Ela deixa de integrar os cálculos conforme a regra do fluxo, mas o registro original e a decisão ficam preservados em auditoria."
      },
      {
        "question": "Posso editar o pedido no lugar do colaborador?",
        "answer": "Use os controles disponíveis no sistema e preserve a trilha. Não altere fatos descritos pelo solicitante sem registrar a base e a decisão correspondentes."
      }
    ],
    "keywords": [
      "analisar solicitação",
      "aprovar",
      "recusar",
      "revisar",
      "auditoria",
      "marca original",
      "retificação"
    ],
    "related": [
      "ajustes-ponto",
      "espelho-e-simbolos",
      "inconsistencias"
    ],
    "checks": [
      "Confirme colaborador, data e tipo antes da decisão.",
      "A nota deve explicar a decisão.",
      "Registros originais devem permanecer auditáveis."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O pedido não está na fila esperada",
        "check": "Filtros de status ou termo de busca podem ocultá-lo.",
        "next": "Selecione Todos, limpe a busca e confirme a empresa/filial e a data."
      },
      {
        "symptom": "A decisão não alterou o espelho",
        "check": "A mudança depende do tipo de solicitação e da aprovação final.",
        "next": "Reabra o pedido e confira o status, a nota e o período do espelho."
      }
    ]
  },
  {
    "id": "espelho-e-simbolos",
    "category": "Registro de ponto",
    "title": "Consultar o espelho e entender os símbolos",
    "summary": "Abra a pessoa e o período, compare jornada e marcações e diferencie origem do registro de estado de validação.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 6,
    "flow": [
      "Registros de ponto",
      "Selecione pessoa e período",
      "Confira origem e status"
    ],
    "image": "./assets/academy/tour-registros-de-ponto.png",
    "imageAlt": "Tela de Registros de Ponto",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "A gestão precisa ter permissão para consultar os colaboradores/filiais. Selecione o período antes de interpretar totais."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Registros de ponto",
            "Selecione o módulo. Se a lista de colaboradores aparecer, pesquise por nome ou matrícula e filtre pela filial quando necessário."
          ],
          [
            "Abra o espelho individual",
            "Toque no funcionário desejado e escolha o mês/ano ou o período de consulta. Confirme novamente o nome no cabeçalho do espelho."
          ],
          [
            "Compare cada dia com a jornada",
            "Leia horário previsto, marcações, total trabalhado, saldo diário e observações em colunas correspondentes. Confira o fuso horário da empresa e não compare horários exibidos em fusos diferentes."
          ],
          [
            "Leia os símbolos separadamente do status",
            "O # indica origem off-line; o * indica lançamento manual/ajuste. Depois leia a situação de validação mostrada junto do registro. Símbolo de origem não significa aprovação nem confirma automaticamente o horário."
          ],
          [
            "Investigue divergência pelo histórico",
            "Confira a solicitação relacionada, decisões e auditoria. Marcações originais não devem ser alteradas manualmente; use o fluxo autorizado de ajuste e preserve o motivo."
          ],
          [
            "Volte ao relatório com escopo claro",
            "Se gerar PDF/CSV, confirme colaborador, filial e datas. O relatório deve representar o escopo selecionado, não uma conclusão automática sobre um pedido pendente."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O que significa #?",
        "answer": "Identifica origem off-line. Consulte os detalhes do registro para entender aparelho, horário recebido e estado de validação."
      },
      {
        "question": "O que significa *?",
        "answer": "Identifica lançamento manual ou ajuste. Procure a justificativa e o histórico correspondente; não interprete o símbolo isoladamente."
      },
      {
        "question": "O registro está pendente: posso somá-lo ao total confirmado?",
        "answer": "Não presuma confirmação por causa do horário exibido. Respeite o status de validação e a orientação da gestão."
      },
      {
        "question": "Por que o saldo não aparece?",
        "answer": "Pode depender do período selecionado, jornada configurada, validação das marcas ou disponibilidade do relatório. Confira mês, filial, jornada e status de cada registro."
      }
    ],
    "keywords": [
      "espelho de ponto",
      "registros",
      "saldo diário",
      "total trabalhado",
      "# offline",
      "* manual",
      "histórico"
    ],
    "related": [
      "uso-offline",
      "revisar-ajustes",
      "relatorios",
      "banco-horas"
    ],
    "checks": [
      "# é origem offline; * é lançamento manual/ajuste.",
      "Estado de validação é outra informação.",
      "Não edite nem remova registro original para corrigir uma divergência."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O saldo diário está como pendente",
        "check": "A jornada ou as marcações podem não permitir o fechamento do dia ainda.",
        "next": "Confira se o dia está completo, se a jornada está vinculada e se há marca pendente."
      },
      {
        "symptom": "Um horário # não entra no total confirmado",
        "check": "# identifica origem offline, que pode aguardar validação separada.",
        "next": "Abra detalhes do registro e leia o estado; não conte uma pendência como confirmada."
      }
    ]
  },
  {
    "id": "uso-offline",
    "category": "Continuidade e sincronização",
    "title": "O que acontece quando a internet cai",
    "summary": "Diferencie os fluxos do terminal compartilhado e do celular, depois verifique o estado da marca antes de agir.",
    "audience": [
      "Colaborador",
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 6,
    "flow": [
      "Identifique o aparelho",
      "Aguarde conexão",
      "Confira sincronização e estado"
    ],
    "image": "./assets/academy/tour-terminal-compartilhado.png",
    "imageAlt": "Terminal compartilhado demonstrativo",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Offline não significa automaticamente confirmado. Preserve o aparelho e anote a mensagem exibida."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Identifique o fluxo usado",
            "Anote se a tentativa ocorreu no terminal compartilhado autorizado ou no Portal do Colaborador em celular. Os processos offline são diferentes."
          ],
          [
            "Durante a perda de conexão",
            "Siga somente as instruções mostradas pelo fluxo. Não altere relógio, localização ou identificadores do aparelho e não limpe armazenamento local."
          ],
          [
            "Depois de recuperar a internet",
            "Deixe o mesmo aparelho conectado e o portal aberto/retomado quando possível para o sistema tentar o envio previsto pelo fluxo. Aguarde a confirmação ou indicação de pendência."
          ],
          [
            "Confira o histórico e o espelho",
            "Na gestão, veja se a marca apareceu e leia origem, horário informado/recebido e validação. # mostra origem offline; o estado continua sendo a fonte para saber se passou pelas verificações."
          ],
          [
            "Evite duplicar a tentativa",
            "Se a marca não aparecer, faça uma captura da mensagem sem dados sensíveis e peça à gestão para conferir antes de marcar de novo. O colaborador deve receber orientação sobre o procedimento da empresa."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Uma marca offline está confirmada?",
        "answer": "Não necessariamente. O horário local pode aguardar validação. Confira o status no histórico e siga o fluxo do aparelho."
      },
      {
        "question": "Posso apagar os dados do navegador para limpar a pendência?",
        "answer": "Não. Isso pode apagar informação necessária à fila local. Preserve o aparelho e peça ajuda à gestão."
      },
      {
        "question": "O que significa #?",
        "answer": "É o símbolo de origem offline. Consulte detalhes e estado para saber como a marca foi recebida e se ainda está pendente."
      },
      {
        "question": "O terminal sincronizou sozinho?",
        "answer": "Fluxos elegíveis tentam sincronizar quando a conexão retorna, mas a confirmação deve ser verificada no portal; não presuma que aconteceu sem conferir."
      }
    ],
    "keywords": [
      "internet caiu",
      "offline",
      "sincronização",
      "pendente",
      "marca offline",
      "sem conexão"
    ],
    "related": [
      "terminal-compartilhado",
      "espelho-e-simbolos",
      "marcar-ponto",
      "inconsistencias"
    ],
    "checks": [
      "Não apague armazenamento local para resolver pendência.",
      "Origem offline e confirmação são conceitos diferentes."
    ],
    "note": "Use os estados mostrados pelo portal. A hora informada por aparelho offline não é, por si só, confirmação de horário pelo servidor.",
    "ifDifferent": [
      {
        "symptom": "A marca offline não apareceu depois de voltar a internet",
        "check": "O dispositivo pode não ter concluído o envio ou a marca está aguardando validação.",
        "next": "Mantenha o aparelho; peça à gestão para conferir fila e histórico antes de marcar novamente."
      },
      {
        "symptom": "Aparelho mostra horário diferente do espelho",
        "check": "O horário local informado pode diferir do horário recebido pelo servidor.",
        "next": "Leia os campos de ocorrência/recebimento e o status; não altere o relógio do aparelho."
      }
    ]
  },
  {
    "id": "inconsistencias",
    "category": "Conferência diária",
    "title": "Revisar inconsistências diárias sem presumir falta",
    "summary": "Use a lista como sinal para conferência, compare a sequência com o espelho e preserve a decisão em fluxo auditável.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 6,
    "flow": [
      "Inconsistências diárias",
      "Abra o espelho do dia",
      "Investigue antes de agir"
    ],
    "image": "./assets/academy/tour-inconsistencias.png",
    "imageAlt": "Tela de inconsistências diárias",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "A página aponta dias com quantidade ímpar de marcações validadas. Isso indica que o dia merece revisão; não prova sozinho que houve falta ou fraude."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Inconsistências diárias",
            "Confira colaborador, data, contagem, primeira/última marca e situação. A página agrupa os dados pelo fuso horário da empresa."
          ],
          [
            "Abra o espelho da mesma pessoa e data",
            "Compare as marcas com a jornada do dia e examine notas, validação e registros de origem offline. Certifique-se de estar olhando a mesma data local e o mesmo fuso."
          ],
          [
            "Procure o contexto antes de concluir",
            "Confira se existe solicitação pendente, marca offline aguardando revisão, abono aprovado ou alteração registrada. A ausência ou a contagem ímpar não autoriza concluir motivo automaticamente."
          ],
          [
            "Escolha o fluxo adequado",
            "Se for erro informado pelo colaborador, peça que abra solicitação de ajuste. Se o registro offline estiver na fila da gestão, analise esse fluxo específico. Não acrescente marca manual como substituição sem justificativa e permissão."
          ],
          [
            "Documente o encaminhamento",
            "Quando a empresa tomar uma decisão, use a nota/justificativa apropriada e mantenha os registros originais. Depois, atualize a consulta para confirmar se a situação refletiu a revisão."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Quantidade ímpar significa ausência?",
        "answer": "Não. A tela descreve dias com quantidade ímpar de marcações validadas para conferência. Verifique jornada, registros e pedidos antes de concluir qualquer causa."
      },
      {
        "question": "Posso corrigir diretamente na lista?",
        "answer": "A tela é de conferência. Use Registros de ponto, Ajustes ou o fluxo offline indicado; a marca original é preservada."
      },
      {
        "question": "Nada aparece, mas o colaborador relata um problema.",
        "answer": "Confira período, acesso às filiais e fuso horário; depois pesquise o espelho do colaborador. Se continuar, abra chamado com data, módulo e mensagem, sem anexar dados desnecessários."
      }
    ],
    "keywords": [
      "inconsistências",
      "quantidade ímpar",
      "marcações",
      "falta",
      "conferência diária",
      "anomalies"
    ],
    "related": [
      "espelho-e-simbolos",
      "revisar-ajustes",
      "uso-offline"
    ],
    "checks": [
      "A lista é um alerta para revisão, não uma decisão sobre a pessoa.",
      "Confira o dia no espelho antes de tomar qualquer ação."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O colaborador aparece com contagem ímpar",
        "check": "A lista detecta uma sequência que merece revisão, não a causa da ocorrência.",
        "next": "Abra o espelho do mesmo dia e confira jornada, abono, marca offline e solicitações."
      },
      {
        "symptom": "A lista parece vazia",
        "check": "Pode não haver ocorrências no escopo retornado ou a filial/permissão limita a consulta.",
        "next": "Confirme o perfil/filial e atualize a página; consulte o espelho se recebeu relato específico."
      }
    ]
  },
  {
    "id": "banco-horas",
    "category": "Banco de horas",
    "title": "Consultar saldo e registrar horas pagas",
    "summary": "Filtre mês/ano, compare acumulado, horas pagas e saldo; registre pagamento apenas quando autorizado e confirmado.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 6,
    "flow": [
      "Banco de horas",
      "Selecione mês e ano",
      "Confira saldo e histórico"
    ],
    "image": "./assets/academy/tour-banco-de-horas.png",
    "imageAlt": "Tabela do Banco de Horas",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Confirme o período e a regra de banco configurada para o vínculo. O saldo usa marcações validadas e jornada atribuída."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Banco de horas",
            "A tela mostra a lista por colaborador, matrícula, acumulado, horas pagas e saldo atual. Se não tiver permissão, peça acesso adequado ao administrador titular."
          ],
          [
            "Escolha mês e ano",
            "Selecione o mês/ano a consultar e clique em Consultar. Confira a referência no formulário e se o resultado corresponde ao ciclo que pretende analisar."
          ],
          [
            "Leia os componentes do saldo",
            "Compare acumulado, horas pagas e saldo atual. A página informa que o saldo é calculado com marcas validadas e jornada vinculada; horas pagas são abatidas e registradas em auditoria."
          ],
          [
            "Investigue valores inesperados",
            "Confira escala, descanso semanal, marcas validadas, período e eventual pagamento registrado. Não altere a jornada nem registre horas pagas apenas para fazer o saldo coincidir com uma expectativa."
          ],
          [
            "Registre horas pagas somente com autorização",
            "Use Registrar horas pagas apenas quando o pagamento foi efetivamente confirmado e o responsável tem autorização. Confira a quantidade, colaborador e confirmação do diálogo; a ação reduz o saldo, mas não muda as batidas originais."
          ],
          [
            "Confira a atualização",
            "Atualize a listagem e confirme saldo, total pago e, se houver, a trilha de auditoria. Guarde os comprovantes conforme o processo interno da empresa."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Saldo atual é o mesmo que horas acumuladas?",
        "answer": "Não. A tabela separa acumulado, horas pagas e saldo atual. Confira cada coluna e o período."
      },
      {
        "question": "Domingo é sempre descanso no cálculo?",
        "answer": "Não presuma. A apuração segue a jornada cadastrada e a regra aplicável; confira o descanso semanal configurado para o vínculo."
      },
      {
        "question": "Registrar horas pagas altera a marcação original?",
        "answer": "Não. O portal informa que a operação reduz o saldo e fica registrada em auditoria; ela não altera batidas originais."
      },
      {
        "question": "Posso registrar pagamento para ajustar o saldo?",
        "answer": "Não. Use essa ação apenas para horas realmente pagas e autorizadas, nunca como correção ou compensação fictícia."
      }
    ],
    "keywords": [
      "banco de horas",
      "saldo",
      "horas pagas",
      "acumulado",
      "compensação",
      "extrato"
    ],
    "related": [
      "jornadas",
      "espelho-e-simbolos",
      "relatorios"
    ],
    "checks": [
      "Confira o mês/ano.",
      "Horas pagas reduzem o saldo, não alteram marcações originais."
    ],
    "note": "A tela informa que limites e prazos de compensação seguem o regime configurado para o vínculo. Confirme a regra e a autorização interna antes de registrar horas pagas.",
    "ifDifferent": [
      {
        "symptom": "Saldo mudou após registrar horas pagas",
        "check": "Horas pagas são abatidas do acumulado e exibidas separadamente.",
        "next": "Confira acumulado, horas pagas e saldo; procure o histórico/auditoria."
      },
      {
        "symptom": "Não posso registrar horas pagas",
        "check": "Essa ação exige confirmação de pagamento e pode estar restrita por perfil ou estado.",
        "next": "Use somente após confirmação real; solicite a autorização e não registre como ajuste de saldo."
      }
    ]
  },
  {
    "id": "relatorios",
    "category": "Relatórios",
    "title": "Gerar e baixar relatórios sem perder o escopo",
    "summary": "Selecione período e filial, gere a prévia e escolha CSV ou PDF; o PDF mensal coletivo só libera após fechamento.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 6,
    "flow": [
      "Relatórios",
      "Filial e período",
      "Revise antes de exportar"
    ],
    "image": "./assets/academy/tour-relatorios.png",
    "imageAlt": "Tela de Relatórios",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Defina qual informação precisa e confirme que sua conta tem acesso às filiais selecionadas."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Relatórios",
            "Escolha Relatório de registros de ponto ou Registro mensal da equipe em PDF, conforme a necessidade."
          ],
          [
            "Escolha filial e período",
            "No relatório de registros, selecione a filial ou Todas e defina datas De e Até. Confirme que o intervalo está completo e no fuso da empresa."
          ],
          [
            "Gere a consulta",
            "Selecione Gerar relatório e aguarde o resultado. Confira os nomes, datas e quantidade de registros antes de baixar qualquer arquivo."
          ],
          [
            "Exporte no formato adequado",
            "CSV pode ser aberto em planilha e permite filtrar dados; PDF é indicado para leitura/ impressão. Revise o destino de download e proteja o arquivo, pois pode conter informações de colaboradores."
          ],
          [
            "Use o PDF mensal coletivo somente no fechamento",
            "O portal informa que esse PDF fica disponível após o mês fechar, a partir do dia 1º do mês seguinte; um colaborador é apresentado por página. Se o mês ainda está aberto, aguarde o período de liberação."
          ],
          [
            "Arquivos oficiais e erros de configuração",
            "Alguns arquivos oficiais dependem de identificadores e dados legais configurados pelo responsável. Se aparecer mensagem de requisito ausente, encaminhe ao administrador titular/suporte em vez de inserir dados estimados."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O PDF do mês atual não está disponível.",
        "answer": "O PDF mensal coletivo é liberado após o fechamento completo do mês, a partir do primeiro dia seguinte. Confira o calendário e selecione um mês já fechado."
      },
      {
        "question": "Por que os totais do CSV não batem?",
        "answer": "Confira filial, período, fuso, status de validação e regras da jornada. CSV é exportação dos dados consultados; não substitui revisão do espelho."
      },
      {
        "question": "Posso enviar um relatório por e-mail para qualquer pessoa?",
        "answer": "Compartilhe somente com pessoas autorizadas e pelo canal aprovado pela empresa. Revise dados pessoais e escopo antes de enviar."
      }
    ],
    "keywords": [
      "relatório",
      "CSV",
      "PDF",
      "exportar",
      "mês fechado",
      "PDF mensal",
      "arquivo oficial"
    ],
    "related": [
      "espelho-e-simbolos",
      "banco-horas",
      "inconsistencias"
    ],
    "checks": [
      "Revise filial e datas antes de exportar.",
      "Proteja arquivos com dados de funcionários."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "PDF mensal ainda não está disponível",
        "check": "O relatório mensal coletivo depende do mês estar fechado.",
        "next": "Selecione período fechado; ele fica disponível a partir do primeiro dia do mês seguinte."
      },
      {
        "symptom": "PDF/CSV veio sem os registros esperados",
        "check": "Período, filial, permissões ou status podem limitar os dados.",
        "next": "Confirme filtros e depois compare com o espelho da pessoa/dia."
      }
    ]
  },
  {
    "id": "configuracoes-empresa",
    "category": "Organização",
    "title": "Conferir dados da empresa e das filiais",
    "summary": "Saiba em qual tela ficam dados legais, filiais, localização e regras de acesso; altere somente informação oficial.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 6,
    "flow": [
      "Configurações ou Filiais",
      "Confira empresa/unidade",
      "Salve e revise"
    ],
    "image": "./assets/academy/tour-configuracoes.png",
    "imageAlt": "Tela de Configurações",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Tenha documentação oficial e a autorização da empresa para alterar dados legais ou de localização."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Escolha a tela certa",
            "Configurações reúne informações da empresa e opções de segurança; Filiais contém unidades, departamentos e dados específicos de cada estabelecimento. Não altere dado de filial no perfil geral sem verificar o destino."
          ],
          [
            "Abra os dados da empresa",
            "No módulo Configurações, confira razão social/nome, tipo e identificador do empregador e contato de privacidade quando esses campos estiverem disponíveis."
          ],
          [
            "Revise a filial separadamente",
            "Em Filiais, confira nome, endereço, CNPJ do estabelecimento, local real, Plus Code e raio de marcação. Use dados oficiais e atualize o departamento ou a unidade no contexto correto."
          ],
          [
            "Salve apenas a alteração conferida",
            "Revise cada campo e clique Salvar. Alterações legais podem afetar exportações oficiais; não preencha com valores aproximados nem reutilize o identificador de outra filial."
          ],
          [
            "Verifique a configuração",
            "Reabra o módulo ou atualize a lista para ver o resultado. Se a gravação falhar, leia a mensagem e não repita várias vezes sem conferir se já salvou."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Qual é a diferença entre empresa e filial?",
        "answer": "Dados gerais ficam no perfil da empresa; endereço, CNPJ do estabelecimento e parâmetros de localização pertencem à unidade, quando o sistema os solicita."
      },
      {
        "question": "Posso colocar contato pessoal no campo de privacidade?",
        "answer": "Use somente o contato autorizado pela empresa para receber solicitações de privacidade."
      },
      {
        "question": "A alteração de endereço altera a localização do terminal?",
        "answer": "Não presuma. Confira os dados da filial e a associação do dispositivo separadamente; o portal pode exigir uma revisão específica do Plus Code ou do raio."
      }
    ],
    "keywords": [
      "configurações",
      "dados da empresa",
      "CNPJ",
      "filial",
      "localização",
      "privacidade",
      "endereço"
    ],
    "related": [
      "filiais-departamentos",
      "terminais-dispositivos",
      "relatorios"
    ],
    "checks": [
      "Diferencie o dado geral da empresa do dado do estabelecimento.",
      "Use documentos oficiais antes de salvar."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "Não sei se edito Empresa ou Filial",
        "check": "Dados gerais e dados específicos do estabelecimento estão em telas separadas.",
        "next": "Confira qual campo/documento é alterado; evite copiar CNPJ de uma filial para outra."
      },
      {
        "symptom": "Um valor legal está incorreto",
        "check": "Dados da empresa/estabelecimento podem alimentar documentos e arquivos oficiais.",
        "next": "Pare e obtenha o dado oficial antes de corrigir; depois valide o fluxo relacionado."
      }
    ]
  },
  {
    "id": "seguranca-conta",
    "category": "Segurança",
    "title": "Trocar senha e ativar dois fatores",
    "summary": "Proteja sua conta individual; saiba o que o código de autenticação faz e como pedir ajuda com acesso perdido.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 6,
    "flow": [
      "Segurança",
      "Senha forte",
      "Configure autenticador"
    ],
    "image": "./assets/academy/tour-seguranca.png",
    "imageAlt": "Tela de Segurança",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Faça isso somente na sua própria conta e use um dispositivo confiável para seu aplicativo autenticador."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Segurança",
            "No Portal de Gestão, selecione Segurança. A área pode mostrar status da autenticação em dois fatores e alteração de senha."
          ],
          [
            "Atualize sua senha com cuidado",
            "Informe a senha atual e escolha uma nova com pelo menos 14 caracteres, conforme a tela. Use uma combinação exclusiva que não seja a senha do e-mail ou de outro serviço."
          ],
          [
            "Ative o autenticador se disponível",
            "Selecione Configurar autenticador, leia a chave exibida pelo portal no aplicativo autenticador de sua confiança e informe o código de seis dígitos para confirmar."
          ],
          [
            "Valide o acesso seguinte",
            "Quando o status indicar ativo, saia apenas quando estiver pronto para entrar novamente. No acesso seguinte, informe senha e código atual do aplicativo."
          ],
          [
            "Se perdeu acesso ao segundo fator",
            "Não envie a chave ou código a terceiros. Contate o administrador titular ou suporte pelo canal autorizado para seguir o processo de recuperação de identidade."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Qual o tamanho mínimo da nova senha?",
        "answer": "A tela recomenda pelo menos 14 caracteres. Escolha uma senha exclusiva e não a compartilhe."
      },
      {
        "question": "Por que o código muda?",
        "answer": "O app autenticador gera códigos temporários de seis dígitos. Use o código vigente no momento da validação."
      },
      {
        "question": "Posso enviar a chave de configuração para o suporte?",
        "answer": "Não. A chave é segredo de autenticação. Nunca envie senha, chave ou código temporário por chamado, e-mail ou grupo."
      }
    ],
    "keywords": [
      "senha",
      "segurança",
      "2FA",
      "autenticador",
      "código seis dígitos",
      "perdi acesso"
    ],
    "related": [
      "primeiro-acesso",
      "acessos-contas",
      "liberar-acesso"
    ],
    "checks": [
      "Use uma senha exclusiva com pelo menos 14 caracteres.",
      "Nunca compartilhe senha, chave ou código de autenticação."
    ],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O código de dois fatores expirou",
        "check": "Os códigos do autenticador são temporários.",
        "next": "Use o código mais recente; não reutilize nem compartilhe o anterior."
      },
      {
        "symptom": "A senha nova não é aceita",
        "check": "A tela exige ao menos 14 caracteres e a senha deve ser exclusiva.",
        "next": "Crie outra frase-senha com o tamanho exigido e sem reutilizar credenciais de outros serviços."
      }
    ]
  },
  {
    "id": "abrir-chamado",
    "category": "Ajuda e suporte",
    "title": "Buscar artigos ou abrir um chamado útil",
    "summary": "Use a base de conhecimento, descreva o problema com contexto e acompanhe respostas pelo protocolo.",
    "audience": [
      "Administrador titular",
      "Gerente"
    ],
    "minutes": 5,
    "flow": [
      "Ajuda",
      "Busque um artigo",
      "Abra chamado se necessário"
    ],
    "image": "./assets/academy/tour-ajuda.png",
    "imageAlt": "Portal de Ajuda e Base de Conhecimento",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Só o administrador titular e o gerente podem abrir e acompanhar chamados pelo portal de empresa, conforme a regra atual."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Ajuda",
            "No menu do Portal de Gestão, entre em Ajuda. A tela reúne Central de Suporte, chamados e Base de Conhecimento."
          ],
          [
            "Busque pelo sintoma e módulo",
            "Use a busca com palavras como nome da tela, mensagem de erro e ação que estava realizando. Abra um artigo relacionado e compare as instruções com o seu perfil."
          ],
          [
            "Abra um novo chamado se a dúvida continuar",
            "Selecione Novo chamado, informe assunto, categoria, prioridade e uma descrição objetiva. Inclua empresa, filial, data aproximada, navegador/aparelho e os passos que levaram ao problema quando forem relevantes."
          ],
          [
            "Anexe apenas evidências necessárias",
            "A tela aceita até 5 arquivos, 20 MB por arquivo e 50 MB total. Remova senhas, códigos, CPF, rostos e dados de terceiros quando não forem necessários; não envie chaves secretas."
          ],
          [
            "Guarde o protocolo e acompanhe",
            "Confira Meus chamados, filtre por status e abra o protocolo para ler as respostas. Se a equipe pedir informação, responda na mesma conversa para manter o contexto."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Como acesso a Certus Academy?",
        "answer": "Dentro de Ajuda, localize Base de Conhecimento e selecione Abrir Certus Academy."
      },
      {
        "question": "Que informação ajuda o suporte?",
        "answer": "Inclua tela/módulo, data aproximada, o que tentou, o que esperava e a mensagem exibida. Evite enviar credenciais ou dados pessoais desnecessários."
      },
      {
        "question": "Posso anexar um vídeo?",
        "answer": "O fluxo aceita anexos dentro dos limites mostrados no formulário. Se o arquivo não puder ser anexado, descreva o problema e peça ao suporte o canal apropriado; não envie link público com dados privados."
      }
    ],
    "keywords": [
      "ajuda",
      "chamado",
      "artigo",
      "suporte",
      "protocolo",
      "anexos",
      "academy"
    ],
    "related": [
      "primeiro-acesso",
      "relatorios",
      "uso-offline"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O anexo é recusado",
        "check": "Arquivo individual acima de 20 MB, mais de cinco arquivos ou total acima de 50 MB não passa pelo limite exibido.",
        "next": "Reduza a quantidade/tamanho e retire dados sensíveis desnecessários."
      },
      {
        "symptom": "Não consigo criar o chamado",
        "check": "O portal libera a ação ao administrador titular e ao gerente.",
        "next": "Confirme o perfil; peça a um usuário autorizado que abra o chamado com seu contexto."
      }
    ]
  },
  {
    "id": "senha-perdida",
    "category": "Segurança",
    "title": "Esqueci minha senha: o que fazer",
    "summary": "Use o fluxo oficial da empresa e evite compartilhar senha temporária ou códigos de autenticação.",
    "audience": [
      "Colaborador",
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 4,
    "flow": [
      "Confirme o portal",
      "Peça redefinição oficial",
      "Entre e troque a senha"
    ],
    "image": "./assets/academy/tour-seguranca.png",
    "imageAlt": "Tela de Segurança",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Não use links de redefinição recebidos de remetentes desconhecidos. O processo depende do perfil e da configuração da empresa."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Confirme se está no portal certo",
            "Gestores entram pela área de gestão; colaboradores entram pelo Portal do Colaborador e usam o identificador da empresa. Verifique antes de pedir redefinição."
          ],
          [
            "Peça ajuda ao responsável correto",
            "No fluxo de gestão, a recuperação automática por e-mail pode ainda não estar configurada; a tela orienta o usuário a pedir ao administrador titular para redefinir o acesso."
          ],
          [
            "Receba uma senha inicial por canal privado",
            "O administrador titular deve usar o fluxo oficial e entregar credencial temporária diretamente. Não poste a senha em grupo ou chamado."
          ],
          [
            "Troque a senha ao entrar",
            "Se o portal solicitar primeiro acesso, crie uma senha pessoal com pelo menos 14 caracteres conforme o sistema orienta. Depois, confirme que sua conta está protegida e não compartilhe o acesso."
          ],
          [
            "Trate o autenticador separadamente",
            "Se também perdeu o app de dois fatores, avise o responsável. Não envie códigos, segredo ou captura da tela de configuração para ninguém."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O botão Esqueci minha senha envia um e-mail?",
        "answer": "A tela atual informa que a recuperação automática por e-mail ainda não está configurada e orienta pedir ajuda ao administrador titular."
      },
      {
        "question": "Meu gestor pode ver minha senha antiga?",
        "answer": "Não peça que alguém informe sua senha antiga. Use o procedimento de redefinição oficial; a senha deve ser pessoal."
      },
      {
        "question": "Recebi um link por mensagem. É seguro?",
        "answer": "Não abra link de remetente desconhecido nem forneça código. Acesse o endereço conhecido do portal diretamente e confirme com o administrador titular."
      }
    ],
    "keywords": [
      "esqueci senha",
      "recuperar acesso",
      "senha temporária",
      "reset",
      "login bloqueado"
    ],
    "related": [
      "seguranca-conta",
      "liberar-acesso",
      "primeiro-acesso"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O link de redefinição não chegou",
        "check": "A recuperação automática por e-mail ainda pode não estar configurada no fluxo de gestão.",
        "next": "Peça ao administrador titular para iniciar a redefinição oficial."
      },
      {
        "symptom": "Tenho senha mas perdi o autenticador",
        "check": "Senha e segundo fator são controles diferentes.",
        "next": "Não compartilhe código; procure o responsável para recuperação da identidade."
      }
    ]
  },
  {
    "id": "abono-manual",
    "category": "Ajustes e justificativas",
    "title": "Registrar abono direto pela gestão",
    "summary": "Use o fluxo manual somente quando autorizado; escolha data, tipo, motivo e confira o efeito imediato e a auditoria.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 6,
    "flow": [
      "Registros de ponto",
      "Abono",
      "Revise antes de registrar"
    ],
    "image": "./assets/academy/tour-ajustes.png",
    "imageAlt": "Tela de apoio a ajustes e conferência",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Um abono direto é aplicado imediatamente, sem etapa de aprovação do colaborador, e fica em auditoria. Confirme autorização interna, data, categoria e motivo antes de começar."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra o espelho da pessoa correta",
            "Em Registros de ponto, selecione colaborador e data do período. Confirme nome, filial, jornada e dia antes de lançar qualquer abono."
          ],
          [
            "Inicie o fluxo Abono",
            "Use a ação de abono direto disponível na tela de registros. Se a ação não aparecer, sua conta pode não ter permissão; não tente contornar acessos."
          ],
          [
            "Escolha o tipo e o escopo",
            "Selecione Abono de dia ou Abono de horas. Informe a data. Para horas, preencha início e fim; para dia, confira a data e o intervalo de datas solicitado pelo sistema."
          ],
          [
            "Classifique e descreva o motivo",
            "Escolha a categoria apresentada (por exemplo, feriado, atestado ou outro) e escreva uma justificativa clara e baseada em documento/decisão confirmada."
          ],
          [
            "Revise o resumo antes de confirmar",
            "Confira tipo, colaborador, data/horários, categoria, motivo e responsável. O lançamento será aplicado imediatamente e não aguardará uma aprovação adicional."
          ],
          [
            "Confira espelho e auditoria",
            "Após salvar, revise o espelho para confirmar o resultado e veja o histórico/auditoria. Se algo ficou incorreto, não lance outro abono para compensar; use o processo autorizado de correção e registre justificativa."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O abono direto aguarda aprovação?",
        "answer": "Não. A tela informa que o lançamento é aplicado imediatamente, sem fluxo de aprovação, e fica em auditoria."
      },
      {
        "question": "Posso lançar porque o colaborador pediu?",
        "answer": "O pedido por si só não substitui a autorização ou a documentação exigida pela empresa. Revise o caso e a regra interna antes de usar um lançamento direto."
      },
      {
        "question": "Posso apagar o registro original?",
        "answer": "Não. Preserve registros originais. O lançamento de abono é uma informação separada e deve permanecer rastreável."
      }
    ],
    "keywords": [
      "abono direto",
      "abono dia",
      "abono horas",
      "feriado",
      "atestado",
      "auditoria",
      "ajuste manual"
    ],
    "related": [
      "ajustes-ponto",
      "revisar-ajustes",
      "espelho-e-simbolos"
    ],
    "checks": [
      "Abono direto entra imediatamente, sem aprovação pendente.",
      "Registre motivo e confirme os dados antes de salvar."
    ],
    "note": "Use abono direto somente com autorização e documentação adequada da empresa. Este guia descreve a tela; não substitui decisão do RH nem regra legal aplicável.",
    "ifDifferent": [
      {
        "symptom": "Os campos de horário não aparecem",
        "check": "Eles só surgem quando Abono de horas é selecionado.",
        "next": "Escolha o tipo correto e informe início e fim antes de confirmar."
      },
      {
        "symptom": "O lançamento foi aplicado imediatamente",
        "check": "O abono direto não usa fila de aprovação.",
        "next": "Confira o colaborador/dia no espelho e a auditoria; se incorreto, siga o fluxo autorizado de correção."
      }
    ]
  },
  {
    "id": "termos-espelho",
    "category": "Registro de ponto",
    "title": "Entender status e termos do espelho",
    "summary": "Diferencie horário, origem, validação, solicitação e saldo para interpretar os dados com precisão.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 5,
    "flow": [
      "Identifique o campo",
      "Leia status e origem",
      "Consulte histórico"
    ],
    "image": "./assets/academy/tour-registros-de-ponto.png",
    "imageAlt": "Espelho demonstrativo do Certus",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Este guia explica rótulos de interface; decisões de jornada e aprovação devem ser confirmadas pelos responsáveis."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Marcações",
            "São os horários e tipos de evento apresentados para o dia. Confirme a sequência e a data no fuso da empresa."
          ],
          [
            "Origem",
            "# sinaliza marca offline. * identifica lançamento manual/ajuste. A origem informa como o registro surgiu; não diz por si só se foi aprovado."
          ],
          [
            "Validação",
            "Status como pendente, validado, revisão ou outro rótulo indicam a situação do processamento/avaliação. Leia o texto da tela e não deduza a situação pelo símbolo."
          ],
          [
            "Solicitação",
            "Um pedido de ajuste pertence a um fluxo de análise. Enquanto estiver pendente, não o trate como alteração concluída."
          ],
          [
            "Saldo e total",
            "Trabalhado, previsto, crédito/abono e saldo diário são medidas distintas. Confira o cabeçalho/legenda e a coluna da data antes de somar ou comparar valores."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "O símbolo # quer dizer que o horário foi conferido?",
        "answer": "Não. Ele identifica origem offline; consulte separadamente o status de validação."
      },
      {
        "question": "O * representa um erro?",
        "answer": "Não necessariamente. Marca lançamento manual/ajuste; abra detalhes e auditoria para entender a justificativa."
      },
      {
        "question": "Pendente significa recusado?",
        "answer": "Não. Pendente indica que a etapa ainda não foi concluída; procure o fluxo e aguarde a decisão."
      }
    ],
    "keywords": [
      "status",
      "validado",
      "pendente",
      "origem",
      "símbolos",
      "saldo",
      "legenda"
    ],
    "related": [
      "espelho-e-simbolos",
      "uso-offline",
      "revisar-ajustes"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "O símbolo e o status parecem contradizer um ao outro",
        "check": "Símbolo representa a origem; status representa validação.",
        "next": "Leia os dois campos e procure o histórico antes de interpretar."
      },
      {
        "symptom": "Não entendo o saldo diário",
        "check": "Saldo depende de jornada, sequência de marcas, abonos e apuração do dia.",
        "next": "Abra os detalhes; se estiver pendente, aguarde dados completos em vez de concluir ausência."
      }
    ]
  },
  {
    "id": "troubleshooting-portal",
    "category": "Solução de dúvidas",
    "title": "Portal não carrega, botão não aparece ou aparece erro",
    "summary": "Siga uma triagem segura antes de repetir ações ou abrir chamado.",
    "audience": [
      "Colaborador",
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 5,
    "flow": [
      "Confira conexão e endereço",
      "Leia mensagem",
      "Reúna contexto"
    ],
    "image": "./assets/academy/tour-ajuda.png",
    "imageAlt": "Central de Ajuda",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "Não compartilhe senha, CPF ou códigos para tentar diagnosticar o erro."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Confira o endereço e a conexão",
            "Abra o portal pelo endereço habitual e confirme que a conexão funciona em outras páginas. Evite links de remetentes desconhecidos."
          ],
          [
            "Leia a mensagem completa",
            "Anote o texto, o módulo, a hora aproximada e a ação que estava fazendo. Não atualize várias vezes se havia uma gravação em andamento."
          ],
          [
            "Confira perfil e filial",
            "Se o botão ou módulo não aparece, confirme a conta, perfil e filial autorizada. Oculte opções indisponíveis não significa que a conta está quebrada."
          ],
          [
            "Tente uma atualização segura",
            "Se não havia gravação pendente, recarregue uma vez ou feche e abra novamente a página. No caso de terminal compartilhado ou fluxo offline, não limpe os dados do navegador."
          ],
          [
            "Abra chamado com evidência mínima",
            "Se o problema persistir, inclua passos, dispositivo/navegador, horário e captura sem credenciais ou dados pessoais desnecessários. Informe se afetou uma pessoa ou toda a empresa."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Posso limpar cache/dados do terminal?",
        "answer": "Não faça isso em aparelho com terminal compartilhado ou marca offline pendente. Procure a gestão para usar o fluxo oficial."
      },
      {
        "question": "A tela fica carregando depois de salvar.",
        "answer": "Confira primeiro a lista ou histórico para saber se a gravação foi concluída antes de repetir a ação."
      },
      {
        "question": "Que dados devo ocultar na captura?",
        "answer": "Oculte senhas, tokens, códigos de autenticação, CPF, dados bancários e informações de outros colaboradores que não sejam necessárias ao chamado."
      }
    ],
    "keywords": [
      "erro",
      "não carrega",
      "botão sumiu",
      "falha",
      "portal",
      "cache",
      "chamado"
    ],
    "related": [
      "abrir-chamado",
      "uso-offline",
      "primeiro-acesso"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "A página não responde após Salvar",
        "check": "A gravação pode ter concluído mesmo sem atualizar o conteúdo.",
        "next": "Confira lista/histórico antes de tentar novamente; assim você evita duplicar uma ação."
      },
      {
        "symptom": "A ação aparece desabilitada",
        "check": "Permissão, prazo, status do dia ou campo obrigatório podem estar bloqueando.",
        "next": "Leia o texto junto do controle, verifique perfil/escopo e não tente contornar o bloqueio."
      }
    ]
  },
  {
    "id": "assinatura-faturas",
    "category": "Assinatura",
    "title": "Consultar plano, faturas e período da empresa",
    "summary": "Veja quem pode acessar a assinatura, como conferir o ciclo e onde validar as informações antes de qualquer ação.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 5,
    "flow": [
      "Assinatura",
      "Revise plano e ciclo",
      "Confira fatura e status"
    ],
    "image": "./assets/academy/tour-assinatura.png",
    "imageAlt": "Tela demonstrativa de assinatura e cobrança",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e registros da imagem são exemplos; sua tela mostra os dados autorizados da sua empresa.",
    "before": [
      "O módulo é reservado ao administrador titular original da empresa. Consulte documentos e valores somente na conta autorizada."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Assinatura e cobrança",
            "No Portal de Gestão, selecione Assinatura se essa opção estiver disponível para sua conta. O menu pode aparecer somente para o administrador titular original da empresa."
          ],
          [
            "Confira plano e periodicidade",
            "Leia plano, periodicidade, valor exibido e status no cabeçalho da página. Compare com o ciclo vigente e com o contrato/decisão interna antes de iniciar mudança."
          ],
          [
            "Revise faturas com calma",
            "Confira o mês, número, vencimento e situação da fatura apresentada. Se houver detalhamento de principal e juros, leia cada parcela e o total sem interpretar um link como confirmação de pagamento."
          ],
          [
            "Entenda mudança ou ativação",
            "Se a empresa quiser ativar ou mudar um plano, o titular deve revisar a opção e o período antes de usar o botão. A tela pode iniciar um checkout; não clique se não estiver autorizado a iniciar esse pagamento."
          ],
          [
            "Confirme o estado depois da ação",
            "Após uma mudança solicitada, volte à página e confira se o status foi atualizado. Não repita checkout nem considere pagamento confirmado por uma tela que apenas abriu o link do provedor."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Por que não aparece Assinatura?",
        "answer": "O módulo é reservado ao administrador titular original. Gerentes e outros perfis devem pedir ao titular que confira o plano."
      },
      {
        "question": "Link de checkout significa que a fatura foi paga?",
        "answer": "Não. A abertura do link é uma etapa de pagamento; confira a situação da fatura e a confirmação mostradas pelo fluxo antes de considerar concluído."
      },
      {
        "question": "Posso trocar de plano pela conta de gerente?",
        "answer": "Não presuma que pode. A assinatura pertence ao titular original e deve ser conferida e autorizada por ele."
      },
      {
        "question": "A fatura mostra juros?",
        "answer": "Leia o detalhamento exibido no portal, incluindo principal, dias e valor informado. Se houver dúvida, não pague por fora do fluxo oficial; peça esclarecimento ao titular/suporte."
      }
    ],
    "keywords": [
      "assinatura",
      "plano",
      "fatura",
      "vencimento",
      "periodicidade",
      "checkout",
      "cobrança"
    ],
    "related": [
      "acessos-contas",
      "abrir-chamado"
    ],
    "checks": [],
    "note": "Os nomes dos botões e os recursos disponíveis podem variar conforme o perfil, as permissões da empresa e a versão do portal. Siga sempre os dados e confirmações apresentados na sua tela.",
    "ifDifferent": [
      {
        "symptom": "A fatura ainda consta como aberta depois do checkout",
        "check": "Abrir ou concluir uma etapa no provedor não é o mesmo que o Certus confirmar o recebimento.",
        "next": "Não pague em duplicidade; atualize a tela e confira o status oficial com o titular/suporte."
      },
      {
        "symptom": "O módulo não aparece para mim",
        "check": "A assinatura é controlada pelo administrador titular original.",
        "next": "Peça ao titular para consultar o plano; não use outra conta de administrador."
      }
    ]
  },
  {
    "id": "marcas-manuais",
    "category": "Registro de ponto",
    "title": "Incluir, editar ou excluir uma marcação manual",
    "summary": "Corrija somente lançamentos manuais elegíveis, respeite o prazo da tela e deixe justificativa rastreável em cada tratamento.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH"
    ],
    "minutes": 7,
    "flow": [
      "Registros de ponto",
      "Selecione pessoa e dia passado",
      "Revise motivo e auditoria"
    ],
    "image": "./assets/academy/tour-registros-de-ponto.png",
    "imageAlt": "Tela de Registros de Ponto",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e horários não representam colaboradores reais.",
    "before": [
      "Tenha a correção documentada e confirme o dia no fuso da empresa. O portal só permite inclusão em dia anterior e exibe o prazo de ajustes do mês.",
      "Marcações originais do relógio são imutáveis; apenas lançamentos incluídos manualmente podem ter Editar/Excluir."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Localize colaborador e data",
            "Em Registros de ponto, selecione a pessoa, o período e o dia correto. Confirme nome, filial, data local e marcações existentes."
          ],
          [
            "Confira elegibilidade e prazo",
            "O botão de inclusão fica desativado para hoje/futuro e após o prazo mensal exibido. O prazo é visível junto do fluxo; não interprete indisponibilidade como falha do sistema."
          ],
          [
            "Inclua uma marca somente quando houver justificativa",
            "Selecione Adicionar marcação manual, informe data, horário, tipo (entrada, início/fim do intervalo ou saída final) e justificativa com pelo menos cinco caracteres. Para dia sem registros, o portal conduz uma sequência em ordem; siga a etapa indicada e confira a contagem."
          ],
          [
            "Revise antes de confirmar",
            "Confira colaborador, data, hora, tipo e motivo. A inclusão recebe * no espelho e fica registrada com responsável e histórico."
          ],
          [
            "Edite apenas uma inclusão manual",
            "Se a marca mostrar ações Editar/Excluir, confira que é lançamento manual. Para editar, informe a justificativa e revise hora/tipo; a data é exibida como somente leitura."
          ],
          [
            "Exclua apenas uma inclusão manual incorreta",
            "Selecione Excluir, leia a confirmação e informe a justificativa. A inclusão deixa de integrar cálculos, mas seu tratamento permanece na auditoria."
          ],
          [
            "Valide o espelho e a auditoria",
            "Depois de cada ação, atualize o espelho. Confira o saldo/total do dia e abra Histórico de tratamentos; confirme operação, antes/depois, responsável e motivo."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Posso editar uma batida original do relógio?",
        "answer": "Não. Batidas originais são imutáveis. Use o fluxo de solicitação/decisão quando precisar corrigir um registro original."
      },
      {
        "question": "Por que o botão de inclusão está desativado?",
        "answer": "Hoje e datas futuras não são elegíveis, e há um prazo mensal que o portal exibe. Confira o dia selecionado e a data-limite mostrada."
      },
      {
        "question": "O que é a sequência de dia sem marcações?",
        "answer": "Para um dia sem marcas, o portal conduz até quatro etapas em ordem: entrada, saída para intervalo, retorno e saída final. Siga a etapa apresentada; não escolha uma sequência arbitrária."
      },
      {
        "question": "Excluir uma inclusão apaga o histórico?",
        "answer": "Não. A tela informa que a inclusão deixa de integrar os cálculos, enquanto o evento e a justificativa permanecem na auditoria."
      },
      {
        "question": "A marca manual conta como batida confirmada de relógio?",
        "answer": "Não. Ela é identificada como lançamento manual/ajuste e deve ser interpretada conforme o estado e o histórico próprios."
      }
    ],
    "keywords": [
      "marca manual",
      "adicionar marcação",
      "editar lançamento",
      "excluir marcação",
      "prazo",
      "auditoria",
      "justificativa"
    ],
    "related": [
      "espelho-e-simbolos",
      "revisar-ajustes",
      "abono-manual"
    ],
    "checks": [
      "Data elegível e prazo ainda aberto.",
      "Só altere uma inclusão manual, nunca uma batida original.",
      "Justificativa e responsável ficam auditados."
    ],
    "note": "Esta orientação descreve controles do portal; faça alterações apenas dentro da autorização, documentação e processo interno da empresa.",
    "ifDifferent": [
      {
        "symptom": "Botões Editar e Excluir não aparecem",
        "check": "A linha pode ser uma batida original, um ajuste aprovado, o dia pode estar fora do prazo ou a data pode ser hoje/futura.",
        "next": "Não tente alterar a batida original; confira o tipo e a data. Só uma inclusão manual elegível oferece esses controles."
      },
      {
        "symptom": "Inclusão manual foi recusada",
        "check": "Revise data passada, horário, tipo, justificativa de pelo menos cinco caracteres e a etapa da sequência do dia.",
        "next": "Corrija o dado confirmado e reenvie uma vez; se o prazo exibido terminou, não contorne o bloqueio."
      }
    ]
  },
  {
    "id": "decidir-offline",
    "category": "Continuidade e sincronização",
    "title": "Analisar uma marca offline pendente",
    "summary": "Compare horário informado e recebido, confira a jornada e registre Aprovar/Rejeitar com justificativa; o status deve ser verificado depois.",
    "audience": [
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 6,
    "flow": [
      "Inconsistências diárias",
      "Marcações offline para análise",
      "Decida e confira auditoria"
    ],
    "image": "./assets/academy/tour-inconsistencias.png",
    "imageAlt": "Área de revisão de marcações pendentes",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e horários não representam colaboradores reais.",
    "before": [
      "A fila mostra dados de origem, mas o horário informado pelo aparelho não é prova independente. A decisão deve seguir a conferência e a política da empresa."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Abra Inconsistências diárias",
            "Na parte superior pode aparecer Marcações offline para análise. Se a lista não aparecer, pode não haver pendências no momento."
          ],
          [
            "Compare os dados da linha",
            "Confira nome, tipo de evento, horário informado e momento em que o sistema recebeu o registro. Não confunda o horário ocorrido no aparelho com o recebimento pelo servidor."
          ],
          [
            "Confira o contexto antes de decidir",
            "Abra o espelho da pessoa e do dia, confira jornada, sequência, filial e outros registros. Verifique se há duplicidade, pedido de ajuste ou contexto comunicado pela gestão."
          ],
          [
            "Registre decisão com motivo",
            "Escolha Aprovar ou Rejeitar. O portal solicita justificativa de no mínimo três caracteres; descreva objetivamente o que foi conferido, sem incluir dado pessoal desnecessário."
          ],
          [
            "Confirme o resultado e a trilha",
            "Após salvar, a lista é atualizada. Confira se o item saiu da pendência, abra o espelho e veja o status/origem; a decisão fica registrada em auditoria."
          ],
          [
            "Se não houver evidência suficiente",
            "Não aprove automaticamente por conveniência nem rejeite apenas pelo símbolo #. Peça contexto ao responsável/colaborador e use a política da empresa antes de concluir."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Aprovar muda o horário informado?",
        "answer": "A ação registra a decisão sobre a marca pendente; leia o horário e o status atualizado depois. Não interprete como edição do dado originalmente recebido."
      },
      {
        "question": "A hora do aparelho é igual à hora de recebimento?",
        "answer": "Não necessariamente. A página mostra campos separados para horário informado e recebido; registre essa diferença ao conferir."
      },
      {
        "question": "O item voltou a aparecer após a decisão?",
        "answer": "Atualize a lista e confira o histórico do colaborador. Se continuar pendente, evite repetir a decisão e abra chamado com data, protocolo/identificador visível e captura sem dados pessoais desnecessários."
      },
      {
        "question": "O que significa #?",
        "answer": "Marca origem offline; o estado de validação é separado e deve ser lido junto da decisão."
      }
    ],
    "keywords": [
      "aprovar marca offline",
      "rejeitar offline",
      "pendência offline",
      "horário informado",
      "horário recebido",
      "decisão auditoria"
    ],
    "related": [
      "uso-offline",
      "espelho-e-simbolos",
      "inconsistencias",
      "marcas-manuais"
    ],
    "checks": [
      "Compare hora informada e recebida.",
      "Leia a jornada e a sequência antes de decidir.",
      "Registre justificativa e valide o status depois."
    ],
    "note": "A decisão cabe à gestão autorizada e deve estar respaldada pelo processo da empresa; a interface não determina por si só a veracidade do horário.",
    "ifDifferent": [
      {
        "symptom": "A fila de pendências está vazia",
        "check": "A tela só mostra itens pendentes; a marca pode já ter decisão ou ainda não ter chegado ao servidor.",
        "next": "Confira o histórico da pessoa e o aparelho; não conclua que a marca nunca ocorreu."
      },
      {
        "symptom": "A decisão foi recusada",
        "check": "Verifique se informou justificativa com pelo menos três caracteres e se o item ainda está pendente.",
        "next": "Atualize a página uma vez e leia o status antes de tentar novamente."
      }
    ]
  },
  {
    "id": "glossario-certus",
    "category": "Primeiros passos",
    "title": "Glossário rápido: termos e símbolos do Certus",
    "summary": "Entenda os rótulos mais comuns da Academy, do espelho e dos cadastros antes de interpretar números e pedidos.",
    "audience": [
      "Colaborador",
      "Administrador titular",
      "Gerente",
      "RH",
      "Supervisor"
    ],
    "minutes": 5,
    "flow": [
      "Identifique o módulo",
      "Leia o termo no contexto",
      "Confira a orientação do fluxo"
    ],
    "image": "./assets/academy/tour-registros-de-ponto.png",
    "imageAlt": "Espelho demonstrativo com símbolos",
    "imageCaption": "Captura demonstrativa do Certus com dados fictícios. Os nomes e horários não representam colaboradores reais.",
    "before": [
      "O mesmo termo pode ser usado em contextos de cadastro e de apuração; confira o módulo e a legenda da tela."
    ],
    "sections": [
      {
        "title": "Passo a passo",
        "steps": [
          [
            "Filial",
            "Unidade do estabelecimento associada à equipe, localização e escopo de acesso. CNPJ/endereço e geofence são específicos da filial quando solicitados."
          ],
          [
            "Jornada e escala",
            "Cadastro de horários/intervalos por dia ou ciclo de trabalho. A prévia de carga horária ajuda a revisar o preenchimento; não substitui validação do RH e documentos aplicáveis."
          ],
          [
            "DSR",
            "Descanso semanal remunerado indicado conforme o vínculo e a jornada configurados. Não presuma que o domingo é sempre o dia de descanso."
          ],
          [
            "Marcação original e lançamento manual",
            "Marca original vem do fluxo de registro; marca manual é incluída por processo autorizado e aparece com *. Marcação original não pode ser editada/excluída; inclusão manual elegível tem justificativa e auditoria."
          ],
          [
            "#, *, pendente e validado",
            "# indica origem offline; * marca lançamento manual ou ajuste aprovado. Pendente/validado descreve estado, não origem. Leia os dois elementos em conjunto."
          ],
          [
            "Ajuste, retificação e abono",
            "Ajuste pede análise de uma marca proposta; retificação aponta uma marca original específica para possível exclusão do cálculo se aprovada; abono registra tratamento de dia ou horas no fluxo aplicável."
          ],
          [
            "Saldo, total trabalhado e horas pagas",
            "Total trabalhado resume marcas consideradas; saldo compara dados apurados com a jornada/regra aplicável; horas pagas são abatimento separado no banco de horas e não reescrevem batidas."
          ],
          [
            "CSV e PDF",
            "CSV é arquivo tabular para análise/planilha; PDF é documento para leitura/impressão. Ambos refletem filtros, permissões e status disponíveis na consulta."
          ],
          [
            "Plus Code e geofence",
            "Plus Code representa uma localização; geofence é o raio de distância exibido para o local de marcação. Use endereço/local oficial e confira o ponto convertido."
          ],
          [
            "REP-A e identificador da empresa",
            "REP-A é citado em fluxos/documentos de registro eletrônico alternativo; identificadores oficiais devem ser reais e confirmados. Não inicialize ou altere configuração legal sem autorização."
          ]
        ]
      }
    ],
    "faqs": [
      {
        "question": "Pendente quer dizer recusado?",
        "answer": "Não. Pendente indica que ainda há etapa de conferência; consulte o fluxo e aguarde decisão."
      },
      {
        "question": "O * quer dizer que a marca é inválida?",
        "answer": "Não por si só. Ele indica lançamento manual/ajuste aprovado. Confira motivo, responsável, validação e auditoria."
      },
      {
        "question": "O saldo é igual ao total trabalhado?",
        "answer": "Não necessariamente. Total trabalhado, jornada prevista, abono, saldo e horas pagas são campos diferentes; leia o cabeçalho e o período."
      },
      {
        "question": "REP-A é o mesmo que ponto pelo celular?",
        "answer": "Não use os termos como sinônimos. A configuração e os documentos seguem fluxos próprios do sistema; confira os dados da filial e a orientação oficial."
      },
      {
        "question": "DSR é sempre no domingo?",
        "answer": "Não. O descanso depende da jornada/escala e do contexto do vínculo."
      }
    ],
    "keywords": [
      "glossário",
      "termos",
      "siglas",
      "DSR",
      "REP-A",
      "Plus Code",
      "geofence",
      "pendente",
      "validado",
      "#",
      "*",
      "saldo"
    ],
    "related": [
      "primeiro-acesso",
      "jornadas",
      "espelho-e-simbolos",
      "decidir-offline",
      "marcas-manuais"
    ],
    "checks": [
      "Leia status e origem separadamente.",
      "Confira o módulo, a pessoa, o período e o fuso.",
      "Consulte o guia detalhado do assunto antes de agir."
    ],
    "note": "Este glossário explica termos da interface; não é interpretação jurídica nem validação do enquadramento de um vínculo.",
    "ifDifferent": [
      {
        "symptom": "O mesmo nome de campo aparece em duas telas",
        "check": "Confirme se está em cadastro, espelho, solicitação ou relatório; os efeitos são diferentes.",
        "next": "Abra o guia do módulo relacionado e confira o contexto antes de agir."
      }
    ],
    "terms": [
      {
        "term": "Filial",
        "meaning": "Unidade/estabelecimento que pode ter endereço, CNPJ, equipe e geofence próprios."
      },
      {
        "term": "Jornada",
        "meaning": "Horários, intervalos e descansos previstos para cada dia."
      },
      {
        "term": "DSR",
        "meaning": "Descanso semanal remunerado conforme jornada e vínculo; o dia não deve ser presumido."
      },
      {
        "term": "Marcação original",
        "meaning": "Registro recebido pelo fluxo do relógio; não é editável nem excluível como lançamento manual."
      },
      {
        "term": "Lançamento manual",
        "meaning": "Registro incluído pela gestão com justificativa e trilha de auditoria; pode ter controles próprios se elegível."
      },
      {
        "term": "# e *",
        "meaning": "# identifica origem offline; * sinaliza marca manual ou ajuste aprovado. O status de validação é consultado separadamente."
      },
      {
        "term": "Ajuste",
        "meaning": "Pedido que solicita análise de uma correção."
      },
      {
        "term": "Retificação",
        "meaning": "Pedido que identifica uma marca original para possível exclusão dos cálculos se aprovado."
      },
      {
        "term": "Abono",
        "meaning": "Tratamento de dia ou horas no fluxo aplicável; confirme se é pedido sujeito a análise ou lançamento direto."
      },
      {
        "term": "Saldo diário",
        "meaning": "Resultado apurado quando jornada e marcas permitem calcular; ausência não é debitada automaticamente."
      },
      {
        "term": "Banco de horas",
        "meaning": "Visão de acumulado, horas pagas e saldo, usando marcas validadas e jornada vinculada."
      },
      {
        "term": "CSV / PDF",
        "meaning": "CSV é tabular para análise em planilha; PDF é paginado para leitura/impressão. Ambos respeitam os filtros da consulta."
      },
      {
        "term": "Plus Code / geofence",
        "meaning": "Código de localização da filial e raio permitido ao redor do ponto configurado."
      },
      {
        "term": "REP-A",
        "meaning": "Regime de registro eletrônico alternativo, citado em fluxos próprios. Dados e configuração exigem confirmação documental."
      }
    ]
  }
];
