import type { MapData } from './MapData.ts';
import { MAP_WIDTH, MAP_HEIGHT } from '../MapManager.ts';

// Helper to generate a simple map
function generateMapData(id: string, name: string, colorTile: number): MapData {
  const groundData: number[][] = [];
  const wallData: number[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const groundRow: number[] = [];
    const wallRow: number[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      groundRow.push(colorTile);
      // Create a border wall
      if (y === 0 || y === MAP_HEIGHT - 1 || x === 0 || x === MAP_WIDTH - 1) {
        wallRow.push(1); // Using 1 as wall/obstacle tile
      } else {
        wallRow.push(-1); // No wall
      }
    }
    groundData.push(groundRow);
    wallData.push(wallRow);
  }

  // Open a "door" on the right side for Map A and left side for Map B
  if (id === 'mapA') {
    wallData[15][MAP_WIDTH - 1] = -1; // Open wall
    wallData[16][MAP_WIDTH - 1] = -1; // Open wall
  } else if (id === 'mapB') {
    wallData[15][0] = -1; // Open wall
    wallData[16][0] = -1; // Open wall
  }

  return {
    id,
    displayName: name,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    groundData,
    wallData,
    spawnPoints: {
      'spawn_center': { id: 'spawn_center', x: 200, y: 200 },
      'spawn_left': { id: 'spawn_left', x: 32, y: 15 * 16 },
      'spawn_right': { id: 'spawn_right', x: (MAP_WIDTH - 2) * 16, y: 15 * 16 }
    },
    transitions: [
      ...(id === 'mapA'
        ? [{
            x: (MAP_WIDTH - 1) * 16,
            y: 14 * 16,
            width: 16,
            height: 3 * 16, // A zone at the right edge
            targetMapId: 'mapB',
            targetSpawnId: 'spawn_left'
          }]
        : [{
            x: 0,
            y: 14 * 16,
            width: 16,
            height: 3 * 16, // A zone at the left edge
            targetMapId: 'mapA',
            targetSpawnId: 'spawn_right'
          }])
    ],
    entities: []
  };
}

export const mapA = generateMapData('mapA', 'Test Map A', 0); // Using 0 for ground
export const mapB = generateMapData('mapB', 'Test Map B', 2); // Assuming 2 might be another texture index or we just use 0
