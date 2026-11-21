# Certus — laboratório isolado de leitura facial

**Demonstração técnica, não um sistema de prova de vida/PAD e não um relógio de ponto.** A página é independente e não foi conectada ao login, cadastro facial, API, serviço offline ou banco de dados da Certus. Não utilizar para funcionários, identidade, presença, jornada, sanções ou controle de acesso.

## Implementação desta rodada

- Interface de laboratório responsiva com prévia espelhada, consentimento explícito, enquadramento guiado, estados acessíveis e mensagens distintas para cada fase.
- MediaPipe Face Landmarker (`@mediapipe/tasks-vision` 1.2.3), com landmarks 3D e scores de blendshape `eyeBlinkLeft`/`eyeBlinkRight`; tenta GPU e recua para CPU. Biblioteca e modelo só são requisitados depois de tocar em “Iniciar diagnóstico”.
- Calibração local dos dois olhos, leitura percentual de cada olho, pose facial relativa à posição neutra, desafio de movimentos em ordem aleatória, diagnóstico em tela, limite de tempo e encerramento explícito da câmera.
- O processamento da imagem fica no navegador. A página não grava nem envia quadros, vídeo, templates ou movimentos para um servidor próprio. Biblioteca, WASM e modelo são baixados de jsDelivr e Google Cloud Storage; esses provedores recebem as requisições e dados comuns de conexão, como IP. Isso deve constar em qualquer avaliação de privacidade.
- `core.js` concentra funções puras e autochecagens sintéticas; `core.test.cjs` contém testes unitários para blendshapes, enquadramento, pose, ordem do desafio e autochecagem; `app.js` cuida da sessão; `index.html` apresenta a demonstração. A tela mostra o resultado agregado da autochecagem (7/7) sem usar câmera.
- `FINAL_TEST_PROTOCOL.md` traz roteiro para cinco sessões repetidas, condições de captura, negações/interrupções, testes limitados com foto/vídeo e tabela de anotação que não inclui dados faciais.

## O que isto NÃO prova

Os landmarks/blendshapes são uma estimativa de expressão e pose. Um desafio de piscar e virar a cabeça é apenas detecção de movimento: não detecta de forma robusta fotos, vídeos, máscaras, deepfakes, injeção de câmera ou replay adaptativo. O uso de uma biblioteca moderna melhora a instrumentação da captura, mas não converte a heurística em PAD. Os thresholds ainda não foram calibrados com dados de dispositivos e população, e não há medições de falsos aceites, falsas rejeições, viés ou desempenho.

## Referências e trilha para uma solução real

- MediaPipe Face Landmarker produz landmarks 3D, blendshape scores e matrizes de transformação; a documentação o descreve para landmarks, expressões e efeitos, não como certificação PAD: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
- ISO/IEC 30107-3:2023 define princípios, métodos de avaliação e reporte de mecanismos PAD; não prescreve um algoritmo nem substitui avaliação de segurança global: https://www.iso.org/standard/79520.html
- NIST FATE PAD publica avaliações de algoritmos de PAD e descreve riscos de apresentação como fotos e replay de vídeo: https://pages.nist.gov/frvt/html/frvt_pad.html
- A LGPD define dado biométrico vinculado a pessoa natural como dado pessoal sensível (art. 5º, II): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

Antes de qualquer uso operacional: threat model específico para o terminal/celular e vetores digitais; laboratório independente ISO/IEC 30107-3:2023 com PAIs e tentativas de replay/injeção; avaliação estatística de falso aceite/rejeição e diferenças demográficas; teste em aparelhos, luz, rede e acessibilidade; parecer de privacidade/LGPD, base legal, retenção, transparência e alternativa não biométrica; revisão de segurança; controles server-side, rate limiting, auditoria e fallback. Nenhum desses itens está feito por este protótipo.

Para uma implantação real, comparar SDKs especializados, pedir proposta e relatório de testes independente, verificar escopo de certificação e vetores não cobertos, local de processamento/retensão, suboperadores, suporte e requisitos de infraestrutura. A FaceTec informa que o 3D Liveness é cobrado mensalmente por uso, exige mínimo mensal e deve rodar nos servidores do cliente; o preço é por cotação: https://www.facetec.com/pricing. Isso é um dado comercial do fornecedor, não validação independente do produto para o Certus.

## Validação registrada

- Publicação estática no GitHub Pages verificada como `built`; HTML e `app.js` entregues com HTTP 200.
- Sintaxe JavaScript, estrutura HTML, separação do controlador e ausência de rotas/solicitações de integração de ponto verificadas estaticamente.
- Na versão anterior, o usuário testou no próprio celular e enviou captura da tela de sucesso dos dois movimentos; isso demonstra funcionamento observado naquela sessão, não segurança/PAD e não valida a nova troca de motor.
- Na versão MediaPipe, navegador de automação carregou a aplicação e chegou ao pedido de câmera; aquele ambiente respondeu `NotFoundError`, sem dispositivo. Portanto não há validação física desta versão nem sessão de desafio com MediaPipe confirmada.
- A sintaxe de HTML/JavaScript e os recursos públicos do modelo/biblioteca foram verificados por HTTP. A suíte `node --test core.test.cjs` está preparada, mas a execução em Node não foi possível neste ambiente. A nova autochecagem aparece na interface e será exercitada no navegador ao abrir a página; ela verifica matemática sintética, não câmera, viés ou PAD.

## Teste cuidadoso

Abra a versão HTTPS mais recente. Use apenas seu próprio rosto ou participante que consentiu; mantenha o rosto inteiro dentro do oval, com boa luz frontal. O navegador baixa aproximadamente alguns megabytes de modelo. Autorize a câmera apenas para essa sessão e encerre ao terminar. Não grave ou compartilhe material biométrico. O painel de indicadores serve para depuração, não é pontuação de segurança nem decisão de autenticidade.
