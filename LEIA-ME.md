# KIT GRÁFICOS 10/10 — Cinzas do Éter · versão 2.0.1

> **Atalho:** cole o **PROMPT DE ATIVAÇÃO** (entregue no chat, fora do zip) numa conversa nova do Antigravity com o zip já na raiz do projeto. Ele faz commit → extração → commit de trava → sanidade → assume o Prompt Mestre → executa só o L0. As seções abaixo descrevem o mesmo caminho em modo manual.

## O que este kit resolve (diagnóstico em 5 linhas)
1. O jogo hoje desenha **tudo com retângulos** (`PreloadScene` com `fillRect`; nenhum `this.load.*`).
2. Os 16 JPGs "APPROVED" (11 MB) **não são usados pelo jogo** e **violam o STYLE_GUIDE** (JPG, ≤ 0,006% dos pixels na paleta, rótulos de texto embutidos, sem grid). São ótimos como **conceito**, inúteis como **asset**.
3. O QA antigo era funcional e não tinha como detectar isso (a parte visual era "comparação manual").
4. O alvo (qualidade de um remaster 16-bit / HD-2D) exige um **pipeline**: IA gera conceito → script impõe pixel/paleta → validador prova → agente integra → crítico audita com screenshots.
5. A batalha (ATB/magias/inimigos) ainda não existe no código; por isso o prompt faz só a **camada de apresentação** (sem lógica), pronta para a Fase 4 plugar.

## Conteúdo (extraia na RAIZ do projeto)
```
PROMPT_MESTRE_ANTIGRAVITY.md      ← o prompt para colar no Antigravity (principal)
QA.md                             ← QA v2.0 (substitui o antigo; o texto original está dentro: §2 e §12)
LEIA-ME.md                        ← este arquivo
art/
  art-rules.json                  ← limiares/orçamentos por tipo de asset (TRAVADO)
  palette.json                    ← paleta v1 (24 cores, gerada do seu constants.ts); só estende após D1
  assets.manifest.json            ← manifesto (começa vazio, modo transição)
  KIT_PROMPTS_IMAGEM.md           ← prompts de geração de imagem preenchidos com o seu GDD
tools/qa/
  validate-assets.mjs             ← validador automático de arte (zero dependências)
  validate-assets.d.mts           ← tipos para o tsc
tests/art/
  AssetPipeline.test.ts           ← liga o validador ao `bun run test`
```

## Instalação
```bash
git add -A && git commit -m "chore: antes do kit de QA 10/10"
# extraia o zip na raiz do projeto, depois:
git add -A && git commit -m "chore(qa): QA v2.0 + validador de arte (QA_LOCK)"
```
Opcional agora (o agente faz no L1): scripts no `package.json`
```json
"qa:art": "node tools/qa/validate-assets.mjs",
"qa:art:strict": "node tools/qa/validate-assets.mjs --strict --dist",
"qa:art:selftest": "node tools/qa/validate-assets.mjs --self-test"
```

## O que esperar logo após instalar
| Comando | Resultado esperado hoje |
|---|---|
| `bun run test` | verde (**36 arquivos / 335 testes**: os 332 de antes + 3 novos) |
| `node tools/qa/validate-assets.mjs --self-test` | `20/20 casos OK` |
| `node tools/qa/validate-assets.mjs` | modo **transição**: 0 erros, 17 avisos (JPGs) |
| `node tools/qa/validate-assets.mjs --strict --dist` | **REPROVADO: 34 erros** — é o QA novo dizendo a verdade sobre a arte "aprovada" |

## Fluxo
`L0` auditoria → `L1` fundação técnica → `L2` direção de arte v2 (**você aprova D1**) → `L3` Kaël (**você aprova D2**) → `L4` mundo → `L5` UI/ícones/fonte → `L6` mapa-múndi (**D3**) → `L7` batalha (apresentação) → `L8` polimento + auditoria final (**"APROVO 10/10"**).
Um lote por vez. A cada fim de lote, um **agente separado (CRÍTICO)** audita (prompt em `QA.md` §7).

## Limites honestos
- **IA de imagem não garante consistência quadro a quadro.** O pipeline reduz o problema (quadro-mestre, referência, pós-processamento, validador), mas o ciclo de Kaël (L3) tende a exigir iterações. É por isso que existe a decisão **D2** antes de replicar para o resto. Se o resultado não chegar ao nível, o validador aceita arte de **qualquer origem** (pixel artist, pack licenciado, ferramenta especializada): troque só a fonte dos PNGs.
- O validador comprova **forma** (formato, grid, paleta, contorno, estabilidade de animação, rastreabilidade). **Beleza** continua dependendo do olhar do CRÍTICO e do **seu** — por isso o 10/10 final exige a sua aprovação explícita.
- O prompt foi desenhado para o fluxo do Antigravity (Planning, browser, terminal), mas **não pude testá-lo rodando dentro do seu Antigravity**. Teste o L0 primeiro (não altera código).

## O que foi verificado antes de entregar
- Validador: 20/20 casos no `--self-test`; 4/4 sabotagens deliberadas detectadas (mutation test); decodificador PNG idêntico ao Pillow em 9 formatos; 10/10 cenários de nível de projeto (rastreabilidade, órfãos, manifesto).
- Instalado numa **cópia do seu projeto**: `tsc` 0 erros e suíte completa verde (332 → 335 testes).
- Documentos: 50 itens de rubrica (5 × 10 categorias), 33 cenários visuais, 12 portões — referências cruzadas conferidas por script; QA original preservado linha a linha.
