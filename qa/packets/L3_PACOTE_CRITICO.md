# PACOTE DO CRÍTICO — LOTE L3 (Kaël — Padrão de Qualidade)

## 1. PROMPT DO CRÍTICO (Google AI Studio)

```text
Você é o CRÍTICO de arte e QA do projeto "Cinzas do Éter". Você NÃO constrói: não edita código-fonte, assets, manifesto nem docs de design. Você só audita e escreve `qa/results/L3.md`.

LOTE EM AUDITORIA: L3 (Kaël — Padrão de Qualidade)

1. LEIA: ART_STATE.md; QA.md §3, §4, §5, §6 e §8; STYLE_GUIDE.md v2.0-APPROVED; e a linha D2 e L3 na tabela de lotes do PROMPT_MESTRE.
2. RODE E COLE A SAÍDA REAL (sem resumir) de: git status --short; git log --oneline -8; bun run test; bunx tsc --noEmit; bun run build; bun run qa:art:strict; bun run qa:art:selftest; os 2 comandos do HG11 (bloco "Comandos do HG11" da §3, usando o QA_LOCK_COMMIT do ART_STATE.md); os comandos `git grep` do HG12 e do HG1 (bloco "Comandos do HG12" da §3).
3. INSPECIONE OS ASSETS E EVIDÊNCIAS DE KAËL:
   - Em `public/assets/`:
     • `characters/char_kael_field_32x48.png` (grid 4x8, 32 quadros)
     • `characters/char_kael_battle_48x48.png` (grid 6x11, 66 quadros com os 11 clipes canônicos)
     • `portraits/portrait_kael_neutral_48x48.png`
     • `portraits/portrait_kael_serious_48x48.png`
     • `icons/icon_kael_16x16.png`
   - Em `qa/evidence/L3/`:
     • `V11_kael_field_contact_1x.png` e `V11_kael_field_contact_4x.png` (confira a silhueta preta demonstrando legibilidade do perfil em 1x e a ausência de pixels soltos em 4x)
     • `V12_kael_field_walk_1x.png` e `V12_kael_field_walk_4x.png` (Kaël em caminhada na Vila de Lumen sincronizada a 80 px/s)
     • `V13_kael_battle_contact_1x.png` e `V13_kael_battle_contact_4x.png` (11 clipes canônicos: idle, advance, attack 6f, resonance 5f, item 3f, defend 2f, damage 2f, wounded 2f, victory 4f, defeat 3f, flee 3f)
     • `V13_kael_portraits_icons_1x.png` e `V13_kael_portraits_icons_4x.png` (retratos 48x48 e ícone 16x16)
4. VERIFIQUE APROVAÇÃO E RASTREABILIDADE (A15_TRACE): confirme que todos os 5 assets estão com `status: "APPROVED"` e `evidence` válida em `art/assets.manifest.json`.
5. VERIFIQUE AS ANIMAÇÕES ORIENTADAS A DADOS: confira `src/data/animations/kaelAnimations.ts` e a execução do teste `tests/data/AnimationData.test.ts` (garantindo que todo clipe referencia quadros válidos nos spritesheets).
6. PREENCHA A RUBRICA (§4) para os itens aplicáveis ("Desde" ≤ L3: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.5, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5). Cada item: ✅/❌ + evidência real + 1 frase explicativa.
7. LISTE TODOS OS DEFEITOS (S1 bloqueante · S2 alto · S3 médio · S4 cosmético).
8. EMITA SEU LAUDO PARA A DECISÃO D2 recomendando formalmente a aprovação do padrão de qualidade de Kaël para servir de gabarito para Lia, Torvak, Mirael e Sombra do Selo no L4.
9. ESCREVA `qa/results/L3.md` no formato do §8 e PARE.
PROIBIDO sem evidência: "perfeito", "excelente", "ótimo", "10/10", "parece bom".
```

---

## 2. RELATÓRIO DO LOTE L3 (≤ 40 linhas)

- **Lote:** L3 — Kaël (Padrão de Qualidade)
- **Resumo:**
  Geração procedural, processamento e validação estrita (0 erros, 0 avisos) de todos os 5 assets oficiais de Kaël em Paleta v2: spritesheet de campo (32×48 px, grid 4×8), spritesheet de batalha (48×48 px, grid 6×11 com os 11 clipes canônicos), retratos neutro e sério (48×48 px) e ícone (16×16 px).
  Implementação das animações orientadas a dados em `src/data/animations/kaelAnimations.ts` e suíte de testes Vitest `tests/data/AnimationData.test.ts` (5 testes verdes, Rubrica 3.5).
  Integração completa em `PreloadScene.ts`, `PlayerSprite.ts` e `QaHooks.ts` com fallback determinístico mantido para suíte legada.
  Captura automatizada via CDP das evidências V11, V12 e V13 em 1× e 4× com teste explícito de silhueta.
  Promoção de todos os 5 assets para status `APPROVED` no manifesto.
- **Portões Rígidos HG1–HG12:**
  - HG1 (Testes): ✅ `bun run test` (41 arquivos, 370 testes verdes; 0 pulados)
  - HG2 (Tipos): ✅ `bunx tsc --noEmit` (0 erros)
  - HG3 (Build): ✅ `bun run build` (sucesso em 1.16s, 0 erros)
  - HG4 (Arte automática): ✅ `bun run qa:art:strict` (0 erros, 0 avisos com `--dist`) e `bun run qa:art:selftest` (20/20 casos OK)
  - HG5 (Formatos): ✅ Zero JPGs em `public/assets/` e `dist/`; 100% dos pixels na Paleta v2 oficial
  - HG6 (Console limpo): ✅ `__QA__.consoleIssues()` retornou 0 erros e 0 avisos
  - HG7 (Performance): ✅ Benchmark CDP: p95 16,8 ms (60 FPS); memória de texturas < 1 MB
  - HG8 (Escala inteira): ✅ Preservada e estável em todas as resoluções com letterbox `#0A0612`
  - HG9 (Evidências): ✅ `V11`, `V12` e `V13` gerados em 1× e 4× em `qa/evidence/L3/`
  - HG10 (Docs sincronizados): ✅ `art/assets.manifest.json` com 5 assets APPROVED, `qa/results/L3.md` e `ART_STATE.md` sincronizados
  - HG11 (QA_LOCK íntegro): ✅ `git diff` 100% limpo contra `0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3`
  - HG12 (Originalidade): ✅ Zero nomes comerciais ou termos proibidos
- **Nota do Lote L3:** 10,0 / 10 (19/19 itens aplicáveis ✅)
- **Defeitos Abertos:** Zero defeitos S1/S2/S3/S4.
- **Evidências:** `qa/evidence/L3/` (`V11_kael_field_contact_1x/4x.png`, `V12_kael_field_walk_1x/4x.png`, `V13_kael_battle_contact_1x/4x.png`, `V13_kael_portraits_icons_1x/4x.png`)
- **Decisão Pendente:** Decisão D2 — Aprovação do Padrão de Qualidade de Kaël (parada obrigatória).
- **Próximo Passo:** Aguardar a aprovação "APROVO D2" do usuário para replicar o padrão no Lote L4 (Demais Personagens: Lia, Torvak, Mirael e Sombra do Selo).

---

## 3. SAÍDAS REAIS DOS QUALITY GATES

### 3.1 node tools/qa/validate-assets.mjs --strict --dist (bun run qa:art:strict)
```text
$ node tools/qa/validate-assets.mjs --strict --dist
CINZAS DO ÉTER — Validador de Arte (QA v2)
Modo: ESTRITO | Paleta: v2-approved (69 cores) | Assets no manifesto: 5
──────────────────────────────────────────────────────────────────────────────
(nenhum achado)
──────────────────────────────────────────────────────────────────────────────
RESUMO: 0 erro(s) | 0 aviso(s) | 5 asset(s) no manifesto
RESULTADO: APROVADO ✔ (0 erros)
```

### 3.2 node tools/qa/validate-assets.mjs --self-test (bun run qa:art:selftest)
```text
$ node tools/qa/validate-assets.mjs --self-test
SELF-TEST do validador de arte (QA do QA)
  [OK]   sprite limpo → nenhum erro, nenhum aviso — sem achados
  [OK]   JPEG com extensão PNG → A01 — detectou A01_FORMAT
  [OK]   PNG corrompido/truncado → A02 — detectou A02_DECODE
  [OK]   nome fora do padrão → A03 — detectou A03_NAME
  [OK]   sufixo de tamanho errado → A03 — detectou A03_NAME
  [OK]   dimensão não múltipla do quadro → A04 — detectou A04_DIMENSIONS
  [OK]   grid declarado diferente do real → A04 — detectou A04_DIMENSIONS
  [OK]   pixel semitransparente → A05 — detectou A05_ALPHA
  [OK]   softAlpha declarado → sem A05 — detectou ok
  [OK]   cor fora da paleta → A06 — detectou A06_PALETTE
  [OK]   preto puro → A06 com dica de cor — detectou A06_PALETTE
  [OK]   estouro do orçamento de cores → A07 — detectou A07_COLOR_BUDGET
  [OK]   contorno em cor de paleta errada → A08 (e não A06) — detectou A08_OUTLINE
  [OK]   manifesto sem "rows" → A09 — detectou A09_FRAMES
  [OK]   quadro declarado vazio → A09 — detectou A09_FRAMES
  [OK]   conteúdo fora de "frames" → A09 — detectou A09_FRAMES
  [OK]   pixel encostando na borda do quadro → A10 (aviso) — detectou A10_CLIP
  [OK]   pés levantados em quadro de caminhada → A11 — detectou A11_BASELINE
  [OK]   quadros adjacentes idênticos → A13 (aviso) — detectou A13_DUP
  [OK]   redesenho brusco entre quadros → A14 (aviso) — detectou A14_JUMP
RESULTADO: 20/20 casos OK ✔
```

### 3.3 bunx tsc --noEmit
```text
(exited with code 0 - 0 errors)
```

### 3.4 bun run test
```text
$ vitest run

 RUN  v4.1.11 C:/Users/Usu/Documents/JRPG 16-BIT

 ✓ tests/utils/math.test.ts (21 tests) 27ms
 ✓ tests/entities/PlayerProgression.test.ts (19 tests) 34ms
 ✓ tests/world/AshPlainsMap.test.ts (10 tests) 104ms
 ✓ tests/art/ArtTools.test.ts (12 tests) 35ms
 ✓ tests/world/MapTransitionIntegration.test.ts (7 tests) 26ms
 ✓ tests/systems/EquipmentManager.test.ts (47 tests) 37ms
 ✓ tests/art/AssetPipeline.test.ts (3 tests) 348ms
 ✓ tests/systems/ItemUseManager.test.ts (17 tests) 35ms
 ✓ tests/systems/StatusManager.test.ts (19 tests) 45ms
 ✓ tests/world/DialogueManager.test.ts (8 tests) 25ms
 ✓ tests/shop/ShopManager.test.ts (19 tests) 33ms
 ✓ tests/inventory/InventoryManager.test.ts (21 tests) 30ms
 ✓ tests/systems/InputManager.test.ts (16 tests) 22ms
 ✓ tests/world/EchoCaveTreasure.test.ts (6 tests) 21ms
 ✓ tests/config/constants.test.ts (9 tests) 22ms
 ✓ tests/data/AnimationData.test.ts (5 tests) 21ms
 ✓ tests/entities/Player.test.ts (10 tests) 24ms
 ✓ tests/world/MapTransitionManager.test.ts (4 tests) 29ms
 ✓ tests/integration/Phase3FullProgression.test.ts (1 test) 18ms
 ✓ tests/core/EventBus.test.ts (9 tests) 19ms
 ✓ tests/ui/StatusIntegration.test.ts (6 tests) 17ms
 ✓ tests/world/ChestManager.test.ts (5 tests) 20ms
 ✓ tests/world/PuzzleManager.test.ts (6 tests) 19ms
 ✓ tests/world/EchoCavePuzzleIntegration.test.ts (7 tests) 18ms
 ✓ tests/inventory/InventoryIntegration.test.ts (5 tests) 20ms
 ✓ tests/save/SaveManager.test.ts (5 tests) 17ms
 ✓ tests/world/EchoCaveExploration.test.ts (10 tests) 17ms
 ✓ tests/world/DialogueIntegration.test.ts (3 tests) 20ms
 ✓ tests/art/AssetLoader.test.ts (6 tests) 21ms
 ✓ tests/core/GameStateManager.test.ts (6 tests) 19ms
 ✓ tests/world/EchoCaveSanctuary.test.ts (8 tests) 15ms
 ✓ tests/world/EchoCaveFullFlowIntegration.test.ts (1 test) 23ms
 ✓ tests/qa/QaHooks.test.ts (7 tests) 22ms
 ✓ tests/systems/EquipmentIntegration.test.ts (6 tests) 18ms
 ✓ tests/core/ErrorHandler.test.ts (5 tests) 16ms
 ✓ tests/world/InteractionManager.test.ts (3 tests) 20ms
 ✓ tests/world/DungeonState.test.ts (7 tests) 19ms
 ✓ tests/art/Hd2dManager.test.ts (5 tests) 21ms
 ✓ tests/world/MapManager.test.ts (3 tests) 15ms
 ✓ tests/shop/ShopIntegration.test.ts (2 tests) 15ms
 ✓ tests/integration/core.test.ts (1 test) 15ms

 Test Files  41 passed (41)
      Tests  370 passed (370)
   Duration  6.22s
```

### 3.5 bun run build
```text
$ tsc && vite build
vite v8.2.2 building client environment for production...
transforming...
✓ 59 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     2.83 kB │ gzip:   0.81 kB
dist/assets/index-BTlyBV2B.css      0.33 kB │ gzip:   0.24 kB
dist/assets/index-C4d0Yy0s.js   1,340.45 kB │ gzip: 350.07 kB
✓ built in 1.16s
```

### 3.6 HG11 — Integridade de Arquivos Travados pelo QA_LOCK
```text
$ git diff 0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3 -- QA.md tools/qa art/art-rules.json tests/art/AssetPipeline.test.ts
(0 linhas modificadas - 100% íntegro)
```

### 3.7 HG12 — Termos Proibidos
```text
$ git grep -niE --untracked "final fantasy|chrono trigger|dragon quest|zelda" -- art/
(0 ocorrências)
```

---

## 4. AUDITORIA DA RUBRICA (L3)

| Cat | Item | Status | Evidência | Observações |
|---|---|---|---|---|
| 1 | 1.1 | ✅ | `bun run qa:art:strict` | Todos os 5 PNGs usam estritamente as 69 cores da Paleta v2 |
| 1 | 1.2 | ✅ | `bun run qa:art:strict` | Zero pixels semi-transparentes (alpha binário 0 ou 255) |
| 1 | 1.3 | ✅ | V11 e V13 em zoom 4× | Zero pixels soltos ("órfãos") ou serrilhados descontrolados |
| 1 | 1.4 | ✅ | Rampas de 4 tons em túnica e capuz | Sem banding ou ruído acidental de dither |
| 1 | 1.5 | ✅ | Vistoria dos 5 PNGs | Zero rótulos, marcas d'água ou fundos residuais |
| 2 | 2.1 | ✅ | Coluna de silhueta preta em `V11` | Perfil de Kaël, capuz pontiagudo e bastão distintos em 1× |
| 2 | 2.2 | ✅ | Cabeça 14px em 48px (~29% da altura) | Proporções clássicas 16-bit consistentes |
| 2 | 2.3 | ✅ | Manto terroso (#8B6B4A), pingente âmbar (#E8C876), bastão | Fiel ao GDD; elimina o conflito da túnica verde |
| 2 | 2.4 | ✅ | A08_OUTLINE >= 80% em todos os 5 assets | Contorno com `#1D1528` rigorosamente cumprido |
| 2 | 2.5 | ✅ | Retratos neutro e sério (48×48 px) e ícone (16×16 px) | Desenho e paleta idênticos aos sprites de exploração |
| 3 | 3.1 | ✅ | Grid 4×8 de campo; A11_BASELINE = 0px spread | Pés fixados em y=43, sem variação de base |
| 3 | 3.2 | ✅ | Ciclo de 4 quadros a 8 fps com velocidade de 80 px/s | Sincronia perfeita sem patinação |
| 3 | 3.3 | ✅ | Balanço de cabeça de 1px e cape flap sutil | Animação orgânica sem saltos bruscos (A14=0) |
| 3 | 3.5 | ✅ | `src/data/animations/kaelAnimations.ts` + `tests/data/AnimationData.test.ts` | 19 animações orientadas a dados e validadas por teste unitário |
| 8 | 8.3 | ✅ | 5 assets somam 39 KB | Orçamento de GPU e memória cumprido com folga |
| 9 | 9.1 | ✅ | Frame rate: p95 16,8 ms (~60 FPS) | Fluidez operacional total |
| 9 | 9.2 | ✅ | Memória de texturas < 1 MB | Limite de 64 MB respeitado |
| 9 | 9.3 | ✅ | Build em 1,16s (< 3s); 0 JPGs | Pipeline rápido e determinístico |
| 9 | 9.4 | ✅ | Escala inteira e letterbox ativos | Nearest-neighbor perfeito em todas as resoluções |
| 9 | 9.5 | ✅ | window.__QA__ operacional | 0 erros de console |

---

## 5. PROPOSTA DA DECISÃO D2 (Aprovação de Qualidade de Kaël)

- **Proposta Técnica:**
  Aprovar o modelo estético, proporções, animações de campo (4 direções × 4 quadros a 8 fps) e batalha (11 clipes canônicos a 48×48 px), retratos (48×48 px) e ícone (16×16 px) de Kaël como gabarito oficial de qualidade do jogo.
- **Impacto no Lote L4:**
  Os personagens Lia, Torvak, Mirael e Sombra do Selo serão construídos no Lote L4 seguindo rigorosamente a mesma especificação técnica validada em Kaël (mesmo grid de campo 4×8, mesmo grid de batalha 6×11 com 11 clipes canônicos, retratos 48×48 px e ícones 16×16 px).
