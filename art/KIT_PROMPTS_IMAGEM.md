# KIT DE PROMPTS DE IMAGEM — Cinzas do Éter

> Prompts para a **ferramenta de geração de imagem** do agente. Eles produzem material **bruto** (conceito + base) que o `tools/art/process.mjs` converte em PNG pixel-perfeito dentro da paleta. A IA de imagem **não** entrega pixel art exato sozinha — a pós-produção por script e o validador (`qa:art:strict`) é que impõem o estilo.
>
> **Regra de originalidade (HG12):** estes prompts descrevem *qualidades* (forma, cor, luz). **Nunca** cite jogos, personagens existentes, estúdios ou artistas, nem peça para imitar a obra ou a assinatura visual de alguém. O prompt exato de cada asset é salvo em `art/prompts/<asset>.md`.

---

## 0. Como usar

1. Monte cada prompt assim: **`STYLE_PREAMBLE`** + **bloco do asset (§5)** + **`LAYOUT`** (se for sheet) + **`BACKGROUND`** + **`NEGATIVE`**.
2. **Um asset por geração** (um personagem, um conjunto de tiles de uma categoria, uma animação). Pedir "tudo de uma vez" derruba a consistência.
3. **Quadro-mestre primeiro.** Gere e aprove 1 pose-mestra do personagem; depois anexe-a como **imagem de referência** em todas as outras gerações dele (se a ferramenta aceitar). Anexe também `art-source/palette_swatch.png` (amostra da paleta) quando possível.
4. Salve: bruto → `art-source/raw/<asset>/`; prompt exato → `art/prompts/<asset>.md`.
5. Processe → manifesto → `bun run qa:art:strict`. Se reprovar, **regenere**; não afrouxe a régua.
6. Se a ferramenta de imagem não existir ou não aceitar referência, avise o usuário (R7) e use a rota ASCII/procedural (`tools/art/ascii2png.mjs`) para o que for pequeno (ícones, tiles, UI) enquanto o usuário gera o restante manualmente com estes prompts.

### Fator de escala `S` (pixel lógico → pixels da imagem gerada)
O processador reduz por razão **inteira**. Peça sempre múltiplos exatos:

| Asset | Tamanho lógico | S | Tamanho na imagem |
|---|---|---|---|
| Sprite de campo | quadro 32×48 | 8 | célula 256×384 |
| Ícone | 16×16 | 8 | 128×128 |
| Tile | 16×16 | 8 | 128×128 |
| Retrato | 48×48 | 8 | 384×384 |
| Cenário de batalha | 384×216 | 4 | 1536×864 |
| Inimigo médio / grande / boss | 48² / 64² / 96² | 8 | 384² / 512² / 768² |

### Grade → proporção da imagem (use proporções que o gerador suporta)
Células de sprite são 2:3. Escolha a grade para a imagem final ficar numa proporção comum:

| Quadros | Grade (colunas × linhas) | Proporção da imagem |
|---|---|---|
| 16 (caminhada 4 dir × 4) | 4 × 4 | 2:3 |
| 8 (idle 2 × 4 dir) | 4 × 2 | 4:3 |
| 6 | 3 × 2 | 1:1 |
| 4 | 2 × 2 | 2:3 |
| 5 ou 3 | completar com 1 célula **vazia** (magenta) em 3×2 ou 2×2 | 1:1 / 2:3 |

> O número real de quadros é declarado no manifesto (`rows[].frames`); células vazias são ignoradas.

---

## 1. `STYLE_PREAMBLE` (copiar no início de TODO prompt)

```text
Original 16-bit JRPG pixel art, polished and highly detailed, crisp hard-edged pixels,
absolutely no anti-aliasing, no blur, no soft gradients, no baked-in glow, no dithering.
Every logical game pixel is drawn as an exact {S}x{S} block of one flat color.
Limited palette: warm amber golds, violet shadows, teal-cyan crystal accents, earthy browns,
muted greens, ash grays. A dark violet outline about 2 logical pixels thick around every character and object.
Cel shading with 3 to 4 tones per material plus a thin rim light.
Light comes from the top-left; shadows fall toward the bottom-right.
Three-quarter top-down JRPG camera. Mood: luminous decay — a world of fading ether crystals
where life is slowly turning to ash; melancholic yet hopeful.
```

## 2. `BACKGROUND` (sprites, VFX, props, ícones)

```text
Flat solid magenta background (#FF00FF) filling the whole image, perfectly uniform, with no shadow, no gradient and no texture on it.
```

## 3. `LAYOUT` (sheets)

```text
Arrange the frames in a {COLS} columns x {ROWS} rows grid of equal cells, read left-to-right then top-to-bottom.
Each cell is {CW}x{CH} px. In every cell the subject is centered horizontally, with its feet on the same baseline
at 88% of the cell height, same scale, same camera angle. Keep at least 10% empty margin inside each cell.
Never let any part touch or cross a cell edge. Do NOT draw grid lines. Unused cells stay plain magenta.
```

## 4. `NEGATIVE` (anexar ao fim de TODO prompt)

```text
NO text, NO letters, NO numbers, NO labels, NO captions, NO watermark, NO signature,
NO grid lines, NO frames or borders, NO user interface, NO background scenery behind sprites,
NO photorealism, NO 3D render, NO vector or smooth look, NO blurry or upscaled-looking pixels,
NO anti-aliased or semi-transparent edges, NO pure black (#000000), NO pure white (#FFFFFF),
NO cropped or cut-off parts, NO overlap between cells,
NO reference to any existing game, character, studio or artist.
```

---

## 5. Blocos por tipo de asset (preenchidos com o GDD)

### T1 — Kaël: pose-mestra *(gerar e aprovar PRIMEIRO — decisão D2)*

```text
[STYLE_PREAMBLE]
Character: Kaël, a 19-year-old "tuner" (sintonizador): tousled brown hair, hooded cloak in dark earthy brown with
violet-tinged shadows, a glowing amber crystal pendant on the chest, practical clothes in earthy tones
(muted ochre and brown tunic — NOT green), leather belt, sturdy boots. He carries a wooden tuning staff
with a small amber crystal at the tip. Expression: curious, determined, slightly naive.
Pose: standing idle, facing the camera (south), full body, relaxed neutral stance.
The character fills 83% of the image height. Single subject. Aspect ratio 2:3 (portrait).
[BACKGROUND] [NEGATIVE]
```

### T2 — Kaël: caminhada (4 direções × 4 quadros) — grade 4×4, imagem 2:3

```text
[STYLE_PREAMBLE]
Use the attached approved master pose of Kaël: identical design, colors, proportions and outline in every frame.
Walk-cycle sprite sheet, 4 columns x 4 rows.
ROWS (directions, top to bottom): 1) walking toward the camera (south), 2) walking left (west, side view),
3) walking right (east, side view), 4) walking away from the camera (north).
COLUMNS (cycle, left to right): 1) right foot forward, body at its lowest, 2) passing pose — legs together, body 1 logical pixel higher,
3) left foot forward, body at its lowest, 4) passing pose again with the opposite arm swing.
The cloak and hair trail slightly behind the motion (1 frame of lag). Feet stay on a fixed ground line.
[LAYOUT: 4x4, cell 256x384] [BACKGROUND] [NEGATIVE]
```

### T3 — Kaël: idle (2 quadros × 4 direções) — grade 4×2, imagem 4:3

```text
[STYLE_PREAMBLE]
Use the attached master pose of Kaël (identical design). Idle breathing sprite sheet, 4 columns x 2 rows.
COLUMNS: south, west, east, north. ROW 1 = rest pose; ROW 2 = inhale pose (chest and shoulders 1 logical pixel higher, cloak settled).
[LAYOUT: 4x2, cell 256x384] [BACKGROUND] [NEGATIVE]
```
> O processador aceita `--transpose` para converter "colunas = direções" em "linhas = direções" ao montar o manifesto.

### T4 — Kaël: animações de batalha *(um prompt por animação; vista lateral 3/4, olhando para a ESQUERDA, em direção aos inimigos)*

Use o mesmo cabeçalho do T3 trocando a descrição:

| Animação | Quadros | Grade | Descrição por quadro |
|---|---|---|---|
| `idle` | 4 | 2×2 | respiração leve, bastão firme, capa balançando |
| `advance` | 4 | 2×2 | passo à frente para atacar, corpo inclinado |
| `attack` | 6 | 3×2 | 1 recuo de antecipação · 2 giro do bastão · 3 golpe com rastro (*smear*) · 4 **impacto** (pose mais esticada) · 5 retorno · 6 recuperação |
| `resonance` | 5 | 3×2 (+1 vazia) | bastão erguido · cristal acende âmbar · corpo arqueado · liberação com os braços abertos · retorno |
| `item` | 3 | 2×2 (+1 vazia) | mão na bolsa · levanta frasco · usa |
| `defend` | 2 | 2×2 (+2 vazias) | postura baixa, capa cobrindo, bastão cruzado |
| `hit` | 2 | 2×2 (+2 vazias) | recuo com impacto · cambaleio |
| `wounded` | 2 | 2×2 (+2 vazias) | postura curvada, respiração pesada (HP baixo) |
| `victory` | 4 | 2×2 | bastão ao alto · giro · pose de vitória · sorriso |
| `defeat` | 3 | 2×2 (+1 vazia) | cambaleia · ajoelha · tomba |
| `flee` | 3 | 2×2 (+1 vazia) | vira de costas · corre · sai |

### T5 — Retratos 48×48 (S=8) — grade 2×2, imagem 2:3 → peça em 4 expressões

```text
[STYLE_PREAMBLE]
Bust portrait of Kaël (same design as the attached master pose), chest-up, facing slightly toward the viewer.
2x2 grid of 4 expressions, one per cell: 1) neutral, 2) determined, 3) surprised, 4) worried.
Each cell 384x384. Same framing and head position in all four.
[BACKGROUND] [NEGATIVE]
```
Repita para **Mirael** (idosa, manto violeta, cabelos brancos, cristal azul no cajado: calma/sábia/preocupada/sorriso), **Torvak** (baixo e robusto, mochila enorme, marrom e âmbar: jovial/negociador/surpreso/pensativo), **Lia** (~18 anos, cabelo castanho em trança lateral, avental terroso sobre vestido âmbar escuro: direta/sorriso seco/preocupada/aliviada).

### T6 — NPCs de campo (caminhada 4×4 + idle 4×2)
Mesmos moldes do T2/T3, **pose-mestra própria de cada NPC aprovada antes**.
- **Mirael** — anciã; manto violeta longo; cajado com cristal azul; andar lento e firme.
- **Torvak** — baixo, robusto; mochila enorme balançando; passos curtos e pesados; marrom e âmbar.
- **Lia** — jovem ágil; trança lateral que balança; cesta de suprimentos na mão; passo rápido (ela **patrulha** a vila).
- **Aldeões genéricos (2–3)** — silhuetas distintas entre si (um adulto de capuz, uma criança, um idoso curvado), tons terrosos.

### T7 — Inimigos e boss *(base + animações; quadro-mestre antes)*

| Inimigo (GDD) | Tamanho | Descrição | Animações (quadros) |
|---|---|---|---|
| **Espectro de Cinzas** | 32² ou 48² | fantasma de éter corrompido: manto esfarrapado cinza-violeta, núcleo violeta brilhante no peito, tentáculos de cinza que se desfazem | idle 4 · toque gélido 4 · hit 2 · derrota 4 (dissolve em cinzas) |
| **Golem de Cristal** | 64² | construto mineral pesado: rocha cinza-marrom com cristais ciano emergindo dos ombros, punhos e peito; olhos ciano | idle 4 · impacto pesado 6 (lento, antecipação longa) · hit 2 · derrota 4 (desmorona em cristais) |
| **Réptil Fossilizado** | 48² | criatura petrificada reanimada: osso e pedra, fendas com brilho verde-veneno, mandíbula larga | idle 4 · mordida venenosa 5 · hit 2 · derrota 4 (racha e vira pó) |
| **Sombra do Selo — fase 1 "O Selo Intacto"** | 96² | figura encapuzada em negro e violeta, **máscara branca inteira** com símbolo de selo, mantos esvoaçantes | idle 4 · golpe selado 6 · marca do vazio 5 · hit 2 |
| **Sombra do Selo — fase 2 "O Selo Quebrado"** | 96² | mesma figura; **máscara partida ao meio**, aura violeta intensa e pulsante, mantos rasgados | idle 4 · fragmentação 6 · dreno de éter 6 · transição fase 1→2: 6 (máscara trinca, parte, aura explode) · derrota 6 (dissolve; cristal da Gruta brilha) |

### T8 — Tilesets *(peça TILES BASE sem bordas — as transições são geradas por código)*

> **Autotile por máscara:** modelos de imagem não acertam conjuntos de borda matematicamente corretos. Peça apenas tiles **base** (sem bordas) e deixe `tools/art/autotile.mjs` gerar as transições (grama↔terra↔pedra↔água; zona viva→morta) combinando dois tiles base com máscaras orgânicas e uma linha de sombra de borda.

```text
[STYLE_PREAMBLE]
Seamless tileable 16x16 pixel tiles, 8 columns x 8 rows (64 tiles), each tile {128x128} px, edge-to-edge with no padding,
all tiles must tile perfectly with themselves on every side. Top-down three-quarter view.
Category: {CATEGORIA}. Include 3 to 4 subtle variants of each ground type to avoid visible repetition.
[NEGATIVE]
```

| Área | Categorias (uma geração por categoria) | Direção visual |
|---|---|---|
| **Lumen (vila)** | calçamento de pedra · grama (≥ 3 variantes) · terra batida · tábuas de madeira · parede de pedra com detalhes art-nouveau (janela, porta) · telhado de ardósia escura · canteiros de flores · água/lagoa · escadas e ponte · cercas · barracas de mercado | quente, âmbar do Núcleo, pedra clara, madeira escura |
| **Planície das Cinzas** | grama viva (verde) · terra rachada · cinzas · pedra morta · árvores mortas · pedras soltas · pilhas de cinza · boca da Gruta | gradiente **vida → morte**: verdes e âmbar de um lado, cinzas e ossos do outro |
| **Gruta do Eco** | piso de caverna (violeta-cinza escuro) · paredes · estalactites · **cristais apagados** (cinza/ciano fosco) · **cristais ativos** (ciano brilhante) · pilares do puzzle (dormente/ativo) · tiles da ponte de Éter · escombros | frio e escuro, com pontos de ciano e violeta |

### T9 — Props e objetos *(múltiplos de 16 px; fundo magenta)*

- **Núcleo de Éter de Lumen** — cristal âmbar grande sobre pedestal circular de pedra, 4 quadros de pulso (brilho sobe e desce); é a peça central da vila.
- Casas (módulos): paredes, telhados, chaminés, portas, janelas acesas; **postes de lanterna** (2 quadros de chama); poço; barris/caixotes; placas; barraca de mercado (3 cores de toldo).
- **Árvores** (3 variantes outonais em âmbar/marrom/verde escuro), arbustos, flores.
- **Gruta:** baú (fechado / abrindo 4 quadros / aberto), pilar de ressonância (dormente / ativando 4 quadros / ativo), ponte de Éter (surgindo 6 quadros), ponto de save (cristal flutuante, 4 quadros).

### T10 — Ícones 16×16 (S=8, células 128×128) — grade 4×3

Itens (GDD): **Elixir Âmbar** (frasco âmbar), **Gota de Éter** (gota ciano), **Antídoto** (frasco verde com folha), **Cristal de Fuga** (cristal ciano com faíscas).
Equipamentos (GDD): **Bastão de Aprendiz** (bastão simples de madeira), **Bastão Sintonizado** (madeira com cristal âmbar), **Túnica de Viajante** (túnica de tecido leve), **Couraça de Éter** (couraça reforçada com veios luminosos), **Pingente de Âmbar** (pingente com cristal âmbar), **Anel de Cristal** (anel com cristal lapidado ciano).
```text
[STYLE_PREAMBLE]
Inventory icon sheet, each icon 128x128 px (16x16 logical pixels), centered in its own cell, strong readable silhouette,
dark violet outline, 3-tone shading. 4 columns x 3 rows. Icons: {LISTA}.
[BACKGROUND] [NEGATIVE]
```

### T11 — UI (molduras 9-slice, barras, cursor)

```text
[STYLE_PREAMBLE]
Pixel UI kit on flat magenta: (1) dialog/menu window frame — dark navy-violet fill (#1A0F2E), violet border,
small teal crystal ornaments in the four corners, corner pieces and edges clearly separable for 9-slice;
(2) a second gold-bordered variant for important windows; (3) horizontal bars with empty and full states:
HP (green), MP (cyan), ATB (amber), XP (gold); (4) animated menu cursor (hand/arrow) in 4 frames;
(5) status icons for poison, defense up, and low HP. Everything drawn without any text.
[BACKGROUND] [NEGATIVE]
```

### T12 — Cenários de batalha (S=4 → 1536×864; 3 planos separados)

```text
[STYLE_PREAMBLE]
Battle backdrop for {ÁREA}, 16:9, side view, horizon at 40% of the height, clear open floor area in the lower half for sprites.
Deliver three separate layers: FAR sky/background, MID scenery, and NEAR floor with foreground elements (no characters).
{DESCRIÇÃO}
[NEGATIVE]
```
- **Planície das Cinzas:** céu crepuscular violeta-âmbar, colinas de cinza, árvores mortas, grama viva só no canto.
- **Gruta do Eco:** cristais apagados nas paredes, poças com reflexo ciano, névoa; ar frio e escuro.
- **Câmara do boss (fundo da Gruta):** grande cristal de Éter apagado ao fundo, selo gravado no chão, pilares.

### T13 — VFX (tiras de quadros, fundo magenta, cores por elemento)

```text
[STYLE_PREAMBLE]
Visual effect animation strip, {N} frames in a {COLS}x{ROWS} grid of equal square cells, same center in every cell.
Effect: {EFEITO}. Frame plan: anticipation (small, dim) -> build-up -> PEAK (largest, brightest, hot-white core) -> breakup -> dissipation (sparse, dim).
Hard-edged pixels, no soft glow. [BACKGROUND] [NEGATIVE]
```

| Efeito | Quadros | Identidade visual (cor/forma) |
|---|---|---|
| **Atacar** (golpe de bastão) | 5 | arco de corte branco-âmbar + faísca no impacto |
| **Pulso** | 6 | onda de choque concentrada branco-violeta: ponto → anel → estrela de impacto → estilhaços |
| **Harmonia** (cura) | 6 | brilho verde-dourado subindo, anel suave, pequenas folhas/faíscas |
| **Dissonância** (todos os inimigos) | 6 | rachaduras violeta irregulares atravessando a tela, energia instável |
| **Barreira** (+DEF 3 turnos) | 6 + loop de 3 | cúpula hexagonal âmbar dourada com brilho de borda; loop sutil enquanto ativa |
| **Item: Elixir Âmbar / Gota de Éter** | 4 | gotas âmbar / ciano subindo e dissipando |
| **Veneno** (status, loop) | 4 | bolhas e gotas verde-veneno ao redor do alvo |
| **Toque gélido** (Espectro) | 5 | fiapos frios azul-violeta tocando o alvo |
| **Impacto pesado** (Golem) | 6 | onda de choque + detritos + estilhaços de cristal ciano |
| **Mordida venenosa** (Réptil) | 5 | duas presas em arco + respingo verde |
| **Golpe Selado** (boss, físico) | 6 | corte violeta-escuro com brilho do símbolo do selo |
| **Marca do Vazio** (boss, mágico) | 6 | símbolo violeta-negro que se forma e implode sobre o alvo |
| **Fragmentação** (boss, área) | 8 | estilhaços violeta irradiando por toda a tela |
| **Dreno de Éter** (boss) | 6 | espiral violeta-ciano sendo sugada em direção ao boss |
| **Vitória** | 8 | a Sombra se dissolve em partículas; cristal da Gruta brilha |
| **Level-up** | 6 | coluna de luz dourada + faíscas |
| **Fuga** (Cristal de Fuga) | 5 | explosão de cristal ciano + clarão |

> ⚠️ O conceito antigo tem uma **"Fire Magic"** que **não existe no GDD** (só há 4 Ressonâncias). Não criar magia de fogo. A chama serve apenas como detalhe ambiente (lanternas/tochas).

### T14 — Mapa-múndi *(somente após a decisão D3)*
Visão geral do continente em estilo de mapa (terreno, caminhos, 3 locais do GDD: **Lumen**, **Planície das Cinzas**, **Gruta do Eco**) + tileset de terreno em escala reduzida (16×16) para o modo escolhido na D3. Mantenha o gradiente **vida → cinzas** coerente com a história: quanto mais longe de Lumen, mais cinza.

---

## 6. Checklist antes de aceitar uma imagem gerada

Rejeite e **regenere** se houver QUALQUER um destes:
- texto, rótulo, número ou marca d'água em qualquer lugar;
- fundo que não seja magenta chapado uniforme;
- personagem cortado, encostando na célula ou sobreposto entre células;
- proporções/cores/rosto **diferentes** do quadro-mestre aprovado;
- pés em alturas diferentes entre quadros do mesmo ciclo;
- glow/gradiente suave ou bordas serrilhadas com anti-aliasing visível;
- cores muito fora da paleta (túnica verde no Kaël, por exemplo — o GDD pede tons terrosos);
- elemento que **não existe no GDD** (ex.: magia de fogo).

## 7. Lembretes

- **Palette v2 (D1):** aprovada a v2, atualize o `STYLE_PREAMBLE` com a lista de cores/rampas e regenere `art-source/palette_swatch.png`.
- Todo prompt usado vira `art/prompts/<asset>.md` e é referenciado em `promptRef` no manifesto.
- Antes do commit: `git grep` do HG12 deve estar **vazio**.
