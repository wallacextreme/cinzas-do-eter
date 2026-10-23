/**
 * PreloadScene — Asset Loading Infrastructure
 *
 * FASE 1/2: Generates minimal placeholder textures programmatically.
 * No external assets are loaded — all graphics are code-generated.
 *
 * Future phases will load real spritesheets and tilesets here.
 * This scene exists to establish the loading pipeline and provide
 * placeholder visuals for movement/collision testing.
 */

import { Scene } from 'phaser';
import { SPRITE, PALETTE, DISPLAY } from '@config/constants.ts';
import { gameState } from '@core/GameStateManager.ts';

/** Keys for placeholder textures generated in this scene */
export const TEX = {
  PLAYER: 'placeholder_player',
  PLAYER_DOWN_0: 'char_kael_down_0',
  PLAYER_DOWN_1: 'char_kael_down_1',
  PLAYER_DOWN_2: 'char_kael_down_2',
  PLAYER_UP_0: 'char_kael_up_0',
  PLAYER_UP_1: 'char_kael_up_1',
  PLAYER_UP_2: 'char_kael_up_2',
  PLAYER_LEFT_0: 'char_kael_left_0',
  PLAYER_LEFT_1: 'char_kael_left_1',
  PLAYER_LEFT_2: 'char_kael_left_2',
  PLAYER_RIGHT_0: 'char_kael_right_0',
  PLAYER_RIGHT_1: 'char_kael_right_1',
  PLAYER_RIGHT_2: 'char_kael_right_2',
  TILE_FLOOR: 'placeholder_floor',
  TILE_WALL: 'placeholder_wall',
  TILE_OBSTACLE: 'placeholder_obstacle',
  // Lumen Village specific placeholders
  TILE_GRASS: 'tile_grass',
  TILE_PATH: 'tile_path',
  TILE_HOUSE_WALL: 'tile_house_wall',
  TILE_DOOR: 'tile_door',
  TILE_CORE: 'tile_core',
  // NPCs
  NPC_LIA: 'npc_lia',
  NPC_TORVAK: 'npc_torvak',
} as const;

import manifestData from '../../art/assets.manifest.json';
import { AssetLoader } from '@art/AssetLoader.ts';
import { registerKaelAnimations } from '../data/animations/kaelAnimations.ts';

export class PreloadScene extends Scene {
  private assetLoader: AssetLoader;

  constructor() {
    super({ key: 'PreloadScene' });
    this.assetLoader = new AssetLoader(manifestData as any);
  }

  preload(): void {
    const queued = this.assetLoader.queueManifestAssets(this);
    if (queued > 0) {
      console.log(`[PreloadScene] Enfileirados ${queued} assets do manifesto.`);
    }
  }

  create(): void {
    this.generatePlaceholderTextures();
    this.createPlayerAnimations();
    this.showLoadingComplete();

    // Transition to GameScene after a brief moment
    this.time.delayedCall(400, () => {
      gameState.transitionTo('EXPLORING');
      this.scene.start('GameScene');
    });
  }

  /**
   * Generate minimal placeholder textures using Phaser's Graphics API.
   * These are temporary visuals for technical validation only.
   * They will be replaced by proper pixel art in later phases.
   */
  private generatePlaceholderTextures(): void {
    // Player directional textures: 32×48 pixel art with walk cycle frames
    this.generatePlayerTextures();

    // NPCs
    this.generateNPCTexture(TEX.NPC_LIA, PALETTE.CRYSTAL_LIGHT);
    this.generateNPCTexture(TEX.NPC_TORVAK, PALETTE.EARTH_LIGHT);

    // Dungeon entities
    this.generateDungeonTextures();

    // Generate one combined tileset for all Phase 2 map tiles
    this.generateTilesetTexture();
  }

  private generateTilesetTexture(): void {
    const g = this.add.graphics();
    const s = SPRITE.TILE_SIZE;

    // Define the tiles: index 0 is dummy/empty so GID 1..12 map directly to their 1-based indices
    const tiles = [
      { fill: 0x000000, border: 0x000000 },                          // 0: EMPTY / DUMMY
      { fill: PALETTE.EARTH_MID, border: PALETTE.EARTH_DARK },        // 1: FLOOR
      { fill: PALETTE.SHADOW_DEEP, border: PALETTE.VIOLET_DARK },     // 2: WALL
      { fill: PALETTE.GRAY_ASH, border: PALETTE.SHADOW_PURPLE },      // 3: OBSTACLE
      { fill: PALETTE.AMBER_DARK, border: PALETTE.EARTH_DARK },       // 4: GRASS
      { fill: PALETTE.EARTH_MID, border: PALETTE.EARTH_DARK },        // 5: PATH
      { fill: PALETTE.EARTH_LIGHT, border: PALETTE.EARTH_DARK },      // 6: HOUSE_WALL
      { fill: PALETTE.AMBER_MID, border: PALETTE.EARTH_DARK },        // 7: DOOR
      { fill: PALETTE.CRYSTAL_MID, border: PALETTE.CRYSTAL_DARK },    // 8: CORE
      { fill: PALETTE.GRAY_DEAD, border: PALETTE.GRAY_ASH },          // 9: ASH_GROUND
      { fill: PALETTE.SHADOW_DEEP, border: PALETTE.SHADOW_PURPLE },   // 10: DEAD_ROCK
      { fill: PALETTE.GRAY_BONE, border: PALETTE.GRAY_DEAD },         // 11: DORMANT_CRYSTAL
      { fill: PALETTE.SHADOW_DARKEST, border: PALETTE.VIOLET_DARK },  // 12: CAVE_ENTRANCE
      { fill: PALETTE.CRYSTAL_LIGHT, border: PALETTE.VIOLET_LIGHT },  // 13: ETHER_BRIDGE
      { fill: PALETTE.SHADOW_DARKEST, border: 0x000000 },             // 14: CHASM
      { fill: PALETTE.VIOLET_DARK, border: PALETTE.CRYSTAL_DARK },    // 15: ALTAR
    ];

    tiles.forEach((tile, index) => {
      const x = index * s;
      
      // Border
      g.fillStyle(tile.border);
      g.fillRect(x, 0, s, s);

      // Fill
      g.fillStyle(tile.fill);
      g.fillRect(x + 1, 1, s - 2, s - 2);
    });

    g.generateTexture('placeholder_tileset', s * tiles.length, s);
    g.destroy();
  }

  private generatePlayerTextures(): void {
    const w = SPRITE.CHAR_WIDTH;  // 32
    const h = SPRITE.CHAR_HEIGHT; // 48
    const dirs = ['down', 'up', 'left', 'right'];

    dirs.forEach(dir => {
      for (let frame = 0; frame < 3; frame++) {
        const g = this.add.graphics();

        // 1. Base Silhouette outline (Violet dark as per STYLE_GUIDE #4A2875)
        g.fillStyle(PALETTE.VIOLET_DARK);
        g.fillRect(4, 2, 24, 44);

        // 2. Cloak & Hood (Earth tones: light and mid)
        g.fillStyle(PALETTE.EARTH_LIGHT);
        g.fillRect(6, 4, 20, 32);

        g.fillStyle(PALETTE.EARTH_MID);
        g.fillRect(8, 6, 16, 28);

        // 3. Direction-specific features
        if (dir === 'down') {
          // Hair and face
          g.fillStyle(PALETTE.EARTH_DARK);
          g.fillRect(10, 6, 12, 6);
          g.fillStyle(PALETTE.WHITE_HIGHLIGHT);
          g.fillRect(11, 10, 10, 6);
          // Eyes in violet
          g.fillStyle(PALETTE.VIOLET_DARK);
          g.fillRect(12, 12, 2, 2);
          g.fillRect(18, 12, 2, 2);
          // Amber Tuning Pendant
          g.fillStyle(PALETTE.AMBER_LIGHT);
          g.fillRect(15, 20, 2, 4);

          // Boots & Legs animation
          g.fillStyle(PALETTE.EARTH_DARK);
          if (frame === 0) {
            g.fillRect(10, 38, 4, 7);
            g.fillRect(18, 38, 4, 7);
          } else if (frame === 1) {
            g.fillRect(10, 37, 4, 9); // left leg forward
            g.fillRect(18, 39, 4, 5); // right leg back
          } else {
            g.fillRect(10, 39, 4, 5); // left leg back
            g.fillRect(18, 37, 4, 9); // right leg forward
          }
        } else if (dir === 'up') {
          // Hood back
          g.fillStyle(PALETTE.EARTH_DARK);
          g.fillRect(10, 6, 12, 10);
          g.fillStyle(PALETTE.EARTH_LIGHT);
          g.fillRect(14, 14, 4, 18); // Cloak spine highlight

          // Boots
          g.fillStyle(PALETTE.EARTH_DARK);
          if (frame === 0) {
            g.fillRect(10, 38, 4, 7);
            g.fillRect(18, 38, 4, 7);
          } else if (frame === 1) {
            g.fillRect(10, 36, 4, 8);
            g.fillRect(18, 40, 4, 5);
          } else {
            g.fillRect(10, 40, 4, 5);
            g.fillRect(18, 36, 4, 8);
          }
        } else if (dir === 'left') {
          // Side profile left
          g.fillStyle(PALETTE.EARTH_DARK);
          g.fillRect(8, 6, 12, 6);
          g.fillStyle(PALETTE.WHITE_HIGHLIGHT);
          g.fillRect(7, 10, 6, 6);
          g.fillStyle(PALETTE.VIOLET_DARK);
          g.fillRect(8, 12, 2, 2);

          // Tuning Staff (Left side)
          g.fillStyle(PALETTE.GRAY_BONE);
          g.fillRect(5, 14, 2, 24);
          g.fillStyle(PALETTE.AMBER_LIGHT);
          g.fillRect(4, 12, 4, 4);

          // Legs walk
          g.fillStyle(PALETTE.EARTH_DARK);
          if (frame === 0) {
            g.fillRect(12, 38, 6, 7);
          } else if (frame === 1) {
            g.fillRect(9, 38, 5, 7);
            g.fillRect(16, 38, 4, 6);
          } else {
            g.fillRect(15, 38, 5, 7);
            g.fillRect(10, 38, 4, 6);
          }
        } else if (dir === 'right') {
          // Side profile right
          g.fillStyle(PALETTE.EARTH_DARK);
          g.fillRect(12, 6, 12, 6);
          g.fillStyle(PALETTE.WHITE_HIGHLIGHT);
          g.fillRect(19, 10, 6, 6);
          g.fillStyle(PALETTE.VIOLET_DARK);
          g.fillRect(22, 12, 2, 2);

          // Tuning Staff (Right side)
          g.fillStyle(PALETTE.GRAY_BONE);
          g.fillRect(25, 14, 2, 24);
          g.fillStyle(PALETTE.AMBER_LIGHT);
          g.fillRect(24, 12, 4, 4);

          // Legs walk
          g.fillStyle(PALETTE.EARTH_DARK);
          if (frame === 0) {
            g.fillRect(14, 38, 6, 7);
          } else if (frame === 1) {
            g.fillRect(18, 38, 5, 7);
            g.fillRect(12, 38, 4, 6);
          } else {
            g.fillRect(12, 38, 5, 7);
            g.fillRect(18, 38, 4, 6);
          }
        }

        const key = `char_kael_${dir}_${frame}`;
        g.generateTexture(key, w, h);
        g.destroy();
      }
    });

    // Generate legacy TEX.PLAYER as alias for initial backwards compatibility
    const fallback = this.add.graphics();
    fallback.fillStyle(PALETTE.VIOLET_DARK);
    fallback.fillRect(4, 2, 24, 44);
    fallback.fillStyle(PALETTE.EARTH_LIGHT);
    fallback.fillRect(6, 4, 20, 32);
    fallback.fillStyle(PALETTE.WHITE_HIGHLIGHT);
    fallback.fillRect(11, 10, 10, 6);
    fallback.generateTexture(TEX.PLAYER, w, h);
    fallback.destroy();
  }

  private createPlayerAnimations(): void {
    // 1. Se os spritesheets reais foram carregados pelo AssetLoader, registra as animações orientadas a dados
    if (this.textures.exists('char_kael_field')) {
      registerKaelAnimations(this.anims);
      return;
    }

    // 2. Fallback determinístico para texturas procedurais caso os assets reais não tenham sido carregados
    const directions = ['down', 'up', 'left', 'right'];
    directions.forEach((dir) => {
      // Walk cycle: frame 1 -> frame 0 -> frame 2 -> frame 0 (8 fps)
      if (!this.anims.exists(`kael_walk_${dir}`)) {
        this.anims.create({
          key: `kael_walk_${dir}`,
          frames: [
            { key: `char_kael_${dir}_1` },
            { key: `char_kael_${dir}_0` },
            { key: `char_kael_${dir}_2` },
            { key: `char_kael_${dir}_0` },
          ],
          frameRate: 8,
          repeat: -1,
        });
      }

      // Idle breathing pose
      if (!this.anims.exists(`kael_idle_${dir}`)) {
        this.anims.create({
          key: `kael_idle_${dir}`,
          frames: [{ key: `char_kael_${dir}_0` }],
          frameRate: 1,
          repeat: -1,
        });
      }
    });
  }



  private generateNPCTexture(key: string, bodyColor: number): void {
    const g = this.add.graphics();
    const w = SPRITE.CHAR_WIDTH;
    const h = SPRITE.CHAR_HEIGHT;

    // Outline in shadow deep
    g.fillStyle(PALETTE.SHADOW_DEEP);
    g.fillRect(0, 0, w, h);

    // Body fill
    g.fillStyle(bodyColor);
    g.fillRect(2, 2, w - 4, h - 4);

    // Head region
    g.fillStyle(PALETTE.WHITE_HIGHLIGHT);
    g.fillRect(4, 4, w - 8, Math.floor(h / 3) - 4);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private generateDungeonTextures(): void {
    const s = SPRITE.TILE_SIZE; // 16px

    // 1. Crystal Pillars (Amber, Violet, Celeste)
    const pillars = [
      { key: 'pillar_amber', gemColor: PALETTE.AMBER_LIGHT, glowColor: PALETTE.AMBER_MID },
      { key: 'pillar_violet', gemColor: PALETTE.VIOLET_LIGHT, glowColor: PALETTE.VIOLET_MID },
      { key: 'pillar_celeste', gemColor: PALETTE.CRYSTAL_LIGHT, glowColor: PALETTE.CRYSTAL_MID },
    ];

    pillars.forEach(p => {
      const g = this.add.graphics();
      // Stone base & shaft
      g.fillStyle(PALETTE.SHADOW_DEEP);
      g.fillRect(2, 6, 12, 10);
      g.fillStyle(PALETTE.GRAY_ASH);
      g.fillRect(3, 8, 10, 7);

      // Glowing crystal crown
      g.fillStyle(p.glowColor);
      g.fillRect(4, 1, 8, 7);
      g.fillStyle(p.gemColor);
      g.fillRect(5, 2, 6, 5);
      g.fillStyle(PALETTE.WHITE_HIGHLIGHT);
      g.fillRect(6, 3, 2, 2);

      g.generateTexture(p.key, s, s);
      g.destroy();
    });

    // 2. Stele of Clue (Ancient Rune Stone)
    const steleG = this.add.graphics();
    steleG.fillStyle(PALETTE.SHADOW_DARKEST);
    steleG.fillRect(2, 1, 12, 15);
    steleG.fillStyle(PALETTE.SHADOW_PURPLE);
    steleG.fillRect(3, 2, 10, 13);
    // Cyan glowing inscriptions
    steleG.fillStyle(PALETTE.CRYSTAL_LIGHT);
    steleG.fillRect(5, 4, 6, 1);
    steleG.fillRect(5, 7, 6, 1);
    steleG.fillRect(5, 10, 4, 1);
    steleG.generateTexture('stele_clue', s, s);
    steleG.destroy();

    // 3. Chest Closed
    const chestClosedG = this.add.graphics();
    chestClosedG.fillStyle(PALETTE.SHADOW_PURPLE);
    chestClosedG.fillRect(1, 3, 14, 12);
    chestClosedG.fillStyle(PALETTE.EARTH_MID);
    chestClosedG.fillRect(2, 4, 12, 10);
    // Iron banding
    chestClosedG.fillStyle(PALETTE.EARTH_DARK);
    chestClosedG.fillRect(2, 7, 12, 2);
    // Amber lock
    chestClosedG.fillStyle(PALETTE.AMBER_LIGHT);
    chestClosedG.fillRect(7, 7, 2, 3);
    chestClosedG.generateTexture('chest_closed', s, s);
    chestClosedG.destroy();

    // 4. Chest Opened
    const chestOpenG = this.add.graphics();
    chestOpenG.fillStyle(PALETTE.SHADOW_PURPLE);
    chestOpenG.fillRect(1, 1, 14, 14);
    // Lid open upwards
    chestOpenG.fillStyle(PALETTE.EARTH_LIGHT);
    chestOpenG.fillRect(2, 1, 12, 4);
    // Deep chest cavity
    chestOpenG.fillStyle(PALETTE.SHADOW_DARKEST);
    chestOpenG.fillRect(2, 6, 12, 8);
    chestOpenG.fillStyle(PALETTE.EARTH_MID);
    chestOpenG.fillRect(3, 11, 10, 3);
    chestOpenG.generateTexture('chest_opened', s, s);
    chestOpenG.destroy();
  }

  private showLoadingComplete(): void {
    const cx = DISPLAY.WIDTH / 2;
    const cy = DISPLAY.HEIGHT / 2;

    this.add.text(cx, cy, 'Carregando...', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#9B6DD7',
      align: 'center',
    }).setOrigin(0.5);
  }
}
