# CINZAS DO ÉTER — QA (Quality Assurance) v2.0 — "Nota 10/10 verificável"

> Versão: **2.0.1** (substitui a 0.1.0 — todo o conteúdo original está preservado nas §2 (camadas A–E) e §12 (regressão e histórico de resultados)). *2.0.1: o HG11 passou a comparar contra a árvore de trabalho, pegando também edições ainda não commitadas.*
>
> **QA_LOCK:** este arquivo é a *régua*. Quem constrói (EXECUTOR) **não edita** `QA.md`, `tools/qa/*`, `art/art-rules.json` nem `tests/art/AssetPipeline.test.ts`. Só o usuário. Para fazer algo passar, mude o **asset**, nunca a régua.
> **Resultados novos** vão em `qa/results/<lote>.md` — **não** neste arquivo.

---

## 0. Leitura seletiva (economize tokens)

| Preciso de… | Leia |
|---|---|
| Rodar os portões rígidos | §3 |
| Pontuar um lote | §4 (rubrica) + §8 (nota) |
| Saber quais screenshots tirar e como | §5 + §6 |
| Atuar como CRÍTICO | §7 (inclui o prompt pronto) |
| Contexto de por que o QA mudou | §1 e §11 |
| Histórico/regressão antigos | §12 (**não** precisa ler para trabalhar em arte) |

---

## 1. Princípios (por que este QA é verificável)

1. **Evidência > opinião.** Nenhum "PASS / APPROVED / 10/10" existe sem comando executado, saída colada e arquivo de screenshot existente.
2. **Máquina primeiro, olho depois.** Tudo que script consegue verificar é script (camada F). O olho do CRÍTICO só julga o que script não alcança (itens `[V]` da §4).
3. **O QA não se auto-aprova.** EXECUTOR ≠ CRÍTICO, e a régua é travada (QA_LOCK).
4. **A régua também é testada.** O validador tem `--self-test`: injeta defeitos reais e exige que sejam detectados ("QA do QA"). Se o self-test falhar, **nenhum** resultado do validador vale.
5. **Honestidade sobre o estado real.** "APPROVED" só vale para asset que (a) está **no jogo**, (b) passa no validador e (c) tem screenshot de evidência. Concept art ≠ asset.
6. **Regressão zero.** Arte nunca quebra lógica: suíte inteira verde a cada lote.
7. **Nota calculada, não declarada.** A nota sai da rubrica por fórmula (§8). Elogio sem evidência é inválido.

---

## 2. Camadas de teste

> As camadas A–E abaixo são o texto **original** (v0.1.0), mantido integralmente. A camada **D** foi ampliada pelas camadas **F, G, H e I** (novas).

### A) Testes Automatizados (Vitest)

**Escopo:** Lógica de jogo que não depende de renderização.

- Utilitários matemáticos (`@utils/math.ts`)
- EventBus (`@core/EventBus.ts`)
- Constantes/configuração (`@config/constants.ts`)
- Cálculo de dano (FASE 4)
- Sistema de atributos (FASE 3)
- Inventário (FASE 7)
- Save/Load serialização (FASE 7)
- Progressão de XP (FASE 7)
- AI de inimigos — lógica de decisão (FASE 5)

**Comando:** `bun run test`
**Watch mode:** `bun run test:watch`

**Regra:** Todo módulo de lógica deve ter testes antes de ser marcado como APPROVED.

---

### B) Testes de Integração (Vitest)

**Escopo:** Interação entre múltiplos sistemas sem renderização.

- EventBus + Sistema de batalha
- Inventário + Loja
- Dano + Atributos + Equipamentos
- Save + Load + Migração

**Regra:** Sistemas que dependem uns dos outros devem ter pelo menos 1 teste de integração.

---

### C) Testes Reais no Navegador

**Escopo:** Tudo que depende de renderização, input ou áudio.

- Phaser inicializa sem erro
- Sprites renderizam corretamente
- Input responde
- Transição de cenas funciona
- UI é legível
- Performance ≥ 55 FPS estável

**Método:** Abrir `http://localhost:3000` via browser subagent, verificar console, capturar screenshots.

**Regra:** Cada FASE concluída deve passar por verificação visual no navegador.

---

### D) Testes Visuais

**Escopo:** Conformidade com STYLE_GUIDE.md.

- Paleta correta (sem cores fora da paleta)
- Escalonamento nearest-neighbor (sem blur)
- Sprites na dimensão correta
- UI legível em resolução alvo
- Contornos em violeta (não preto)

**Método:** Screenshots + comparação manual com STYLE_GUIDE.md.

---

### E) Playthrough Completo

**Escopo:** Experiência de jogo integrada, do início ao fim da Vertical Slice.

**Checklist de Playthrough:**

- [ ] Jogo inicia sem erro
- [ ] Abertura/narrativa funciona
- [ ] Vila de Lumen funciona
- [ ] NPCs interagíveis
- [ ] Loja funciona (comprar/vender)
- [ ] Área externa funciona
- [ ] Encontros aleatórios funcionam
- [ ] Batalha ATB funciona
- [ ] Todos os comandos funcionam (atacar, magia, item, defender, fugir)
- [ ] Magia/Ressonância funciona
- [ ] Cura funciona
- [ ] Inventário funciona
- [ ] Equipamento funciona
- [ ] Dungeon funciona
- [ ] Boss (2 fases) funciona
- [ ] Vitória funciona
- [ ] Derrota funciona
- [ ] XP/Level up funciona
- [ ] Save funciona
- [ ] Load funciona
- [ ] Áudio funciona (BGM + SFX)
- [ ] Sem erros no console
- [ ] FPS estável ≥ 55

**Regra:** O playthrough deve ser feito pelo CRÍTICO, não pelo EXECUTOR.

---

### F) Validação Automática de Arte *(nova)*

**Escopo:** o antigo "Checklist de Validação de Assets" do STYLE_GUIDE/ART_PIPELINE, antes 100% manual, agora é script.

**Comandos** (scripts do `package.json`, criados no L1):

| Script | Comando real | Quando |
|---|---|---|
| `bun run qa:art` | `node tools/qa/validate-assets.mjs` | durante o trabalho (modo vem do manifesto) |
| `bun run qa:art:strict` | `node tools/qa/validate-assets.mjs --strict --dist` | **portão HG4** (sempre estrito, inclui `dist/`) |
| `bun run qa:art:selftest` | `node tools/qa/validate-assets.mjs --self-test` | QA do QA (20/20 casos) |

**Fontes de regras:** `art/art-rules.json` (travado) · `art/palette.json` (extensível **só** após D1) · `art/assets.manifest.json` (o EXECUTOR edita).
**Integração:** `tests/art/AssetPipeline.test.ts` roda dentro do `bun run test`.
**Modos:** `transição` (padrão do kit: órfãos/legados são AVISO) e `estrito` (ERRO). O lote **L1 só termina com `"strict": true`** no manifesto.

| Código | O que garante |
|---|---|
| A00_CONFIG | arquivos de configuração presentes e válidos |
| A01_FORMAT | somente PNG sem perda (JPEG/WebP/GIF/BMP proibidos) |
| A02_DECODE | PNG legível e não entrelaçado |
| A03_NAME | `[tipo]_[nome]_[variante]_[LxA].png` em minúsculas; sufixo = tamanho do quadro |
| A04_DIMENSIONS | múltiplo do quadro · grid declarado = real · tamanho exato (bg) · máx. 2048 px |
| A05_ALPHA | alpha só 0 ou 255 (sem anti-aliasing), salvo `softAlpha` declarado |
| A06_PALETTE | 100% dos pixels opacos na paleta; `#000000` e `#FFFFFF` proibidos |
| A07_COLOR_BUDGET | cores únicas ≤ orçamento do tipo |
| A08_OUTLINE | ≥ 80% dos pixels de borda na cor de contorno (personagens, inimigos, retratos) |
| A09_FRAMES | quadros declarados não vazios · fora de `frames` vazios · `rows` obrigatório |
| A10_CLIP | pixels encostando na borda do quadro (risco de corte) — aviso |
| A11_BASELINE | pés estáveis (±1 px) em linhas `walk/run/idle` |
| A12_DRIFT | centro de massa horizontal estável — aviso |
| A13_DUP | quadros adjacentes idênticos — aviso |
| A14_JUMP | mudança brusca entre quadros (design incoerente) — aviso |
| A15_TRACE | `origin/source/promptRef/generator/evidence` coerentes; **APPROVED exige evidência** |
| A16_ORPHAN | PNG em `public/assets` fora do manifesto |
| A17_MISSING | entrada do manifesto sem arquivo |
| A18_SIZE | orçamento de tamanho (arquivo, `public/assets` ≤ 8 MB, imagens em `dist/` ≤ 10 MB) |
| A19_LEGACY | imagem não-PNG em `public/` ou `dist/` |
| A20_MANIFEST | esquema do manifesto (campos obrigatórios, ids únicos, tipos válidos) |

**Regra:** erro do validador **nunca** é "falso positivo" por decisão do EXECUTOR. Se o validador está errado, o EXECUTOR registra em `BLOCKERS.md` e o **usuário** decide.

---

### G) Testes Visuais com Evidência *(nova — substitui o método da D)*

**Método:** carregar o jogo com `?qa=1` (expõe `window.__QA__`, **somente** nesse modo), usar o browser subagent para colocar o jogo no estado determinístico de um cenário da §5 e capturar. Cada cenário gera **2 capturas**: (a) quadro inteiro na escala inteira do viewport; (b) **recorte em zoom 4×** da região de maior risco.

**Contrato `window.__QA__`** (implementado no L1; só ativo com `?qa=1`):

```ts
interface QaHooks {
  version: 1;
  ready(): boolean;                       // jogo carregado e cena estável
  scenarios(): string[];                  // IDs da matriz (V01…V33) disponíveis
  load(id: string): Promise<void>;        // põe o jogo no estado determinístico do cenário
  freeze(on: boolean): void;              // congela relógio/aleatoriedade (animações seguem "steppáveis")
  step(frames: number): void;             // avança N quadros determinísticos
  play(animKey: string, opts?: { dir?: string; loop?: boolean }): void;
  setQuality(q: 'low' | 'medium' | 'high'): void;
  setTimeOfDay(p: 'dawn' | 'day' | 'dusk' | 'night'): void;
  setReduceFlashes(on: boolean): void;
  fps(seconds?: number): { avg: number; p95FrameMs: number; samples: number };
  memory(): { textureCount: number; estimatedMB: number };
  scale(): { zoom: number; integer: boolean; canvas: [number, number]; viewport: [number, number] };
  consoleIssues(): { errors: string[]; warnings: string[] };
  snapshot(): Promise<string>;            // PNG (dataURL) do canvas em resolução nativa
}
```

Sandbox de batalha (L7): `?qa=1&sandbox=battle&enemy=<id>&anim=<id>` — toca qualquer animação do catálogo sem lógica de combate.

---

### H) Performance & Orçamentos *(nova)*

Medidos por `__QA__.fps()` / `__QA__.memory()` por **60 s** em cada cenário da matriz. Registrar CPU/GPU/navegador da máquina de referência no relatório L0.

| Métrica | Orçamento |
|---|---|
| Tempo de quadro p95 | ≤ **18,2 ms** (≥ 55 FPS) |
| Memória estimada de texturas | ≤ **64 MB** |
| Carga Boot → Game (cache frio, dev server) | ≤ **3 s** |
| Imagens em `dist/` | ≤ **10 MB** (A18) |
| Maior textura/atlas | ≤ **2048×2048** (A04) |

---

### I) Acessibilidade & Segurança Visual *(nova)*

- **Fotossensibilidade:** nenhum efeito com mais de **3 flashes/s** em mais de **25%** da tela (flash = variação de luminância média ≥ 10% entre quadros consecutivos). Opção de configuração **"Reduzir flashes"**: troca flash branco por escurecimento suave e limita shake a ≤ 2 px.
- **Contraste:** texto/fundo de UI ≥ **4,5:1** (calculado a partir das cores da paleta, em teste Vitest).
- **Legibilidade:** UI legível na resolução lógica (1×) e em 720p.
- **Não depender só de cor:** status (veneno, defesa, buff) com **ícone/forma** além de cor.

---

## 3. Portões Rígidos (HG) — todos obrigatórios, binários

Um único ❌ reprova o lote, independentemente da nota.

| ID | Portão | Comando / método | Passa quando |
|---|---|---|---|
| HG1 | Testes | `bun run test` | 100% verdes; contagem ≥ baseline do L0 (medido em 2026-10-05: **35 arquivos / 332 testes**; com o kit: 36 / 335); nenhum `.skip`/`.only`/`xit` novo |
| HG2 | Tipos | `bunx tsc --noEmit` | 0 erros |
| HG3 | Build | `bun run build` | sucesso, 0 erros |
| HG4 | Arte automática | `bun run qa:art:strict` **e** `bun run qa:art:selftest` | 0 erros; self-test 20/20; manifesto com `"strict": true` |
| HG5 | Formatos | coberto pelo HG4 (varre `public/` e `dist/`) | nenhum JPG/WebP/GIF/BMP |
| HG6 | Console limpo | `__QA__.consoleIssues()` em cada cenário do lote | 0 erros e 0 warnings |
| HG7 | Performance | `__QA__.fps()` + `__QA__.memory()` (§H) | todos os orçamentos cumpridos |
| HG8 | Escala inteira | 5 resoluções: 1280×720, 1366×768, 1920×1080, 2560×1440, 3840×2160 (V31) | `scale().integer === true`, pixel uniforme, letterbox `#0A0612` |
| HG9 | Evidência completa | `ls` dos arquivos exigidos pela matriz do lote | todos existem, não vazios, citados no relatório |
| HG10 | Docs sincronizados | conferir | ART_PIPELINE (registro), STYLE_GUIDE, CHANGELOG, PROGRESS, `ART_STATE.md`, `qa/results/<lote>.md`; **nenhum "APPROVED" sem `evidence`** |
| HG11 | QA_LOCK íntegro | os 2 comandos do bloco **"Comandos do HG11"** logo abaixo (comparam o `QA_LOCK_COMMIT` com a **árvore de trabalho**, não só com o `HEAD`) | **ambos sem nenhuma linha de saída** (ou commit do usuário registrado em `ART_STATE.md`) |
| HG12 | Originalidade | comandos do bloco **"Comandos do HG12"** logo abaixo | `git grep` de originalidade **sem nenhuma ocorrência** (jogos/artistas só aparecem como régua de qualidade nos docs de processo, nunca em prompts de geração) |

**Comandos do HG11** (QA_LOCK; troque `<QA_LOCK_COMMIT>` pelo hash registrado em `ART_STATE.md`):

```bash
# 1) diferenças (commitadas OU não) em relação ao commit de trava: DEVE terminar sem nenhuma linha de saída
git diff --stat <QA_LOCK_COMMIT> -- QA.md tools/qa art/art-rules.json tests/art/AssetPipeline.test.ts

# 2) arquivos novos/não rastreados ou alterados nos caminhos travados: DEVE terminar sem nenhuma linha de saída
git status --short -- QA.md tools/qa art/art-rules.json tests/art/AssetPipeline.test.ts
```

> Passar **só um** hash ao `git diff` compara com a árvore de trabalho (inclui o que ainda não foi commitado). Não use `... <hash> HEAD ...` aqui — essa forma deixa passar edição não commitada.

**Comandos do HG12 e checagens auxiliares** (usam `git grep`, que funciona igual em PowerShell, cmd e bash — não dependa de `grep`):

```bash
# HG12 — originalidade: DEVE terminar sem nenhuma linha de saída
git grep -niE --untracked "final fantasy|octopath|square ?enix|chrono|zelda|nintendo|pokemon|disney|ghibli|in the style of|(no|ao) estilo d[eoa]" -- art/prompts art-source

# HG1 — nenhum teste desligado: DEVE terminar sem nenhuma linha de saída
git grep -nE "\.(skip|only)\(|(^|[^a-zA-Z])x(it|describe)\(" -- tests
```

> Atenção ao ler o resultado: `git grep` sem ocorrências sai com código 1 e **sem saída** — isso é o resultado desejado (✅). Qualquer linha impressa = ❌.

---

## 4. Rubrica Visual — 50 itens (10 categorias × 5)

**Tipos:** `[A]` automático (script/teste) · `[V]` visual (CRÍTICO + screenshot/vídeo com evidência).
**"Desde"** = primeiro lote em que o item é aplicável (antes disso é `N/A` e **não** entra na nota).
Cada item é **binário** (✅/❌) e exige evidência (caminho de arquivo + região, ou saída de comando).

### Cat. 1 — Higiene de pixel & paleta
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 1.1 | Todos os PNGs de `public/assets` passam o validador (A01–A15) com 0 erros | A | L1 |
| 1.2 | Zero JPG/WebP/GIF/BMP em `public/` e `dist/` (A19) | A | L1 |
| 1.3 | Em zoom 4×: sem pixels órfãos soltos nem serrilhado irregular nas curvas principais (amostra ≥ 10 sprites/tiles distintos, citar coordenadas) | V | L3 |
| 1.4 | Sem banding/dither acidental; ≤ 4 tons por material (rampas coerentes) | V | L3 |
| 1.5 | Nenhum asset contém texto, rótulo, marca d'água ou fundo residual (contact sheet de **todos** os PNGs revisada) | V | L3 |

### Cat. 2 — Personagens & design
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 2.1 | Teste de silhueta (preencher de preto): Kaël, Lia, Torvak e Mirael distinguíveis em 1× | V | L3 |
| 2.2 | Proporções/escala consistentes (cabeça ≈ 1/3–1/4 da altura); personagens lado a lado no mesmo quadro | V | L3 |
| 2.3 | Fiel ao GDD: Kaël (capa com capuz, pingente âmbar, **tons terrosos**) · Mirael (manto violeta, cabelos brancos, cristal azul no cajado) · Torvak (baixo, mochila enorme, marrom/âmbar) · Lia (trança lateral, avental terroso, cesta) · Sombra do Selo (encapuzado negro/violeta, máscara com selo partido) | V | L3 |
| 2.4 | Contorno conforme regra (A08 ≥ 80%) em todo char/npc/enemy/boss/portrait | A | L3 |
| 2.5 | Retratos coerentes com os sprites (mesmo desenho/cores); Kaël com ≥ 2 expressões | V | L3 |

### Cat. 3 — Animação de movimento
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 3.1 | 4 direções × ≥ 4 quadros de caminhada + idle ≥ 2 quadros por personagem móvel; pés estáveis ±1 px (A09/A11) | A | L3 |
| 3.2 | Ciclo de caminhada sem "patinar" (pés sincronizados com 80 px/s); gravação ≥ 3 s por direção | V | L3 |
| 3.3 | Movimento secundário (capa/cabelo/cajado) e balanço de cabeça visíveis; loop sem "pulo" | V | L3 |
| 3.4 | Idle com respiração perceptível; NPCs com idle próprio, distinto do jogador | V | L4 |
| 3.5 | Animações definidas por dados (`src/data/animations/`); teste Vitest garante que todo clipe referencia quadros existentes | A | L3 |

### Cat. 4 — Mundo & tilemaps
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 4.1 | Nenhuma área plana > 6×6 tiles sem variação/detalhe; ≥ 3 variantes de chão por mapa | V | L4 |
| 4.2 | Transições (grama↔terra↔pedra↔água; zona viva→morta) com autotile, sem emendas visíveis | V | L4 |
| 4.3 | Profundidade correta: copas/telhados ocluem o jogador; objetos altos com y-sort; nenhum personagem "na frente de parede" indevido | V | L4 |
| 4.4 | Elementos animados (água, Núcleo, cristais, tochas) a 4–8 fps, sem tearing | V | L4 |
| 4.5 | Semântica de colisão/GIDs intacta: testes de mapa/transição verdes; mapeamento de tiles em **tabela de dados** | A | L4 |

### Cat. 5 — Iluminação & atmosfera (HD-2D-lite)
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 5.1 | Cada mapa com grade de cor própria (Lumen âmbar quente · Planície gradiente vida→cinzas · Gruta cristal/violeta) | V | L4 |
| 5.2 | Fontes de luz (Núcleo, lanternas, cristais) com halo coerente; luz global vinda do topo-esquerda | V | L4 |
| 5.3 | Sombras: blob sob personagens + sombras de objetos altos para baixo-direita, consistentes | V | L4 |
| 5.4 | Partículas ambientes (vagalumes/cinzas/poeira de cristal) sutis, sem prejudicar a leitura | V | L4 |
| 5.5 | Todo efeito obedece `GraphicsSettings` (Baixo/Médio/Alto); em "Baixo" pós-efeitos desligam sem quebrar a leitura; HG7 em todos | A | L4 |

### Cat. 6 — Batalha & VFX
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 6.1 | Cena de batalha por área com fundo em ≥ 3 planos (parallax) + piso; party e inimigos posicionados/escalados corretamente | V | L7 |
| 6.2 | Cada ataque/Ressonância com identidade própria e ≥ 6 quadros: antecipação, pico, dissipação | V | L7 |
| 6.3 | Impacto: flash curto + hit-stop + shake + números de dano em fonte bitmap, legíveis | V | L7 |
| 6.4 | Sombra do Selo: transição visual da fase 2 (máscara parte, aura violeta intensifica) clara e dramática | V | L7 |
| 6.5 | `BattleAnimationPlayer` testado em Vitest com mocks (sem Phaser); sandbox toca **todas** as animações do catálogo sem erro de console | A | L7 |

### Cat. 7 — UI, HUD & tipografia
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 7.1 | Todas as janelas usam moldura 9-slice PNG (nenhum retângulo `Graphics`) com cantos cristalinos coerentes | V | L5 |
| 7.2 | Fonte bitmap com PT-BR completo (ç ã õ é ê ë í ó ú â ô): "Kaël, Éter, Fragmentos, Gruta do Eco, Ressonância, Ação" | V | L5 |
| 7.3 | Contraste texto/fundo ≥ 4,5:1 em todos os pares de cores de UI (teste Vitest) | A | L5 |
| 7.4 | Ícones 16×16 de todos os itens/equipamentos do GDD em inventário, loja e status; cursor animado; barras HP/MP/ATB/XP do kit | V | L5 |
| 7.5 | Retratos nos diálogos; caixas com transição abrir/fechar suave, sem "popping" | V | L5 |

### Cat. 8 — Consistência de direção de arte
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 8.1 | Contact sheet com **todos** os assets lado a lado: mesma linguagem (contorno, rampas, nível de detalhe) | V | L4 |
| 8.2 | Direção de luz única (topo-esquerda; sombras baixo-direita) em personagens, tiles e props | V | L4 |
| 8.3 | Toda cor de `constants.ts` ∈ `art/palette.json` (teste de sincronia) e 100% dos pixels ∈ paleta (A06) | A | L1 |
| 8.4 | Zona viva × morta obedece à regra (cinzas substituem verdes/âmbares) | V | L4 |
| 8.5 | Originalidade: nenhum asset reconhecível como cópia de outro jogo; HG12 limpo | V | L8 |

### Cat. 9 — Performance & robustez
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 9.1 | p95 de quadro ≤ 18,2 ms em todos os cenários da matriz (60 s cada) | A | L1 |
| 9.2 | Memória estimada de texturas ≤ 64 MB; nenhum atlas > 2048² | A | L1 |
| 9.3 | Carga Boot→Game ≤ 3 s; imagens em `dist/` ≤ 10 MB | A | L1 |
| 9.4 | Escala inteira verificada em 5 resoluções (HG8) | A | L1 |
| 9.5 | Console limpo; fallback de asset ausente testado (não crasha; usa placeholder) | A | L1 |

### Cat. 10 — Polimento & game feel
| ID | Verificação | Tipo | Desde |
|---|---|---|---|
| 10.1 | Transições de mapa/batalha com wipe de cristal; fades de 30 quadros (STYLE_GUIDE) | V | L5 |
| 10.2 | Feedbacks: prompt de interação animado · baú abrindo (animação + partículas) · puzzle resolvido (pulso nos cristais, ponte de Éter surge) · level-up (efeito + texto) | V | L4 |
| 10.3 | Câmera: seguimento suave com *pixel-snapping*, sem tremor sub-pixel; shake controlado | V | L4 |
| 10.4 | Segurança visual: opção "Reduzir flashes"; nenhum efeito > 3 flashes/s em > 25% da tela (contagem em gravação do sandbox) | V | L7 |
| 10.5 | Primeira impressão: vídeo ≥ 30 s do boot ao primeiro NPC sem artefatos + 3 screenshots "cartão-postal" | V | L8 |

---

## 5. Matriz de Testes Visuais (cenários)

Evidência de cada cenário: `qa/evidence/<lote>/<ID>_<slug>_<n>.png` (quadro inteiro + recorte 4×). Vídeos em `.webm`/`.webp` na mesma pasta.

| ID | Cenário | Lote | Itens verificados |
|---|---|---|---|
| V01 | Boot → título/Lumen (carregamento) | L1 | 9.3, 9.5, 10.5 |
| V02 | Lumen — Núcleo em close (pulso + halo) | L4 | 4.4, 5.2, 8.2 |
| V03 | Lumen — rua com Lia patrulhando | L4 | 3.2, 3.4, 5.3 |
| V04 | Lumen — loja do Torvak (exterior e interior) | L4 | 2.3, 4.3 |
| V05 | Lumen — borda de casa/telhado: jogador atrás e na frente | L4 | 4.3 |
| V06 | Lumen — amanhecer / dia / entardecer (3 grades de cor) | L4 | 5.1 |
| V07 | Planície — transição zona viva → morta | L4 | 4.2, 8.4 |
| V08 | Planície — boca da Gruta + cinzas em partículas | L4 | 4.1, 5.4 |
| V09 | Gruta — puzzle de cristais (dormente / ativo / ponte surgindo) | L4 | 4.4, 10.2 |
| V10 | Gruta — baú abrindo | L4 | 10.2 |
| V11 | Kaël — 4 direções (contact sheet 1× e 4×) | L3 | 1.3, 1.4, 2.1, 2.2, 3.1 |
| V12 | Kaël — caminhada (gravação ≥ 3 s × 4 direções) | L3 | 3.2, 3.3 |
| V13 | Kaël — poses de batalha (contact sheet) + retratos | L3 | 2.3, 2.5 |
| V14 | NPCs em idle (Mirael, Torvak, Lia, aldeões) lado a lado | L4 | 2.1, 2.2, 3.4 |
| V15 | Diálogo com retrato | L5 | 2.5, 7.5 |
| V16 | Loja — UI com ícones | L5 | 7.1, 7.4 |
| V17 | Menu de status / equipamento | L5 | 7.1, 7.2, 7.4 |
| V18 | Inventário com ícones | L5 | 7.4 |
| V19 | Texto PT-BR completo na fonte bitmap | L5 | 7.2 |
| V20 | Wipe de cristal (mapa e batalha) | L5 | 10.1 |
| V21 | Mapa-múndi | L6 | itens aplicáveis das cat. 4, 5, 8 |
| V22 | Batalha — Espectro de Cinzas (UI ATB completa) | L7 | 6.1, 6.3, 7.1 |
| V23 | Batalha — Golem de Cristal | L7 | 6.1 |
| V24 | Batalha — Réptil Fossilizado (+ status veneno) | L7 | 6.1, 6.2 |
| V25 | Batalha — Sombra do Selo, fase 1 | L7 | 6.1 |
| V26 | Batalha — Sombra do Selo, transição para a fase 2 | L7 | 6.4 |
| V27 | VFX das Ressonâncias: Pulso, Harmonia, Dissonância, Barreira (sequência de quadros) | L7 | 6.2 |
| V28 | VFX de inimigos/boss: Toque gélido, Impacto pesado, Mordida venenosa, Golpe Selado, Marca do Vazio, Fragmentação, Dreno de Éter | L7 | 6.2 |
| V29 | Impacto (flash, hit-stop, shake, números de dano) com "Reduzir flashes" ON e OFF | L7 | 6.3, 10.4 |
| V30 | Vitória / level-up / derrota | L7 | 6.2, 10.2 |
| V31 | Escala em 5 resoluções (720p, 768p, 1080p, 1440p, 4K) | L1 | 9.4 |
| V32 | Qualidade Baixo / Médio / Alto (comparativo + FPS) | L4 | 5.5, 9.1 |
| V33 | Contact sheet de **todos** os assets (consistência e originalidade) | L4, L8 | 1.5, 8.1, 8.5 |

---

## 6. Protocolo de Evidência

1. **Screenshot sem arquivo = não existe.** Citar sempre o caminho (`qa/evidence/L3/V11_kael_4dir_4x.png`) e a região observada.
2. O **CRÍTICO recaptura** os cenários — não reutiliza capturas do EXECUTOR.
3. Recortes 4× devem ser **nearest-neighbor** (sem suavização) e mostrar a grade de pixels.
4. Comandos: colar a **saída real** (não resumo). Saída longa: primeiras e últimas linhas + contagem.
5. Vídeos (`.webm`) ficam fora do git (`.gitignore`), mas **o arquivo deve existir** na máquina para o HG9.
6. Cada achado `[V]` informa **onde olhar**: arquivo, coordenada/região ou quadro.

---

## 7. Papéis: EXECUTOR × CRÍTICO

- **EXECUTOR** constrói. **Não** edita a régua (§QA_LOCK), **não** escreve o veredito do próprio lote.
- **CRÍTICO** audita. **Não** edita código-fonte, assets, manifesto nem docs de design; só escreve `qa/results/<lote>.md`.
- Melhor prática: o CRÍTICO roda numa **conversa/agente separado** (contexto limpo = menos viés). No Antigravity: abra um novo agente no gerenciador de agentes e cole o prompt abaixo, trocando `<LOTE>`.

### Prompt do CRÍTICO (copiar e colar)

```text
Você é o CRÍTICO de arte e QA do projeto "Cinzas do Éter". Você NÃO constrói: não edita código-fonte, assets, manifesto nem docs de design. Você só audita e escreve `qa/results/<LOTE>.md`.

LOTE EM AUDITORIA: <LOTE>   (ex.: L3)

1. LEIA: ART_STATE.md; QA.md §3, §4, §5, §6 e §8; o STYLE_GUIDE.md vigente; e só a linha deste lote na tabela de lotes do PROMPT_MESTRE.
2. RODE E COLE A SAÍDA REAL (sem resumir) de: git status --short; git log --oneline -8; bun run test; bunx tsc --noEmit; bun run build; bun run qa:art:strict; bun run qa:art:selftest; os 2 comandos do HG11 (bloco "Comandos do HG11" da §3, usando o QA_LOCK_COMMIT do ART_STATE.md); os comandos `git grep` do HG12 e do HG1 (bloco "Comandos do HG12" da §3).
3. ABRA O JOGO com ?qa=1 no browser subagent. NÃO reutilize screenshots do EXECUTOR: RECAPTURE todos os cenários da matriz (§5) deste lote — quadro inteiro e recorte 4×. Tente QUEBRAR: redimensione a janela (5 resoluções), troque a qualidade Baixo/Médio/Alto, atravesse mapas, spamme interação.
4. PREENCHA A RUBRICA (§4) só para os itens aplicáveis ao lote ("Desde" ≤ lote). Cada item: ✅/❌ + evidência (caminho do arquivo + região, ou saída de comando) + 1 frase. Item sem evidência = ❌.
5. LISTE TODOS OS DEFEITOS (S1 bloqueante · S2 alto · S3 médio · S4 cosmético) com como reproduzir. Se encontrar menos de 3, repita a inspeção em zoom 4× nos 10 recortes de maior risco antes de concluir. Não invente defeitos.
6. CALCULE A NOTA (§8). APROVADO somente se: todos os HG ✅ + nota do lote ≥ 9,0 + nenhuma categoria < 8,0 + zero defeitos S1/S2. Caso contrário REPROVADO + lista priorizada de correções.
7. ESCREVA `qa/results/<LOTE>.md` no formato do §8 e PARE.
PROIBIDO sem evidência: "perfeito", "excelente", "ótimo", "10/10", "parece bom".
```

---

## 8. Nota & definição de 10/10

**Fórmulas**
- Nota de categoria = (itens ✅ aplicáveis ÷ itens aplicáveis da categoria) × 10.
- **Nota do lote** = (itens ✅ aplicáveis ÷ itens aplicáveis) × 10, 1 casa decimal.

**Aprovação de lote** — todas as condições:
1. HG1–HG12 todos ✅;
2. nota do lote **≥ 9,0**;
3. nenhuma categoria **< 8,0**;
4. zero defeitos **S1/S2**.

**Certificação 10/10** (somente no L8) — todas as condições:
1. HG1–HG12 todos ✅;
2. **50/50** itens ✅;
3. zero defeitos S1–S3;
4. vídeo ≥ 30 s + 3 screenshots "cartão-postal" arquivados;
5. **aprovação explícita do usuário** ("APROVO 10/10") registrada em `ART_STATE.md`. *Sem aprovação humana não há 10/10.*

**Leitura da nota:** 9–10 pronto · 7–8,9 revisar · < 7 refazer.

### Template de `qa/results/<lote>.md`

```markdown
# Resultado do lote <Lx> — <nome> — <data>
Veredito: APROVADO | REPROVADO    Nota: x,x/10 (n/m itens)    CRÍTICO em conversa separada: sim | não

## Portões rígidos
| HG | ✅/❌ | Evidência (comando → saída / caminho) |

## Rubrica (apenas itens aplicáveis)
| Cat | Item | ✅/❌ | Evidência | Obs. |

## Defeitos
| ID | Sev | Descrição | Como reproduzir | Arquivo/Região |

## Evidências (arquivos)
## Decisões pendentes do usuário
## Próximos passos
```

---

## 9. Gauntlet Loop & bloqueios

- **Máx. 3 ciclos** EXECUTOR → CRÍTICO por lote. Falhou 3×: registrar em `BLOCKERS.md` (ID, descrição, tentativas, hipótese) e **parar**.
- Lote que quebrar HG1–HG3 e não for corrigível em 1 ciclo → `git revert` do commit do lote (commits atômicos, um por lote).
- O CRÍTICO nunca "ajuda" a corrigir; devolve a lista priorizada ao EXECUTOR.

---

## 10. Regressão estendida (mapa de dependências de arte)

Complementa o mapa original (§12). Mudou o item da esquerda → testar também a direita.

```
Assets/Manifesto   → AssetLoader, PreloadScene, Validador (HG4), Paleta
AssetLoader        → todas as cenas (Game, Battle, UI), testes de mapa (GIDs/colisão)
Mapeamento de tiles→ MapManager, colisão, transições de mapa, save de posição
Iluminação/FX      → Câmera, GraphicsSettings, Performance (HG7)
Animações (dados)  → Player, NPC, apresentação de batalha, testes de dados
Escala/Render      → todas as cenas, UI (posições), Input (coordenadas do mouse)
Fonte bitmap       → todo texto (diálogo, loja, status, inventário), glifos PT-BR
```

**Regra:** mudou X → rodar a suíte inteira **e** os cenários V relacionados.

---

## 11. Baseline visual — auditoria externa (2026-10-05)

> Fatos **medidos** no zip enviado. O L0 deve reconfirmar cada um; esta tabela existe para ninguém "chutar" o ponto de partida.

| # | Fato | Medição |
|---|---|---|
| 1 | O jogo desenha tudo com retângulos | `PreloadScene.preload()` vazio; **0** chamadas `this.load.*` em `src/`; ≈ 22 usos de `generateTexture`/`Graphics` |
| 2 | Arte "APPROVED" não está no jogo | 16 JPGs em `public/assets/` (**11,04 MB**) + 16 cópias em `dist/` (**11,0 MB**), **nunca carregados** |
| 3 | Assets violam o STYLE_GUIDE | Todos JPG (lossy); 1024×1024 ou 1376×768; **32 675 a 178 281** cores únicas por imagem; **≤ 0,006%** dos pixels dentro da paleta de 24 cores |
| 4 | São concept sheets, não spritesheets | rótulos de texto embutidos ("Walking N S E W", "Attack 1"), poses irregulares, sem grid, impossíveis de fatiar em 32×48 |
| 5 | Paleta v1 não cobre os próprios conceitos | sem azul de água, laranja/vermelho de fogo, verde vivo de cura/veneno |
| 6 | Lógica de batalha ainda inexistente | `src/battle/`, `src/art/`, `src/audio/` são stubs; Fases 4–6 = NOT_STARTED; GDD sem mapa-múndi |
| 7 | Mundo placeholder | Lumen = campo de GIDs 3/4 + poucos retângulos; tileset de 15 quadrados (`placeholder_tileset`) |
| 8 | Escala fracionária | `Scale.FIT` → pixels irregulares fora de múltiplos de 384×216 |
| 9 | Conflitos conceito × GDD | túnica **verde** de Kaël (GDD: "tons terrosos"); **"Fire Magic"** no VFX (GDD só tem 4 Ressonâncias: Pulso, Harmonia, Dissonância, Barreira) |
| 10 | Base técnica saudável | `tsc` 0 erros; **35 arquivos / 332 testes** verdes (o QA antigo dizia 331) |

**Pontos fortes a preservar:** arquitetura (lógica sem Phaser, EventBus, CONTRACTS.md), suíte de testes e governança (FONTE DE VERDADE, CRÍTICO ≠ EXECUTOR). **Direção de arte dos conceitos:** boa — o panorama de Lumen (cristal âmbar central, lanternas, árvores de outono) e os monstros são excelentes alvos visuais.

**Nota visual de partida (estimativa do auditor):** ≈ **1 a 1,5 / 10** pela rubrica da §4 (poucos itens `[A]` passam hoje). O L0 mede o valor real.

---

## 12. Histórico preservado (v0.1.0)

> Daqui para baixo: o texto **original, sem alterações**. Resultados **novos** não entram aqui — vão em `qa/results/`.

## Testes de Regressão

Quando um sistema for alterado, testar também os sistemas que dependem dele.

### Mapa de Dependências

```
Battle System → Player, HP, MP, Inventory, XP, Equipment, Save, UI
Player        → Stats, Equipment, Level, Save
Inventory     → Items, Gold, Save, UI
Save/Load     → Player, Inventory, WorldState, Settings
UI            → Player (HP/MP), Inventory, Battle, Dialog
Audio         → Settings (volume)
World         → Collision, Camera, NPC, Dialog
```

---

## Resultado Atual (FASE 2 — UNIDADE 6 — LOJA DO TORVAK)

| Suite | Testes | Status |
|-------|--------|--------|
| tests/utils/math.test.ts | 21 | ✅ PASS |
| tests/core/EventBus.test.ts | 9 | ✅ PASS |
| tests/config/constants.test.ts | 9 | ✅ PASS |
| tests/entities/Player.test.ts | 10 | ✅ PASS |
| tests/save/SaveManager.test.ts | 5 | ✅ PASS |
| tests/core/ErrorHandler.test.ts | 5 | ✅ PASS |
| tests/core/GameStateManager.test.ts | 6 | ✅ PASS |
| tests/systems/InputManager.test.ts | 15 | ✅ PASS |
| tests/integration/core.test.ts | 1 | ✅ PASS |
| tests/world/MapManager.test.ts | 3 | ✅ PASS |
| tests/world/MapTransitionManager.test.ts | 4 | ✅ PASS |
| tests/world/InteractionManager.test.ts | 3 | ✅ PASS |
| tests/world/DialogueManager.test.ts | 8 | ✅ PASS |
| tests/world/DialogueIntegration.test.ts | 3 | ✅ PASS |
| tests/inventory/InventoryManager.test.ts | 21 | ✅ PASS (NEW) |
| tests/shop/ShopManager.test.ts | 19 | ✅ PASS (NEW) |
| tests/shop/ShopIntegration.test.ts | 2 | ✅ PASS (NEW) |
| **Total** | **144** | **✅ ALL PASS (0 regressions)** |

### Playtest no Navegador (Unidade 6 — Loja do Torvak)
- **Abertura da Loja:** Interação com Torvak -> diálogo de mercador -> encerramento do diálogo abre automaticamente a interface `MERCADOR TORVAK`. ✅ PASS
- **Exibição de Produtos e Saldo:** 4 consumíveis canônicos do GDD exibidos com preços e descrições corretas; saldo inicial de 100 Fragmentos visível. ✅ PASS
- **Navegação:** Cursor pulsante `►` navega entre os itens com setas/WASD e atualiza descrições e highlight de preço. ✅ PASS
- **Compra Válida:** Compra de 1x Elixir Âmbar (30 Fragmentos) deduz saldo para 70 e incrementa quantidade possuída para 1. ✅ PASS
- **Múltiplas Compras:** Segunda compra de Elixir Âmbar deduz saldo para 40 e incrementa para 2; compra subsequente de Antídoto (20 Fragmentos) deduz saldo para 20 e incrementa para 1. ✅ PASS
- **Rejeição por Saldo Insuficiente:** Tentativa de comprar item com custo superior ao saldo (ex: Gota de Éter por 50 Frag quando saldo é 40) rejeita a compra, exibe "✗ Saldo insuficiente!" em vermelho (`#C04040`) e preserva o saldo intacto. ✅ PASS
- **Fechamento e Retorno à Exploração:** Pressionar `[X]` (CANCEL) fecha a interface da loja; exploração do jogador é restaurada imediatamente; movimentação em 4 direções e câmera funcionando perfeitamente sem input preso. ✅ PASS
- **Persistência em Reabertura:** Reabrir a loja após compras reflete o saldo restante (20 Fragmentos) e quantidades já adquiridas no inventário. ✅ PASS
- **Console:** 0 erros no console, build 100% limpo, FPS estável. ✅ PASS

---

## 2026-09-03 — FASE 2 / UNIDADE 7: ÁREA EXTERNA (Planície das Cinzas & Entrada da Gruta do Eco)

### Execução de Testes Automatizados
- **Testes Unitários:** 161/161 passing (100% PASS across 19 test files).
- **Novos Testes (Unidade 7):**
  - `tests/world/AshPlainsMap.test.ts`: 10/10 PASS (dimensões 32x40, integridade de matrizes, spawns com facing `DOWN`/`UP`, limites intransponíveis, transições para Vila e Caverna, placas interativas).
  - `tests/world/MapTransitionIntegration.test.ts`: 7/7 PASS (ida e volta Vila ↔ Planície ↔ Gruta do Eco, reset de velocidade, transição de estado `EXPLORING` -> `LOADING` -> `EXPLORING`, rejeição de transições concorrentes, tratamento gracioso de IDs inválidos, persistência de ouro e inventário).
- **Regressão:** Todos os 144 testes anteriores preservados e 100% aprovados.
- **Build de Produção:** `bun run build` concluído com sucesso e 0 erros (`dist/assets/index-Bk4QjQ1v.js`).

### Playtest no Navegador (Gauntlet Crítico)
- **Vila de Lumen -> Planície das Cinzas:** Transição suave com fade, player reposicionado em `spawn_north` (y: 32) com `facing: DOWN`, limites de câmera ajustados para 512x640. ✅ PASS
- **Navegação & Colisão:** Caminho sinuoso navegável entre aglomerados rochosos (GID 10); colisão física com rochas mortas e limites laterais funcionando perfeitamente. ✅ PASS
- **Placa Informativa:** Placa na planície `sign_ash_plains` exibe prompt `[Z] Ler` e texto sobre a Gruta do Eco ao sul. ✅ PASS
- **Retorno à Vila:** Transição sul -> norte para Vila de Lumen coloca player no portão sul (`spawn_south`) com `facing: UP`; colisor anterior limpo e novo colisor registrado sem erros de física. ✅ PASS
- **Persistência do Torvak & Loja:** Torvak permanece presente no mapa da vila; interação abre diálogo e loja; compra de 1x Elixir Âmbar (30 Frag) deduz saldo para 70 Fragmentos; reabertura confirma 70 Fragmentos mantidos. ✅ PASS
- **Entrada da Gruta do Eco:** Transição ao sul da planície carrega a antecâmara da caverna (GID 12, solo de pedra e paredes escuras de caverna); limites de câmera 384x288. ✅ PASS
- **Retorno da Gruta -> Planície:** Transição de volta posiciona o jogador em frente à boca da caverna voltado para o norte (`UP`). ✅ PASS
- **Console & Performance:** 0 erros no console, build sem advertências impeditivas, taxa de quadros estável a 60 FPS. ✅ PASS

---

## 2026-09-09 — FASE 3 / UNIDADE 7: SISTEMA DE EQUIPAMENTO

### Execução de Testes Automatizados
- **Testes Unitários e de Integração:** 283/283 passing (100% PASS across 30 test files).
- **Novos Testes (Unidade 7 — 53 testes):**
  - `tests/systems/EquipmentManager.test.ts` (47 testes):
    - Validação de catálogo de 6 equipamentos canônicos (`apprentice_staff`, `tuned_staff`, `traveler_tunic`, `ether_cuirass`, `amber_pendant`, `crystal_ring`).
    - Estado inicial de Kaël: `tuned_staff` equipado em `weapon`, slots `armor` e `accessory` nulos.
    - Equipar com item presente no inventário (item sai do inventário e ocupa slot).
    - Rejeição de equip com item ausente do inventário ou de slot incorreto.
    - Troca atômica (swap) de itens no mesmo slot com retorno do anterior ao inventário.
    - Falha atômica e rollback se o inventário estiver cheio durante swap ou unequip.
    - Cálculo puro derivado de `EffectiveStats` (garantindo que `PlayerState.stats` base nunca é mutado).
    - Clamping seguro de HP e MP se stats máximos forem reduzidos em desequipar.
    - Emissão de evento `equipment:changed` via EventBus em cada alteração válida.
  - `tests/systems/EquipmentIntegration.test.ts` (6 testes):
    - Fluxo ponta a ponta: compra na loja → inventário → equipar → desequipar.
    - Fluxo do baú da Gruta do Eco: obter `amber_pendant` → equipar no slot acessório → bônus RES +2, SOR +2 aplicados.
    - Prevenção de vazamento de stats (reverter a estado desequipado restaura exatamente os stats base).
    - Limite de capacidade do inventário bloqueando desequipamento sem perda de dados.
    - Loadout completo (arma + armadura + acessório) com soma cumulativa correta de atributos derivados.
- **Regressão:** Todos os 230 testes anteriores das Fases 1, 2 e F3-U01 a F3-U06 preservados e 100% aprovados.
- **Typecheck:** `bunx tsc --noEmit` executado com 0 erros.
- **Build de Produção:** `bun run build` gerado com sucesso (`dist/assets/index-DbM_B57n.js`).

### Playtest no Navegador (Gauntlet Crítico)
- **Estado Inicial de Kaël:** `player.equipment.weapon === 'tuned_staff'`, `armor === null`, `accessory === null`; `tuned_staff` ausente do inventário (quantidade 0). ✅ PASS
- **Atributos Efetivos Iniciais:** Base ATK=14, MAG=16 → Efetivo ATK=19 (+5), MAG=18 (+2). ✅ PASS
- **Equipar Túnica de Viajante:** Inserido `traveler_tunic` no inventário → equip no slot `armor` com sucesso; item removido do inventário; efetivo DEF sobe de 10 para 13 (+3). ✅ PASS
- **Equipar Pingente de Âmbar:** Inserido `amber_pendant` no inventário → equip no slot `accessory` com sucesso; item removido do inventário; efetivo RES sobe de 12 para 14 (+2) e SOR de 8 para 10 (+2). ✅ PASS
- **Desequipar Bastão Sintonizado:** Unequip de `weapon` desocupa o slot (`null`), devolve 1x `tuned_staff` ao inventário; efetivo ATK retorna aos 14 base. ✅ PASS
- **Reequipar Bastão Sintonizado:** Reequipar do inventário ocupa o slot e zera o item no inventário; efetivo ATK retorna a 19. ✅ PASS
- **Console & Estabilidade:** 0 erros no console do navegador, rendering intacto, taxa de quadros estável a 60 FPS. ✅ PASS

---

## 2026-09-09 — FASE 3 / UNIDADE 8: MENU DE STATUS

### Execução de Testes Automatizados
- **Testes Unitários e de Integração:** 308/308 passing (100% PASS across 32 test files).
- **Novos Testes (Unidade 8 — 25 testes):**
  - `tests/systems/StatusManager.test.ts` (19 testes):
    - Ciclo de vida: abertura, fechamento, persistência de estado e eventos `menu:statusOpened` / `menu:statusClosed`.
    - Geração fiel da ViewModel com dados do jogador (Nome "Kaël", Título "Adepto do Éter", Nível, HP/MP atuais e máximos, XP atual, necessário e restante).
    - Delegação estrita a `EquipmentManager.calculateEffectiveStats` com verificação de que Kaël inicia com `tuned_staff` (ATK 17 [+5], MAG 10 [+2]).
    - Garantia formal de imutabilidade absoluta de `PlayerState.stats`.
    - Exibição e formatação de slots (`[Arma]`, `[Armadura]`, `[Acessório]`) e tratamento de slots vazios `(Nenhum)`.
    - Atualização dinâmica pós-equip (`traveler_tunic` -> DEF 13 [+3], `amber_pendant` -> RES 11 [+2], SOR 7 [+2]).
    - Atualização dinâmica pós-unequip (reversão a stats base puros).
    - Navegação cíclica pelos 3 slots de equipamento (`selectNextSlot`, `selectPreviousSlot`, limites e wrap-around).
    - Formatador de bônus (`formatStatBonus`).
  - `tests/ui/StatusIntegration.test.ts` (6 testes):
    - Transição de fase de `EXPLORING` para `MENU` na abertura e retorno para `EXPLORING` no fechamento.
    - Bloqueio de abertura se fase atual for `DIALOGUE`.
    - Sincronização em tempo real com evento `equipment:changed`.
    - Sincronização em tempo real com ganho de XP e subida de nível (`player:levelUp`).
    - Consumo seguro de ações `MENU` e `CANCEL` via `InputManager` para prevenção de double-trigger.
- **Regressão:** Todos os 283 testes anteriores das Fases 1, 2 e F3-U01 a F3-U07 preservados e 100% aprovados.
- **Typecheck:** `bunx tsc --noEmit` executado com 0 erros.
- **Build de Produção:** `bun run build` gerado com sucesso (`dist/assets/index-CQmqYjy7.js`).

### Playtest no Navegador (Gauntlet Crítico)
- **Abertura do Menu de Status:** Tecla/botão `[M]` abre modal de 360×190 px, centralizado, transiciona fase para `MENU`. ✅ PASS
- **Renderização e Fidelidade:** Exibe Nome "✦ KAËL", "Adepto do Éter", "NÍVEL 1 ✦", barras preenchidas de HP (150/150), MP (45/45), XP (0/20), 6 atributos com bônus destacados (ATK 17 [+5], MAG 10 [+2]), e slot de Arma com "Bastão Sintonizado". ✅ PASS
- **Navegação de Slots:** Setas `[↓]` e `[↑]` movimentam cursor `►` e alternam a caixa de detalhes entre Arma, Armadura e Acessório. ✅ PASS
- **Fechamento e Retorno:** Pressionar `[X]` fecha a interface, retorna fase para `EXPLORING` e restaura movimentação fluida. ✅ PASS
- **Guarda Anti Double-Trigger de Escape:** Pressionar `[ESC]` abre o menu e permanece aberto sem fechamento instantâneo. Segundo pressionamento de `[ESC]` fecha o menu perfeitamente. ✅ PASS
- **Movimentação do Jogador:** Movimentação física congelada durante o menu e plenamente restaurada após o fechamento. ✅ PASS
- **Console & Estabilidade:** 0 erros no console do navegador, rendering nítido pixel-perfect, taxa de quadros estável a 60 FPS. Gravação em vídeo gerada em `status_menu_verification_1788955039344.webp`. ✅ PASS

---

## 2026-09-09 — FASE 3 / UNIDADE 9: INVENTÁRIO COMPLETO DE KAËL

### Execução de Testes Automatizados
- **Testes Unitários e de Integração:** 331/331 passing (100% PASS across 34 test files).
- **Novos Testes (Unidade 9 — 23 testes):**
  - `tests/systems/ItemUseManager.test.ts` (17 testes):
    - Elixir Âmbar: cura 50 HP quando ferido, consome 1 unidade, clampar ao teto efetivo máximo, rejeição com mensagem *"HP já está no valor máximo!"* quando cheio sem consumo de item.
    - Gota de Éter: restaura 20 MP, consome 1 unidade, clamp ao teto efetivo de MP, rejeição com mensagem *"MP já está no valor máximo!"* quando cheio sem consumo de item.
    - Antídoto: rejeitado na exploração (*"Nenhum efeito: Kaël não está envenenado."*) sem consumo de item.
    - Cristal de Fuga: rejeitado na exploração (*"Este item só pode ser usado em batalha."*) sem consumo de item; preparado para contexto de batalha.
    - Validações gerais: rejeição se item não possuído (quantidade 0), item desconhecido, e equipamentos usados como consumíveis (*"Este item não pode ser usado desta forma."*).
    - Remoção de último item da pilha (quantidade 1 → 0 remove entrada do inventário).
    - EventBus: emissão contratual de `inventory:itemUsed` com payload `{ itemId, playerId, amountApplied }` estritamente em usos bem-sucedidos.
    - Atomicidade Forte (Rollback): simulação de falha na remoção do item verifica reversão imediata de HP/MP sem corrupção do jogador ou inventário.
  - `tests/inventory/InventoryIntegration.test.ts` (5 testes):
    - Loja do Torvak → Inventário → Uso em série de Elixires até exaustão completa da pilha.
    - Equipamentos no inventário: equipar remove do inventário e aplica bônus de stats derivados; desequipar devolve ao inventário.
    - Transições de fase: abertura transiciona `EXPLORING` → `MENU`, fechamento retorna `MENU` → `EXPLORING`.
    - Guardas concorrentes: bloqueio de abertura durante `DIALOGUE`, `SHOP`, `STATUS` e transições de mapa.
    - Compatibilidade com Save/Load: `toState()` preserva com fidelidade itens, quantidades, slots e Fragmentos.
  - `tests/systems/InputManager.test.ts` (1 teste adicional):
    - Mapeamento e ciclo de vida da ação `INVENTORY` com `KeyI`.
- **Regressão:** Todos os 308 testes anteriores preservados e 100% aprovados.
- **Typecheck:** `bunx tsc --noEmit` executado com 0 erros.
- **Build de Produção:** `bun run build` gerado com sucesso (`dist/assets/index-B-xgW4uF.js`).

### Playtest no Navegador (Gauntlet Crítico)
- **Abertura do Inventário:** Tecla `[I]` ou botão `[I] Inventário` abre janela modal de 360×190 px, centralizada, transiciona fase para `MENU`. ✅ PASS
- **Estado Vazio:** Exibe título `✦ INVENTÁRIO`, saldo `Fragmentos: 100 ✦`, subcabeçalho `ITENS POSSUÍDOS`, aviso `Inventário vazio`, e `Nenhum item em posse.`. Cursor ocultado e CONFIRM bloqueado. ✅ PASS
- **Integração com Loja do Torvak:** Compra de 2× Elixir Âmbar e 1× Gota de Éter na loja reflete imediatamente no saldo e estoque do inventário. ✅ PASS
- **Listagem e Cursor:** Exibe `Elixir Âmbar ×2`, `Gota de Éter ×1`, cursor `►` funcional e navegável com setas cima/baixo. ✅ PASS
- **Inspeção de Detalhes:** Mostra nome, tag `[Consumível]`, descrição do item e estado de disponibilidade em tempo real. ✅ PASS
- **Uso de Consumível:** Uso de Elixir recupera HP (+50 HP) e reduz pilha (2 → 1); uso subsequente recupera até 150/150 HP e remove o item ao zerar. ✅ PASS
- **Rejeição com HP Cheio:** Tentativa de uso com HP cheio rejeitada com mensagem de feedback `✗ HP já está no valor máximo!` sem consumo. ✅ PASS
- **Restauração de MP:** Uso de Gota de Éter quando ferido em MP (+20 MP) e consumo do item. ✅ PASS
- **Fechamento e Retorno:** Teclas `[X]`, `[ESC]` ou `[I]` fecham a interface, retornam fase para `EXPLORING` e restauram movimentação física normal do jogador. ✅ PASS
- **Console & Estabilidade:** 0 erros inesperados no console do navegador, rendering nítido pixel-perfect, 60 FPS estáveis. Gravação em vídeo gerada em `inventory_usage_playtest_1788959073370.webp`. ✅ PASS


