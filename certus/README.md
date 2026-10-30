# Certus by VagasIO — versão demonstrativa 0.1

Esta pasta contém uma demonstração visual navegável do produto Certus. O site é servido pelo GitHub Pages em `/certus/` e usa somente HTML, CSS e JavaScript estáticos.

## Incluído nesta etapa

- Interface responsiva inspirada na identidade visual do VagasIO.
- Navegação por visão geral, funcionários, registros fictícios, solicitações de ajuste, jornadas, filiais/equipes, relatórios, terminais e configurações.
- Busca e filtros de demonstração, formulários locais de exemplo, simulação de revisão de solicitação e exportação CSV com dados fictícios.
- Avisos visíveis de que o ambiente não coleta, autentica ou registra dados oficiais.

## Não incluído — não usar em operação real

Não há API, banco de dados, login, RBAC, isolamento multi-tenant, trilha de auditoria no servidor, sincronização offline segura, captura de rosto, prova de vida, GPS, autorização de terminal, cálculo trabalhista, folha ou relatório regulatório. Os dados de teste ficam apenas em memória na página e somem ao recarregar.

Não inserir nomes, CPF, localização, fotos, templates biométricos, credenciais ou registros de empregados reais. Esta demonstração não é um sistema de ponto eletrônico e não produz comprovantes válidos.

## Próximas etapas antes de qualquer produção

1. Decidir infraestrutura independente para API e PostgreSQL, proprietário operacional, custos e política de backup.
2. Definir modelo de ameaças, autenticação, recuperação de conta, RBAC, isolamento de tenant, logs imutáveis e testes de autorização negativa.
3. Fazer análise jurídica/privacidade do tratamento de dados de jornada e dados biométricos; selecionar fornecedor biométrico especializado após avaliação de prova de vida, falsos positivos/falsos negativos, retenção, região de processamento, suboperadores e custos.
4. Especificar regras de jornada e relatórios com revisão especializada; não presumir regra legal universal.
5. Implementar API/database isolados e validar migrações, autorização multiempresa e auditoria em ambiente de teste.
6. Desenvolver app e modo quiosque nativos ou solução tecnicamente apropriada; testar fila offline criptografada, assinatura, relógio adulterado, duplicação e reconciliação em dispositivos reais.
7. Executar piloto controlado com dados de teste e plano de resposta a incidentes, revisão de segurança e validação operacional antes de produção.

A publicação de conteúdo estático dentro do site do VagasIO não fornece uma API, banco, autenticação ou controles de dispositivo para este produto. Nenhum backend ou serviço pago é criado por este repositório.
