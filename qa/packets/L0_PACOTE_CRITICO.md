# PACOTE DO CRÍTICO — LOTE L0 (Auditoria e Linha de Base)

## 1. PROMPT DO CRÍTICO (Google AI Studio)

```text
Você é o CRÍTICO de arte e QA do projeto "Cinzas do Éter". Você NÃO constrói: não edita código-fonte, assets, manifesto nem docs de design. Você só audita e escreve `qa/results/L0.md`.

LOTE EM AUDITORIA: L0

1. LEIA: ART_STATE.md; QA.md §3, §4, §5, §6 e §8; o STYLE_GUIDE.md vigente; e só a linha deste lote na tabela de lotes do PROMPT_MESTRE.
2. RODE E COLE A SAÍDA REAL (sem resumir) de: git status --short; git log --oneline -8; bun run test; bunx tsc --noEmit; bun run build; bun run qa:art:strict; bun run qa:art:selftest; os 2 comandos do HG11 (bloco "Comandos do HG11" da §3, usando o QA_LOCK_COMMIT do ART_STATE.md); os comandos `git grep` do HG12 e do HG1 (bloco "Comandos do HG12" da §3).
3. ABRA O JOGO com ?qa=1 no browser subagent. NÃO reutilize screenshots do EXECUTOR: RECAPTURE todos os cenários da matriz (§5) deste lote — quadro inteiro e recorte 4×. Tente QUEBRAR: redimensione a janela (5 resoluções), troque a qualidade Baixo/Médio/Alto, atravesse mapas, spamme interação.
4. PREENCHA A RUBRICA (§4) só para os itens aplicáveis ao lote ("Desde" ≤ lote). Cada item: ✅/❌ + evidência (caminho do arquivo + região, ou saída de comando) + 1 frase. Item sem evidência = ❌.
5. LISTE TODOS OS DEFEITOS (S1 bloqueante · S2 alto · S3 médio · S4 cosmético) com como reproduzir. Se encontrar menos de 3, repita a inspeção em zoom 4× nos 10 recortes de maior risco antes de concluir. Não invente defeitos.
6. CALCULE A NOTA (§8). APROVADO somente se: todos os HG ✅ + nota do lote ≥ 9,0 + nenhuma categoria < 8,0 + zero defeitos S1/S2. Caso contrário REPROVADO + lista priorizada de correções.
7. ESCREVA `qa/results/L0.md` no formato do §8 e PARE.
PROIBIDO sem evidência: "perfeito", "excelente", "ótimo", "10/10", "parece bom".
```

---

## 2. RELATÓRIO DO LOTE L0

- **Lote:** L0 — Auditoria e Linha de Base
- **Resumo:**
  Instalação completa do Kit Gráficos 2.0.1 travada no commit `0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3`. Reconfirmação dos 9 Fatos do projeto: estado atual 100% placeholder com 16 JPGs legados não carregados. Zero linhas de código alteradas; baseline de 36 arquivos e 335 testes unitários 100% verdes registrado.
- **Portões Rígidos HG1–HG12:**
  - HG1 (Testes): ✅ `bun run test` (36 files, 335 tests verdes; 0 skipped via `git grep`)
  - HG2 (Tipos): ✅ `bunx tsc --noEmit` (0 erros)
  - HG3 (Build): ✅ `bun run build` (sucesso em 898ms)
  - HG4 (Arte automática): ✅ `node tools/qa/validate-assets.mjs --self-test` (20/20 OK); `node tools/qa/validate-assets.mjs` (0 erros, 17 avisos em modo TRANSIÇÃO)
  - HG5 (Formatos): ❌ Linha de base contém 16 JPGs legados em `public/assets/` (a migrar em L1)
  - HG6 (Console limpo): ❌ Pendente L1 (requer hook `__QA__.consoleIssues()`)
  - HG7 (Performance): ❌ Pendente L1 (requer hooks `__QA__.fps()` / `memory()`)
  - HG8 (Escala inteira): ❌ Pendente L1 (jogo atual usa Phaser.Scale.FIT)
  - HG9 (Evidência): ✅ `qa/baseline/boot_title.png` gerado e arquivado
  - HG10 (Docs sincronizados): ✅ `ART_STATE.md` criado e sincronizado
  - HG11 (QA_LOCK íntegro): ✅ `git diff` e `git status` limpos contra `0bc0ca1`
  - HG12 (Originalidade): ✅ `git grep` com zero ocorrências
- **Nota Inicial de Referência:** 0,6 / 10 (3 itens ✅ de 50: 4.5, 8.3, 8.5)
  - Cat. 1: 0,0 | Cat. 2: 0,0 | Cat. 3: 0,0 | Cat. 4: 2,0 | Cat. 5: 0,0
  - Cat. 6: 0,0 | Cat. 7: 0,0 | Cat. 8: 4,0 | Cat. 9: 0,0 | Cat. 10: 0,0
- **Defeitos Abertos:**
  - S2: 16 arquivos JPG legados (11,04 MB) em `public/assets/` inflam o pacote e violam HG5 (a corrigir em L1).
  - S3: Jogo utiliza `Phaser.Scale.FIT` em vez de escala inteira com letterbox (a corrigir em L1).
  - S4: Ausência de hooks de automação `window.__QA__` impedindo navegação remota na baseline (a implementar em L1).
- **Evidências:** `qa/baseline/boot_title.png`, `ART_STATE.md`
- **Decisões Pendentes:** D1 (aguardada no fim de L2), D2 (fim de L3), D3 (início de L6), D4 (sob demanda).
- **Atritos:** Nenhum erro do kit ou do código. O comando nativo `Test-Path` no PowerShell exigiu aspas para caminhos com espaço (`"JRPG 16-BIT"`).
- **Próximo Passo:** L1 — Fundação Técnica (migração dos JPGs para `art-source/concepts/`, scripts de QA no `package.json`, implementação de `tools/art/process.mjs`, `ascii2png.mjs`, `autotile.mjs`, escala inteira e hooks `window.__QA__`).

---

## 3. SAÍDAS REAIS DOS QUALITY GATES

### 3.1 node tools/qa/validate-assets.mjs --self-test
```text
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

### 3.2 node tools/qa/validate-assets.mjs
```text
CINZAS DO ÉTER — Validador de Arte (QA v2)
Modo: TRANSIÇÃO | Paleta: v1-style-guide-0.1.0 (24 cores) | Assets no manifesto: 0
ATENÇÃO: modo TRANSIÇÃO — órfãos e formatos legados aparecem como AVISO. O lote L1 só termina com "strict": true no manifesto.
──────────────────────────────────────────────────────────────────────────────
[AVISO] A19_LEGACY  public/assets/backgrounds/bg_battle_echo_cave.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/backgrounds/env_ash_plains.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/backgrounds/env_lumen_village.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/characters/char_kael_sheet.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/icons/icons_equipment.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/icons/icons_items.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/monsters/enemy_reptil_fossilizado.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/monsters/monsters_trio_sheet.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/npcs/npc_lia_sheet.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/npcs/npc_mirael_sheet.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/npcs/npc_torvak_sheet.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/props/props_interactive_sheet.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/tilesets/tileset_echo_cave.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/tilesets/tileset_lumen_village.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/ui/ui_battle_and_menu_frames.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A19_LEGACY  public/assets/vfx/vfx_battle_resonance.jpg — formato JPG não é permitido em public/ (mover para art-source/concepts/ ou converter)
[AVISO] A18_SIZE  public/assets pesa 11.0 MB > orçamento 8 MB
──────────────────────────────────────────────────────────────────────────────
RESUMO: 0 erro(s) | 17 aviso(s) | 0 asset(s) no manifesto
RESULTADO: APROVADO ✔ (0 erros)
```

### 3.3 bunx tsc --noEmit
```text
(exited with code 0 - 0 errors)
```

### 3.4 bun run test
```text
$ vitest run

 RUN  v4.1.11 C:/Users/Usu/Documents/JRPG 16-BIT

 ✓ tests/utils/math.test.ts (21 tests) 33ms
 ✓ tests/core/GameStateManager.test.ts (6 tests) 17ms
 ✓ tests/entities/Player.test.ts (10 tests) 18ms
 ✓ tests/world/PuzzleManager.test.ts (6 tests) 20ms
 ✓ tests/systems/StatusManager.test.ts (19 tests) 28ms
 ✓ tests/world/AshPlainsMap.test.ts (10 tests) 101ms
 ✓ tests/systems/EquipmentManager.test.ts (47 tests) 43ms
 ✓ tests/inventory/InventoryManager.test.ts (21 tests) 26ms
 ✓ tests/entities/PlayerProgression.test.ts (19 tests) 35ms
 ✓ tests/systems/ItemUseManager.test.ts (17 tests) 30ms
 ✓ tests/world/DialogueManager.test.ts (8 tests) 23ms
 ✓ tests/shop/ShopManager.test.ts (19 tests) 29ms
 ✓ tests/world/MapTransitionIntegration.test.ts (7 tests) 35ms
 ✓ tests/world/DialogueIntegration.test.ts (3 tests) 22ms
 ✓ tests/world/EchoCavePuzzleIntegration.test.ts (7 tests) 21ms
 ✓ tests/config/constants.test.ts (9 tests) 17ms
 ✓ tests/core/EventBus.test.ts (9 tests) 18ms
 ✓ tests/world/ChestManager.test.ts (5 tests) 20ms
 ✓ tests/world/EchoCaveTreasure.test.ts (6 tests) 23ms
 ✓ tests/save/SaveManager.test.ts (5 tests) 22ms
 ✓ tests/integration/core.test.ts (1 test) 15ms
 ✓ tests/world/EchoCaveFullFlowIntegration.test.ts (1 test) 19ms
 ✓ tests/ui/StatusIntegration.test.ts (6 tests) 19ms
 ✓ tests/world/MapTransitionManager.test.ts (4 tests) 22ms
 ✓ tests/world/EchoCaveExploration.test.ts (10 tests) 16ms
 ✓ tests/world/EchoCaveSanctuary.test.ts (8 tests) 15ms
 ✓ tests/systems/InputManager.test.ts (16 tests) 15ms
 ✓ tests/inventory/InventoryIntegration.test.ts (5 tests) 21ms
 ✓ tests/systems/EquipmentIntegration.test.ts (6 tests) 16ms
 ✓ tests/integration/Phase3FullProgression.test.ts (1 test) 17ms
 ✓ tests/world/InteractionManager.test.ts (3 tests) 16ms
 ✓ tests/world/DungeonState.test.ts (7 tests) 15ms
 ✓ tests/world/MapManager.test.ts (3 tests) 11ms
 ✓ tests/core/ErrorHandler.test.ts (5 tests) 13ms
 ✓ tests/art/AssetPipeline.test.ts (3 tests) 202ms
 ✓ tests/shop/ShopIntegration.test.ts (2 tests) 6ms

 Test Files  36 passed (36)
      Tests  335 passed (335)
   Start at  16:19:24
   Duration  4.08s (transform 3.40s, setup 0ms, import 6.08s, tests 1.02s, environment 12ms)
```

### 3.5 bun run build
```text
$ tsc && vite build
vite v8.2.2 building client environment for production...
transforming...
✓ 54 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     2.83 kB │ gzip:   0.81 kB
dist/assets/index-BTlyBV2B.css      0.33 kB │ gzip:   0.24 kB
dist/assets/index-B-xgW4uF.js   1,320.25 kB │ gzip: 343.60 kB
✓ built in 898ms
```

### 3.6 git status --short
```text
?? ART_STATE.md
?? qa/
```

### 3.7 git diff --stat 0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3..HEAD
```text
(clean - HEAD é o QA_LOCK_COMMIT)
```

### 3.8 HG11 Integrity Commands
```text
$ git diff --stat 0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3 -- QA.md tools/qa art/art-rules.json tests/art/AssetPipeline.test.ts
(clean - 0 lines)

$ git status --short -- QA.md tools/qa art/art-rules.json tests/art/AssetPipeline.test.ts
(clean - 0 lines)
```

### 3.9 HG12 Originality Command
```text
$ git grep -niE --untracked "final fantasy|octopath|square ?enix|chrono|zelda|nintendo|pokemon|disney|ghibli|in the style of|(no|ao) estilo d[eoa]" -- art/prompts art-source
(clean - 0 lines, exit code 1)
```

### 3.10 HG1 Test Skips Command
```text
$ git grep -nE "\.(skip|only)\(|(^|[^a-zA-Z])x(it|describe)\(" -- tests
(clean - 0 lines, exit code 1)
```
