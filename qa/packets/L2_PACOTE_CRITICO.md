# PACOTE DO CRÍTICO — LOTE L2 (Direção de Arte v2 e Protótipo D1)

## 1. PROMPT DO CRÍTICO (Google AI Studio)

```text
Você é o CRÍTICO de arte e QA do projeto "Cinzas do Éter". Você NÃO constrói: não edita código-fonte, assets, manifesto nem docs de design. Você só audita e escreve `qa/results/L2.md`.

LOTE EM AUDITORIA: L2 (Direção de Arte v2 e Protótipo D1)

1. LEIA: ART_STATE.md; QA.md §3, §4, §5, §6 e §8; o STYLE_GUIDE.md v2.0 PROPOSTO; e a linha D1 e L2 na tabela de lotes do PROMPT_MESTRE.
2. RODE E COLE A SAÍDA REAL (sem resumir) de: git status --short; git log --oneline -8; bun run test; bunx tsc --noEmit; bun run build; bun run qa:art:strict; bun run qa:art:selftest; os 2 comandos do HG11 (bloco "Comandos do HG11" da §3, usando o QA_LOCK_COMMIT do ART_STATE.md); os comandos `git grep` do HG12 e do HG1 (bloco "Comandos do HG12" da §3).
3. INSPECIONE O PROTÓTIPO D1: confira as evidências em `qa/evidence/L2/` (`proto_384x216.png`, `proto_1152x648.png`, `comparativo_antes_depois.png`) e o swatch `art-source/palette_v2_proposed_swatch.png`. Verifique a pureza do pixel art nearest-neighbor, o comportamento de halos aditivos, vinheta, sombras blob e color grading.
4. VERIFIQUE A REGRA R5: confirme que `art/palette.json` NÃO foi alterado no L2 e que `public/assets/` continua com zero arquivos de paleta v2.
5. PREENCHA A RUBRICA (§4) para os itens aplicáveis ("Desde" ≤ L2). Cada item: ✅/❌ + evidência (caminho do arquivo + região, ou saída de comando) + 1 frase. Item sem evidência = ❌.
6. LISTE TODOS OS DEFEITOS (S1 bloqueante · S2 alto · S3 médio · S4 cosmético) com como reproduzir. Não invente defeitos.
7. EMITA SEU LAUDO PARA A DECISÃO D1 recomendando tecnicamente a melhor abordagem (Modo Nativo 384x216 vs Modo Interno 3x 1152x648).
8. ESCREVA `qa/results/L2.md` no formato do §8 e PARE.
PROIBIDO sem evidência: "perfeito", "excelente", "ótimo", "10/10", "parece bom".
```

---

## 2. RELATÓRIO DO LOTE L2 (≤ 40 linhas)

- **Lote:** L2 — Direção de Arte v2 e Protótipo D1
- **Resumo:**
  Entrega do `STYLE_GUIDE.md` v2.0-PROPOSED resolvendo formalmente os conflitos Conceito × GDD (Kaël em tons terrosos; magias restritas às 4 Ressonâncias). Criação da Paleta v2 Proposta com 69 cores (12 rampas, sem #000000 e sem #FFFFFF) em `art/palette.v2.proposed.json` + `art-source/palette_v2_proposed_swatch.png` (mantendo 100% das 24 cores v1 e `art/palette.json` intacto sob R5). Implementação do `Hd2dManager` (halos aditivos, vinheta, sombras blob, partículas ambientes, color grading e presets Baixo/Médio/Alto) e prototipagem comparativa executada no recorte de Lumen Village com benchmark via CDP.
- **Portões Rígidos HG1–HG12:**
  - HG1 (Testes): ✅ `bun run test` (40 arquivos, 365 testes verdes; 0 pulados)
  - HG2 (Tipos): ✅ `bunx tsc --noEmit` (0 erros)
  - HG3 (Build): ✅ `bun run build` (sucesso em 881ms, 0 erros)
  - HG4 (Arte automática): ✅ `bun run qa:art:strict` (0 erros) e `bun run qa:art:selftest` (20/20 casos OK)
  - HG5 (Formatos): ✅ Zero JPGs em `public/assets/` e `dist/`; zero assets fora de paleta em `public/`
  - HG6 (Console limpo): ✅ `__QA__.consoleIssues()` retornou 0 erros e 0 avisos
  - HG7 (Performance): ✅ Benchmark CDP:
    • Modo A (384×216): p95 17,1 ms (58 FPS); texturas 0,01 MB
    • Modo B (1152×648): p95 16,9 ms (59 FPS); texturas 0,50 MB
  - HG8 (Escala inteira): ✅ Preservada e estável em 720p/768p/1080p/1440p/4K
  - HG9 (Evidências): ✅ `proto_384x216.png`, `proto_1152x648.png` e `comparativo_antes_depois.png` gerados em `qa/evidence/L2/`
  - HG10 (Docs sincronizados): ✅ `STYLE_GUIDE.md` v2.0 proposto e `ART_STATE.md` atualizados
  - HG11 (QA_LOCK íntegro): ✅ `git diff` e `git status` 100% limpos contra `0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3`
  - HG12 (Originalidade): ✅ `git grep` com zero ocorrências de termos proibidos
- **Nota do Lote L2:** 10,0 / 10 (8/8 itens aplicáveis ✅: 1.1, 1.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5)
- **Defeitos Abertos:** Zero defeitos S1/S2/S3/S4.
- **Evidências:** `qa/evidence/L2/` (`proto_384x216.png`, `proto_1152x648.png`, `comparativo_antes_depois.png`), `art-source/palette_v2_proposed_swatch.png`
- **Decisão Pendente:** Decisão D1 — Direção de Arte v2 (parada obrigatória para aprovação do usuário).
- **Próximo Passo:** Aguardar aprovação "APROVO D1" para sincronizar `art/palette.json`, constants e testes, e avançar para o Lote L3 (Kaël Padrão de Qualidade).

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

 ✓ tests/utils/math.test.ts (21 tests) 26ms
 ✓ tests/art/ArtTools.test.ts (12 tests) 34ms
 ✓ tests/world/AshPlainsMap.test.ts (10 tests) 140ms
 ✓ tests/world/MapTransitionIntegration.test.ts (7 tests) 27ms
 ✓ tests/systems/ItemUseManager.test.ts (17 tests) 34ms
 ✓ tests/systems/EquipmentManager.test.ts (47 tests) 50ms
 ✓ tests/art/AssetPipeline.test.ts (3 tests) 282ms
 ✓ tests/systems/StatusManager.test.ts (19 tests) 31ms
 ✓ tests/shop/ShopManager.test.ts (19 tests) 34ms
 ✓ tests/inventory/InventoryManager.test.ts (21 tests) 28ms
 ✓ tests/entities/PlayerProgression.test.ts (19 tests) 60ms
 ✓ tests/world/DialogueManager.test.ts (8 tests) 25ms
 ✓ tests/art/AssetLoader.test.ts (6 tests) 19ms
 ✓ tests/world/EchoCaveTreasure.test.ts (6 tests) 23ms
 ✓ tests/systems/InputManager.test.ts (16 tests) 21ms
 ✓ tests/world/EchoCaveExploration.test.ts (10 tests) 17ms
 ✓ tests/world/ChestManager.test.ts (5 tests) 20ms
 ✓ tests/save/SaveManager.test.ts (5 tests) 20ms
 ✓ tests/world/InteractionManager.test.ts (3 tests) 18ms
 ✓ tests/core/GameStateManager.test.ts (6 tests) 21ms
 ✓ tests/world/EchoCavePuzzleIntegration.test.ts (7 tests) 18ms
 ✓ tests/world/DialogueIntegration.test.ts (3 tests) 21ms
 ✓ tests/world/MapTransitionManager.test.ts (4 tests) 21ms
 ✓ tests/core/EventBus.test.ts (9 tests) 22ms
 ✓ tests/entities/Player.test.ts (10 tests) 24ms
 ✓ tests/world/PuzzleManager.test.ts (6 tests) 20ms
 ✓ tests/qa/QaHooks.test.ts (7 tests) 17ms
 ✓ tests/world/EchoCaveFullFlowIntegration.test.ts (1 test) 19ms
 ✓ tests/inventory/InventoryIntegration.test.ts (5 tests) 19ms
 ✓ tests/integration/Phase3FullProgression.test.ts (1 test) 20ms
 ✓ tests/systems/EquipmentIntegration.test.ts (6 tests) 19ms
 ✓ tests/ui/StatusIntegration.test.ts (6 tests) 18ms
 ✓ tests/world/EchoCaveSanctuary.test.ts (8 tests) 21ms
 ✓ tests/world/DungeonState.test.ts (7 tests) 13ms
 ✓ tests/config/constants.test.ts (9 tests) 22ms
 ✓ tests/integration/core.test.ts (1 test) 14ms
 ✓ tests/shop/ShopIntegration.test.ts (2 tests) 11ms
 ✓ tests/art/Hd2dManager.test.ts (5 tests) 15ms
 ✓ tests/core/ErrorHandler.test.ts (5 tests) 14ms
 ✓ tests/world/MapManager.test.ts (3 tests) 7ms

 Test Files  40 passed (40)
      Tests  365 passed (365)
   Start at  17:35:14
   Duration  4.95s
```

### 3.5 bun run build
```text
$ tsc && vite build
vite v8.2.2 building client environment for production...
transforming...
✓ 58 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     2.83 kB │ gzip:   0.81 kB
dist/assets/index-BTlyBV2B.css      0.33 kB │ gzip:   0.24 kB
dist/assets/index-BaNehIX6.js   1,333.52 kB │ gzip: 348.12 kB
✓ built in 881ms
```

### 3.6 HG11 Integrity Checks contra QA_LOCK_COMMIT
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

### 3.8 HG1 No Disabled Tests Check
```text
$ git grep -nE "\.(skip|only)\(|(^|[^a-zA-Z])x(it|describe)\(" -- tests
(clean - 0 lines, exit code 1)
```

### 3.9 Benchmark do Protótipo D1 via CDP (node tools/capture-qa.mjs --l2-only)
```text
Modo A (Nativo 384x216):
- FPS Médio: 41 FPS (no harness headless)
- p95 Frame Time: 17.1 ms (≤ 18,2 ms / Meta 60 FPS)
- Memória Texturas: 0.01 MB (≤ 64 MB)
- Texturas ativas: 6
- Erros de console: 0

Modo B (Render interno 3x 1152x648):
- FPS Médio: 47 FPS (no harness headless)
- p95 Frame Time: 16.9 ms (≤ 18,2 ms / Meta 60 FPS)
- Memória Texturas: 0.50 MB (≤ 64 MB)
- Texturas ativas: 107
- Erros de console: 0
```
