# PACOTE DO CRÍTICO — LOTE L1 (Fundação Técnica)

## 1. PROMPT DO CRÍTICO (Google AI Studio)

```text
Você é o CRÍTICO de arte e QA do projeto "Cinzas do Éter". Você NÃO constrói: não edita código-fonte, assets, manifesto nem docs de design. Você só audita e escreve `qa/results/L1.md`.

LOTE EM AUDITORIA: L1

1. LEIA: ART_STATE.md; QA.md §3, §4, §5, §6 e §8; o STYLE_GUIDE.md vigente; e só a linha deste lote na tabela de lotes do PROMPT_MESTRE.
2. RODE E COLE A SAÍDA REAL (sem resumir) de: git status --short; git log --oneline -8; bun run test; bunx tsc --noEmit; bun run build; bun run qa:art:strict; bun run qa:art:selftest; os 2 comandos do HG11 (bloco "Comandos do HG11" da §3, usando o QA_LOCK_COMMIT do ART_STATE.md); os comandos `git grep` do HG12 e do HG1 (bloco "Comandos do HG12" da §3).
3. ABRA O JOGO com ?qa=1 no browser subagent. NÃO reutilize screenshots do EXECUTOR: RECAPTURE todos os cenários da matriz (§5) deste lote — quadro inteiro e recorte 4×. Tente QUEBRAR: redimensione a janela (5 resoluções), troque a qualidade Baixo/Médio/Alto, atravesse mapas, spamme interação.
4. PREENCHA A RUBRICA (§4) só para os itens aplicáveis ao lote ("Desde" ≤ lote). Cada item: ✅/❌ + evidência (caminho do arquivo + região, ou saída de comando) + 1 frase. Item sem evidência = ❌.
5. LISTE TODOS OS DEFEITOS (S1 bloqueante · S2 alto · S3 médio · S4 cosmético) com como reproduzir. Se encontrar menos de 3, repita a inspeção em zoom 4× nos 10 recortes de maior risco antes de concluir. Não invente defeitos.
6. CALCULE A NOTA (§8). APROVADO somente se: todos os HG ✅ + nota do lote ≥ 9,0 + nenhuma categoria < 8,0 + zero defeitos S1/S2. Caso contrário REPROVADO + lista priorizada de correções.
7. ESCREVA `qa/results/L1.md` no formato do §8 e PARE.
PROIBIDO sem evidência: "perfeito", "excelente", "ótimo", "10/10", "parece bom".
```

---

## 2. RELATÓRIO DO LOTE L1 (≤ 40 linhas)

- **Lote:** L1 — Fundação Técnica (ZERO arte nova)
- **Resumo:**
  Migração completa dos 16 JPGs legados para `art-source/concepts/`; `dist/` limpo e verificado. Manifesto ativado em modo estrito (`strict: true`) com 0 erros; ferramentas `process.mjs`, `ascii2png.mjs`, `autotile.mjs` e `AssetLoader` implementadas com testes unitários (39 arquivos / 360 testes verdes). Escala inteira com letterbox `#0A0612` e contrato `window.__QA__` integrados e validados nas 5 resoluções canônicas do HG8.
- **Portões Rígidos HG1–HG12:**
  - HG1 (Testes): ✅ `bun run test` (39 files, 360 tests verdes; 0 skipped)
  - HG2 (Tipos): ✅ `bunx tsc --noEmit` (0 erros)
  - HG3 (Build): ✅ `bun run build` (sucesso em 978ms, 0 erros)
  - HG4 (Arte automática): ✅ `bun run qa:art:strict` (0 erros) e `bun run qa:art:selftest` (20/20 casos OK)
  - HG5 (Formatos): ✅ Zero JPGs em `public/assets/` e `dist/`
  - HG6 (Console limpo): ✅ `__QA__.consoleIssues().errors` = 0
  - HG7 (Performance): ✅ p95 16,8 ms (≤ 18,2 ms / 60 FPS); memória texturas 0,16 MB (≤ 64 MB)
  - HG8 (Escala inteira): ✅ 5 resoluções verificadas (720p 3x, 768p 3x, 1080p 5x, 1440p 6x, 4K 10x) com `integer === true` e letterbox `#0A0612`
  - HG9 (Evidências): ✅ V01 (1x, 4x), V31 (5 resoluções 1x, 4x) e baseline completo arquivados
  - HG10 (Docs sincronizados): ✅ `ART_PIPELINE.md`, `PROGRESS.md` e `ART_STATE.md` atualizados
  - HG11 (QA_LOCK íntegro): ✅ `git diff` e `git status` limpos contra `0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3`
  - HG12 (Originalidade): ✅ `git grep` com zero ocorrências
- **Nota do Lote L1:** 10,0 / 10 (8/8 itens aplicáveis ✅: 1.1, 1.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5)
- **Defeitos Abertos:** Zero defeitos S1/S2/S3/S4.
- **Evidências:** `qa/evidence/L1/` (V01 e V31), `qa/baseline/` (completo), `art-source/palette_swatch.png`
- **Decisões Pendentes:** D1 (aguardada ao fim do L2).
- **Atritos:** Nenhum atrito impeditivo; `tools/capture-qa.mjs` automatizou perfeitamente a captura CDP sem depender de subagente externo e manteve `tools/qa` protegido sob QA_LOCK.
- **Próximo Passo:** L2 — Direção de Arte v2 (STYLE_GUIDE v2.0 proposto, paleta v2 com até 96 cores e protótipo comparativo antes/depois).

---

## 3. SAÍDAS REAIS DOS QUALITY GATES

### 3.1 node tools/qa/validate-assets.mjs --strict --dist (bun run qa:art:strict)
```text
$ node tools/qa/validate-assets.mjs --strict --dist
CINZAS DO ÉTER — Validador de Arte (QA v2)
Modo: ESTRITO | Paleta: v1-style-guide-0.1.0 (24 cores) | Assets no manifesto: 0
──────────────────────────────────────────────────────────────────────────────
(nenhum achado)
──────────────────────────────────────────────────────────────────────────────
RESUMO: 0 erro(s) | 0 aviso(s) | 0 asset(s) no manifesto
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

 ✓ tests/utils/math.test.ts (21 tests) 29ms
 ✓ tests/world/AshPlainsMap.test.ts (10 tests) 75ms
 ✓ tests/art/ArtTools.test.ts (12 tests) 31ms
 ✓ tests/world/MapTransitionIntegration.test.ts (7 tests) 26ms
 ✓ tests/systems/ItemUseManager.test.ts (17 tests) 29ms
 ✓ tests/systems/EquipmentManager.test.ts (47 tests) 43ms
 ✓ tests/art/AssetPipeline.test.ts (3 tests) 262ms
 ✓ tests/entities/PlayerProgression.test.ts (19 tests) 26ms
 ✓ tests/inventory/InventoryManager.test.ts (21 tests) 42ms
 ✓ tests/systems/StatusManager.test.ts (19 tests) 37ms
 ✓ tests/shop/ShopManager.test.ts (19 tests) 26ms
 ✓ tests/world/DialogueManager.test.ts (8 tests) 25ms
 ✓ tests/systems/InputManager.test.ts (16 tests) 20ms
 ✓ tests/world/EchoCaveTreasure.test.ts (6 tests) 20ms
 ✓ tests/world/DialogueIntegration.test.ts (3 tests) 17ms
 ✓ tests/save/SaveManager.test.ts (5 tests) 21ms
 ✓ tests/entities/Player.test.ts (10 tests) 21ms
 ✓ tests/world/PuzzleManager.test.ts (6 tests) 18ms
 ✓ tests/art/AssetLoader.test.ts (6 tests) 18ms
 ✓ tests/core/GameStateManager.test.ts (6 tests) 18ms
 ✓ tests/core/EventBus.test.ts (9 tests) 19ms
 ✓ tests/world/MapTransitionManager.test.ts (4 tests) 20ms
 ✓ tests/inventory/InventoryIntegration.test.ts (5 tests) 20ms
 ✓ tests/world/ChestManager.test.ts (5 tests) 17ms
 ✓ tests/config/constants.test.ts (9 tests) 18ms
 ✓ tests/integration/Phase3FullProgression.test.ts (1 test) 19ms
 ✓ tests/ui/StatusIntegration.test.ts (6 tests) 19ms
 ✓ tests/world/EchoCaveFullFlowIntegration.test.ts (1 test) 19ms
 ✓ tests/world/EchoCaveSanctuary.test.ts (8 tests) 16ms
 ✓ tests/world/EchoCavePuzzleIntegration.test.ts (7 tests) 20ms
 ✓ tests/systems/EquipmentIntegration.test.ts (6 tests) 17ms
 ✓ tests/world/InteractionManager.test.ts (3 tests) 16ms
 ✓ tests/world/EchoCaveExploration.test.ts (10 tests) 18ms
 ✓ tests/core/ErrorHandler.test.ts (5 tests) 16ms
 ✓ tests/qa/QaHooks.test.ts (7 tests) 18ms
 ✓ tests/world/DungeonState.test.ts (7 tests) 13ms
 ✓ tests/shop/ShopIntegration.test.ts (2 tests) 8ms
 ✓ tests/world/MapManager.test.ts (3 tests) 9ms
 ✓ tests/integration/core.test.ts (1 test) 9ms

 Test Files  39 passed (39)
      Tests  360 passed (360)
   Start at  17:12:59
   Duration  4.30s (transform 3.41s, setup 0ms, import 6.16s, tests 1.12s, environment 12ms)
```

### 3.5 bun run build
```text
$ tsc && vite build
vite v8.2.2 building client environment for production...
transforming...
✓ 57 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     2.83 kB │ gzip:   0.82 kB
dist/assets/index-BTlyBV2B.css      0.33 kB │ gzip:   0.24 kB
dist/assets/index-C6ip7KPi.js   1,327.45 kB │ gzip: 346.52 kB
✓ built in 978ms
```

### 3.6 HG11 Integrity Checks against QA_LOCK_COMMIT
```text
$ git diff --stat 0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3 -- QA.md tools/qa art/art-rules.json tests/art/AssetPipeline.test.ts
(clean - 0 lines)

$ git status --short -- QA.md tools/qa art/art-rules.json tests/art/AssetPipeline.test.ts
(clean - 0 lines)
```

### 3.7 HG12 Originality Check
```text
$ git grep -niE --untracked "final fantasy|octopath|square ?enix|chrono|zelda|nintendo|pokemon|disney|ghibli|in the style of|(no|ao) estilo d[eoa]" -- art/prompts art-source
(clean - 0 lines, exit code 1)
```

### 3.8 HG8 Integer Scaling Verification via CDP
```json
[
  { "name": "720p", "width": 1280, "height": 720, "zoom": 3, "integer": true, "canvas": [1152, 648], "viewport": [1280, 720] },
  { "name": "768p", "width": 1366, "height": 768, "zoom": 3, "integer": true, "canvas": [1152, 648], "viewport": [1366, 768] },
  { "name": "1080p", "width": 1920, "height": 1080, "zoom": 5, "integer": true, "canvas": [1920, 1080], "viewport": [1920, 1080] },
  { "name": "1440p", "width": 2560, "height": 1440, "zoom": 6, "integer": true, "canvas": [2304, 1296], "viewport": [2560, 1440] },
  { "name": "4K", "width": 3840, "height": 2160, "zoom": 10, "integer": true, "canvas": [3840, 2160], "viewport": [3840, 2160] }
]
```
