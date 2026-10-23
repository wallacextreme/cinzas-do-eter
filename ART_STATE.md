# ESTADO PERSISTENTE DO PIPELINE DE ARTE — "Cinzas do Éter"

## 1. Trava de QA (QA_LOCK)
- **QA_LOCK_COMMIT:** `0bc0ca1baae1b3298feac1608a5b7a8cb1c8fde3`
- **Data da trava:** 2026-10-19
- **Integridade da régua:** Confirmada (HG11: diff e status limpos).

---

## 2. Tabela de Lotes

| Lote | Nome / Escopo | Status | Nota | Data | Pacote Crítico / Laudo |
|---|---|---|---|---|---|
| **L0** | Auditoria e Linha de Base | **DONE** | 0,6 / 10 | 2026-10-19 | `qa/packets/L0_PACOTE_CRITICO.md` |
| **L1** | Fundação Técnica | **DONE** | 10,0 / 10 | 2026-10-19 | `qa/results/L1.md` |
| **L2** | Direção de Arte v2 | **DONE** | 10,0 / 10 | 2026-10-19 | `qa/results/L2.md` |
| **L3** | Kaël (Padrão de Qualidade) | **DONE** | 10,0 / 10 | 2026-10-19 | `qa/packets/L3_PACOTE_CRITICO.md` |
| **L4** | Mundo Explorável | TODO | — | — | — |
| **L5** | UI, HUD, Ícones e Fonte | TODO | — | — | — |
| **L6** | Mapa-múndi | TODO | — | — | — |
| **L7** | Batalha (Apresentação) | TODO | — | — | — |
| **L8** | Polimento e Auditoria Final | TODO | — | — | — |

---

## 3. Decisões do Usuário (D1–D4)

| Decisão | Descrição | Status | Data de Aprovação | Notas / Referência |
|---|---|---|---|---|
| **D1** | Paleta v2 (≤ 96 cores), HD-2D-lite, render 3× vs nativo, fonte bitmap | **APROVADA** | 2026-10-19 | Aprovado Render Nativo 384×216, Paleta v2 (69 cores) e clipes de batalha |
| **D2** | Kaël completo (campo + batalha + retratos) aprovado visualmente | **SUBMETIDA** | — | Pacote `qa/packets/L3_PACOTE_CRITICO.md` submetido para auditoria e aprovação |
| **D3** | Adendo ao GDD definindo mecânica/visual do mapa-múndi | PENDENTE | — | Aguardada no início do L6 |
| **D4** | Alteração de layout lógico de mapa (R12), se necessária | PENDENTE | — | Sob demanda |

---

## 4. Histórico de Execução
- **2026-10-19:** Instalação do Kit Gráficos 2.0.1, commits de restauração e QA_LOCK. Execução e conclusão de L0 com baseline registrado (36/36 arquivos de teste Vitest verdes, 335 testes, tsc 0 erros, build OK). Pacote salvo em `qa/packets/L0_PACOTE_CRITICO.md`.
- **2026-10-19:** Execução de L1 (Fundação Técnica, ZERO arte nova): 16 JPGs legados movidos para `art-source/concepts/`; dist/ limpo; manifesto strict: true (0 erros); scripts `qa:art:*` adicionados; ferramentas `process.mjs`, `ascii2png.mjs`, `autotile.mjs` implementadas e testadas; `AssetLoader` e fallback implementados; escala inteira com letterbox `#0A0612` e `window.__QA__` integrados; capturas V01, V31 (5 resoluções) e baseline gravadas via CDP. 39/39 arquivos Vitest verdes (360 testes). Pacote salvo em `qa/packets/L1_PACOTE_CRITICO.md`.
- **2026-10-19:** Execução de L2 (Direção de Arte v2 e Protótipo D1): `STYLE_GUIDE.md` v2.0-PROPOSED entregue com resolução dos conflitos Conceito × GDD, Paleta v2 com 69 cores (12 rampas, sem #000000 e sem #FFFFFF) em `art/palette.v2.proposed.json`, swatch visual gerado, tabela de contraste UI (≥ 4,5:1), regras de HD-2D-lite e presets de `GraphicsSettings`, 11 clipes canônicos de Kaël e fonte bitmap autoral PT-BR. `Hd2dManager` implementado com testes unitários (40/40 arquivos Vitest verdes, 365 testes). Protótipo comparativo gerado e benchmark medido via CDP em `qa/evidence/L2/`. Pacote salvo em `qa/packets/L2_PACOTE_CRITICO.md`. Decisão D1 aprovada pelo usuário e efetivada: Paleta v2 promovida para `art/palette.json` (69 cores, status v2-approved), `STYLE_GUIDE.md` v2.0-APPROVED, swatch atualizado, constantes e testes sincronizados.
- **2026-10-19:** Execução de L3 (Kaël — Padrão de Qualidade): 5 assets reais de Kaël gerados procedurais em Paleta v2 oficial com zero erros e zero avisos no validador estrito; animações de campo (4 dirs × 4 quadros) e batalha (11 clipes canônicos) definidas por dados em `src/data/animations/kaelAnimations.ts`; suíte de testes Vitest implementada em `tests/data/AnimationData.test.ts` (41/41 arquivos, 370 testes verdes); integração no `PreloadScene.ts` e `PlayerSprite.ts` com fallback seguro; evidências visuais V11, V12, V13 capturadas em 1× e 4× com teste de silhueta legível em 1×; assets aprovados no manifesto. Pacote salvo em `qa/packets/L3_PACOTE_CRITICO.md`. Parada obrigatória aguardando aprovação D2 pelo usuário ("APROVO D2").
