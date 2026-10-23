# CINZAS DO ÉTER — Progresso

> Atualizado em: FASE 2 (pré-implementação)

| Sistema | Status | Testes | Crítico | Última alteração |
|---------|--------|--------|---------|------------------|
| Projeto/Config | APPROVED | 39/39 PASS | Testes passam, Vite funciona | FASE 0 |
| Documentação | APPROVED | N/A | Documentos completos | FASE 0 |
| EventBus | APPROVED | 9/9 PASS | Testes unitários passam | FASE 0 |
| Math Utils | APPROVED | 21/21 PASS | Testes unitários passam | FASE 0 |
| Constants | APPROVED | 9/9 PASS | Validação de paleta/dimensões | FASE 0 |
| BootScene | APPROVED | Verificação visual no navegador | Boot funcional confirmado | FASE 0 |
| Game Loop | APPROVED | PASS (Visual) | Cenas Boot -> Preload -> Game | FASE 1 |
| Input | APPROVED | 16/16 PASS | Ação INVENTORY adicionada, verificação visual | FASE 3 |
| Câmera | APPROVED | PASS (Visual) | Câmera segue jogador | FASE 1 |
| Colisão | APPROVED | PASS (Visual) | Jogador colide com parede gerada | FASE 1 |
| Estado Global | APPROVED | 5/5 PASS | Transições validadas no ErrorHandler/State | FASE 1 |
| Exploração | APPROVED | 85/85 PASS | U1 a U10 validadas: Vila, Planície e Masmorra | FASE 2 |
| Vila (Lumen) | APPROVED | PASS (Visual) | Mapa, tileset, colisões testadas | FASE 2 |
| Área Externa | APPROVED | 17/17 PASS | Planície das Cinzas ↔ Entrada Gruta, playtest real | FASE 2 (U7) |
| Interação | APPROVED | 3/3 PASS | Prompt e detecção de proximidade validados | FASE 2 |
| NPCs | APPROVED | PASS (Visual) | Lia ✅, Torvak ✅, Mirael ⏳ | FASE 2 |
| Diálogo | APPROVED | 11/11 PASS | Typewriter, paginação, input seguro, estado DIALOGUE | FASE 2 |
| Loja | APPROVED | 42/42 PASS | Torvak shop, compras, feedback, playtest real PASS | FASE 2 (U6) |
| Dungeon | APPROVED | 50/50 PASS | 8 salas (R1-R7), bifurcações, puzzles, baú, altar | FASE 2 (U8-U10) |
| Personagem | IN_PROGRESS | 130/130 PASS | F3-U01 a F3-U09 auditados e APROVADOS (331 testes globais) | FASE 3 |
| Movimento | APPROVED | PASS (Visual) | Walk cycle (8 fps) e idle direcionado (F3-U02) | FASE 3 |
| Atributos | APPROVED | 29/29 PASS | HP/MP, ATK, DEF, MAG, RES, VEL, SOR, dano, cura, MP (F3-U03/U06) | FASE 3 |
| Batalha/ATB | NOT_STARTED | — | — | — |
| Comandos | NOT_STARTED | — | — | — |
| Magia/Ressonância | NOT_STARTED | — | — | — |
| Inimigos | NOT_STARTED | — | — | — |
| Boss | NOT_STARTED | — | — | — |
| Progressão/XP | APPROVED | 19/19 PASS | Fórmula `level * level * 20`, multi-level up, crescimento (F3-U04/U05) | FASE 3 |
| Equipamento | APPROVED | 53/53 PASS | 3 slots canônicos, 6 itens, stats derivados, tuned_staff inicial (F3-U07) | FASE 3 (U07) |
| Inventário | APPROVED | 43/43 PASS | Inventário completo de Kaël (F3-U09), consumíveis atômicos, rollback, UI 360x190 | FASE 3 (U09) |
| Narrativa | NOT_STARTED | — | — | — |
| Arte/Sprites | IN_PROGRESS | 5/5 assets reais de Kaël APPROVED | Kaël completo em campo, batalha, retratos e ícone (L3); aguardando Decisão D2 | L3 |
| Áudio | NOT_STARTED | — | — | — |
| Save/Load | APPROVED | 5/5 PASS | Operações básicas em localStorage | FASE 1 |
| UI | APPROVED | 25/25 PASS | StatusBox, DialogueBox, ShopBox e Prompt validados (F3-U08) | FASE 3 (U08) |
| Integração | APPROVED | 1/1 PASS | Pipeline core simulado e testado | FASE 1 |

---

## FASE 3 — Auditoria Oficial das Unidades Implementadas (F3-U01 a F3-U09)

| Unidade | Descrição | Status Auditoria | Evidência / Validação |
|---------|-----------|------------------|------------------------|
| **F3-U01** | Sprite Direcional | **APPROVED** | 4 direções (32×48), 12 frames procedurais, paleta com contorno `#4A2875`, playtest no navegador OK |
| **F3-U02** | Idle / Walk | **APPROVED** | 8 animações Phaser (4 walk a 8 fps + 4 idle), direção preservada ao parar e em diálogos, sem jitter, playtest OK |
| **F3-U03** | Atributos | **APPROVED** | ATK 12, DEF 10, MAG 8, RES 9, VEL 11, SOR 5; bounds [1, 999], clamp seguro, NaN validation em todos os stats |
| **F3-U04** | XP | **APPROVED** | `level * level * 20`, acúmulo seguro, sanitização contra NaN, valores negativos ignorados, consistência após subida |
| **F3-U05** | Level Up | **APPROVED** | +25 Max HP, +8 Max MP, +2 ATK/DEF/MAG/RES, +1 VEL/SOR; restauração total, evento `player:levelUp`, tabela documentada no GDD/CONTRACTS |
| **F3-U06** | HP / MP / Dano / Cura | **APPROVED** | `damagePlayer`, `healPlayer`, `restoreMp` retornam valor aplicado e clampam; `consumeMp` atômico; 0/negativos/NaN sanitizados |
| **F3-U07** | Sistema de Equipamento | **APPROVED** | 3 slots canônicos (weapon, armor, accessory); 6 itens definidos; tuned_staff inicial equipado; EffectiveStats derivado (base imutável); transações atômicas com inventário; clamping de HP/MP; evento `equipment:changed`; 53 novos testes; playtest real no navegador OK |
| **F3-U08** | Menu de Status | **APPROVED** | ViewModel pura desacoplada de Phaser; consumo estrito de `calculateEffectiveStats`; layout 360×190 Decadência Luminosa; barras de HP/MP/XP; stats com bônus destacados; navegação entre slots; proteção de input e double-trigger (ESC/M); 25 novos testes (308 total); playtest real no navegador OK |
| **F3-U09** | Inventário Completo de Kaël | **APPROVED** | ItemUseManager puro (sem Phaser); atomicidade com rollback; Elixir Âmbar (+50 HP), Gota de Éter (+20 MP); rejeição de Antídoto/Cristal na exploração; InventoryBox 360×190 Decadência Luminosa com scrolling e cursor cíclico; integração Loja Torvak ↔ Inventário ↔ Equipamentos; tecla I e botões debug; 23 novos testes (331 total); playtest real no navegador OK |

## Legenda

| Status | Significado |
|--------|------------|
| NOT_STARTED | Ainda não iniciado |
| IN_PROGRESS | Em desenvolvimento |
| IN_REVIEW | Aguardando revisão/testes |
| APPROVED | Aprovado com evidência |
| BLOCKED | Bloqueado — ver BLOCKERS.md |
