# CINZAS DO ÉTER — Audio Pipeline

> Versão: 0.1.0 | Método: Síntese procedural via Web Audio API

---

## Princípio

Todo áudio do jogo é **sintetizado por código** usando a Web Audio API nativa do navegador.
Nenhum arquivo de música ou SFX pronto pode ser utilizado.

---

## Sintetizador

### Arquitetura do Audio Engine

```
AudioContext (Web Audio API)
  ├── MasterGain (volume master)
  │   ├── BGM Bus (GainNode)
  │   │   └── Synth Voices (OscillatorNode + envelopes)
  │   └── SFX Bus (GainNode)
  │       └── SFX Players (OscillatorNode + noise + envelopes)
  └── Analyser (opcional, para debug visual)
```

### Tipos de Oscilador Disponíveis

| Tipo | Uso |
|------|-----|
| `sine` | Tons suaves, pads, flauta |
| `square` | Leads, melodia principal (som "chiptune") |
| `sawtooth` | Strings, leads agressivos |
| `triangle` | Bass, tons suaves retro |

### Envelope ADSR

```
Attack  → Tempo para atingir volume máximo
Decay   → Tempo para cair ao nível Sustain
Sustain → Nível mantido enquanto nota ativa
Release → Tempo para silenciar após nota parar
```

Todos os instrumentos devem definir um ADSR.

---

## Instrumentos Planejados

| Instrumento | Oscilador | Uso |
|-------------|-----------|-----|
| Lead Crystal | Square + leve vibrato | Melodia principal |
| Pad Ether | Sine × 2 (desafinados) | Ambientação, acordes |
| Bass Earth | Triangle | Linha de baixo |
| Strings Decay | Sawtooth filtrado | Texturas dramáticas |
| Perc Pulse | Noise + envelope curto | Percussão |
| Bell Amber | Sine com harmônicos | Efeitos de cristal, UI |

---

## Música

### Tracks Planejados

| Track | Contexto | Andamento | Tom |
|-------|----------|-----------|-----|
| Tema de Lumen | Vila | Moderato, 90 BPM | Caloroso, esperançoso |
| Planície das Cinzas | Exploração externa | Andante, 72 BPM | Melancólico, vasto |
| Gruta do Eco | Dungeon | Lento, 60 BPM | Tenso, misterioso |
| Batalha | Combate comum | Allegro, 140 BPM | Energético, urgente |
| Boss | Combate com chefe | Allegro, 150 BPM | Intenso, épico |
| Vitória | Pós-batalha | Moderato, 100 BPM | Triunfante, breve (5s) |
| Game Over | Derrota | Largo, 50 BPM | Sombrio, breve (5s) |

### Estrutura Musical

- Composição em loop (seamless)
- Duração do loop: 30–60 segundos por track
- Crossfade entre tracks: 1 segundo
- Sem clipping nos pontos de loop

---

## Efeitos Sonoros (SFX)

| SFX | Método | Duração |
|-----|--------|---------|
| Ataque físico | Noise burst + envelope rápido | ~200ms |
| Magia/Ressonância | Sine sweep + harmônicos | ~500ms |
| Cura | Sine ascendente + bell | ~600ms |
| Dano recebido | Noise + tom descendente | ~300ms |
| Menu cursor | Square pulse curto | ~50ms |
| Menu confirm | Bell duplo | ~150ms |
| Menu cancel | Square descendente | ~100ms |
| Level up | Arpejo ascendente (square) | ~1000ms |
| Passos | Noise filtrado, variação | ~100ms |
| Abrir baú | Noise + bell ascendente | ~400ms |
| Salvar | Chime suave (sine) | ~500ms |
| Erro/impossível | Buzz curto (square) | ~200ms |

---

## Controle de Volume

| Bus | Volume padrão | Configurável |
|-----|---------------|-------------|
| Master | 1.0 | Não (fixo) |
| BGM | 0.5 | Sim (settings) |
| SFX | 0.7 | Sim (settings) |

- Volume é salvo no SaveData.settings
- Mudanças de volume devem ter rampa suave (50ms) para evitar clicks

---

## Regras

1. **Sem arquivos de áudio externos** — tudo sintetizado em runtime
2. **Sem clipping** — monitorar amplitude, compressar se necessário
3. **Loops sem corte perceptível** — ponto de loop deve ser seamless
4. **Crossfade entre músicas** — nunca cortar abruptamente
5. **SFX não devem interferir com BGM** — buses separados
6. **Testar em volume máximo** — verificar ausência de distorção
7. **AudioContext deve ser criado após interação do usuário** — requisito do navegador

---

## Testes de Áudio

- [ ] Cada SFX toca sem erro
- [ ] BGM faz loop sem corte perceptível
- [ ] Crossfade funciona entre tracks
- [ ] Volume master/BGM/SFX funciona
- [ ] Sem clipping em volume máximo
- [ ] AudioContext resume após interação do usuário
- [ ] Múltiplos SFX simultâneos não distorcem
