/**
 * Items Data — Definition of all canonical items in Cinzas do Éter
 *
 * Conforms to GDD.md (Vertical Slice).
 * Pure data definitions, decoupled from rendering and game state.
 */

export type ItemType = 'consumable' | 'equipment' | 'key_item' | 'material';

export interface ItemDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly type: ItemType;
  readonly maxStack?: number; // Defaults to 99 per CONTRACTS.md
}

export const ITEMS_DATABASE: Record<string, ItemDefinition> = {
  'elixir_amber': {
    id: 'elixir_amber',
    name: 'Elixir Âmbar',
    description: 'Restaura 50 HP com a essência pura do Éter.',
    price: 30,
    type: 'consumable',
    maxStack: 99,
  },
  'ether_drop': {
    id: 'ether_drop',
    name: 'Gota de Éter',
    description: 'Restaura 20 MP sintonizando vibrações espirituais.',
    price: 50,
    type: 'consumable',
    maxStack: 99,
  },
  'antidote': {
    id: 'antidote',
    name: 'Antídoto',
    description: 'Neutraliza toxinas e impurezas no organismo.',
    price: 20,
    type: 'consumable',
    maxStack: 99,
  },
  'escape_crystal': {
    id: 'escape_crystal',
    name: 'Cristal de Fuga',
    description: 'Fragmento facetado que permite retirada imediata de batalhas.',
    price: 80,
    type: 'consumable',
    maxStack: 99,
  },
  'amber_pendant': {
    id: 'amber_pendant',
    name: 'Pingente de Âmbar',
    description: 'Amuleto ancestral que ressoa com o calor primordial do Éter.',
    price: 150,
    type: 'equipment',
    maxStack: 1,
  },
  'apprentice_staff': {
    id: 'apprentice_staff',
    name: 'Bastão de Aprendiz',
    description: 'Bastão simples de madeira tratada, usado por sintonizadores iniciantes.',
    price: 60,
    type: 'equipment',
    maxStack: 1,
  },
  'tuned_staff': {
    id: 'tuned_staff',
    name: 'Bastão Sintonizado',
    description: 'Bastão condutor de Éter, afinado para amplificar ressonâncias.',
    price: 200,
    type: 'equipment',
    maxStack: 1,
  },
  'traveler_tunic': {
    id: 'traveler_tunic',
    name: 'Túnica de Viajante',
    description: 'Veste leve de tecido reforçado, ideal para longas jornadas.',
    price: 80,
    type: 'equipment',
    maxStack: 1,
  },
  'ether_cuirass': {
    id: 'ether_cuirass',
    name: 'Couraça de Éter',
    description: 'Armadura leve infundida com cristais de Éter estabilizado.',
    price: 250,
    type: 'equipment',
    maxStack: 1,
  },
  'crystal_ring': {
    id: 'crystal_ring',
    name: 'Anel de Cristal',
    description: 'Anel facetado de cristal de Éter que amplifica a sensibilidade mágica.',
    price: 180,
    type: 'equipment',
    maxStack: 1,
  },
};

/**
 * Retrieves an item definition by ID. Returns undefined if not found.
 */
export function getItemDefinition(id: string): ItemDefinition | undefined {
  return ITEMS_DATABASE[id];
}
