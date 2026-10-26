# Taverna do Mau Mau — Nova Geração

**Fundação 02 (projeto de laboratório; NÃO é uma atualização do jogo publicado).**

## Objetivo

Reconstruir **todos** os sistemas da Taverna atual, preservando identidade visual, menus, temas, personagens, regras, malandragens, contas, sala VIP, bots, multiplayer, Crônicas/conquistas e progressão. O novo cliente visual usará **Phaser 4.2.1** e efeitos 2.5D para web e celular. O motor atual e o servidor autoritativo permanecem a referência até validação de paridade.

## O que já existe neste pacote

- Estrutura Vite + Phaser 4.2.1, com desenho procedural de mesa bordô, cartas, posições de até nove bots, efeitos de luz simulados e botões com relevo CSS.
- Fatia vertical **offline experimental**: criar mesa para 2, 5 ou 10 participantes; interagir por ID imutável; comprar, jogar, passar, anunciar MAU MAU, escolher naipe no J; bots com atraso 3–5 s; relógio humano 15 s.
- Núcleo lógico desacoplado, observável e testável por Node sem Phaser; as jogadas são independentes de animações e do DOM.
- Testes das regras básicas, identidade, naipes, turnos, Q, A, 7, 9, continuidade de rodadas e timers de penalidade.
- Animações gráficas isoladas do núcleo de regras: cartas em movimento, efeitos de especiais e destaque PULADO!
- Botão de próxima rodada e alternância de iniciador respeitando eliminações.
- Build para HTML único **Phaser real**, independente do HTML CSS demonstrativo; workflow de GitHub Actions para testes e empacotamento sem deploy.

## O que NÃO está pronto (não usar como substituto)

**Não há** login real, conexão com servidor, OPA!!! com evidências, blefes intencionais, supercombos, sala VIP, votação, espectador, loja, histórico persistente, conquistas, efeitos completos, áudio nem compatibilidade verificada em dispositivos físicos. O jogo publicado não é afetado. Não há PWA ou deploy da nova versão. Este módulo offline intencionalmente **rejeita blefes**, enquanto o motor de produção possui as regras para blefes; a paridade deve ser realizada antes de qualquer beta.

## Entrega pelo GitHub Actions (não faz deploy)

A ramificação isolada executa o workflow `.github/workflows/nextgen-lab.yml` nos commits dela. Quando concluir **com sucesso**, disponibiliza o artefato `taverna-phaser-lab-android` contendo `index.html` compilado com o Phaser e CSS embutidos. É este HTML compilado que pode ser aberto diretamente no Chrome; o `nova-geracao/index.html` do código-fonte continua dependente do Vite. Para produção/web, a arquitetura futura deve usar cache e bundles próprios; a versão monolítica existe somente para teste rápido.

A etapa gráfica deve passar por teste manual com WebGL no Android e iPhone; os testes Node não verificam FPS nem GPU.

## Executar localmente

```bash
npm install
npm run dev
```

Abrir a URL indicada pelo Vite. Para testes lógicos sem instalar dependências:

```bash
npm test
npm run check
npm run build
npm run verify:artifact
```

## Referência congelada, 26/10/2026

- Código público de referência: `eduabreu031/Taverna-do-Mau-Mau`, commit `3496b404c42ee83bddde593e09fb3db99ca0d01b`.
- Servidor privado de referência: `eduabreu031/Taverna-Multiplayer-Servidor`, commit `1cce947b671098cb32d05074140f86ad9a7c9f84`.
- Regras de produção inspecionadas: `src/game.js` (blob `193928c87057a813061a2f5cf75fcd774efbf5a4`), `src/rounds.js`, `src/accusations.js`, `src/combo.js`, `src/clock.js`.

**Segurança**: não copiar o código do servidor privado para este repositório público; integrar por API oficial após versionar contratos e testar autorização. Não se efetuou backup dos bancos de dados, segredos ou recursos remotos: a proteção atual é o branch separado do código público, não um backup de infraestrutura.

Consulte `docs/MIGRACAO.md` para o inventário de sistemas e critérios de aprovação de cada etapa.