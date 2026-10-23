# CINZAS DO ÉTER — Contratos entre Sistemas

> Versão: 0.1.0 | Status: FASE 0 — Fundação

**Este arquivo é a constituição técnica do projeto.**
Nenhum executor pode quebrar um contrato existente sem atualizar este documento E executar os testes afetados.

---

## Regras Universais

1. **HP nunca pode gerar NaN** — usar `safeAdd`/`safeSub` de `@utils/math.ts`
2. **MP nunca pode gerar NaN** — idem
3. **XP nunca pode gerar NaN** — idem
4. **ATB nunca pode ultrapassar seu limite lógico** — clampar em [0, MAX_ATB]
5. **Quantidades nunca podem ficar negativas sem regra explícita** — usar `safeSub(a, b, true)`
6. **IDs devem ser estáveis** — nunca reutilizar, nunca mudar após criação
7. **Dados salvos devem possuir versão** — campo `version` obrigatório
8. **Mudanças de schema devem possuir migração** — função de migração por versão
9. **Erros de save devem ser tratados** — catch com fallback, nunca silenciar
10. **Estados inválidos devem ser detectados** — validação na criação e no load

---

## GAME_STATE

```typescript
type GamePhase = 
  | 'BOOT' 
  | 'LOADING' 
  | 'EXPLORING' 
  | 'DIALOGUE'
  | 'MENU' 
  | 'PAUSED'
  | 'BATTLE';
```

### Transições Válidas
- `BOOT` → `LOADING`
- `LOADING` → `EXPLORING`
- `EXPLORING` → `MENU`, `PAUSED`, `BATTLE`, `LOADING`, `DIALOGUE`
- `DIALOGUE` → `EXPLORING`
- `MENU` → `EXPLORING`
- `PAUSED` → `EXPLORING`
- `BATTLE` → `EXPLORING`

### Invariantes de DIALOGUE
- Durante a fase `DIALOGUE`, a movimentação física do jogador (`PlayerSprite`) é bloqueada e sua velocidade é zerada (`0, 0`).
- Apenas a UI de diálogo processa ações de input (`CONFIRM` para avanço e revelação de texto).
- A transição para `DIALOGUE` consome a ação `CONFIRM` de abertura, impedindo salto da primeira mensagem.
- Ao encerrar a conversa, o sistema deve transicionar obrigatoriamente de volta para `EXPLORING`, restaurando a movimentação do jogador.
- Não é permitida transição direta de `DIALOGUE` para `BATTLE`, `MENU` ou `PAUSED` sem retornar previamente para `EXPLORING`.

### Invariantes de MENU
- Durante a fase `MENU`, a movimentação física do jogador (`PlayerSprite`) é bloqueada e sua velocidade é zerada (`0, 0`).
- Apenas a interface de menu ativa consome inputs de navegação (`MOVE_UP`, `MOVE_DOWN`), seleção ou fechamento (`CANCEL`, `MENU`).
- A abertura do menu consome a ação `MENU` e ativa guarda contra double-trigger imediato (`justOpened`), garantindo que teclas como `Escape` não causem fechamento no mesmo frame.
- O fechamento consome as ações `CANCEL` e `MENU` e transiciona obrigatoriamente de volta para `EXPLORING`, restaurando o controle de movimentação do jogador.
- Não é permitida a abertura de `MENU` se o jogo estiver em `DIALOGUE`, `LOADING` ou transição de mapa.

---

## PLAYER

```typescript
interface PlayerState {
  id: string;            // Estável, nunca muda
  name: string;          // "Kaël" na Vertical Slice
  level: number;         // [1, 99] inteiro
  xp: number;            // [0, ∞) inteiro, nunca NaN
  xpToNext: number;      // Calculado: level * level * 20

  hp: number;            // [0, maxHp] inteiro, nunca NaN
  maxHp: number;         // [1, 9999] inteiro
  mp: number;            // [0, maxMp] inteiro, nunca NaN
  maxMp: number;         // [0, 999] inteiro

  stats: {
    atk: number;         // [1, 999] inteiro
    def: number;         // [1, 999] inteiro
    mag: number;         // [1, 999] inteiro
    res: number;         // [1, 999] inteiro
    vel: number;         // [1, 999] inteiro
    sor: number;         // [1, 999] inteiro
  };

  equipment: {
    weapon: string | null;     // Item ID ou null
    armor: string | null;
    accessory: string | null;
  };
}
```

### Invariantes
 
- `0 <= hp <= maxHp`
- `0 <= mp <= maxMp`
- `level >= 1` (máx 10 na Vertical Slice, cap 99 no motor)
- `xp >= 0`
- `xpToNext = level * level * 20`
- `maxHp >= 1`
- Todos os stats >= 1 e <= 999
- Nenhum campo numérico pode ser NaN ou Infinity

### Contrato de Progressão e Crescimento (Level Up)

- Cada subida de nível aplica incrementos fixos e atômicos:
  - `maxHp += 25` (com restauração de `hp = maxHp`)
  - `maxMp += 8` (com restauração de `mp = maxMp`)
  - `atk += 2`
  - `def += 2`
  - `mag += 2`
  - `res += 2`
  - `vel += 1`
  - `sor += 1`
- Ao subir de nível, emite obrigatoriamente o evento `player:levelUp` com `{ newLevel: number, stats: Stats }`.
- Funções atômicas de mutação (`damagePlayer`, `healPlayer`, `restoreMp`) retornam o valor numérico efetivamente aplicado após clamping.
- `consumeMp` retorna boolean de sucesso e não altera MP em caso de saldo insuficiente ou valor inválido/NaN.
- Entradas negativas ou NaN em `damagePlayer`, `healPlayer`, `restoreMp`, `consumeMp`, `gainExperience` e `addPlayerXp` são sanitizadas sem corromper o estado do jogador.

---

## EQUIPMENT

### Slots Canônicos
- `weapon`: Armas que concedem bônus primariamente ofensivos (ATK, MAG).
- `armor`: Armaduras que concedem bônus primariamente defensivos (DEF, RES).
- `accessory`: Acessórios que concedem bônus utilitários e atributos secundários (RES, SOR, MAG, VEL).

### Contrato de Equipamento e Stats Efetivos
1. **Separação Rígida:** `PlayerState.stats` NUNCA é mutado por equipamentos. Stats base são a única fonte da verdade de crescimento.
2. **Cálculo Derivado:** `EffectiveStats` é uma projeção pura calculada sob demanda:
   `effectiveStat = baseStat + Σ(equipBonuses)`
3. **Transação Atômica de Inventário:**
   - Equipar um item requer que ele exista no inventário (`inventory.items`). O item é removido do inventário e colocado no slot.
   - Se o slot já possuía um item equipado, o item anterior retorna ao inventário (swap atômico). Se o inventário estiver cheio e não puder receber o item desequipado, a operação inteira falha e o estado é preservado.
   - Desequipar devolve o item ao inventário. Se o inventário estiver cheio, a operação falha e o item permanece equipado.
4. **Regras de HP e MP:**
   - Equipar NÃO restaura HP ou MP atual.
   - Desequipar clampa HP e MP atuais se os stats máximos diminuírem:
     `hp = min(hp, effectiveMaxHp)`
     `mp = min(mp, effectiveMaxMp)`
5. **Equipamento Inicial de Kaël:**
   - Kaël inicia com `tuned_staff` equipado no slot `weapon`.
   - O item NÃO é adicionado ao inventário simultaneamente (reside exclusivamente no slot de equipamento).
6. **Invariantes:**
   - Apenas itens com `type === 'equipment'` podem ser equipados.
   - O item deve pertencer ao slot de destino (`equipmentDef.slot === targetSlot`).
   - Todos os bônus de stats são números inteiros finitos (nunca NaN, null ou undefined).
   - Ao alterar qualquer equipamento com sucesso, emite o evento `equipment:changed` com `{ slot, previousItemId, newItemId }`.

---

## BATTLE_STATE

```typescript
type BattlePhase =
  | 'STARTING'      // Transição de entrada
  | 'ACTIVE'        // ATB rodando, esperando ações
  | 'COMMAND_SELECT'// Jogador selecionando comando
  | 'EXECUTING'     // Animação de ação em progresso
  | 'VICTORY'       // Todos os inimigos derrotados
  | 'DEFEAT'        // Jogador derrotado
  | 'FLEEING'       // Fuga em progresso
  | 'ENDED';        // Batalha finalizada

interface BattleState {
  phase: BattlePhase;
  turnCount: number;           // [0, ∞) inteiro

  actors: BattleActor[];       // Sempre pelo menos 1 (jogador)
  enemies: BattleEnemy[];      // Sempre pelo menos 1

  activeActor: string | null;  // ID do ator com ATB cheio
  actionQueue: QueuedAction[]; // Fila de ações a executar
}

interface BattleActor {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atb: number;           // [0, ATB_MAX]
  atbMax: number;        // Constante, ex: 100
  stats: Stats;
  isDefending: boolean;
  statusEffects: StatusEffect[];
}

interface QueuedAction {
  actorId: string;
  command: 'attack' | 'resonance' | 'item' | 'defend' | 'flee';
  targetId?: string;
  skillId?: string;
  itemId?: string;
}
```

### Invariantes

- `phase` é sempre um valor válido do enum
- `actors.length >= 1`
- `enemies.length >= 1` quando phase não é VICTORY ou ENDED
- `0 <= atb <= atbMax`
- ATB NÃO enche durante fases `EXECUTING`, `VICTORY`, `DEFEAT`, `ENDED`
- ATB para aliados para durante `COMMAND_SELECT` (modo Wait)
- Ações na queue são processadas em ordem FIFO
- Dano mínimo: 1 (nunca 0, negativo ou NaN)
- Cura não pode exceder maxHp/maxMp

---

## INVENTORY

```typescript
interface InventoryItem {
  itemId: string;        // ID estável do item (referência a data/)
  quantity: number;       // [0, 99] inteiro
}

interface Inventory {
  items: InventoryItem[];
  maxSlots: number;       // Limite de tipos de item diferentes
  gold: number;           // [0, 999999] inteiro, "Fragmentos"
}
```

### Invariantes

- `quantity >= 0` — ao chegar a 0, o item é removido do inventário
- `quantity <= 99`
- `gold >= 0`
- Nunca NaN em nenhum campo numérico
- `items.length <= maxSlots`
- Não pode existir dois InventoryItem com mesmo `itemId`

---

## SAVE_DATA

```typescript
interface SaveData {
  version: string;          // Semver: "0.1.0"
  timestamp: string;        // ISO 8601
  playtime: number;         // Segundos totais, inteiro

  player: PlayerState;
  inventory: Inventory;

  worldState: {
    currentScene: string;   // ID da cena atual
    currentMap: string;     // ID do mapa atual
    playerPosition: { x: number; y: number };
    flags: Record<string, boolean>;  // Flags de progresso narrativo
    visitedMaps: string[];
  };

  settings: {
    musicVolume: number;    // [0, 1]
    sfxVolume: number;      // [0, 1]
    textSpeed: number;      // [1, 3] (1=lento, 2=normal, 3=rápido)
    atbMode: 'active' | 'wait';
  };
}
```

### Invariantes

- `version` é sempre uma string semver válida
- `timestamp` é sempre um ISO 8601 válido
- `playtime >= 0`
- Settings: `0 <= volume <= 1`, `1 <= textSpeed <= 3`
- Load deve validar TODOS os campos e preencher defaults para campos ausentes
- Se a versão do save não corresponde à versão atual, executar migração
- Save deve ser atômico — nunca salvar parcialmente

---

## EVENTS (EventBus)

### Eventos Definidos

| Evento | Payload | Emissor | Consumidor |
|--------|---------|---------|------------|
| `player:damaged` | `{ amount: number, source: string }` | Battle | UI, Audio |
| `player:healed` | `{ amount: number }` | Battle | UI, Audio |
| `player:levelUp` | `{ newLevel: number, stats: Stats }` | Systems | UI, Audio |
| `player:died` | `{}` | Battle | Scenes |
| `battle:start` | `{ enemies: string[] }` | World | Scenes, Audio |
| `battle:end` | `{ result: 'victory' \| 'defeat' \| 'flee' }` | Battle | Scenes, Audio |
| `battle:phaseChange` | `{ phase: BattlePhase }` | Battle | UI |
| `inventory:itemUsed` | `{ itemId: string, playerId?: string, amountApplied?: number }` | Battle/Systems/UI | Inventory, Audio, UI |
| `inventory:itemAdded` | `{ itemId: string, quantity: number }` | Systems | UI |
| `inventory:goldChanged` | `{ oldGold: number, newGold: number }` | Systems | UI |
| `shop:open` | `{ shopId: string, merchantName?: string }` | World/UI | Systems, UI |
| `shop:buy` | `{ shopId: string, itemId: string, quantity: number, price: number }` | Systems | UI, Audio |
| `shop:close` | `{ shopId: string }` | UI | World, Systems |
| `scene:transition` | `{ from: string, to: string }` | Scenes | Audio, UI |
| `map:transitionStart` | `{ from: string, to: string }` | World | Scenes, Audio, UI |
| `map:transitionEnd` | `{ mapId: string, collisionLayer: any }` | World | Scenes, Systems |
| `dialog:start` | `{ dialogId: string }` | World | UI |
| `dialog:advance` | `{ dialogId: string, pageIndex: number, totalPages: number }` | World/UI | UI |
| `dialog:end` | `{ dialogId: string }` | UI | World |
| `equipment:changed` | `{ slot: string, previousItemId: string | null, newItemId: string | null }` | Systems | UI, Audio |
| `menu:statusOpened` | `{ player: PlayerState }` | Systems | UI, Scenes |
| `menu:statusClosed` | `{}` | Systems | Scenes, World |
| `menu:inventoryOpened` | `{ player: PlayerState }` | Systems/UI | UI, Scenes |
| `menu:inventoryClosed` | `{}` | Systems/UI | Scenes, World |
| `save:complete` | `{ slot: number }` | Save | UI |
| `save:error` | `{ error: string }` | Save | UI |
| `audio:play` | `{ trackId: string, type: 'bgm' \| 'sfx' }` | Various | Audio |
| `game:phaseChange` | `{ from: GamePhase, to: GamePhase }` | Core | All |

### Regras de Eventos

1. Nomes de evento usam formato `sistema:ação` em lowercase
2. Payload é sempre um objeto (nunca primitivo solto)
3. Eventos são fire-and-forget — emissor não espera resposta
4. Para comunicação request/response, usar callbacks explícitos
5. Novos eventos devem ser documentados aqui ANTES de serem implementados

---

## DAMAGE FORMULA

```
dano_fisico = max(1, floor((ATK * 2 - DEF_alvo) * variacao))
dano_magico = max(1, floor((MAG * 2 - RES_alvo) * variacao))
cura        = max(1, floor(MAG * 1.5 * variacao))
variacao    = randomFloat(0.9, 1.1)

Se alvo está defendendo:
  dano_final = max(1, floor(dano * 0.5))

Critico (chance = SOR / 100):
  dano_final = dano * 2
```

### Invariantes

- Dano nunca é 0, negativo ou NaN
- Cura nunca é 0, negativa ou NaN
- Cura não pode levar HP acima de maxHp
- Variação é sempre [0.9, 1.1]
