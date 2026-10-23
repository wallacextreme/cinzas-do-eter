# CINZAS DO ÉTER — Game Design Document (Vertical Slice)

> Documento vivo: Fonte primária de decisões de design, mundo e mecânicas.

---

## 🛑 REGRA CRÍTICA: FONTE DE VERDADE 🛑

**O histórico de outras conversas, outros projetos (ex: Voxel ARPG), transcripts, memórias passadas do agente ou projetos anteriores NÃO constitui requisito ou contexto para este projeto.**

1. **Workspace é absoluto:** Somente arquivos (como GDD.md, STYLE_GUIDE.md, ARCHITECTURE.md, CONTRACTS.md) e decisões existentes neste diretório podem definir o universo, personagens, nomes, mapas, mecânicas e identidade deste JRPG.
2. **Tratar como NÃO DEFINIDO:** Quando uma informação (ex: nome de uma vila, NPC, inimigo) não estiver documentada no workspace atual, o agente deve tratá-la como **NÃO DEFINIDA** e pedir esclarecimento ou gerar um placeholder genérico explícito, **nunca** reutilizando nomes de outro projeto.
3. **Isolamento estrito:** É expressamente proibido importar conceitos, nomes, lore ou conteúdos de qualquer projeto anterior.

---

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **Nome provisório** | Cinzas do Éter |
| **Gênero** | JRPG 2D turn-based com ATB |
| **Plataforma** | PC (Navegador, futuramente Tauri/Windows) |
| **Resolução lógica** | 384×216 (16:9) |
| **Estilo visual** | Pixel art 16-bit, Decadência Luminosa |
| **Tom** | Melancólico-esperançoso, mistério crescente |
| **Duração (Vertical Slice)** | 30–45 minutos |

---

## Premissa

O Éter — a energia vital que sustenta toda a vida — está cristalizando e parando. As cidades sobrevivem ao redor de grandes Núcleos de Éter, mas esses núcleos estão apagando um a um. O mundo está lentamente morrendo.

Uma organização conhecida como a **Ordem do Sétimo Selo** acredita que a única salvação é um "reinício" completo — destruir o que resta para permitir que o mundo renasça do zero. Eles aceleram a destruição dos Núcleos como parte de um ritual.

O protagonista descobre que o Éter não está morrendo naturalmente — está sendo **drenado** para alimentar algo adormecido nas profundezas da terra. A Ordem não busca o renascimento: busca despertar essa entidade.

---

## Protagonista

### Kaël

- **Idade**: 19 anos
- **Origem**: Vila de Lumen, construída ao redor do último Núcleo estável
- **Ocupação**: Sintonizador — pessoa treinada para manter a ressonância dos Núcleos de Éter
- **Motivação**: Descobrir por que o Éter está falhando e salvar Lumen
- **Personalidade**: Curioso, determinado, inicialmente ingênuo sobre a dimensão do problema
- **Habilidade especial**: Pode perceber frequências de Éter que outros não conseguem — base do sistema de Ressonância
- **Arma**: Bastão sintonizador (vara condutora de Éter)
- **Visual**: Capa com capuz, pingente de cristal âmbar, roupas práticas de tons terrosos

---

## Personagens da Vertical Slice

### Mirael
- **Papel**: Mentora de Kaël, anciã da vila de Lumen
- **Função no jogo**: NPC que fornece contexto e missão inicial
- **Visual**: Idosa com manto violeta, cabelos brancos, cristal azul no cajado

### Torvak
- **Papel**: Mercador ambulante que visita Lumen
- **Função no jogo**: Lojista (itens e equipamentos)
- **Visual**: Baixo, robusto, carrega mochila enorme, tons de marrom e âmbar

### Lia
- **Papel**: Jovem aldeã de Lumen, amiga de infância de Kaël
- **Função no jogo**: NPC interativa que oferece perspectiva emocional sobre a crise do Éter. Representa a voz dos cidadãos comuns de Lumen — pessoas que não são sintonizadores nem comerciantes, mas que sentem diretamente os efeitos da decadência do Éter no cotidiano
- **Personalidade**: Pragmática e cautelosamente otimista. Preocupa-se com o futuro da vila mas evita o fatalismo. Fala de forma direta, com um humor seco que esconde preocupação genuína. Costuma se manter ativa — patrulhando a vila verificando se os vizinhos estão bem
- **Visual**: Jovem (~18 anos), cabelos castanhos presos em trança lateral, avental terroso sobre vestido simples em tons de âmbar escuro. Carrega uma cesta de suprimentos. Contorno violeta escuro (#4A2875) conforme STYLE_GUIDE
- **Papel na vila**: Ajuda na manutenção da vila — distribui suprimentos, verifica o estado das casas, cuida dos mais velhos. É uma das poucas pessoas que circula ativamente pela vila ao invés de ficar parada
- **Objetivo do diálogo**: Contextualiza a situação cotidiana de Lumen para o jogador. Seus diálogos revelam que os aldeões percebem que o Núcleo está mais fraco, que as colheitas estão menores, e que há um medo crescente mas não declarado. Oferece uma perspectiva humana complementar à visão mais técnica/mística de Mirael
- **Relação narrativa**: Sua presença contrasta com Mirael (que vê a crise do Éter de forma mística/anciã) e Torvak (que a vê de forma comercial/pragmática). Lia mostra o impacto humano direto. Em fases futuras, pode servir como ponto de conexão emocional e motivação adicional para a missão de Kaël

### Sombra do Selo (inimigo chefe)
- **Papel**: Agente da Ordem do Sétimo Selo enviado para destruir o Núcleo de Lumen
- **Função no jogo**: Boss final da Vertical Slice
- **Visual**: Figura encapuzada em negro e violeta, máscara com símbolo de selo partido

---

## Mundo

### Lumen (Vila)
- Centro da Vertical Slice
- Construída ao redor de um Núcleo de Éter âmbar que pulsa suavemente
- Casas de pedra com detalhes art-nouveau
- Ambiente quente, iluminado pelo Núcleo
- NPCs: Mirael, Torvak, Lia, 2–3 aldeões genéricos

### Planície das Cinzas (Área externa)
- Região entre Lumen e a Gruta do Eco
- Zona mista: partes ainda vivas (grama verde, Éter fraco), partes mortas (cinzas, pedra)
- Encontros aleatórios com inimigos
- Transição visual gradual de zona viva para zona morta

### Gruta do Eco (Dungeon)
- Caverna natural com formações de cristal de Éter apagado
- Puzzles simples de ressonância (ativar cristais na ordem correta)
- Encontros com inimigos mais fortes
- Boss no final: Sombra do Selo

---

## Sistema de Batalha

### Tipo: ATB (Active Time Battle)

- Cada ator (jogador e inimigos) possui uma barra de ATB que enche em tempo real
- Quando a barra enche, o ator pode agir
- A velocidade de enchimento depende do atributo VEL (velocidade)
- Durante seleção de comandos: ATB dos outros continua enchendo (exceto em modo "Wait" opcional)

### Comandos

| Comando | Descrição |
|---------|-----------|
| **Atacar** | Ataque físico básico com arma equipada |
| **Ressonância** | Habilidades mágicas baseadas em frequências de Éter |
| **Item** | Usar item do inventário |
| **Defender** | Reduz dano recebido em 50% até o próximo turno |
| **Fugir** | Tentativa de fuga (chance baseada em VEL vs inimigos) |

### Ressonância (Sistema de Magia)

O jogador combina frequências de Éter para criar efeitos. Na Vertical Slice:

| Ressonância | Efeito | Custo MP |
|-------------|--------|----------|
| **Pulso** | Dano de impacto em um alvo | 4 |
| **Harmonia** | Cura HP do usuário | 6 |
| **Dissonância** | Dano em todos os inimigos (menor que Pulso) | 8 |
| **Barreira** | Aumenta DEF por 3 turnos | 5 |

### Cálculo de Dano

```
dano_fisico = (ATK * 2 - DEF) * variação(0.9, 1.1)
dano_magico = (MAG * 2 - RES) * variação(0.9, 1.1)
cura = MAG * 1.5 * variação(0.95, 1.05)
```

Mínimo de dano: 1 (nunca 0, nunca negativo, nunca NaN)

---

## Atributos

| Atributo | Sigla | Descrição | Kaël (Nível 1) |
|----------|-------|-----------|----------------|
| Pontos de Vida | HP | Vida do personagem | 150 / 150 |
| Pontos de Magia | MP | Recurso para Ressonância | 45 / 45 |
| Ataque | ATK | Dano físico | 12 |
| Defesa | DEF | Redução de dano físico | 10 |
| Magia | MAG | Poder de Ressonância e cura | 8 |
| Resistência | RES | Redução de dano mágico | 9 |
| Velocidade | VEL | Velocidade de enchimento do ATB | 11 |
| Sorte | SOR | Chance de crítico, fuga, drops | 5 |

---

## Progressão

### Level Up
- XP ganho ao derrotar inimigos
- Level up aumenta todos os atributos segundo uma tabela fixa
- Level máximo na Vertical Slice: 10 (expansível até 99 no motor)
- Fórmula XP: `xp_necessario = nivel * nivel * 20`
- Ao subir de nível, HP e MP são totalmente restaurados aos novos valores máximos
- Emite o evento contratual `player:levelUp` com `{ newLevel, stats }`

### Tabela Fixa de Crescimento por Nível (Kaël)

| Atributo | Ganho por Nível | Efeito ao Subir |
|----------|-----------------|-----------------|
| **Max HP** | +25 | Restaura HP atual ao novo máximo |
| **Max MP** | +8 | Restaura MP atual ao novo máximo |
| **ATK** | +2 | Dano físico base aumentado |
| **DEF** | +2 | Redução de dano físico aumentada |
| **MAG** | +2 | Poder mágico e cura aumentados |
| **RES** | +2 | Redução de dano mágico aumentada |
| **VEL** | +1 | Frequência de turnos acelerada |
| **SOR** | +1 | Sorte e chances de crítico aumentadas |

### Equipamentos (Vertical Slice)

| ID | Nome | Slot | Bônus | Observações |
|----|------|------|-------|-------------|
| `apprentice_staff` | Bastão de Aprendiz | weapon | ATK +3 | Arma inicial básica de canalização |
| `tuned_staff` | Bastão Sintonizado | weapon | ATK +5, MAG +2 | **Equipamento inicial de Kaël** (já equipado) |
| `traveler_tunic` | Túnica de Viajante | armor | DEF +3 | Vestimenta resistente de tecido leve |
| `ether_cuirass` | Couraça de Éter | armor | DEF +5, RES +3 | Armadura reforçada com resíduo de Éter |
| `amber_pendant` | Pingente de Âmbar | accessory | RES +2, SOR +2 | Tesouro do baú da Gruta do Eco (R7) |
| `crystal_ring` | Anel de Cristal | accessory | MAG +3, VEL +1 | Adorno refinado de cristal lapidado |

**Regras de Equipamento:**
- 3 slots canônicos: `weapon`, `armor`, `accessory`.
- Bônus de equipamento são estritamente derivados (`EffectiveStats = BaseStats + Σ(Bônus)`).
- Os atributos base de Kaël (`PlayerState.stats`) **nunca** são mutados por equipamentos.
- Equipar um item o remove do inventário; desequipar o retorna ao inventário de forma atômica.
- Kaël inicia o jogo com o `tuned_staff` equipado em sua arma (não duplica no inventário).

### Menu de Status (Vertical Slice)

- Acessível durante a exploração através da tecla `[M]` ou `[ESC]`.
- Congela a movimentação de Kaël e transiciona a fase de jogo para `MENU`.
- Apresentação em modal 16-bit com dimensões de 360×190 px sob a paleta Decadência Luminosa (`#1A0F2E`, borda `#6B3FA0`, cantos cristalinos `#7DE8F0`).
- Exibe:
  - Identidade: Nome ("Kaël"), Título ("Adepto do Éter") e Nível.
  - Recursos Vitais: HP e MP com valores atuais e máximos efetivos, e barras coloridas; XP atual e necessário com barra âmbar.
  - Atributos Efetivos: ATK, DEF, MAG, RES, VEL, SOR calculados estritamente pelo `EquipmentManager.calculateEffectiveStats()`. Bônus derivados são exibidos em destaque ao lado dos valores base (ex: `ATK  17  (+5)`).
  - Equipamentos Equipados: Lista interativa com os 3 slots (`Arma`, `Armadura`, `Acessório`), cursor pulsante navegável via setas e painel descritivo com lore e bônus da peça selecionada.
- Fechamento via `[X]` ou `[ESC]`, restaurando imediatamente a exploração e o movimento de Kaël sem teclas presas.

---

## Inventário (Vertical Slice)

| Item | Efeito | Preço |
|------|--------|-------|
| Elixir Âmbar | Restaura 50 HP | 30 |
| Gota de Éter | Restaura 20 MP | 50 |
| Antídoto | Cura veneno | 20 |
| Cristal de Fuga | Fuga garantida | 80 |

Moeda: **Fragmentos** (fragmentos cristalizados de Éter)

---

## Inimigos (Vertical Slice)

### Espectro de Cinzas
- Tipo: Fantasma/Éter corrompido
- HP: 30 | ATK: 8 | DEF: 3 | VEL: 5
- Ataque: Toque gélido (dano mágico leve)
- Fraqueza: Ressonância (Pulso)
- Local: Planície das Cinzas

### Golem de Cristal
- Tipo: Construto mineral
- HP: 60 | ATK: 12 | DEF: 10 | VEL: 2
- Ataque: Impacto pesado (dano físico alto, lento)
- Fraqueza: Ataques físicos (DEF alta mas HP moderado)
- Local: Gruta do Eco

### Réptil Fossilizado
- Tipo: Criatura petrificada reanimada
- HP: 40 | ATK: 10 | DEF: 6 | VEL: 7
- Ataque: Mordida venenosa (dano + chance de veneno)
- Fraqueza: Defesa baixa contra magia
- Local: Planície das Cinzas, Gruta do Eco

---

## Boss: Sombra do Selo

### Fase 1 — "O Selo Intacto"
- HP: 200 | ATK: 15 | DEF: 8 | MAG: 12 | VEL: 6
- Ataques: Golpe Selado (físico), Marca do Vazio (mágico, single)
- Comportamento: Alterna entre físico e mágico a cada turno

### Fase 2 — "O Selo Quebrado" (ativa abaixo de 50% HP)
- Mudança visual: máscara se parte, aura violeta intensa
- ATK +5, MAG +5, VEL +3
- Novo ataque: Fragmentação (dano mágico em área)
- Comportamento: Mais agressivo, prioriza ataques em área
- A cada 3 turnos: usa "Dreno de Éter" (rouba MP do jogador)

### Condição de Vitória
- Reduzir HP a 0
- Cutscene de vitória: Sombra se dissolve, cristal na Gruta brilha

### Condição de Derrota
- HP de Kaël chega a 0
- Tela de Game Over com opção de continuar do último save

---

## Economia

- Kaël começa com: 100 Fragmentos
- Inimigos dropam: 5–20 Fragmentos
- Boss dropa: 100 Fragmentos + item raro
- Preços calibrados para que o jogador possa comprar 3–5 itens antes da dungeon

---

## Fluxo da Vertical Slice

```
ABERTURA (texto/cutscene simples)
    ↓
LUMEN (Vila)
  → Falar com Mirael (recebe missão)
  → Explorar vila
  → Comprar na loja do Torvak
    ↓
PLANÍCIE DAS CINZAS
  → Encontros aleatórios (2–4 batalhas)
  → Transição visual vida → morte
    ↓
GRUTA DO ECO
  → Puzzle de ressonância (1–2 puzzles simples)
  → Encontros (3–5 batalhas)
  → Encontrar equipamento no baú
    ↓
BOSS: Sombra do Selo (2 fases)
    ↓
VITÓRIA → Cutscene → Retorno a Lumen
    ↓
FIM DA VERTICAL SLICE
```

---

## Objetivos da Vertical Slice

1. Provar que o game loop funciona: boot → exploração → batalha → progressão → boss
2. Demonstrar a identidade visual "Decadência Luminosa"
3. Validar o sistema ATB com Ressonância
4. Confirmar que save/load funciona
5. Garantir que a arquitetura suporta expansão futura
6. Mostrar qualidade "indie 16-bit bem acabado", não protótipo
