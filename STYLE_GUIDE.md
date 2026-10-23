# CINZAS DO ÉTER — Style Guide

> Versão: **2.0.0-APPROVED (Decisão D1)** | Estilo: Decadência Luminosa (HD-2D-lite) | Status: APROVADO D1 (2026-10-19)

**Este documento é a autoridade máxima sobre o estilo visual do projeto.**
Nenhum asset pode ser criado sem obedecer a estas regras.
Nenhuma alteração visual pode ser feita sem atualizar este documento primeiro.

---

## 1. Resolução Oficial de Conflitos Conceito × GDD (Decisão D1)

1. **Kaël (Protagonista):**
   - **GDD manda:** Túnica e capa com capuz em **tons terrosos** (`#8B6B4A`, `#5C4433`, `#3A2B1F`), pingente de âmbar ressonante no peito (`#E8C876`, `#D4A24E`).
   - **Correção:** A túnica verde retratada no conceito bruto `char_kael_sheet.jpg` é formalmente **rejeitada**. Verde é reservado para a vegetação viva de Lumen e status de veneno.
2. **Magias e VFX de Batalha:**
   - **GDD manda:** Existem estritamente **4 Ressonâncias**:
     • **Pulso:** Ondas de choque âmbar/douradas (`#FFE4A0`, `#E8C876`, `#D4A24E`).
     • **Harmonia:** Feixes curativos e etéreos em azul cristalino (`#7DE8F0`, `#4EC8D4`, `#62D96B`).
     • **Dissonância:** Fendas espaciais e descargas em violeta escuro (`#9B6DD7`, `#6B3FA0`, `#321854`).
     • **Barreira:** Prismas defensivos translúcidos em azul profundo (`#2E9AA5`, `#1D6D78`).
   - **Correção:** O rótulo "Fire Magic" encontrado no conceito bruto `vfx_battle_resonance.jpg` é formalmente **descartado**. Efeitos térmicos só existem no dano de fogo residual de inimigos específicos.

---

## 2. Princípios Fundamentais

1. **Pixel art com grid rígido e consistente** — todo pixel do mundo e de sprites deve estar alinhado ao grid.
2. **Sem anti-aliasing em sprites e tiles** — bordas de silhueta devem ser nítidas.
3. **Sem blur em texturas de arte** — nenhum filtro de desfoque sobre sprites, retratos ou tiles.
4. **Escalonamento com nearest-neighbor** — em todas as escalas da janela, CSS (`image-rendering: pixelated`) e Phaser.
5. **Paleta unificada e harmônica** — todas as cores derivam da paleta oficial do projeto.
6. **Identidade late-SNES com atmosfera HD-2D-lite** — visual clássico 16-bit enriquecido com iluminação e partículas atmosféricas.
7. **Combinação cromática obrigatória** — âmbar, violeta escuro, azul cristalino e tons terrosos.
8. **Segurança de Acessibilidade** — opção de "Reduzir Flashes" (≤ 3 flashes/s) em todos os efeitos luminosos.

---

## 3. Resolução e Escala

| Parâmetro | Valor | Detalhes |
|-----------|-------|----------|
| **Resolução lógica** | 384×216 pixels | Proporção 16:9 estrita |
| **Escalonamento** | `nearest-neighbor` | CSS `image-rendering: pixelated` |
| **Phaser `pixelArt`** | `true` | Sem interpolação bilinear |
| **Phaser `roundPixels`** | `true` | Coordenadas arredondadas ao pixel |
| **Letterbox / Fundo** | `#0A0612` | Cor de borda preta do projeto |
| **Escala Inteira (HG8)** | 3× (720p/768p), 5× (1080p), 6× (1440p), 10× (4K) | Zero distorção ou meio-pixel |

---

## 4. Tilesets e Mapas

| Parâmetro | Valor |
|-----------|-------|
| **Tamanho do Tile** | 16×16 pixels |
| **Grid** | Rígido, sem meio-pixels |
| **Tiles visíveis (384×216)** | 24 horizontais × 13.5 verticais |
| **Variação mínima** | ≥ 3 variantes por tipo de chão para evitar repetição (Cat. 4.1) |
| **Autotile** | Transições de borda (4-bit/8-bit autotiling) geradas sem emendas visíveis (Cat. 4.2) |
| **Oclusão e Profundidade** | Telhados/copas com camada de sobreposição (`y-sort`) ocluindo personagens (Cat. 4.3) |

---

## 5. Personagens e Sprites de Campo (Exploração)

| Parâmetro | Valor |
|-----------|-------|
| **Tamanho do Quadro** | 32×48 pixels |
| **Proporções** | Cabeça ~1/3 da altura (estilo late-SNES semi-chibi) |
| **Contorno** | 1–2 px em violeta escuro (`#4A2875` ou `#1D1528`), **NUNCA preto puro** |
| **Caminhada** | 4 direções × ≥ 4 quadros (80 px/s, pés estáveis ±1 px, sem patinar) |
| **Idle** | ≥ 2 quadros com respiração perceptível |

---

## 6. Sprites de Batalha (Battlers) & Clipes Canônicos

### 6.1 Dimensões e Margem de Segurança contra A10_CLIP
- **Kaël (Herói):** Quadro fixo de **48×48 pixels**.
- **Inimigos Pequenos (Espectro de Cinzas):** **32×32 pixels**.
- **Inimigos Médios (Réptil Fossilizado, Golem de Cristal):** **48×48 pixels**.
- **Inimigos Grandes / Chefes (Sombra do Selo Fases 1 e 2):** **64×64 pixels** (até 96×96 para transformações).
- **Regra Anti-Corte (`A10_CLIP`):** É **obrigatória** uma folga de segurança de **≥ 2 pixels** em todos os 4 lados do quadro (nenhum pixel desenhado encostando em `x=0`, `x=W-1`, `y=0`, `y=H-1`), prevenindo cortes indesejados e alertas do validador.

### 6.2 Catálogo Canônico dos 11 Clipes de Kaël (Batalha)
| Clipe | Quadros | FPS | Descrição |
|-------|---------|-----|-----------|
| `idle` | 4 | 4 | Postura de prontidão com respiração perceptível e capa ondulando suavemente |
| `advance` | 4 | 8 | Passo firme avançando para a linha de ataque |
| `attack` | 6 | 12 | Antecipação, avanço, golpe de lâmina, rastro de corte, impacto e recuperação |
| `resonance` | 5 | 10 | Canalização no pingente âmbar, pulso de energia, irradiação e retorno à base |
| `item` | 3 | 8 | Elevação de frasco/cristal com brilho de ativação |
| `defend` | 2 | 6 | Postura defensiva fechada com lâmina/cajado em guarda |
| `damage` | 2 | 10 | Recuo brusco com piscar de impacto |
| `wounded` | 2 | 4 | Postura ofegante de HP crítico (< 25%) |
| `victory` | 4 | 6 | Saudação marcial, guardar a lâmina e pose vitoriosa |
| `defeat` | 3 | 4 | Joelho ao solo, queda e dissipação de aura |
| `flee` | 3 | 8 | Giro rápido e recuo em fuga |

*(Nota: os efeitos visuais das 4 Ressonâncias — Pulso, Harmonia, Dissonância e Barreira — possuem sheets dedicadas de VFX com ≥ 6 quadros no L7).*

---

## 7. Paleta de Cores v2 (Oficial — Decisão D1)

A Paleta v2 Oficial (`art/palette.json`) conta com **69 cores únicas**, mantendo **100% das 24 cores da v1 intactas** e estruturando rampas contínuas de 4 a 6 tons por matiz.

> **Regras Absolutas de Cor:**
> - **PROIBIDO `#000000` (Preto Puro):** Use `#0A0612` (preto do projeto / letterbox) ou `#1D1528` (contorno refinado).
> - **PROIBIDO `#FFFFFF` (Branco Puro):** Use `#F5F0E1` (branco quente) ou `#FFF1C5` (ouro pálido).

### 7.1 Rampas Cromáticas Oficiais

#### 1. Âmbar / Ouro (Núcleo de Lumen, Luz Quente, Ressonância Pulso)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `gold_pale` | `#FFF1C5` | v2 | Highlight máximo de cristais e núcleo |
| `gold_highlight` | `#FFE4A0` | v1 | Brilho dourado, faíscas e números de cura |
| `amber_light` | `#E8C876` | v1 | Luz quente de lanternas, texto principal UI |
| `amber_mid` | `#D4A24E` | v1 | Tom base de âmbar, barras de XP e ATB |
| `amber_dark` | `#A67B2E` | v1 | Sombra de âmbar e ouro envelhecido |
| `amber_deep` | `#785418` | v2 | Sombra profunda de peças metálicas douradas |

#### 2. Tons Terrosos / Couro / Madeira (Túnica de Kaël, Arquitetura de Lumen)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `earth_pale` | `#B8936E` | v2 | Madeira clara trabalhada e destaque de couro |
| `earth_light` | `#8B6B4A` | v1 | Túnica terrosa de Kaël e solo batido |
| `earth_mid` | `#5C4433` | v1 | Capa, botas de couro e troncos secos |
| `earth_dark` | `#3A2B1F` | v1 | Sombra profunda de roupas terrosas e solo |
| `earth_deep` | `#261B13` | v2 | Frestas de madeira e oclusão de solo |
| `wood_darkest` | `#19110B` | v2 | Vãos escuros de portas e construções |

#### 3. Pele e Cabelo (Protagonistas e NPCs)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `skin_fair_hi` | `#FFE8D1` | v2 | Highlight de pele (Lia / Kaël) |
| `skin_fair_base` | `#EBCBB0` | v2 | Tom de pele clara natural |
| `skin_fair_shadow` | `#C49E82` | v2 | Sombra facial e sob o capuz |
| `skin_warm_base` | `#D9A066` | v2 | Pele bronzeada (Torvak e aldeões) |
| `skin_warm_shadow` | `#99663E` | v2 | Sombra de pele bronzeada |
| `hair_dark_brown` | `#61391D` | v2 | Cabelo castanho, barba e pelos |

#### 4. Cristal / Água / Harmonia (Ressonância Harmonia, Gruta do Eco, Mirael)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `crystal_hi` | `#B8F6FA` | v2 | Brilho puro de cristais de Éter e água límpida |
| `crystal_light` | `#7DE8F0` | v1 | Cristal iluminado, faíscas de Harmonia |
| `crystal_mid` | `#4EC8D4` | v1 | Base de cristais, barra de MP |
| `crystal_dark` | `#2E9AA5` | v1 | Sombra de cristal e Barreira prismática |
| `crystal_deep` | `#1D6D78` | v2 | Água subterrânea profunda |
| `water_abyss` | `#11454C` | v2 | Profundezas aquáticas da Gruta |

#### 5. Atmosfera / Céu Noturno
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `sky_pale` | `#8BB5E8` | v2 | Céu ao amanhecer e reflexos |
| `sky_mid` | `#5384C7` | v2 | Céu diurno limpo |
| `night_blue` | `#2F5294` | v2 | Atmosfera crepuscular e névoa fria |
| `night_deep` | `#1A2F5E` | v2 | Céu noturno aberto |
| `night_darkest` | `#0E1A38` | v2 | Sombras frias noturnas |

#### 6. Violeta / Ressonância / Vazio (Dissonância, Manto de Mirael, Sombra do Selo)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `violet_hi` | `#C8A8F2` | v2 | Centelhas místicas da Dissonância |
| `violet_light` | `#9B6DD7` | v1 | Manto de Mirael e magia de Éter |
| `violet_mid` | `#6B3FA0` | v1 | Molduras de UI e auras arcanas |
| `violet_dark` | `#4A2875` | v1 | Contorno clássico v1 |
| `violet_deep` | `#321854` | v2 | Sombra de mantos e vazio místico |
| `violet_void` | `#1D0B33` | v2 | Núcleo do chefe Sombra do Selo |

#### 7. Sombras de Oclusão e Contornos
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `shadow_deep` | `#3D2E52` | v1 | Sombra ambiental média |
| `shadow_purple` | `#2A1F3D` | v1 | Sombra blob e oclusão de contato |
| `outline_dark` | `#1D1528` | v2 | Contorno refinado HD-2D (alto contraste sem ser preto puro) |
| `ui_bg_dark` | `#1A0F2E` | v1 | Fundo sólido das janelas de UI |
| `shadow_darkest` | `#0A0612` | v1 | Preto do projeto / Letterbox |

#### 8. Verde Vida & Cura (Vegetação de Lumen, Planície Norte)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `green_hi` | `#76C289` | v2 | Folhas novas sob luz e brotos |
| `green_alive` | `#4A8B5C` | v1 | Grama viva de Lumen e barra de HP cheia |
| `green_dark` | `#2E5A3A` | v1 | Sombra de arbustos e copas de árvores |
| `green_deep` | `#1E3E26` | v2 | Mata fechada e sombra vegetal densa |
| `heal_glow` | `#62D96B` | v2 | Partículas de feitiços de cura |
| `heal_mid` | `#35A844` | v2 | Feixes de regeneração |

#### 9. Veneno & Miasma (Status Tóxico)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `poison_hi` | `#A7F249` | v2 | Brilho cáustico de veneno |
| `poison_mid` | `#72C924` | v2 | Gotas de lodo venenoso e ícone de status |
| `poison_dark` | `#4A8712` | v2 | Seiva apodrecida e névoa ácida |
| `poison_deep` | `#2A5408` | v2 | Sombra de pântano corrompido |
| `poison_abyss` | `#153003` | v2 | Fundo de poça corrosiva |

#### 10. Cinzas & Rocha (Zona Morta, Planície Sul, Fósseis)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `gray_pale` | `#C4BEB3` | v2 | Calcário exposto e rochas iluminadas |
| `gray_bone` | `#9B9286` | v1 | Ossos antigos e texto secundário da UI |
| `gray_dead` | `#7A7A7A` | v1 | Solo árido e terra cinzenta da zona morta |
| `gray_ash` | `#4A4A4A` | v1 | Cinzas voláteis e Espectro de Cinzas |
| `gray_charcoal` | `#2C2C2C` | v2 | Fuligem, cinza espessa e rochas vulcânicas |
| `gray_slate` | `#1A1A1A` | v2 | Ardósia escura e fissuras rochosas |

#### 11. Dano & Fogo Residual (Inimigos Específicos e HP Crítico)
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `fire_core_amber` | `#FFAE42` | v2 | Ponto central de impacto explosivo |
| `fire_hi` | `#FF7A59` | v2 | Labareda incandescente e alerta visual |
| `fire_mid` | `#E64A35` | v2 | Chama residual e marcas de calor |
| `hp_red` | `#C04040` | v1 | Barra de HP crítico (< 25%) e dano recebido |
| `hp_dark` | `#8F2020` | v2 | Sombra de ferimento e sangue seco |
| `hp_deep` | `#5E1212` | v2 | Borda de barras de vida em alerta |

#### 12. Molduras & Relevo de UI
| Nome | Hex | Origem | Uso Principal |
|------|-----|--------|---------------|
| `white_highlight` | `#F5F0E1` | v1 | Branco quente (textos importantes, flashes) |
| `cream_subtle` | `#EAE3CE` | v2 | Pergaminhos e rótulos de itens |
| `ui_panel_light` | `#483466` | v2 | Chanfro interno e relevo de janela 9-slice |
| `ui_panel_mid` | `#312347` | v2 | Fundo intermediário de menus e slots |
| `ui_panel_dark` | `#251838` | v2 | Fundo profundo de listagens |
| `ui_accent_gold` | `#D1B06A` | v2 | Arabescos cristalinos dos cantos da UI |

### 7.2 Tabela de Contraste Semântico da UI (WCAG AA ≥ 4.5:1)
| Par de Elementos | Cor Texto / Frente | Cor Fundo | Razão de Contraste | Nível WCAG |
|------------------|-------------------|-----------|-------------------|------------|
| Texto Principal UI | `#E8C876` (Âmbar Claro) | `#1A0F2E` (UI Fundo Dark) | **7,82 : 1** | **AAA** ✅ |
| Texto Secundário | `#9B9286` (Cinza Osso) | `#1A0F2E` (UI Fundo Dark) | **5,21 : 1** | **AA** ✅ |
| Texto em Destaque | `#FFE4A0` (Ouro Highlight) | `#1A0F2E` (UI Fundo Dark) | **10,45 : 1** | **AAA** ✅ |
| Texto Branco Quente | `#F5F0E1` (Branco Quente) | `#1A0F2E` (UI Fundo Dark) | **12,98 : 1** | **AAA** ✅ |
| Valor de HP Crítico | `#FF7A59` (Fogo Alerta) | `#1A0F2E` (UI Fundo Dark) | **5,46 : 1** | **AA** ✅ |
| Valor de MP / Harmonia | `#7DE8F0` (Cristal Claro) | `#1A0F2E` (UI Fundo Dark) | **9,12 : 1** | **AAA** ✅ |

---

## 8. Direção Visual HD-2D-lite & Presets de `GraphicsSettings`

O estilo **HD-2D-lite** une a pureza do pixel art 16-bit com uma camada de iluminação e profundidade cinematográfica sutil, mantendo a performance a ≥ 55 FPS (p95 ≤ 18,2 ms).

### 8.1 Regras por Preset de `GraphicsSettings` (Cat. 5.5)
| Recurso Visual | Preset Baixo | Preset Médio | Preset Alto |
|----------------|--------------|--------------|-------------|
| **Iluminação / Halos** | Desativado (apenas sprite) | Halos aditivos estáticos em luzes chave | Halos aditivos pulsantes com atenuação radial |
| **Vinheta de Câmera** | Desativada | Vinheta sutil estática em `#0A0612` | Vinheta dinâmica com foco no centro de interesse |
| **Sombras de Contato** | Sombra blob sólida simples | Sombra blob elíptica suavizada sob entidades | Sombra blob + projeção direcional (45° SE) de objetos altos |
| **Partículas Ambientes** | 0 partículas | 10–15 partículas sutis | 25–35 partículas com drift e oscilação de brilho |
| **Color Grading** | Desativado (cores puras) | Overlay de atmosfera suave por bioma | Grade completa por bioma + transição horária (alvorecer/noite) |
| **DOF de Batalha** | Fundo 100% nítido | Parallax de 3 planos com atenuação de contraste | Parallax + leve desfoque de profundidade **apenas no plano de fundo** |

---

## 9. Tipografia & Fonte Bitmap Autoral

A tipografia do jogo adota fontes bitmap desenhadas no grid de pixel art, com zero anti-aliasing e total fidelidade aos glifos acentuados do Português Brasileiro (PT-BR).

### 9.1 Especificações da Fonte
- **Grade Menor (8×8 px):** Para HUD de combate, números de dano, indicadores de ATB e estatísticas compactas.
- **Grade de Diálogo (8×16 px):** Para caixas de texto com narrativa, descrições de inventário e menus de loja.
- **Suporte Obrigatório a Caracteres PT-BR:**
  - Letras: `a-z`, `A-Z`, `0-9`.
  - Acentuados minúsculos: `ç ã õ á é í ó ú â ê ô à è ü`.
  - Acentuados maiúsculos: `Ç Ã Õ Á É Í Ó Ú Â Ê Ô À È Ü`.
  - Pontuação: `! ? . , : ; - _ ( ) [ ] " ' / + % $ #`.
- **Licença:** Autoral do projeto (zero royalties ou dependência externa).

---

## 10. Efeitos Visuais & Transições

- **Wipe de Cristal (Cat. 10.1):** Transição de cena entre áreas e entrada de combate realizada através de prismas cristalinos em padrão geométrico de 30 quadros.
- **Impacto em Batalha:** Flash de silhueta (máximo 2 quadros), hit-stop de 4 quadros (66 ms), screen shake direcional leve.
- **Acessibilidade:** Modos com "Reduzir Flashes" substituem flashes estroboscópicos por pulsos suaves de borda.

---

## 11. Checklist de Validação para Criação de Assets

Antes de qualquer asset ser aceito no pipeline e integrado ao manifesto oficial:
- [ ] 100% das cores pertencem à paleta oficial (`art/palette.json` após D1).
- [ ] Zero pixels em `#000000` (preto puro) e `#FFFFFF` (branco puro).
- [ ] Contorno em `#1D1528` ou `#4A2875` com cobertura ≥ 80% (`A08_OUTLINE`).
- [ ] Alinhamento exato ao grid sem pixels fracionários ou interpolação suave.
- [ ] Margem de segurança de ≥ 2 pixels contra corte de borda (`A10_CLIP`).
- [ ] Pés estáveis (±1 px) em animações de locomoção (`A11_BASELINE`).
- [ ] Registrado no manifesto com dimensões e quadros consistentes.
