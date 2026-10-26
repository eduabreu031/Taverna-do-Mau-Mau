# Plano mestre — migração com paridade funcional

## Princípios que não podem mudar

1. **Mesmo design e identidade**: menus e personagens serão reproduzidos conforme os assets e telas atuais, sem reinterpretar o tema. Bordô original, textura, contraste dos temas, indicadores do turno, seleção de naipes fora da mesa, baralhos temáticos opacos.
2. **Mesmas regras e malandragens**: funcionalidade só pode ser marcada como migrada se suas regras e consequências coincidirem com o motor servidor publicado; não confiar em uma implementação simplificada.
3. **Servidor autoritativo**: contas, moedas e recompensas apenas pelo servidor, nunca por eventos visuais de cliente. Não migrar segredos para frontend.
4. **Nada de quebra no ar**: nunca editar deploy atual para experimentar; usar branch/artefatos separados. Releases após validação, rollback independente.
5. **Nenhuma carta troca de identidade**: ID, rank e suit imutáveis; animação deve usar snapshot; estado imutável no cliente; toda ação ancorada na revisão do servidor.
6. **Interface móvel primeiro**: safe-area, feedback ao toque, renderizações menores em aparelhos modestos, seleção por ID sem dependência da geometria da mão.

## Inventário auditado no servidor existente

| Domínio | Referência inspecionada | Estado no laboratório |
| --- | --- | --- |
| Turnos, compra e descarte | `src/game.js`, `src/rounds.js` | **Parcial**: subset offline testável |
| 7 (+5), Q, A, J, 9 | `src/game.js` | **Parcial**: casos fundamentais testados |
| Blefe irregular e OPA!!! | `src/game.js`, `src/accusations.js` | **Pendente**: *não* incluído no laboratório |
| Supercombo no duelo final | `src/combo.js` | **Pendente** |
| Cronômetro + 2 de atraso | `src/clock.js`, `src/game.js` | **Parcial**: relógio demo; sem comprovação ponta a ponta |
| Sala VIP, host, acesso e senhas | `src/index.js`, `src/vip-password.js`, `src/room-access.js` | **Pendente** |
| Login, convidados, administradores, sessões | `src/auth.js` | **Pendente** |
| Bots, desconexão, inatividade e remoção | `src/index.js`, `src/room-policy.js` | **Parcial**: bots locais de demonstração |
| Espectadores, promoção, placar | `src/room-policy.js`, `src/index.js` | **Pendente** |
| Social, reações e votação | `src/social.js` | **Pendente** |
| Crônicas e conquistas | `src/cronicas-*.js` | **Pendente** (não inventar recompensas) |
| Registro de feedback, bugs, histórico | `src/feedback.js`, `src/history.js` | **Pendente** |
| Temas, baralhos e personagens | Interface pública a auditar com assets originais | **Pendente**: primeira mesa usa paleta provisória clássica |
| Sons, rádio e animações avançadas | Interface pública a auditar | **Pendente** |

## Sequência de trabalho

**Fase 0 — Segurança (iniciada).** Branch isolado em GitHub no mesmo repositório, apontando para commit publicado. Backup verificável de assets e dados do backend exige procedimento próprio. Bloquear a publicação de Nova Geração no endereço atual.

**Fase 1 — Fundação (iniciada).** Phaser 4 + tela de mesa, animador guiado por eventos, estado independente, seleção por ID, tela responsiva, perfis de desempenho, testes. Nessa versão somente ações offline de demonstração.

**Fase 2 — Paridade offline.** Portar do motor autoritativo todos os casos: combos, jogadas ilegais/OPA!!!, mau com declaração antecipada e falsa, regras do 9, alteração de naipe, score, eliminação, revanche, retomada após atualização, IA por dificuldade, todos os botões atuais. Reproduzir e comparar testes do servidor.

**Fase 3 — Paridade visual.** Reproduzir menus e temas originais exatamente (não redesenhar); adicionar novas texturas, materiais simulados, iluminação por tema, perspectiva, partículas, layers; medir FPS/bateria/temperatura; manter modo leve.

**Fase 4 — Multiplayer & serviços.** API/protocolo versionado, autenticação existente, salas públicas/VIP, bots no multiplayer, reconexão, espectador, votação, host, changelog e reportes; testes E2E com duas contas e múltiplas salas. Somente usar ambiente de teste, sem compartilhar banco de produção durante experimentação.

**Fase 5 — Crônicas e economia.** Progresso confirmado server-side, catálogo, inventário, loja com conferência de gastos, migração de perfis consentida e idempotente; nenhum saldo calculado no cliente.

**Fase 6 — Beta isolado.** URL própria, testes em Android e iOS, WebGL context loss, offline/PWA, acessibilidade, FPS, rede instável, rollback, teste de longa duração. Jamais publicar em produção sem aprovação.

## Critérios para chamar de "igual ao atual"

- Cobertura de cada ação, penalidade, sequência, timer, mau, OPA e combo no mesmo cenário de 2, 5 e 10 participantes, inclusive após desconectar/reconectar.
- Mensagens e efeitos sincronizados com as revisões e provas reais do servidor; nenhum segredo ou mão oculta de oponente exposta no cliente.
- Todos os menus, conta, perfis, temas, texto, layout, acesso VIP, conquistas e moedas presentes e testados.
- Medição em Android e iOS reais, com degrade gracioso quando WebGL falhar.
- Sem alteração da versão anterior até aprovação, incluindo testes de rollback e preservação de dados.

## Decisões técnicas

- Phaser 4.2.1: renderização WebGL 2D/2.5D. Efeito 3D perceptual em cartas e botões; efeitos 3D verdadeiros exigirão shader/projeção/engine complementar, definidos após testes, sem prometer ray tracing.
- UI híbrida: canvas Phaser para mesa/cartas/efeitos, DOM acessível para menus/controles. A lógica do jogo não depende de nenhum dos dois.
- Arquivos gerados proceduralmente neste laboratório são **placeholders visuais**, não substituem os assets autorais da Taverna.
- Funções desta base não devem ser usadas como autoridade do multiplayer. O servidor já contém regras de blefe/supercombo que estão deliberadamente ausentes no protótipo.