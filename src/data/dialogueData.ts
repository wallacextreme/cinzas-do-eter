/**
 * DialogueData — Dialogue Content & Data Definitions
 *
 * Decoupled definitions for dialogue nodes, messages, and narrative triggers.
 * Used by DialogueManager and independent of specific scenes or entities.
 */

export interface DialogueMessage {
  speakerName?: string;
  portraitKey?: string;
  text: string;
  /** Narrative event trigger (e.g. 'quest:accept', 'shop:open') */
  eventTrigger?: string;
  /** Optional callback fired when message is shown/completed */
  onComplete?: () => void;
}

export interface DialogueNode {
  id: string;
  messages: DialogueMessage[];
  /** Optional next dialogue branch identifier */
  nextDialogueId?: string;
}

export type DialogueDatabase = Record<string, DialogueNode>;

export const DEFAULT_DIALOGUES: DialogueDatabase = {
  'dialogue_npc_lia': {
    id: 'dialogue_npc_lia',
    messages: [
      {
        speakerName: 'Lia',
        text: 'Kaël! Você sentiu isso? As vibrações do Éter no chão estão ficando cada vez mais fracas...',
      },
      {
        speakerName: 'Lia',
        text: 'Até a colheita no leste da vila começou a murchar. Tenho medo do que vai acontecer se o Núcleo apagar de vez.',
      },
      {
        speakerName: 'Lia',
        text: 'Por favor, tome muito cuidado se você for além dos portões para a Planície das Cinzas.',
      },
    ],
  },
  'dialogue_npc_torvak': {
    id: 'dialogue_npc_torvak',
    messages: [
      {
        speakerName: 'Torvak',
        text: 'Saudações, jovem! Torvak a seu dispor. Minhas mercadorias vieram de terras distantes.',
      },
      {
        speakerName: 'Torvak',
        text: 'Os caminhos estão perigosos com a sombra avançando, mas um mercador nunca perde o faro para negócios!',
      },
      {
        speakerName: 'Torvak',
        text: 'Dê uma olhada na minha loja! Tenho suprimentos essenciais prontos para você.',
      },
    ],
  },
  'dialogue_sign_1': {
    id: 'dialogue_sign_1',
    messages: [
      {
        speakerName: 'Placa',
        text: 'Vila de Lumen — Refúgio sob o calor do Núcleo de Éter.',
      },
      {
        speakerName: 'Placa',
        text: 'Aviso aos viajantes: A Estrada Sul leva à Planície das Cinzas. Perigo iminente.',
      },
    ],
  },
  // Template prepared for Mirael (GDD requirement for future units)
  'dialogue_npc_mirael': {
    id: 'dialogue_npc_mirael',
    messages: [
      {
        speakerName: 'Mirael',
        text: 'Kaël, a ressonância do Éter está enfraquecendo a cada pulsar do Núcleo.',
      },
      {
        speakerName: 'Mirael',
        text: 'Seu bastão sintonizador é a chave para restaurar o fluxo na Gruta do Eco.',
      },
    ],
  },
  'dialogue_sign_ash_plains': {
    id: 'dialogue_sign_ash_plains',
    messages: [
      {
        speakerName: 'Placa',
        text: 'Planície das Cinzas — Perigo ao Sul: Gruta do Eco.',
      },
    ],
  },
  'dialogue_stele_r3_clue': {
    id: 'dialogue_stele_r3_clue',
    messages: [
      {
        speakerName: 'Estela Antiga',
        text: 'Uma inscrição antiga reluz na pedra:',
      },
      {
        speakerName: 'Estela Antiga',
        text: 'O Éter desperta primeiro no solo profundo (Âmbar), eleva-se no manto místico (Violeta) e ressoa na luz do zênite (Celeste).',
      },
    ],
  },
  'dialogue_r6_altar': {
    id: 'dialogue_r6_altar',
    messages: [
      {
        speakerName: 'Altar do Eco',
        text: 'Um pedestal esculpido em pedra escura sustenta um receptáculo silencioso.',
      },
      {
        speakerName: 'Altar do Eco',
        text: 'O Núcleo Corrompido pulsa em dormência sombria no interior do santuário.',
      },
    ],
  },
};
