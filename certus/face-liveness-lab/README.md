# Certus — protótipo isolado de prova de vida

**Apenas laboratório. Não é um relógio de ponto, não verifica identidade e não pode aprovar ou gerar marcações.** Esta pasta é autônoma e não foi incluída nos links, no portal do colaborador, no terminal, na API, no serviço de sincronização offline ou no banco de dados da Certus.

## O que há nesta primeira versão

- Solicita consentimento de teste e permissão de câmera antes de iniciar.
- Carrega localmente no navegador Face API e modelos públicos de detecção facial e 68 pontos faciais.
- Escolhe aleatoriamente a ordem das tarefas e o lado do movimento: um piscar e uma virada de cabeça.
- Exige um único rosto com confiança e tamanho mínimos; termina por tempo esgotado; encerra a câmera ao parar, retirar o consentimento, sair da página ou perder foco.
- Não tem gravação, armazenamento de imagem/modelo, GPS, endpoint de backend ou código de marcação. Não envia quadros da câmera pela lógica da página.
- Baixar a biblioteca/modelos de CDN requer tráfego de rede normal, que pode revelar ao provedor o IP e metadados de conexão.

## Executar em ambiente de teste

Sirva esta pasta como site estático **local** (localhost) ou em um preview HTTPS controlado. `getUserMedia` não funciona em páginas sem contexto seguro. Não copie a pasta para o site público/produção nem a conecte aos fluxos de empregado. Compartilhe apenas com participantes de teste que consentiram e sem dados reais de RH.

## Testes automatizados

Com Node.js 18+:

```sh
node --test core.test.cjs
```

Os testes cobrem a geometria de EAR/virada, aleatoriedade da sequência e rejeição de zero/múltiplos rostos, baixa confiança e rosto pequeno. Eles não avaliam a eficácia anti-fraude, viés, falsos resultados, câmera física, compatibilidade ou segurança de produção.

## Casos manuais necessários antes de ampliar o teste

1. Câmera negada, sem câmera, rede/CDN indisponível: não concluir, não criar registros e oferecer mensagem de erro clara.
2. Nenhum rosto, dois rostos, rosto pequeno, fora de centro, pouca luz e uso com óculos: sem aprovação indevida; documentar taxa de falha e acessibilidade.
3. Piscar real, virar para cada lado, sequência aleatória e retorno ao centro: conferir o que a interface pede versus o que detecta, em vários modelos de aparelho/câmera.
4. Foto impressa, foto em outra tela, vídeo pré-gravado, vídeo com desafio adaptativo, câmera virtual/replay, injeção de quadros e movimento da tela/foto: o resultado deve ser tratado como facilmente contornável até testes independentes provarem o contrário.
5. Encerrar, retirar consentimento, trocar de aba/fechar página: confirmar que todas as faixas de câmera param e que não resta captura ativa.
6. Repetir em celulares modestos, conexões lentas, diferentes tons de pele, idades, mobilidade, condições visuais e de iluminação; medir falso aceite, falsa rejeição e desistência com protocolo e consentimento apropriados.

## Limites conhecidos

Esta versão é uma heurística simples de landmarks, não um detector robusto de prova de vida. Um vídeo pode simular o piscar e um rosto em tela pode ser movido para imitar a virada. Thresholds não foram calibrados para população/aparelhos reais. A mensagem de conclusão não deve ser usada como evidência para pagamento, assiduidade, identidade, controle de acesso ou sanção trabalhista.

Qualquer etapa posterior no Certus exigiria avaliação de ameaça e de privacidade/LGPD, revisão de segurança, acessibilidade e integração server-side com controles contra replay, isolamento por empresa, auditoria e fallback presencial/manual. Não há pedido de produção ou autorização para publicar o fluxo nesta etapa.
