# CINZAS DO ÉTER — TODO

> Atualizado em: FASE 2 (pré-implementação)

---

## FASE 0 — Fundação ✅

| ID | Tarefa | Prioridade | Deps | Status | Critérios |
|----|--------|-----------|------|--------|-----------|
| F0-01 | Inicializar projeto Vite+TS+Phaser | CRÍTICA | — | ✅ DONE | Build funciona, Phaser importa |
| F0-02 | Criar estrutura de diretórios | CRÍTICA | F0-01 | ✅ DONE | Todas as pastas existem |
| F0-03 | Criar GDD.md | CRÍTICA | — | ✅ DONE | Documento completo |
| F0-04 | Criar STYLE_GUIDE.md | CRÍTICA | — | ✅ DONE | Paleta, proporções, regras |
| F0-05 | Criar ARCHITECTURE.md | CRÍTICA | F0-02 | ✅ DONE | Estrutura documentada |
| F0-06 | Criar CONTRACTS.md | CRÍTICA | — | ✅ DONE | Todas interfaces definidas |
| F0-07 | Criar pipelines (ART, AUDIO) | ALTA | F0-04 | ✅ DONE | Processos documentados |
| F0-08 | Criar sistema de testes | CRÍTICA | F0-01 | ✅ DONE | Vitest roda, 39 testes passam |
| F0-09 | Inicializar Git | ALTA | F0-01 | ✅ DONE | Repo inicializado |
| F0-10 | Primeiro commit | ALTA | Todos | ✅ DONE | Commit da fundação |

---

## FASE 1 — Core ✅

| ID | Tarefa | Prioridade | Deps | Status | Critérios |
|----|--------|-----------|------|--------|-----------|
| F1-01 | Game loop funcional | CRÍTICA | F0 | ✅ DONE | 60fps, delta time correto |
| F1-02 | Sistema de input | CRÍTICA | F1-01 | ✅ DONE | Teclado WASD/Arrows, rebindable |
| F1-03 | Sistema de cenas | CRÍTICA | F1-01 | ✅ DONE | Transição boot→preload→game |
| F1-04 | Sistema de câmera | ALTA | F1-01 | ✅ DONE | Segue jogador, limites de mapa |
| F1-05 | Colisão básica | ALTA | F1-01 | ✅ DONE | Tilemap collision |
| F1-06 | State manager | ALTA | F1-01 | ✅ DONE | Estado centralizado, tipado |
| F1-07 | Save foundation | ALTA | F1-01 | ✅ DONE | Save/load com versionamento |
| F1-08 | Error handler | MÉDIA | F1-01 | ✅ DONE | Captura global de erros |
| F1-09 | Player entity + sprite | CRÍTICA | F1-02 | ✅ DONE | Lógica e visual separados |
| F1-10 | Integração core | ALTA | Todos | ✅ DONE | Pipeline core simulada e testada |

**Auditoria final: 82/82 testes passando. APROVADA.**

---

## FASE 2 — Exploração Básica ✅

| ID | Tarefa | Prioridade | Deps | Status | Critérios |
|----|--------|-----------|------|--------|-----------|
| F2-U01 | Sistema de mapas e transições | CRÍTICA | F1 | ✅ DONE | MapManager extensível, fade entre mapas, spawn points, regressão 82 testes |
| F2-U02 | Mapa da vila de Lumen | CRÍTICA | F2-U01 | ✅ DONE | Layout reconhecível, colisão, paleta âmbar/terra, camera follow |
| F2-U03 | Sistema de interação | CRÍTICA | F2-U02 | ✅ DONE | Detecção por proximidade+facing, prompt visual, consumo único de input |
| F2-U04 | Sistema de diálogo | CRÍTICA | F2-U03 | ✅ DONE | Abrir/avançar/fechar, typewriter, bloqueia movimento, restaura input, sem teclas presas |
| F2-U05 | NPCs (Mirael, Torvak, Lia) | ALTA | F2-U04 | ✅ DONE | Lia ✅, Torvak ✅, Mirael ⏳ (preservada para fase posterior) |
| F2-U06 | Loja do Torvak | ALTA | F2-U05 | ✅ DONE | Listar→selecionar→verificar Fragmentos→comprar→feedback→múltiplas compras→sair, 42 novos testes (144 total) |
| F2-U07 | Área externa (Planície das Cinzas) | ALTA | F2-U01 | ✅ DONE | Planície navegável (32x40), transições bidirecionais Vila ↔ Planície ↔ Gruta do Eco, persistência de saldo/inventário, 17 novos testes (161 total) |
| F2-U08 | Dungeon (Gruta do Eco) | ALTA | F2-U07 | ✅ DONE | 8 salas como mapas separados (R1 a R7 + Antecâmara), bifurcações, infraestrutura MapManager |
| F2-U09 | Puzzle ambiental | ALTA | F2-U08, F2-U04 | ✅ DONE | Cristais de ressonância (Âmbar/Violeta/Celeste), estele com enigma, ponte de éter |
| F2-U10 | Integração e regressão final | CRÍTICA | Todos F2 | ✅ DONE | Fluxo completo R1->R7, baú de tesouro R7, altar narrativo R6, 211 testes passando |

**Auditoria final da Fase 2: 211/211 testes passando (100% verde). APROVADA.**

---

## FASE 3 — Personagem & Progressão (EM ANDAMENTO)

| ID | Tarefa | Prioridade | Deps | Status | Critérios |
|----|--------|-----------|------|--------|-----------|
| F3-U01 | Sprite direcional | CRÍTICA | F2 | ✅ DONE | 4 direções (Sul, Norte, Leste, Oeste), 12 frames procedurais de Kaël |
| F3-U02 | Idle/Walk | CRÍTICA | F3-U01 | ✅ DONE | Walk cycle (8 fps), idle direcionado, congelamento suave em diálogos |
| F3-U03 | Atributos | ALTA | F1-06 | ✅ DONE | Invariantes de HP, MP, ATK, DEF, MAG, RES, VEL, SOR |
| F3-U04 | XP | ALTA | F3-U03 | ✅ DONE | Fórmula canônica `level * level * 20`, acúmulo de XP seguro |
| F3-U05 | Level Up | ALTA | F3-U04 | ✅ DONE | Progressão de nível, crescimento de stats, evento `player:levelUp` no EventBus |
| F3-U06 | HP/MP/Dano/Cura | ALTA | F3-U03 | ✅ DONE | Funções atômicas `damagePlayer`, `healPlayer`, `consumeMp`, `restoreMp` |
| F3-U07 | Equipamento | ALTA | F3-U03 | ✅ DONE | 3 slots canônicos, 6 itens, transações atômicas, stats derivados, 53 novos testes (283 total) |
| F3-U08 | Menu de Status | MÉDIA | F3-U05, F3-U07 | ✅ DONE | ViewModel pura, stats efetivos derivados, layout 360×190, 25 novos testes (308 total) |
| F3-U09 | Inventário completo | ALTA | F3-U06 | ✅ DONE | ItemUseManager puro, transações atômicas com rollback, InventoryBox 360×190, 23 novos testes (331 total) |
| F3-U10 | Integração e Regressão | CRÍTICA | Todos F3 | NOT_STARTED | Playthrough com combate básico, progressão e validação geral de 0 erros |

**Status da Fase 3: EM ANDAMENTO (F3-U01 a F3-U09 auditados e APROVADOS | 331/331 testes passando).**

---

## FASE 4–11 — (A ser detalhado quando FASE 3 for concluída)

Tarefas das fases 4–11 serão detalhadas conforme o projeto avança, para evitar planejamento prematuro.
