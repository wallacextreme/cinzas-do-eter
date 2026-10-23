import { describe, it, expect } from 'vitest';
import { echoCaveEntranceMap } from '@world/maps/EchoCaveEntranceMap.ts';
import { echoCaveR2Map } from '@world/maps/EchoCaveR2Map.ts';
import { echoCaveR3Map } from '@world/maps/EchoCaveR3Map.ts';
import { DEFAULT_DIALOGUES } from '@data/dialogueData.ts';

describe('Echo Cave Exploration (R1, R2, R3)', () => {
  describe('R1: Entrada da Gruta do Eco (echo_cave)', () => {
    it('has valid dimensions and matching matrices', () => {
      expect(echoCaveEntranceMap.width).toBe(24);
      expect(echoCaveEntranceMap.height).toBe(18);
      expect(echoCaveEntranceMap.groundData.length).toBe(18);
      expect(echoCaveEntranceMap.wallData.length).toBe(18);
      echoCaveEntranceMap.groundData.forEach(row => expect(row.length).toBe(24));
      echoCaveEntranceMap.wallData.forEach(row => expect(row.length).toBe(24));
    });

    it('contains spawn points for entrance and return from R2', () => {
      expect(echoCaveEntranceMap.spawnPoints['spawn_entrance']).toBeDefined();
      expect(echoCaveEntranceMap.spawnPoints['spawn_entrance'].facing).toBe('DOWN');

      expect(echoCaveEntranceMap.spawnPoints['spawn_south']).toBeDefined();
      expect(echoCaveEntranceMap.spawnPoints['spawn_south'].facing).toBe('UP');
    });

    it('has transitions leading to ash_plains and echo_cave_r2', () => {
      const toAsh = echoCaveEntranceMap.transitions.find(t => t.targetMapId === 'ash_plains');
      expect(toAsh).toBeDefined();
      expect(toAsh?.targetSpawnId).toBe('spawn_south');

      const toR2 = echoCaveEntranceMap.transitions.find(t => t.targetMapId === 'echo_cave_r2');
      expect(toR2).toBeDefined();
      expect(toR2?.targetSpawnId).toBe('spawn_north');
    });
  });

  describe('R2: Cruzamento das Sombras (echo_cave_r2)', () => {
    it('has valid dimensions and matching matrices', () => {
      expect(echoCaveR2Map.width).toBe(24);
      expect(echoCaveR2Map.height).toBe(18);
      expect(echoCaveR2Map.groundData.length).toBe(18);
      expect(echoCaveR2Map.wallData.length).toBe(18);
      echoCaveR2Map.groundData.forEach(row => expect(row.length).toBe(24));
      echoCaveR2Map.wallData.forEach(row => expect(row.length).toBe(24));
    });

    it('contains all fork spawn points', () => {
      expect(echoCaveR2Map.spawnPoints['spawn_north']).toBeDefined();
      expect(echoCaveR2Map.spawnPoints['spawn_west']).toBeDefined();
      expect(echoCaveR2Map.spawnPoints['spawn_east']).toBeDefined();
    });

    it('has 3 transitions connecting to R1, R3 and R4', () => {
      const toR1 = echoCaveR2Map.transitions.find(t => t.targetMapId === 'echo_cave');
      expect(toR1).toBeDefined();
      expect(toR1?.targetSpawnId).toBe('spawn_south');

      const toR3 = echoCaveR2Map.transitions.find(t => t.targetMapId === 'echo_cave_r3');
      expect(toR3).toBeDefined();
      expect(toR3?.targetSpawnId).toBe('spawn_east');

      const toR4 = echoCaveR2Map.transitions.find(t => t.targetMapId === 'echo_cave_r4');
      expect(toR4).toBeDefined();
      expect(toR4?.targetSpawnId).toBe('spawn_west');
    });
  });

  describe('R3: Câmara dos Ecos & Pista (echo_cave_r3)', () => {
    it('has valid dimensions and matching matrices', () => {
      expect(echoCaveR3Map.width).toBe(24);
      expect(echoCaveR3Map.height).toBe(18);
      expect(echoCaveR3Map.groundData.length).toBe(18);
      expect(echoCaveR3Map.wallData.length).toBe(18);
    });

    it('has transition back to R2', () => {
      const toR2 = echoCaveR3Map.transitions.find(t => t.targetMapId === 'echo_cave_r2');
      expect(toR2).toBeDefined();
      expect(toR2?.targetSpawnId).toBe('spawn_west');
    });

    it('contains the clue stele entity', () => {
      const stele = echoCaveR3Map.entities.find(e => e.entityId === 'stele_r3_clue');
      expect(stele).toBeDefined();
      expect(stele?.type).toBe('object');
    });

    it('contains the canonical riddle text in dialogue database', () => {
      const dialogue = DEFAULT_DIALOGUES['dialogue_stele_r3_clue'];
      expect(dialogue).toBeDefined();
      expect(dialogue.messages.length).toBeGreaterThanOrEqual(2);

      const clueMessage = dialogue.messages[1].text;
      expect(clueMessage).toContain('solo profundo (Âmbar)');
      expect(clueMessage).toContain('manto místico (Violeta)');
      expect(clueMessage).toContain('luz do zênite (Celeste)');
    });
  });
});
