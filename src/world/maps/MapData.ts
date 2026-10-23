/**
 * MapData — Interface for declarative map definitions
 *
 * Defines the structure of maps, their transition zones, and entity placements.
 */

export interface MapTransitionZone {
  x: number;
  y: number;
  width: number; // in tiles or pixels depending on implementation. We'll use tiles for map logic.
  height: number;
  targetMapId: string;
  targetSpawnId: string;
}

export interface MapEntityPlacement {
  entityId: string;
  x: number;
  y: number;
  type: 'npc' | 'object' | 'enemy' | 'interactable' | 'pillar' | 'chest';
}

export interface MapSpawnPoint {
  id: string;
  x: number;
  y: number;
  facing?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'; // Default facing direction on spawn
}

export interface MapData {
  id: string;
  displayName: string;
  width: number; // In tiles
  height: number; // In tiles
  
  // Minimal representation for Phase 2, relying on programmatic tiles
  groundData: number[][];
  wallData: number[][];
  
  spawnPoints: Record<string, MapSpawnPoint>;
  transitions: MapTransitionZone[];
  entities: MapEntityPlacement[];
}
