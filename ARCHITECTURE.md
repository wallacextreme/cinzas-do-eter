# CINZAS DO ÉTER — Arquitetura de Software

> Documento vivo: Regras e padrões de arquitetura para a Vertical Slice.

---

## 🛑 REGRA CRÍTICA: FONTE DE VERDADE 🛑

**O histórico de outras conversas, outros projetos, transcripts, memórias passadas do agente ou projetos anteriores NÃO constitui requisito ou contexto para este projeto.**

- **Workspace é absoluto:** Somente arquivos e código existentes neste diretório podem ditar padrões, arquiteturas, nomes de sistemas e estruturas de pastas.
- **Tratar como NÃO DEFINIDO:** Quando uma especificação não estiver clara no workspace atual, o agente deve tratá-la como **NÃO DEFINIDA** em vez de importar pressuposições ou lógicas de projetos paralelos ou anteriores.
- **Isolamento estrito:** A arquitetura deste projeto (JRPG 16-BIT) é contida e independente. Nada de fora deve ser injetado implicitamente.

---

## Stack

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| TypeScript | ~6.0 | Linguagem principal |
| Phaser 3 | 3.90 | Motor de jogo 2D |
| Vite | ^8.2 | Bundler e dev server |
| Bun | 1.3 | Runtime e package manager |
| Vitest | ^4.1 | Framework de testes |
| Web Audio API | Nativa | Áudio procedural |
| Git | 2.55 | Controle de versão |

---

## Estrutura de Diretórios

```
cinzas-do-eter/
├── index.html                 # Entry point HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── GDD.md                     # Game Design Document
├── STYLE_GUIDE.md             # Autoridade visual
├── ARCHITECTURE.md            # Este arquivo
├── CONTRACTS.md               # Contratos entre sistemas
├── PROGRESS.md                # Tabela de progresso
├── TODO.md                    # Lista de tarefas
├── ART_PIPELINE.md            # Pipeline de arte
├── AUDIO_PIPELINE.md          # Pipeline de áudio
├── QA.md                      # Estratégia de testes
├── CHANGELOG.md               # Histórico de mudanças
├── BLOCKERS.md                # Problemas bloqueantes
│
├── src/
│   ├── main.ts                # Bootstrap do Phaser
│   ├── style.css              # CSS global (pixel-perfect)
│   │
│   ├── config/                # Configuração
│   │   ├── game-config.ts     # Config do Phaser
│   │   └── constants.ts       # Paleta, dimensões, constantes
│   │
│   ├── core/                  # Infraestrutura central
│   │   └── EventBus.ts        # Sistema de eventos pub/sub
│   │
│   ├── scenes/                # Cenas do Phaser
│   │   └── BootScene.ts       # Cena de boot
│   │
│   ├── entities/              # Entidades do jogo
│   │   └── index.ts           # (FASE 3)
│   │
│   ├── systems/               # Sistemas de jogo
│   │   └── index.ts           # (FASE 1)
│   │
│   ├── battle/                # Sistema de batalha
│   │   └── index.ts           # (FASE 4)
│   │
│   ├── world/                 # Mapas e mundo
│   │   └── index.ts           # (FASE 2)
│   │
│   ├── ui/                    # Interface do usuário
│   │   └── index.ts           # (FASE 2–4)
│   │
│   ├── data/                  # Dados estáticos
│   │   └── index.ts           # (FASE 4–7)
│   │
│   ├── audio/                 # Áudio procedural
│   │   └── index.ts           # (FASE 10)
│   │
│   ├── art/                   # Arte procedural
│   │   └── index.ts           # (FASE 9)
│   │
│   ├── save/                  # Persistência
│   │   └── index.ts           # (FASE 7)
│   │
│   └── utils/                 # Utilitários
│       └── math.ts            # Operações matemáticas seguras
│
├── tests/                     # Testes automatizados
│   ├── core/
│   │   └── EventBus.test.ts
│   ├── config/
│   │   └── constants.test.ts
│   └── utils/
│       └── math.test.ts
│
└── public/                    # Assets estáticos
    └── (vazio — assets serão adicionados nas fases posteriores)
```

---

## Princípios Arquiteturais

### 1. Separação de Responsabilidades

| Camada | Conteúdo | Exemplo |
|--------|----------|---------|
| **Apresentação** | Renderização, sprites, animações, UI | `scenes/`, `ui/`, `art/` |
| **Lógica** | Regras de jogo, batalha, progressão | `systems/`, `battle/`, `entities/` |
| **Dados** | Definições estáticas, tabelas | `data/` |
| **Persistência** | Save/load, migração | `save/` |
| **Infraestrutura** | EventBus, config, utils | `core/`, `config/`, `utils/` |

### 2. Comunicação entre Sistemas

```
┌─────────────┐     EventBus      ┌─────────────┐
│  Sistema A  │ ──────────────→   │  Sistema B  │
└─────────────┘   (pub/sub)       └─────────────┘
```

- Sistemas NÃO devem importar uns aos outros diretamente (exceto Dados e Utils)
- Toda comunicação entre sistemas passa pelo `EventBus`
- Exceções permitidas: leitura de dados estáticos (`data/`), uso de utils

### 3. Phaser como Camada de Renderização

```
┌───────────────────────────────────┐
│         Lógica do Jogo            │  ← TypeScript puro
│  (Battle, Entities, Systems)      │
├───────────────────────────────────┤
│       Adaptadores Phaser          │  ← Scenes, GameObjects
│  (Scenes, Sprites, Tilemap)       │
├───────────────────────────────────┤
│           Phaser 3                │  ← Motor
└───────────────────────────────────┘
```

- Lógica de jogo NÃO depende de Phaser diretamente
- Phaser é usado apenas para renderização, input e áudio
- Isso permite testes unitários sem Phaser e futura portabilidade

### 4. Regras Anti-Padrão

| ❌ Proibido | ✅ Correto |
|------------|-----------|
| Estado global mutável | Estado gerenciado via classes tipadas |
| Funções com 200+ linhas | Funções pequenas e focadas |
| `any` em TypeScript | Tipos explícitos, generics quando necessário |
| Imports circulares | Dependência unidirecional, EventBus para comunicação |
| Dados hardcoded no código | Dados em `data/`, referenciados por ID |
| Lógica no render loop | Lógica separada, render apenas apresenta |

---

## Path Aliases

```typescript
@/         → src/
@core/     → src/core/
@scenes/   → src/scenes/
@entities/ → src/entities/
@systems/  → src/systems/
@battle/   → src/battle/
@world/    → src/world/
@ui/       → src/ui/
@data/     → src/data/
@audio/    → src/audio/
@art/      → src/art/
@save/     → src/save/
@utils/    → src/utils/
@config/   → src/config/
```

Configurados em `tsconfig.json` e `vite.config.ts`.

---

## Empacotamento Futuro (Tauri)

A arquitetura é preparada para futuro empacotamento:

- Sem dependência de CDN
- Assets locais
- Web Audio API (funciona em webview)
- Phaser renderiza em Canvas/WebGL (ambos suportados por Tauri)
- Sem APIs de servidor necessárias
- Save via `localStorage` (migrável para filesystem via Tauri API)
