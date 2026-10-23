# CINZAS DO ÉTER — Art Pipeline

> Versão: 0.1.0 | Estilo: Decadência Luminosa

---

## Métodos de Produção

### A) Arte Procedural por Código (Preferido para elementos técnicos)

Usado para:
- Tiles geométricos (chão, parede, grid)
- Partículas e efeitos visuais
- UI (bordas, barras, cursores)
- Padrões repetitivos

Vantagens:
- Consistência garantida
- Fácil alteração
- Sem necessidade de arquivos externos
- Reprodutível

### B) Geração de Imagem por IA (Quando necessário para qualidade)

Usado para:
- Sprites de personagens (protagonista, NPCs, inimigos, boss)
- Retratos (portraits)
- Tiles complexos (formações de cristal, elementos orgânicos)
- Backgrounds de batalha

Regras obrigatórias:
- Arte deve ser **original** — não solicitar cópia de personagens existentes
- Não solicitar imitação direta de artista específico
- Seguir rigorosamente STYLE_GUIDE.md (paleta, proporções, regras de contorno)
- Registrar a origem e o prompt neste documento
- Pós-processar para alinhar ao grid de pixels se necessário

---

## Nomenclatura

```
[tipo]_[nome]_[variante]_[tamanho].png

Exemplos:
char_kael_walk_south_32x48.png
tile_stone_floor_v1_16x16.png
enemy_spectro_idle_32x32.png
portrait_kael_neutral_48x48.png
ui_border_corner_8x8.png
bg_battle_gruta_384x216.png
```

| Prefixo | Tipo |
|---------|------|
| `char_` | Personagem jogável |
| `npc_` | NPC |
| `enemy_` | Inimigo |
| `boss_` | Chefe |
| `tile_` | Tile de mapa |
| `portrait_` | Retrato |
| `ui_` | Elemento de interface |
| `bg_` | Background |
| `fx_` | Efeito visual |
| `icon_` | Ícone de item/status |

---

## Resolução e Formato

| Tipo | Tamanho | Formato |
|------|---------|---------|
| Tiles | 16×16 px | PNG-8 ou PNG-24 com transparência |
| Personagens | 32×48 px (por frame) | PNG-24 com transparência |
| Inimigos pequenos | 32×32 px | PNG-24 com transparência |
| Inimigos médios | 48×48 px | PNG-24 com transparência |
| Inimigos grandes/boss | 64×64 ou 96×96 px | PNG-24 com transparência |
| Retratos | 48×48 px | PNG-24 com transparência |
| Backgrounds | 384×216 px | PNG-24 |
| Ícones | 16×16 px | PNG-24 com transparência |
| UI elements | Variável | PNG-24 com transparência |

---

## Spritesheets

Spritesheets devem ser organizados como:

```
[frames horizontais] × [frames verticais]

Personagem caminhada (4 frames × 4 direções):
┌────┬────┬────┬────┐
│ S1 │ S2 │ S3 │ S4 │  ← Sul (frente)
├────┼────┼────┼────┤
│ N1 │ N2 │ N3 │ N4 │  ← Norte (costas)
├────┼────┼────┼────┤
│ L1 │ L2 │ L3 │ L4 │  ← Leste (direita)
├────┼────┼────┼────┤
│ O1 │ O2 │ O3 │ O4 │  ← Oeste (esquerda)
└────┴────┴────┴────┘

Total: 128×192 px (4×32 horizontal, 4×48 vertical)
```

---

## Organização de Arquivos

```
public/
  sprites/
    characters/    # Spritesheets de personagens jogáveis
    npcs/          # Spritesheets de NPCs
    enemies/       # Sprites de inimigos
    bosses/        # Sprites de chefes
  tiles/
    tilesets/      # Tilesets completos
  portraits/       # Retratos de personagens
  ui/              # Elementos de interface
  backgrounds/     # Backgrounds de batalha e cutscene
  effects/         # Spritesheets de efeitos
  icons/           # Ícones de itens e status
```

---

## Checklist de Validação

Antes de integrar qualquer asset:

- [ ] Usa exclusivamente cores da paleta (STYLE_GUIDE.md)
- [ ] Contornos em #4A2875 (violeta escuro), não preto
- [ ] Dimensões corretas para o tipo
- [ ] Alinhado ao grid de pixels
- [ ] Sem anti-aliasing
- [ ] Sem blur
- [ ] PNG sem compressão lossy
- [ ] Aparência correta em 1x e 3x
- [ ] Nomenclatura seguindo padrão
- [ ] Registrado neste documento

---

## Registro de Assets Criados

### FASE 0 & FASE 1
Conceitos visuais e testes procedurais de grid.

### FASE 2 / CONCEPT REFERENCE (Model Sheets & Concepts)
> **Atenção:** Os 16 arquivos abaixo são referências visuais de conceito (`CONCEPT_REF`) geradas por IA, localizadas em `art-source/concepts/`. NÃO são assets de produção cortados em grid nem carregados em runtime.
> **Assets reais de jogo em public/assets/: 0/N** (serão gerados e validados nos lotes L3 a L7).

| ID / Nome | Caminho no Projeto | Tipo | Método | Resolução / Formato | Status |
|---|---|---|---|---|:---:|
| `char_kael` | `art-source/concepts/characters/char_kael_sheet.jpg` | Protagonista | IA (Gemini 3.1) | Sheet 32×48, 4 dir, poses, portrait | CONCEPT_REF |
| `npc_lia` | `art-source/concepts/npcs/npc_lia_sheet.jpg` | NPC (Lumen) | IA (Gemini 3.1) | Sheet 32×48, 4 dir, expressões, portrait | CONCEPT_REF |
| `npc_torvak` | `art-source/concepts/npcs/npc_torvak_sheet.jpg` | NPC (Lojista) | IA (Gemini 3.1) | Sheet 32×48, mochila volumosa, portrait | CONCEPT_REF |
| `npc_mirael` | `art-source/concepts/npcs/npc_mirael_sheet.jpg` | NPC (Mentora) | IA (Gemini 3.1) | Sheet 32×48, 4 dir, magias, portrait | CONCEPT_REF |
| `monsters_trio` | `art-source/concepts/monsters/monsters_trio_sheet.jpg` | Inimigos/Boss | IA (Gemini 3.1) | Espectro (32×32), Golem (48×48), Sombra (64×64) | CONCEPT_REF |
| `enemy_reptil` | `art-source/concepts/monsters/enemy_reptil_fossilizado.jpg` | Inimigo Comum | IA (Gemini 3.1) | Réptil Fossilizado (32×32), idle/ataque | CONCEPT_REF |
| `env_lumen` | `art-source/concepts/backgrounds/env_lumen_village.jpg` | Ambiente | IA (Gemini 3.1) | Panorama top-down 3/4 da Vila de Lumen | CONCEPT_REF |
| `env_ash_plains`| `art-source/concepts/backgrounds/env_ash_plains.jpg` | Ambiente | IA (Gemini 3.1) | Planície das Cinzas (Zona Viva -> Devastação) | CONCEPT_REF |
| `bg_battle_cave`| `art-source/concepts/backgrounds/bg_battle_echo_cave.jpg` | Background | IA (Gemini 3.1) | Batalha Gruta do Eco (384×216 px) | CONCEPT_REF |
| `tileset_lumen` | `art-source/concepts/tilesets/tileset_lumen_village.jpg` | Tileset | IA (Gemini 3.1) | Grid 16×16: pedras, telhados, pontes, solo | CONCEPT_REF |
| `tileset_cave`  | `art-source/concepts/tilesets/tileset_echo_cave.jpg` | Tileset | IA (Gemini 3.1) | Grid 16×16: caverna, cristais, altares, estalactites | CONCEPT_REF |
| `props_sheet`   | `art-source/concepts/props/props_interactive_sheet.jpg` | Props | IA (Gemini 3.1) | 16 objetos funcionais (baús, save point, postes) | CONCEPT_REF |
| `vfx_resonance` | `art-source/concepts/vfx/vfx_battle_resonance.jpg` | VFX Batalha | IA (Gemini 3.1) | 9 magias/habilidades animadas quadro a quadro | CONCEPT_REF |
| `icons_items`   | `art-source/concepts/icons/icons_items.jpg` | Ícones | IA (Gemini 3.1) | 9 ícones 16×16 (elixires, cristais, fragmentos) | CONCEPT_REF |
| `icons_equip`   | `art-source/concepts/icons/icons_equipment.jpg` | Ícones | IA (Gemini 3.1) | 6 ícones 16×16 (bastões, túnicas, pingente) | CONCEPT_REF |
| `ui_frames`     | `art-source/concepts/ui/ui_battle_and_menu_frames.jpg` | Interface | IA (Gemini 3.1) | Molduras de diálogo, menus, barras HP/MP/ATB/XP | CONCEPT_REF |
