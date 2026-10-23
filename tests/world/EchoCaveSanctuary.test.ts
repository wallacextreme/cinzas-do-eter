import { describe, it, expect } from 'vitest';
import { echoCaveR5Map } from '@world/maps/EchoCaveR5Map.ts';
import { echoCaveR6Map } from '@world/maps/EchoCaveR6Map.ts';
import { DEFAULT_DIALOGUES } from '@data/dialogueData.ts';

describe('Echo Cave R5 (Abyss Bridge) & R6 (Sanctuary) Integration', () => {
  describe('R5: Ponte do Abismo Map Data', () => {
    it('has valid dimensions and tile matrices', () => {
      expect(echoCaveR5Map.width).toBe(24);
      expect(echoCaveR5Map.height).toBe(18);
      expect(echoCaveR5Map.groundData.length).toBe(18);
      expect(echoCaveR5Map.wallData.length).toBe(18);
      echoCaveR5Map.groundData.forEach(row => expect(row.length).toBe(24));
      echoCaveR5Map.wallData.forEach(row => expect(row.length).toBe(24));
    });

    it('contains all 3 directional spawn points', () => {
      expect(echoCaveR5Map.spawnPoints['spawn_west']).toBeDefined();
      expect(echoCaveR5Map.spawnPoints['spawn_north']).toBeDefined();
      expect(echoCaveR5Map.spawnPoints['spawn_south']).toBeDefined();
    });

    it('contains transitions to R4, R6 and R7', () => {
      const toR4 = echoCaveR5Map.transitions.find(t => t.targetMapId === 'echo_cave_r4');
      expect(toR4).toBeDefined();
      expect(toR4?.targetSpawnId).toBe('spawn_east');

      const toR6 = echoCaveR5Map.transitions.find(t => t.targetMapId === 'echo_cave_r6');
      expect(toR6).toBeDefined();
      expect(toR6?.targetSpawnId).toBe('spawn_south');

      const toR7 = echoCaveR5Map.transitions.find(t => t.targetMapId === 'echo_cave_r7');
      expect(toR7).toBeDefined();
      expect(toR7?.targetSpawnId).toBe('spawn_north');
    });
  });

  describe('R6: Santuário do Eco (Narrative & Strict Scope Compliance)', () => {
    it('has valid dimensions and tile matrices', () => {
      expect(echoCaveR6Map.width).toBe(24);
      expect(echoCaveR6Map.height).toBe(18);
      expect(echoCaveR6Map.groundData.length).toBe(18);
      expect(echoCaveR6Map.wallData.length).toBe(18);
      echoCaveR6Map.groundData.forEach(row => expect(row.length).toBe(24));
      echoCaveR6Map.wallData.forEach(row => expect(row.length).toBe(24));
    });

    it('has spawn point and transition leading back to R5', () => {
      expect(echoCaveR6Map.spawnPoints['spawn_south']).toBeDefined();
      expect(echoCaveR6Map.spawnPoints['spawn_south'].facing).toBe('UP');

      const toR5 = echoCaveR6Map.transitions.find(t => t.targetMapId === 'echo_cave_r5');
      expect(toR5).toBeDefined();
      expect(toR5?.targetSpawnId).toBe('spawn_north');
    });

    it('contains the Altar do Núcleo Corrompido as an environmental object', () => {
      const altar = echoCaveR6Map.entities.find(e => e.entityId === 'altar_corrupted_core');
      expect(altar).toBeDefined();
      expect(altar?.type).toBe('object');
    });

    it('strictly satisfies Ajuste 3: NO battles, NO enemies, NO boss, NO battle triggers', () => {
      // Must not have any entities of type 'enemy', 'boss', 'trigger_battle'
      const combatEntities = echoCaveR6Map.entities.filter(
        e => (e.type as string) === 'enemy' || (e.type as string) === 'boss' || (e.type as string) === 'battle'
      );
      expect(combatEntities.length).toBe(0);

      // Verify no enemy IDs
      const enemyIds = echoCaveR6Map.entities.filter(
        e => e.entityId.includes('enemy') || e.entityId.includes('boss')
      );
      expect(enemyIds.length).toBe(0);
    });

    it('has lore description in dialogue database for Altar do Eco', () => {
      const dialogue = DEFAULT_DIALOGUES['dialogue_r6_altar'];
      expect(dialogue).toBeDefined();
      expect(dialogue.messages.length).toBeGreaterThanOrEqual(1);
      expect(dialogue.messages[1].text).toContain('Núcleo Corrompido pulsa em dormência sombria');
    });
  });
});
