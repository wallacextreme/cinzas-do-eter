import { describe, it, expect } from 'vitest';
import { ashPlainsMap } from '@world/maps/AshPlainsMap.ts';
import { echoCaveEntranceMap } from '@world/maps/EchoCaveEntranceMap.ts';

describe('AshPlainsMap (Planície das Cinzas)', () => {
  it('has correct identity and dimensions (32x40 tiles / 512x640 px)', () => {
    expect(ashPlainsMap.id).toBe('ash_plains');
    expect(ashPlainsMap.displayName).toBe('Planície das Cinzas');
    expect(ashPlainsMap.width).toBe(32);
    expect(ashPlainsMap.height).toBe(40);
  });

  it('has valid groundData and wallData matrix dimensions', () => {
    expect(ashPlainsMap.groundData.length).toBe(40);
    expect(ashPlainsMap.wallData.length).toBe(40);

    for (let y = 0; y < 40; y++) {
      expect(ashPlainsMap.groundData[y].length).toBe(32);
      expect(ashPlainsMap.wallData[y].length).toBe(32);
      
      // All ground tiles must be valid non-negative GIDs
      for (let x = 0; x < 32; x++) {
        expect(ashPlainsMap.groundData[y][x]).toBeGreaterThan(0);
        expect(ashPlainsMap.groundData[y][x]).toBeLessThanOrEqual(12);
      }
    }
  });

  it('defines valid spawn points with proper positions and facing directions', () => {
    expect(ashPlainsMap.spawnPoints['spawn_north']).toBeDefined();
    expect(ashPlainsMap.spawnPoints['spawn_north'].facing).toBe('DOWN');
    expect(ashPlainsMap.spawnPoints['spawn_north'].x).toBe(16 * 16);
    expect(ashPlainsMap.spawnPoints['spawn_north'].y).toBe(2 * 16);

    expect(ashPlainsMap.spawnPoints['spawn_south']).toBeDefined();
    expect(ashPlainsMap.spawnPoints['spawn_south'].facing).toBe('UP');
    expect(ashPlainsMap.spawnPoints['spawn_south'].x).toBe(16 * 16);
    expect(ashPlainsMap.spawnPoints['spawn_south'].y).toBe(36 * 16);
  });

  it('defines transitions connecting to Lumen Village and Echo Cave', () => {
    expect(ashPlainsMap.transitions.length).toBe(2);

    // North transition to Lumen Village
    const toLumen = ashPlainsMap.transitions.find(t => t.targetMapId === 'lumen_village');
    expect(toLumen).toBeDefined();
    expect(toLumen?.targetSpawnId).toBe('spawn_south');
    expect(toLumen?.y).toBe(0);

    // South transition to Echo Cave
    const toCave = ashPlainsMap.transitions.find(t => t.targetMapId === 'echo_cave');
    expect(toCave).toBeDefined();
    expect(toCave?.targetSpawnId).toBe('spawn_entrance');
    expect(toCave?.y).toBe(39 * 16);
  });

  it('spawns do not collide with their corresponding return transition zones (anti-loop)', () => {
    const northSpawn = ashPlainsMap.spawnPoints['spawn_north'];
    const northTrans = ashPlainsMap.transitions.find(t => t.targetMapId === 'lumen_village')!;
    // Spawn y (32) must be strictly outside transition box [0, 16]
    expect(northSpawn.y).toBeGreaterThan(northTrans.y + northTrans.height);

    const southSpawn = ashPlainsMap.spawnPoints['spawn_south'];
    const southTrans = ashPlainsMap.transitions.find(t => t.targetMapId === 'echo_cave')!;
    // Spawn y (576) must be strictly above transition box [624, 640]
    expect(southSpawn.y).toBeLessThan(southTrans.y);
  });

  it('has boundary wall protection on left, right and outer boundaries', () => {
    // Left boundary
    for (let y = 1; y < 39; y++) {
      expect(ashPlainsMap.wallData[y][0]).toBe(2);
    }
    // Right boundary
    for (let y = 1; y < 39; y++) {
      expect(ashPlainsMap.wallData[y][31]).toBe(2);
    }
  });

  it('has internal obstacles creating navigable path and collisions', () => {
    let obstacleCount = 0;
    for (let y = 1; y < 39; y++) {
      for (let x = 1; x < 31; x++) {
        if (ashPlainsMap.wallData[y][x] > 0) {
          obstacleCount++;
        }
      }
    }
    // Substantial obstacle count creating terrain
    expect(obstacleCount).toBeGreaterThan(50);

    // Path at (16, y) should have walkable passage
    expect(ashPlainsMap.wallData[2][16]).toBe(-1);
    expect(ashPlainsMap.wallData[36][16]).toBe(-1);
  });

  it('includes interactive signpost entity', () => {
    const sign = ashPlainsMap.entities.find(e => e.entityId === 'sign_ash_plains');
    expect(sign).toBeDefined();
    expect(sign?.type).toBe('object');
  });
});

describe('EchoCaveEntranceMap (Entrada da Gruta do Eco)', () => {
  it('has correct identity and dimensions (24x18 tiles)', () => {
    expect(echoCaveEntranceMap.id).toBe('echo_cave');
    expect(echoCaveEntranceMap.displayName).toBe('Entrada da Gruta do Eco');
    expect(echoCaveEntranceMap.width).toBe(24);
    expect(echoCaveEntranceMap.height).toBe(18);
  });

  it('defines valid spawn and return transition to ash_plains', () => {
    expect(echoCaveEntranceMap.spawnPoints['spawn_entrance']).toBeDefined();
    expect(echoCaveEntranceMap.spawnPoints['spawn_entrance'].facing).toBe('DOWN');

    const toPlains = echoCaveEntranceMap.transitions.find(t => t.targetMapId === 'ash_plains');
    expect(toPlains).toBeDefined();
    expect(toPlains?.targetSpawnId).toBe('spawn_south');
  });
});
