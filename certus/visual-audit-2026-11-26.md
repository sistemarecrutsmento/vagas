# Auditoria visual Certus — 26/11/2026

## Escopo efetivamente conferido

- Portal Master: navegação pelas 14 áreas superiores (visão geral, empresas, planos, contratos, financeiro, suporte, monitoramento, dispositivos, implantação, configurações globais, catálogo de recursos, comunicados, acessos e auditoria). Foram revisadas a estrutura e as regras responsivas compartilhadas; a captura real detalhada foi feita na área Auditoria e Logs, em desktop.
- Acesso de gestão da The Goods: navegação por Jornadas e inspeção dos padrões de empresa/colaborador; nenhuma operação de negócio foi executada na auditoria.
- Portal público/login e terminal: consulta de HTML, estilos responsivos e uso de service worker.
- Revisão estática dos componentes responsivos globais do Portal Master e da gestão.

## Problemas comprovados

1. Em Auditoria e Logs, colunas que compartilham espaço encolhem até partir palavras e valores caractere a caractere. Responsável, tipo, timestamp e UUID ficavam quebrados em múltiplas linhas, aumentando bastante cada registro. O campo Detalhes exibia JSON cru. A captura visual anexada ao registro de auditoria mostra esse defeito.
2. O helper compartilhado de tabelas usava a mesma renderização para timestamps, enums e JSON, deixando datas ISO, estados e papéis em códigos técnicos. Como o helper serve as tabelas dos módulos Master, a falha se repete em diferentes áreas.
3. O Portal Master não possuía um padrão geral comum para campos de formulários; os estilos estavam dispersos entre a tela de login e alguns formulários específicos.
4. A gestão aplicava `overflow-wrap:anywhere` a títulos, parágrafos, rótulos, botões e células. Em tabelas estreitas isso pode reduzir a largura mínima das colunas e quebrar palavras mesmo quando a tabela deve rolar horizontalmente.

## Correções propostas no rascunho

- Tabelas Master com colunas estáveis, cabeçalhos sem quebra, rolagem horizontal acessível por toque/teclado e indicação para consultar colunas adicionais.
- Timestamp/data em formato brasileiro, estados e papéis mais legíveis; objetos JSON recolhidos em “Ver detalhes”; booleanos traduzidos.
- Padrão comum para formulários, controles, caixas de texto, caixas de seleção e grupos de campos, preservando handlers/rotas e ações existentes.
- Gestão: impedir quebra de palavras em cabeçalhos, manter rolagem de tabelas e preservar quebra apenas em texto longo quando necessário.
- Incremento de versão dos assets/cache para que a atualização seja efetivamente carregada após eventual publicação.
- Testes estáticos e Playwright previstos para as 14 páginas principais do Master, em 1440×900 e 390×844, incluindo tabela com datas, identificadores e JSON comprido.

## Limites desta rodada

A captura pixel a pixel em viewport autenticado foi realizada na página de auditoria do Master, não em todas as subabas de todos os módulos nem em todos os tamanhos solicitados. Os fluxos de escrita/ações administrativas não foram acionados. O PR permanece em branch de rascunho: nada foi mesclado ou publicado, e não houve alteração de dados. Após CI aprovado, ainda é necessária a verificação visual real das telas em desktop, tablet e celular antes de aprovar publicação.
