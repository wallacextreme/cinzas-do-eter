# CINZAS DO ÉTER — Changelog

---

## [0.6.0] — 2026-10-19 — Pipeline Gráfico 10/10: Lote L3 (Kaël — Padrão de Qualidade)

### Adicionado
- 5 assets oficiais de Kaël em Paleta v2 gerados procedurais com 0 erros e 0 avisos no validador estrito:
  • `char_kael_field_32x48.png` (grid 4×8, 32 quadros: 4 dirs walk a 8 fps + 4 dirs idle a 4 fps)
  • `char_kael_battle_48x48.png` (grid 6×11, 66 quadros com os 11 clipes canônicos do STYLE_GUIDE)
  • `portrait_kael_neutral_48x48.png` e `portrait_kael_serious_48x48.png` (retratos 48×48 px)
  • `icon_kael_16x16.png` (ícone de HUD/menu 16×16 px)
- Módulo de animações orientadas a dados em `src/data/animations/kaelAnimations.ts` e `types.ts` cobrindo 8 clipes de exploração e 11 clipes de batalha.
- Suíte de testes unitários `tests/data/AnimationData.test.ts` (5 testes verdes, Rubrica 3.5).
- Integração no `PreloadScene.ts`, `PlayerSprite.ts` e `QaHooks.ts` (cenários V11, V12, V13).
- Evidências visuais V11, V12 e V13 em 1× e 4× com teste explícito de silhueta gravadas em `qa/evidence/L3/`.
- Todos os 5 assets de Kaël aprovados (`status: "APPROVED"`) com rastreabilidade formal no manifesto `art/assets.manifest.json`.
- Pacote do crítico preparado em `qa/packets/L3_PACOTE_CRITICO.md` e resultado formal em `qa/results/L3.md`.

---

## [0.5.0] — 2026-10-19 — Pipeline Gráfico 10/10: Lote L2 (Direção de Arte v2 e Protótipo D1)

### Adicionado
- `STYLE_GUIDE.md` v2.0-PROPOSED com resolução oficial dos conflitos Conceito × GDD (Kaël em tons terrosos; magias nas 4 Ressonâncias), Paleta v2 com 69 cores em 12 rampas, tabela de contraste UI (≥ 4,5:1), regras de HD-2D-lite e presets de `GraphicsSettings`, catálogo canônico dos 11 clipes de batalha de Kaël (48×48 px) e fonte bitmap autoral PT-BR.
- `art/palette.v2.proposed.json` (69 cores únicas, preservando 100% das 24 cores da v1) e swatch visual em `art-source/palette_v2_proposed_swatch.png`.
- `Hd2dManager.ts` em `src/art/` com orquestração de iluminação aditiva, vinheta, partículas ambientes, sombras blob e color grading com testes unitários em `tests/art/Hd2dManager.test.ts`.
- Protótipo comparativo com benchmark via CDP em `qa/evidence/L2/`: `proto_384x216.png`, `proto_1152x648.png` e `comparativo_antes_depois.png`.
- Pacote do crítico preparado em `qa/packets/L2_PACOTE_CRITICO.md`.

---

## [0.4.0] — 2026-10-19 — Pipeline Gráfico 10/10: Lote L1 (Fundação Técnica)

### Adicionado
- Pipeline de arte: `tools/art/process.mjs`, `tools/art/ascii2png.mjs` e `tools/art/autotile.mjs` com testes unitários em `tests/art/ArtTools.test.ts`.
- `AssetLoader.ts` orientado ao manifesto `art/assets.manifest.json` com fallback para placeholders procedurais.
- Escala inteira (384×216 com letterbox `#0A0612` e nearest-neighbor / `pixelArt: true`).
- Contrato `window.__QA__` em `src/qa/QaHooks.ts` ativo exclusivamente com `?qa=1`.
- Automação de captura CDP via `tools/capture-qa.mjs` com cobertura das 5 resoluções do HG8.
- Amostra da paleta oficial em `art-source/palette_swatch.png`.

### Alterado
- 16 arquivos JPG legados movidos de `public/assets/` para `art-source/concepts/` (status `CONCEPT_REF`).
- `art/assets.manifest.json` ativado com `"strict": true` e `dist/` limpo (zero JPGs em produção).
- `package.json` com scripts `qa:art`, `qa:art:strict` e `qa:art:selftest`.

---

## [0.1.0] — FASE 0: Fundação

### Adicionado
- Projeto inicializado com Vite 8 + TypeScript 6 + Phaser 3.90 + Bun
- Estrutura modular de diretórios: core, scenes, entities, systems, battle, world, ui, data, audio, art, save, utils, config
- `EventBus` — sistema de eventos pub/sub para comunicação entre sistemas
- `math.ts` — operações matemáticas seguras (anti-NaN, clamping, safe division)
- `constants.ts` — paleta Decadência Luminosa, dimensões de sprite, configurações
- `game-config.ts` — configuração Phaser com pixel-perfect rendering
- `BootScene.ts` — cena de boot placeholder
- Path aliases (`@core/`, `@utils/`, `@config/`, etc.)
- Vitest configurado com 39 testes passando
- Documentação completa:
  - GDD.md
  - STYLE_GUIDE.md (com regras de pixel art puro)
  - ARCHITECTURE.md
  - CONTRACTS.md
  - PROGRESS.md
  - TODO.md
  - ART_PIPELINE.md
  - AUDIO_PIPELINE.md
  - QA.md
  - CHANGELOG.md
  - BLOCKERS.md
- Git inicializado

---

## [0.1.1] — FASE 0: Correções de Auditoria

### Corrigido
- `ARCHITECTURE.md` — removido diretório `assets/` documentado mas inexistente no disco
- `constants.ts` — padronizado nomes da paleta: `AMBER_DARK→AMBER_MID`, `AMBER_DEEP→AMBER_DARK`, `EARTH_DARK→EARTH_MID`, `EARTH_DEEP→EARTH_DARK` (valores hex inalterados)
- `public/` — removidos `favicon.svg` e `icons.svg` (boilerplate Vite, assets externos)
- `tsconfig.json` — adicionado `ignoreDeprecations: "6.0"` para compatibilidade com TypeScript 6
- `main.ts` — removido import de tipo não utilizado (`import type Phaser`)

---

## [0.2.0] — FASE 1: Core

### Adicionado
- `PreloadScene.ts` — geração de texturas placeholder programáticas
- `GameScene.ts` — cena principal de exploração com input, câmera, colisão
- `InputManager.ts` — sistema de input desacoplado (WASD/Arrows, CONFIRM, CANCEL, MENU)
- `Player.ts` — entidade lógica do jogador com invariantes de CONTRACTS.md
- `PlayerSprite.ts` — representação visual do jogador com Phaser Arcade Physics
- `MapManager.ts` — gerenciador de mapas com tilemap programático de teste
- `GameStateManager.ts` — máquina de estados (BOOT→LOADING→EXPLORING→MENU/PAUSED/BATTLE)
- `SaveManager.ts` — persistência com versionamento em localStorage
- `ErrorHandler.ts` — captura global de erros e prevenção de loops
- Testes: 82/82 passando (unit + integration)
- Auditoria final APROVADA com playtest real no navegador

---

## [0.2.1] — FASE 2: Preparação Documental

### Adicionado
- `GDD.md` — Lia formalizada como personagem da Vertical Slice (aldeã de Lumen, amiga de Kaël)
- `TODO.md` — reestruturado com 10 unidades da FASE 2
- `PROGRESS.md` — atualizado para pré-implementação FASE 2
- Plano de implementação da FASE 2 aprovado com ajustes
- `GDD.md` e `ARCHITECTURE.md` — Regra crítica FONTE DE VERDADE adicionada para isolamento estrito de contexto.

### Alterado
- `GDD.md` — lista de NPCs de Lumen atualizada: Mirael, Torvak, Lia, 2–3 aldeões genéricos

---

## [0.3.0] — FASE 2: Exploração - Unidade 1

### Adicionado
- `MapData.ts` — interface base de definição de mapas
- `MapTransitionManager.ts` — infraestrutura para transição segura de mapas
- Suporte a `loadMap` declarativo no `MapManager.ts`
- Câmera fade configurada para transições suaves
- Testes unitários de transição implementados e validados no navegador

---

## [0.3.1] — FASE 2: Exploração - Unidade 2

### Adicionado
- `LumenVillageMap.ts` — Mapa oficial da Vila de Lumen (60x40) gerado declarativamente
- Texturas placeholder específicas para Lumen na `PreloadScene.ts` organizadas em um `placeholder_tileset` unificado
- Script interno `buildLumen.ts` para geração programática do mapa

### Alterado
- `MapManager.ts` atualizado para lidar com um tileset unificado e índices absolutos `putTileAt` consistentes
- `GameScene.ts` agora carrega a `lumenVillageMap` ao invés dos mapas de teste `mapA` e `mapB`

---

## [0.3.2] — FASE 2: Exploração - Unidade 3

### Adicionado
- Interface `InteractableEntity.ts` base para objetos/NPCs interativos no mundo
- `InteractionPrompt.ts` para indicador visual flutuante ("Z") sobre entidades
- `InteractionManager.ts` responsável por detectar entidades próximas, rastrear `facingDirection` e exibir prompts
- `Signpost.ts` como entidade de teste interativa

### Alterado
- `PlayerSprite.ts` agora rastreia `facingDirection` (UP, DOWN, LEFT, RIGHT)
- `InputManager.ts` agora possui `consumeAction()` para evitar múltiplos gatilhos com um único aperto de tecla
- `GameScene.ts` atualizada para instanciar e processar `InteractionManager`

---

## [0.3.3] — FASE 2: Exploração - Unidade 4

### Adicionado
- Texturas placeholder `npc_lia` e `npc_torvak` programáticas em `PreloadScene.ts`
- Entidade base `NPC.ts` estendendo `Phaser.Physics.Arcade.Sprite` e implementando `InteractableEntity`
- `Lia` e `Torvak` instanciados dinamicamente baseados nas coordenadas do `LumenVillageMap.ts`
- Método `spawnEntities` em `GameScene.ts` para carregar NPCs com base nos dados do mapa atual

---

## [0.3.4] — FASE 2: Exploração - Unidade 5

### Adicionado
- `src/data/dialogueData.ts` — definições de tipos (`DialogueMessage`, `DialogueNode`) e diálogos para Lia, Torvak, Placa e template para Mirael
- `src/world/DialogueManager.ts` — regras e controle de fluxo de diálogos, desacoplado de renderização, integrado a `GameStateManager` e `EventBus`
- `src/ui/DialogueBox.ts` — caixa de diálogo 16-bit com estilo Decadência Luminosa (`#1A0F2E`, borda `#6B3FA0`, cantos cristalinos `#7DE8F0`), efeito typewriter e indicador pulsante de avanço
- `tests/world/DialogueManager.test.ts` — 8 testes unitários cobrindo paginação, encerramento, transições de estado e hooks narrativos
- `tests/world/DialogueIntegration.test.ts` — 3 testes de integração cobrindo o loop completo de interação com Lia e Torvak
- Documentação formal do estado `DIALOGUE` e evento `dialog:advance` em `CONTRACTS.md`

### Alterado
- `GameStateManager.ts` — adicionada fase `DIALOGUE` com transições válidas bidirecionais com `EXPLORING`
- `PlayerSprite.ts` — congelamento de movimento e velocidade zerada durante a fase `DIALOGUE`
- `InteractionManager.ts` — ocultação de prompt flutuante e supressão de novas interações durante diálogo ativo; tolerância de raio aumentada para 48px
- `NPC.ts` e `Signpost.ts` — integrados ao `EventBus` para emitir `dialog:start` e responder a `dialog:end`
- `GameScene.ts` — instanciação e loop de update de `DialogueManager` e `DialogueBox`
- `InputManager.ts` — aprimorado com suporte a `wasJustDown`/`wasJustUp` para detecção de toques rápidos sub-frame e bindings estendidos
- `PROGRESS.md`, `TODO.md` e `QA.md` atualizados com registro explícito de escopo (Lia ✅, Torvak ✅, Mirael ⏳) e aprovação da Unidade 5

---

## [0.3.5] — FASE 2: Exploração - Unidade 6 (Loja do Torvak)

### Adicionado
- `src/data/itemsData.ts` — catálogo dos 4 itens canônicos do GDD: Elixir Âmbar (30 Frag), Gota de Éter (50 Frag), Antídoto (20 Frag), Cristal de Fuga (80 Frag).
- `src/inventory/InventoryManager.ts` — fundação mínima de inventário e economia, controle rigoroso da moeda Fragmentos (saldo inicial 100), operações matemáticas seguras com `@utils/math.ts` (anti-NaN, sem saldo negativo, limite de pilha 99, limite de slots).
- `src/shop/shopData.ts` — dados de catálogos desacoplados de comerciantes (`shop_torvak`).
- `src/shop/ShopManager.ts` — camada de lógica e regras de compra puras em TypeScript (zero dependências de Phaser e de Torvak), validação atômica, navegação de produtos, eventos `shop:open`, `shop:buy`, `shop:close`.
- `src/ui/ShopBox.ts` — interface modal 16-bit com estética Decadência Luminosa (384×216, janela `#1A0F2E`, borda `#6B3FA0`, cantos cristalinos `#7DE8F0`), cursor pulsante, saldo dinâmico, highlight de acessibilidade financeira, caixa de descrição, feedback imediato e proteção de abertura (`justOpened`).
- `tests/inventory/InventoryManager.test.ts` — 21 testes unitários cobrindo moeda, adição/remoção de itens, limites e invariantes.
- `tests/shop/ShopManager.test.ts` — 19 testes unitários cobrindo catálogo, navegação, compra válida, saldo insuficiente, saldo exato, múltiplas compras, preços inválidos, estoque e eventos.
- `tests/shop/ShopIntegration.test.ts` — 2 testes de integração validando o fluxo completo de interação, diálogo, abertura da loja, compras e persistência entre sessões.
- Documentação de eventos (`shop:open`, `shop:buy`, `shop:close`, `inventory:goldChanged`) em `CONTRACTS.md`.

### Alterado
- `DialogueBox.ts` e `ShopBox.ts` — corrigido posicionamento relativo de elementos filhos em Containers com `setScrollFactor(0)`, garantindo pixel art e alinhamento visual perfeito com a câmera.
- `InteractionManager.ts` — esconde prompt de interação e cancela entidade ativa ao receber evento `shop:open`.
- `GameScene.ts` — integrado `InventoryManager`, `ShopManager` e `ShopBox`; abertura automática da loja ao encerrar diálogo com Torvak; congelamento de movimento e supressão de interações durante compras; restauração imediata ao fechar.
- `dialogueData.ts` — atualizadas falas do Torvak para introduzir e convidar à loja após os avisos sobre os perigos da Planície das Cinzas.
- `tsconfig.json` e `vite.config.ts` — adicionados path aliases para `@inventory` e `@shop`.
- `PROGRESS.md`, `TODO.md` e `QA.md` — atualizados com a aprovação da Unidade 6 e total de 144 testes automatizados 100% passando.

---

## [0.3.6] — FASE 2: Exploração - Unidade 7 (Área Externa - Planície das Cinzas & Entrada da Gruta do Eco)

### Adicionado
- `src/world/maps/AshPlainsMap.ts` — mapa declarativo da Planície das Cinzas (32×40 tiles, 512×640 px), setor norte com transição para Vila de Lumen, setor central com caminho navegável entre formações rochosas (rochas mortas e cristais dormentes), setor sul com cinzas profundas e boca da caverna conectando à Gruta do Eco; entidade de placa informativa `sign_ash_plains`.
- `src/world/maps/EchoCaveEntranceMap.ts` — antecâmara técnica de validação da Gruta do Eco (24×18 tiles, 384×288 px), solo de caverna, paredes rochosas escuras, ponto de spawn `spawn_entrance` voltado para o sul e gatilho norte de retorno à Planície das Cinzas.
- `src/world/maps/index.ts` — barrel export centralizando tipos e definições de todos os mapas do jogo.
- `src/scenes/PreloadScene.ts` — geração técnica de tileset expandida com tiles GID 9 (`TILE_ASH_GROUND`), GID 10 (`TILE_DEAD_ROCK`), GID 11 (`TILE_DORMANT_CRYSTAL`) e GID 12 (`TILE_CAVE_ENTRANCE`); inclusão de índice 0 dummy para mapeamento 1-based nativo no Phaser.
- `tests/world/AshPlainsMap.test.ts` — 10 testes unitários cobrindo dimensões, integridade das matrizes de ground/wall, coordenadas e facings de spawn, delimitação de zonas de transição, barreiras e obstáculos navegáveis.
- `tests/world/MapTransitionIntegration.test.ts` — 7 testes de integração validando transições bidirecionais Vila ↔ Planície ↔ Gruta do Eco, reset de velocidade física, atualização do estado do jogador, proteção contra transições duplicadas, recuperação de estado em IDs inválidos e persistência estrita do inventário/saldo de Fragmentos.
- Documentação formal dos eventos `map:transitionStart` e `map:transitionEnd` em `CONTRACTS.md`.

### Alterado
- `src/world/MapTransitionManager.ts` — suporte a `spawnPoint.facing` com chamada ao método `player.setFacingDirection`, reset atômico de velocidade `(0, 0)` na partida e no término da transição.
- `src/entities/PlayerSprite.ts` — adicionado método público `setFacingDirection` para permitir reorientação do sprite durante spawns em transições.
- `src/scenes/GameScene.ts` — registro dos três mapas (`lumenVillageMap`, `ashPlainsMap`, `echoCaveEntranceMap`), HUD com título de área dinâmico (`currentMapData.displayName`), desativação preventiva do colisor anterior em `map:transitionStart` e instanciação dinâmica de entidades por mapa.
- `PROGRESS.md`, `TODO.md` e `QA.md` atualizados com a Unidade 7 concluída e 161/161 testes 100% aprovados.

---

## [0.4.0] — FASE 3: Personagem & Progressão - Unidade 7 (Sistema de Equipamento)

### Adicionado
- `src/data/equipmentData.ts` — definições canônicas dos 6 equipamentos da Vertical Slice (`apprentice_staff`, `tuned_staff`, `traveler_tunic`, `ether_cuirass`, `amber_pendant`, `crystal_ring`), com tipos estritos `EquipmentSlot` (`weapon`, `armor`, `accessory`), `StatBonus` e funções de consulta/validação puras (`getEquipmentDefinition`, `isEquipmentSlot`, `isValidEquipmentItem`).
- `src/systems/EquipmentManager.ts` — motor desacoplado de regras de equipamento em TypeScript puro; transações atômicas de equip/unequip/swap integradas com `InventoryManager`; cálculo puro e derivado de `EffectiveStats` (`BaseStats + Σ(Bonuses)` sem jamais mutar `PlayerState.stats`); regras de preservação e clamping de HP/MP; disparo do evento `equipment:changed` no EventBus.
- `tests/systems/EquipmentManager.test.ts` — 47 testes unitários cobrindo catálogo, loadout inicial de Kaël, equip/unequip/swap, integridade transacional com inventário, rollback em inventário cheio, cálculo derivado de stats, imutabilidade de stats base e clamping de HP/MP.
- `tests/systems/EquipmentIntegration.test.ts` — 6 testes de integração cobrindo fluxos de ponta a ponta: compra na loja → inventário → equipar → desequipar, obtenção do Pingente de Âmbar no baú da Gruta do Eco, prevenção de vazamento de atributos e loadout completo com 3 peças.
- Adicionado contrato formal do Sistema de Equipamento e especificação do evento `equipment:changed` em `CONTRACTS.md`.

### Alterado
- `src/data/itemsData.ts` — adicionados os 5 equipamentos canônicos faltantes ao banco de dados de itens (`apprentice_staff`, `tuned_staff`, `traveler_tunic`, `ether_cuirass`, `crystal_ring`), todos com tipo `equipment` e `maxStack: 1`.
- `src/entities/Player.ts` — Kaël agora inicia com seu `tuned_staff` equipado no slot de arma (sem duplicata no inventário).
- `src/systems/index.ts` — barrel export atualizado exportando `InputManager` e `EquipmentManager`.
- `src/data/index.ts` — barrel export atualizado exportando `equipmentData.ts`.
- `src/scenes/GameScene.ts` — `EquipmentManager` instanciado e exposto para depuração no console do navegador (`__EQUIPMENT_MANAGER__`).
- `PROGRESS.md`, `TODO.md` e `QA.md` — atualizados com F3-U07 formalmente APROVADA e 283/283 testes 100% passando.

---

## [0.4.1] — FASE 3: Personagem & Progressão - Unidade 8 (Menu de Status)

### Adicionado
- `src/systems/StatusManager.ts` — camada de lógica e geração de ViewModel do Menu de Status em TypeScript puro; integração estrita com `EquipmentManager.calculateEffectiveStats` sem recalcular fórmulas de equipamento; formatação de recursos (HP, MP, XP com XP restante), 6 atributos derivados com bônus destacados (sem mutar stats base), e slots de equipamento com nomes e descrições canônicas.
- `src/ui/StatusBox.ts` — componente de apresentação visual 16-bit em Phaser (`Container`, profundidade 650, fixo à câmera `scrollFactor(0)`), dimensões 360×190 px, paleta *Decadência Luminosa* (`#1A0F2E`, borda 2px `#6B3FA0`, cantos cristalinos `#7DE8F0`), layout de duas colunas, barras de HP/MP/XP, cursor pulsante navegável e painel inferior de detalhes.
- `tests/systems/StatusManager.test.ts` — 19 testes unitários cobrindo ciclo de vida, integridade de dados, delegação de atributos efetivos, imutabilidade da base, slots equipados, atualizações dinâmicas e navegação.
- `tests/ui/StatusIntegration.test.ts` — 6 testes de integração validando transições de fase (`EXPLORING` ↔ `MENU`), bloqueios concorrentes com diálogo, sincronização de eventos (`equipment:changed`, `player:levelUp`) e proteção de input.
- Invariantes de fase `MENU` e eventos `menu:statusOpened` / `menu:statusClosed` adicionados a `CONTRACTS.md`.

### Alterado
- `src/systems/index.ts` — barrel export atualizado exportando `StatusManager` e tipos associados.
- `src/ui/index.ts` — barrel export atualizado exportando `StatusBox`.
- `src/scenes/GameScene.ts` — integração do `StatusManager` e `StatusBox`, controle de abertura com tecla `MENU`, congelamento de movimento durante menu, guarda anti double-trigger para `Escape`, e exposição para depuração (`__STATUS_MANAGER__`, `__STATUS_BOX__`).
- `index.html` e `src/main.ts` — adicionados botões de depuração para `[M] Status` e `[ESC]`.
- `GDD.md` — documentação da interface de Menu de Status da Vertical Slice.
- `PROGRESS.md`, `TODO.md` e `QA.md` — atualizados com F3-U08 formalmente APROVADA e 308/308 testes 100% passando.

---

## [0.4.2] — FASE 3: Personagem & Progressão - Unidade 9 (Inventário Completo de Kaël)

### Adicionado
- `src/systems/ItemUseManager.ts` — motor de regras de uso atômico de consumíveis em TypeScript puro, desacoplado de Phaser; validação estrita de posse, tipo, contexto e pré-condições; cálculo de recursos efetivos máximos via `EquipmentManager`; consumo e transações protegidas com rollback em caso de falha de remoção; suporte a Elixir Âmbar (+50 HP), Gota de Éter (+20 MP), rejeição de Antídoto na exploração sem consumo, e preparação para Cristal de Fuga em batalhas futuras; emissão contratual de `inventory:itemUsed`.
- `src/ui/InventoryBox.ts` — componente de apresentação visual 16-bit em Phaser (`Container`, profundidade 650, dimensões 360×190 px, fixo à câmera `scrollFactor(0)`), paleta *Decadência Luminosa* (`#1A0F2E`, borda 2px `#6B3FA0`, cantos cristalinos `#7DE8F0`); listagem de itens possuídos com contadores (`×N`), cursor navegável cíclico com paginação/scrolling suave, painel de detalhes com identificação `[Consumível]` e `[Equipamento]`, instruções de equipagem via Menu de Status [M], mensagens de feedback dinâmico temporizado (2.5s) e tratamento do estado de inventário vazio.
- `tests/systems/ItemUseManager.test.ts` — 17 testes unitários cobrindo consumíveis canônicos, restauração de HP/MP, clamping aos tetos efetivos, rejeição de uso em teto máximo sem consumo de item, rejeição de antídoto/cristal em exploração, rejeição de equipamentos como consumíveis, consumo do último item da pilha, emissão de eventos e teste crítico de garantia atômica (rollback).
- `tests/inventory/InventoryIntegration.test.ts` — 5 testes de integração cobrindo fluxos completos: Loja Torvak → Inventário → Uso de consumíveis até exaustão da pilha; Inventário ↔ Equipamento (equipar remove do inventário, desequipar devolve com bônus de stats corretos); Transições de fase `EXPLORING` ↔ `MENU`; guardas contra abertura em `DIALOGUE`, `SHOP`, `STATUS` e transições; compatibilidade total com Save/Load via `toState()`.
- Suporte à ação lógica `INVENTORY` (tecla `KeyI`, `i`, `I`) no `InputManager.ts` e inclusão de testes dedicados em `tests/systems/InputManager.test.ts`.
- Contratos de uso de itens e eventos `inventory:itemUsed`, `menu:inventoryOpened`, `menu:inventoryClosed` formalizados em `CONTRACTS.md`.

### Alterado
- `src/systems/InputManager.ts` — adicionada ação `INVENTORY` aos tipos, bindings padrões e estados de ação.
- `src/systems/index.ts` — barrel export atualizado com `ItemUseManager`, `UseContext`, `CanUseResult`, `ItemUseResult`.
- `src/ui/index.ts` — barrel export atualizado com `InventoryBox`.
- `src/scenes/GameScene.ts` — instanciação e integração de `ItemUseManager` e `InventoryBox`, tratamento de abertura com `INVENTORY`, bloqueio de movimentação durante menu, integração com transições e exposição para depuração (`__ITEM_USE_MANAGER__`, `__INVENTORY_BOX__`).
- `index.html` e `src/main.ts` — adicionado botão de depuração `[I] Inventário` e wiring direto.
- `ARCHITECTURE.md`, `PROGRESS.md`, `TODO.md` e `QA.md` — atualizados com F3-U09 100% concluída e 331/331 testes passando.


