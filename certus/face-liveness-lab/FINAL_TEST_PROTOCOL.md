# Roteiro de aceitação — laboratório de movimentos faciais

Este roteiro testa estabilidade de captura e usabilidade, **não certifica PAD nem autoriza ponto**. Use apenas aparelho próprio e participantes que consentiram. Não grave, fotografe ou guarde rosto, vídeo, template, nome de participante ou dado de RH.

## A. Preparação

- Anote modelo do aparelho, versão do sistema, navegador, data/hora aproximada e condição geral de luz; não associe a nomes.
- Abra o laboratório por HTTPS; aceite o consentimento de demonstração. Espere a autochecagem do software indicar `9/9 OK`.
- No primeiro uso, aguarde baixar a biblioteca/modelo (cerca de 3,7 MB só do arquivo de modelo, além de WASM e biblioteca); os pedidos de rede revelam metadados normais de conexão aos distribuidores.
- Dê permissão de câmera só para a sessão de teste. Use luz frontal suficiente, lente limpa e enquadre o rosto inteiro dentro do oval.

## B. Repetibilidade normal

Faça cinco sessões consecutivas em condição semelhante. Cada sessão inclui piscar, virar/voltar e um gesto extra aleatório (abrir/fechar a boca ou sorrir/relaxar), com ordem aleatória. Continue até testar pelo menos uma vez cada gesto extra. Em cada uma anote apenas: resultado, qual etapa falhou, indicador esquerdo/direito na piscada, indicador de expressão no gesto extra, FPS e mensagem. Não tente forçar a conclusão; execute a instrução normalmente.

Tabela para registro manual:

| Tentativa | Condição geral | Etapa/diagnóstico | FPS (se disponível) | Concluiu movimentos? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

**Meta de usabilidade sugerida para prosseguir a uma avaliação formal:** pelo menos 4/5 sessões normais concluídas sem orientação adicional, sem falha de câmera e sem travamento. Esta meta não mede segurança e não é estatística de falso aceite.

## C. Condições de captura

Faça uma ou mais sessões por condição; anote “concluiu/não concluiu” e a mensagem, não capture imagem:

- luz frontal boa; luz fraca; contraluz moderada;
- distância confortável e ligeiramente maior/menor, mantendo o rosto dentro do oval;
- aparelho estável e pequeno movimento natural de mão;
- com óculos usuais, se aplicável;
- enquadramento ligeiramente fora do centro, para ver se a página orienta a corrigir sem concluir indevidamente.

Observe se os valores de piscar esquerdo/direito variam ao fechar/abrir os olhos e se o score de boca/sorriso responde ao gesto e volta ao calibrado quando relaxa. Os números são scores do modelo, não probabilidade de identidade ou autenticidade. Anote também se a calibração neutra e a instrução do gesto foram claras.

## D. Estados e interrupções

- Negue a permissão da câmera: a sessão deve falhar com mensagem clara e nenhum resultado concluído.
- Durante uma sessão, toque em “Encerrar câmera”; a prévia deve parar e o resultado deve deixar de ser concluído.
- Mude para outra aba/aplicativo: ao perder foco, a sessão deve encerrar a câmera.
- Recarregue a página; retire a permissão do navegador e abra de novo.
- Se a rede for interrompida antes do primeiro download, o detector deve mostrar falha de inicialização, nunca “concluído”.

## E. Teste limitado de apresentação (próprio laboratório)

Somente se os responsáveis pela avaliação concordarem e sem pessoas/dados reais: apresente uma fotografia própria impressa ou em outra tela e, separadamente, um vídeo gravado exibido em outra tela. Registre apenas se o desafio foi concluído ou não. Nunca enviar material para qualquer servidor, testar em outro sistema ou tentar acesso indevido.

- Se foto/vídeo concluir: anote como **falha de resistência a apresentação**; o laboratório é demonstravelmente inadequado como prova de vida.
- Se foto/vídeo não concluir: isso **não prova** resistência a ataques; uma única sessão não cobre telas, replay adaptativo, deepfake, injeção de câmera, máscaras, iluminação, diversidade ou tentativas em escala.
- Não use “passou” ou “falhou” como decisão laboral. Para avaliar PAD de verdade, usar laboratório independente e protocolo ISO/IEC 30107-3:2023 com classes de ataque e relatório.

## F. Verificação em aparelhos

Repita pelo menos as cinco sessões normais em dois aparelhos diferentes, com navegadores atualizados. Registre lentidão, aquecimento, falha de modelo/câmera, mensagens confusas e necessidade de reposicionar. Se as taxas diferirem, não compensar relaxando limiares sem nova bateria de testes e medição de falsos aceites/rejeições.

## Critério de encerramento desta rodada

A rodada de usabilidade fica documentada quando houver resultados de cinco tentativas por aparelho, estados de interrupção verificados e conclusão honesta dos testes limitados de apresentação. Isso ainda não é autorização para produção: continuam necessários threat model, avaliação PAD independente, estatística demográfica, acessibilidade, revisão de segurança e análise LGPD/base legal/retenção/alternativa não biométrica. O dado biométrico vinculado a pessoa é sensível pela LGPD.
