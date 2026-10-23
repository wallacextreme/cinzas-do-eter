/**
 * GameScene — Main Exploration Scene
 *
 * FASE 2: Exploração
 * - Unit 1: Map Transitions ✅
 * - Unit 2: Lumen Village ✅
 */

import { Scene } from 'phaser';
import { DISPLAY } from '@config/constants.ts';
import { InputManager } from '@systems/InputManager.ts';
import { createDefaultPlayer } from '@entities/Player.ts';
import { PlayerSprite } from '@entities/PlayerSprite.ts';
import { MapManager } from '@world/MapManager.ts';
import { MapTransitionManager } from '@world/MapTransitionManager.ts';
import { lumenVillageMap } from '@world/maps/LumenVillageMap.ts';
import { ashPlainsMap } from '@world/maps/AshPlainsMap.ts';
import { echoCaveEntranceMap } from '@world/maps/EchoCaveEntranceMap.ts';
import { echoCaveR2Map } from '@world/maps/EchoCaveR2Map.ts';
import { echoCaveR3Map } from '@world/maps/EchoCaveR3Map.ts';
import { echoCaveR4Map } from '@world/maps/EchoCaveR4Map.ts';
import { echoCaveR5Map } from '@world/maps/EchoCaveR5Map.ts';
import { echoCaveR6Map } from '@world/maps/EchoCaveR6Map.ts';
import { echoCaveR7Map } from '@world/maps/EchoCaveR7Map.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { InteractionManager } from '@world/InteractionManager.ts';
import { Signpost } from '@entities/Signpost.ts';
import { CrystalPillar } from '@entities/CrystalPillar.ts';
import { TreasureChest } from '@entities/TreasureChest.ts';
import { NPC } from '@entities/NPC.ts';
import { DialogueManager } from '@world/DialogueManager.ts';
import { DialogueBox } from '@ui/DialogueBox.ts';
import { gameState } from '@core/GameStateManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { ShopManager } from '@shop/ShopManager.ts';
import { ShopBox } from '@ui/ShopBox.ts';
import { PuzzleManager } from '@world/dungeon/PuzzleManager.ts';
import { ChestManager, chestManager } from '@world/dungeon/ChestManager.ts';
import { EquipmentManager } from '@systems/EquipmentManager.ts';
import { StatusManager } from '@systems/StatusManager.ts';
import { StatusBox } from '@ui/StatusBox.ts';
import { ItemUseManager } from '@systems/ItemUseManager.ts';
import { InventoryBox } from '@ui/InventoryBox.ts';
import { Hd2dManager } from '@art/Hd2dManager.ts';
import { PALETTE } from '@config/constants.ts';

export class GameScene extends Scene {
  private inputManager!: InputManager;
  private player!: PlayerSprite;
  private mapManager!: MapManager;
  private transitionManager!: MapTransitionManager;
  private interactionManager!: InteractionManager;
  private dialogueManager!: DialogueManager;
  private dialogueBox!: DialogueBox;
  private inventoryManager!: InventoryManager;
  private shopManager!: ShopManager;
  private shopBox!: ShopBox;
  private equipmentManager!: EquipmentManager;
  private statusManager!: StatusManager;
  private statusBox!: StatusBox;
  private itemUseManager!: ItemUseManager;
  private inventoryBox!: InventoryBox;
  private puzzleManager!: PuzzleManager;
  private chestManager!: ChestManager;
  private npcs: NPC[] = [];
  private signposts: { id: string; sprite: Phaser.GameObjects.GameObject }[] = [];
  private pillars: CrystalPillar[] = [];
  private chests: TreasureChest[] = [];
  private dungeonVisuals: Phaser.GameObjects.GameObject[] = [];
  private areaTitleText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;
  private currentCollider?: Phaser.Physics.Arcade.Collider;
  private currentCollisionLayer?: Phaser.Tilemaps.TilemapLayer;
  public hd2dManager!: Hd2dManager;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // ── Input Setup ────────────────────────────────────
    this.inputManager = new InputManager();
    this.inputManager.bindToScene(this);

    // Ensure gameState is EXPLORING
    if (gameState.getPhase() === 'BOOT') gameState.transitionTo('LOADING');
    if (gameState.getPhase() === 'LOADING') gameState.transitionTo('EXPLORING');

    // ── Dialogue System Setup ──────────────────────────
    this.dialogueManager = new DialogueManager();
    this.dialogueBox = new DialogueBox(this, this.dialogueManager, this.inputManager);

    // ── Inventory & Shop System Setup ──────────────────
    this.inventoryManager = new InventoryManager();
    this.equipmentManager = new EquipmentManager(this.inventoryManager);
    this.itemUseManager = new ItemUseManager(this.inventoryManager, this.equipmentManager);
    this.statusManager = new StatusManager(this.equipmentManager);
    this.statusBox = new StatusBox(this, this.statusManager, this.inputManager);
    this.inventoryBox = new InventoryBox(
      this,
      this.inventoryManager,
      this.itemUseManager,
      this.inputManager
    );
    this.shopManager = new ShopManager(this.inventoryManager);
    this.shopBox = new ShopBox(this, this.shopManager, this.inputManager);

    // ── Puzzle & Chest Systems Setup ───────────────────
    this.puzzleManager = new PuzzleManager();
    this.chestManager = chestManager;

    EventBus.on('dialog:end', this.handleDialogEnd, this);
    EventBus.on('puzzle:solved', this.handlePuzzleSolved, this);
    EventBus.on('menu:statusClosed', () => {
      if (gameState.getPhase() === 'MENU') {
        gameState.transitionTo('EXPLORING');
      }
    }, this);
    EventBus.on('menu:inventoryClosed', () => {
      if (gameState.getPhase() === 'MENU') {
        gameState.transitionTo('EXPLORING');
      }
    }, this);

    // ── Map Setup ──────────────────────────────────────
    this.mapManager = new MapManager();

    // ── Player Setup ───────────────────────────────────
    const cx = DISPLAY.WIDTH / 2;
    const cy = DISPLAY.HEIGHT / 2;
    
    const playerState = createDefaultPlayer();
    this.player = new PlayerSprite(this, cx, cy, playerState, this.inputManager);

    // ── Transition Manager Setup ───────────────────────
    this.transitionManager = new MapTransitionManager(this, this.mapManager, this.player);
    this.transitionManager.registerMap(lumenVillageMap);
    this.transitionManager.registerMap(ashPlainsMap);
    this.transitionManager.registerMap(echoCaveEntranceMap);
    this.transitionManager.registerMap(echoCaveR2Map);
    this.transitionManager.registerMap(echoCaveR3Map);
    this.transitionManager.registerMap(echoCaveR4Map);
    this.transitionManager.registerMap(echoCaveR5Map);
    this.transitionManager.registerMap(echoCaveR6Map);
    this.transitionManager.registerMap(echoCaveR7Map);

    // ── Interaction Setup ──────────────────────────────
    this.interactionManager = new InteractionManager(this, this.player, this.inputManager);

    // Initial map load
    this.currentCollisionLayer = this.mapManager.loadMap(this, lumenVillageMap);
    this.currentCollider = this.physics.add.collider(this.player, this.currentCollisionLayer);
    
    // Spawn map entities (NPCs and Signposts)
    this.spawnEntities(lumenVillageMap);
    
    const centerSpawn = lumenVillageMap.spawnPoints['spawn_center'];
    this.player.setPosition(centerSpawn.x, centerSpawn.y);

    // ── Camera Setup ───────────────────────────────────
    const mapBounds = this.mapManager.getBounds();
    this.cameras.main.setBounds(0, 0, mapBounds.width, mapBounds.height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── HD-2D-lite Atmosphere Setup ────────────────────
    this.hd2dManager = new Hd2dManager(this);
    this.setupHd2dForMap(lumenVillageMap.id);

    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>)['__GAME_SCENE__'] = this;
      (window as unknown as Record<string, unknown>)['__HD2D_MANAGER__'] = this.hd2dManager;
      (window as unknown as Record<string, unknown>)['__DIALOGUE_MANAGER__'] = this.dialogueManager;
      (window as unknown as Record<string, unknown>)['__PLAYER__'] = this.player;
      (window as unknown as Record<string, unknown>)['__INVENTORY_MANAGER__'] = this.inventoryManager;
      (window as unknown as Record<string, unknown>)['__SHOP_MANAGER__'] = this.shopManager;
      (window as unknown as Record<string, unknown>)['__SHOP_BOX__'] = this.shopBox;
      (window as unknown as Record<string, unknown>)['__PUZZLE_MANAGER__'] = this.puzzleManager;
      (window as unknown as Record<string, unknown>)['__CHEST_MANAGER__'] = this.chestManager;
      (window as unknown as Record<string, unknown>)['__EQUIPMENT_MANAGER__'] = this.equipmentManager;
      (window as unknown as Record<string, unknown>)['__STATUS_MANAGER__'] = this.statusManager;
      (window as unknown as Record<string, unknown>)['__STATUS_BOX__'] = this.statusBox;
      (window as unknown as Record<string, unknown>)['__ITEM_USE_MANAGER__'] = this.itemUseManager;
      (window as unknown as Record<string, unknown>)['__INVENTORY_BOX__'] = this.inventoryBox;
      (window as unknown as Record<string, unknown>)['__TRANSITION_MANAGER__'] = this.transitionManager;
      (window as unknown as Record<string, unknown>)['__MAP_MANAGER__'] = this.mapManager;
    }

    // ── Events ─────────────────────────────────────────
    EventBus.on('map:transitionStart', this.handleMapTransitionStart, this);
    EventBus.on('map:transitionEnd', this.handleMapTransitionEnd, this);

    // ── Debug Display ──────────────────────────────────
    this.areaTitleText = this.add.text(cx, 4, lumenVillageMap.displayName, {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#E8C876',
      align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.debugText = this.add.text(cx, DISPLAY.HEIGHT - 8, 'Input: nenhum', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#4EC8D4',
      align: 'center',
    }).setOrigin(0.5, 1).setScrollFactor(0);

    console.log('[GameScene] Lumen Village loaded');
  }

  private handleMapTransitionStart(): void {
    if (this.currentCollider) {
      this.currentCollider.active = false;
    }
  }

  private handleMapTransitionEnd(payload: any) {
    if (this.currentCollider) {
      this.currentCollider.destroy();
    }
    this.currentCollisionLayer = payload.collisionLayer;
    this.currentCollider = this.physics.add.collider(this.player, this.currentCollisionLayer!);
    
    // Update title and spawn entities for the newly loaded map
    const mapData = this.mapManager.getCurrentMapData();
    if (mapData) {
      if (this.areaTitleText) {
        this.areaTitleText.setText(mapData.displayName);
      }
      this.spawnEntities(mapData);
      this.setupHd2dForMap(mapData.id);
    }
  }

  public setupHd2dForMap(mapId: string): void {
    if (!this.hd2dManager) return;
    if (mapId === 'lumen_village') {
      this.hd2dManager.setupLumenAtmosphere([
        { x: 20 * 16, y: 18 * 16, radius: 48, color: PALETTE.AMBER_LIGHT, intensity: 0.85 },
        { x: 14 * 16, y: 19 * 16, radius: 32, color: PALETTE.AMBER_MID, intensity: 0.65 },
        { x: 26 * 16, y: 19 * 16, radius: 32, color: PALETTE.AMBER_MID, intensity: 0.65 },
      ]);
      this.hd2dManager.registerEntityShadow(this.player);
      for (const npc of this.npcs) {
        this.hd2dManager.registerEntityShadow(npc);
      }
    } else {
      this.hd2dManager.clearAtmosphere();
      this.hd2dManager.registerEntityShadow(this.player);
    }
  }

  private clearEntities(): void {
    // Unregister and destroy NPCs
    for (const npc of this.npcs) {
      this.interactionManager.unregisterEntity(npc.id);
      if (this.hd2dManager) {
        this.hd2dManager.unregisterEntityShadow(npc);
      }
      npc.destroy();
    }
    this.npcs = [];

    // Unregister and destroy Signposts
    for (const s of this.signposts) {
      this.interactionManager.unregisterEntity(s.id);
      s.sprite.destroy();
    }
    this.signposts = [];

    // Unregister and destroy Pillars
    for (const p of this.pillars) {
      this.interactionManager.unregisterEntity(p.id);
    }
    this.pillars = [];

    // Unregister and destroy Chests
    for (const c of this.chests) {
      this.interactionManager.unregisterEntity(c.id);
    }
    this.chests = [];

    // Destroy any visual artifacts (sprites, labels)
    for (const v of this.dungeonVisuals) {
      v.destroy();
    }
    this.dungeonVisuals = [];
  }

  private spawnEntities(mapData: any): void {
    this.clearEntities();
    
    if (mapData.entities) {
      for (const e of mapData.entities) {
        if (e.type === 'npc') {
          const texture = e.entityId;
          const npc = new NPC(this, e.x, e.y, texture, e.entityId, `dialogue_${e.entityId}`);
          this.npcs.push(npc);
          if (this.hd2dManager) {
            this.hd2dManager.registerEntityShadow(npc);
          }
          this.physics.add.collider(this.player, npc);
          this.interactionManager.registerEntity(npc);
        } else if (e.type === 'object') {
          let text = 'Informação';
          if (e.entityId === 'sign_1') text = 'Bem-vindo a Vila de Lumen!';
          if (e.entityId === 'sign_ash_plains') text = 'Planície das Cinzas — Perigo ao Sul: Gruta do Eco.';
          if (e.entityId === 'stele_r3_clue') text = 'O Éter desperta primeiro no solo profundo (Âmbar), eleva-se no manto místico (Violeta) e ressoa na luz do zênite (Celeste).';
          if (e.entityId === 'altar_corrupted_core') text = 'Um pedestal esculpido em pedra escura sustenta um receptáculo silencioso. O Núcleo Corrompido pulsa em dormência sombria no interior do santuário.';

          const sign = new Signpost(e.entityId, e.x, e.y, text);
          let signSprite: Phaser.GameObjects.GameObject;
          if (e.entityId === 'stele_r3_clue') {
            signSprite = this.add.image(sign.x, sign.y, 'stele_clue').setDepth(10);
          } else if (e.entityId === 'altar_corrupted_core') {
            signSprite = this.add.rectangle(sign.x, sign.y, 20, 20, 0x4A2875).setStrokeStyle(1, 0x2E9AA5).setDepth(10);
          } else {
            signSprite = this.add.rectangle(sign.x, sign.y, 16, 16, 0x884422).setDepth(10);
          }
          this.dialogueManager.registerDialogue({
            id: `dialogue_${e.entityId}`,
            messages: [{ speakerName: e.entityId === 'altar_corrupted_core' ? 'Altar do Eco' : 'Placa', text }],
          });
          this.signposts.push({ id: sign.id, sprite: signSprite });
          this.interactionManager.registerEntity(sign);
        } else if (e.type === 'pillar') {
          const pillar = new CrystalPillar(e.entityId, e.x, e.y, this.puzzleManager, this.dialogueManager);
          this.pillars.push(pillar);
          this.interactionManager.registerEntity(pillar);

          const sprite = this.add.image(e.x, e.y, e.entityId).setDepth(10);
          const labelColor = e.entityId.includes('amber') ? '#E8C876' : e.entityId.includes('violet') ? '#9B6DD7' : '#7DE8F0';
          const labelText = e.entityId.includes('amber') ? 'ÂMBAR' : e.entityId.includes('violet') ? 'VIOLETA' : 'CELESTE';
          const label = this.add.text(e.x, e.y - 12, labelText, {
            fontSize: '6px',
            fontFamily: 'monospace',
            color: labelColor,
          }).setOrigin(0.5, 0.5).setDepth(11);

          this.dungeonVisuals.push(sprite, label);
        } else if (e.type === 'chest') {
          const isOpened = this.chestManager.isChestOpened(e.entityId);
          const chestSprite = this.add.image(e.x, e.y, isOpened ? 'chest_opened' : 'chest_closed').setDepth(10);
          const label = this.add.text(e.x, e.y - 12, 'BAÚ', {
            fontSize: '6px',
            fontFamily: 'monospace',
            color: '#E8C876',
          }).setOrigin(0.5, 0.5).setDepth(11);

          const chest = new TreasureChest(
            e.entityId,
            e.x,
            e.y,
            'amber_pendant',
            this.chestManager,
            this.inventoryManager,
            this.dialogueManager,
            (newState) => {
              if (newState === 'OPENED') {
                chestSprite.setTexture('chest_opened');
              }
            }
          );
          this.chests.push(chest);
          this.interactionManager.registerEntity(chest);
          this.dungeonVisuals.push(chestSprite, label);
        }
      }
    }

    // If R4 is loaded and puzzle is solved, render the Ether Bridge
    if (mapData.id === 'echo_cave_r4' && this.puzzleManager.isSolved()) {
      this.applyEtherBridge();
    }
  }

  private handlePuzzleSolved(): void {
    if (this.mapManager.getCurrentMapId() === 'echo_cave_r4') {
      this.applyEtherBridge();
      this.cameras.main.flash(500, 125, 232, 240, false);
    }
  }

  private applyEtherBridge(): void {
    const bridgeCols = [16, 17];
    const bridgeRows = [8, 9, 10];
    for (const c of bridgeCols) {
      for (const r of bridgeRows) {
        this.mapManager.setTile('Ground', c, r, 13);
        this.mapManager.removeTile('Walls', c, r);
      }
    }
    this.mapManager.recalculateWallCollisions();
  }

  private handleDialogEnd(payload: { dialogId: string }): void {
    if (payload.dialogId === 'dialogue_npc_torvak') {
      this.shopBox.open('shop_torvak');
    }
  }

  update(_time: number, delta: number): void {
    if (this.hd2dManager) {
      this.hd2dManager.update();
    }

    // Only update gameplay systems if not transitioning
    if (!this.transitionManager.getIsTransitioning()) {
      this.inputManager.update();

      if (this.shopBox.visible) {
        // Freeze player movement during shop
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body) {
          body.setVelocity(0, 0);
        }
        this.shopBox.update(delta);
      } else if (this.statusBox.visible) {
        // Freeze player movement during status menu
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body) {
          body.setVelocity(0, 0);
        }
        this.statusBox.update(delta);
      } else if (this.inventoryBox.visible) {
        // Freeze player movement during inventory menu
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body) {
          body.setVelocity(0, 0);
        }
        this.inventoryBox.update(delta);
      } else {
        const canOpenStatus =
          gameState.getPhase() === 'EXPLORING' &&
          !this.dialogueManager.isDialogueActive() &&
          !this.transitionManager.getIsTransitioning() &&
          !this.shopBox.visible &&
          !this.inventoryBox.visible;

        const canOpenInventory =
          gameState.getPhase() === 'EXPLORING' &&
          !this.dialogueManager.isDialogueActive() &&
          !this.transitionManager.getIsTransitioning() &&
          !this.shopBox.visible &&
          !this.statusBox.visible;

        if (canOpenStatus && this.inputManager.isActionJustPressed('MENU')) {
          this.inputManager.consumeAction('MENU');
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.setVelocity(0, 0);
          }
          gameState.transitionTo('MENU');
          this.statusBox.open(this.player.getPlayerState());
        } else if (canOpenInventory && this.inputManager.isActionJustPressed('INVENTORY')) {
          this.inputManager.consumeAction('INVENTORY');
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.setVelocity(0, 0);
          }
          gameState.transitionTo('MENU');
          this.inventoryBox.open(this.player.getPlayerState());
        } else {
          this.player.update();
          this.interactionManager.update();
          this.dialogueBox.update(delta);
          
          // Check for transition zones only if dialogue is not active
          if (!this.dialogueManager.isDialogueActive()) {
            const mapData = this.mapManager.getCurrentMapData();
            if (mapData) {
              for (const zone of mapData.transitions) {
                const px = this.player.x;
                const py = this.player.y;
                
                if (px >= zone.x && px <= zone.x + zone.width && py >= zone.y && py <= zone.y + zone.height) {
                  this.transitionManager.transitionToMap(zone.targetMapId, zone.targetSpawnId);
                }
              }
            }
          }
        }
      }
    }

    // Debug: show which movement actions are active
    const actions: string[] = [];
    if (this.inputManager.isActionDown('MOVE_UP')) actions.push('↑');
    if (this.inputManager.isActionDown('MOVE_DOWN')) actions.push('↓');
    if (this.inputManager.isActionDown('MOVE_LEFT')) actions.push('←');
    if (this.inputManager.isActionDown('MOVE_RIGHT')) actions.push('→');
    if (this.inputManager.isActionJustPressed('CONFIRM')) actions.push('[Z]');
    if (this.inputManager.isActionJustPressed('CANCEL')) actions.push('[X]');
    if (this.inputManager.isActionJustPressed('MENU')) actions.push('[M]');
    if (this.inputManager.isActionJustPressed('INVENTORY')) actions.push('[I]');

    this.debugText.setText(actions.length > 0 ? `Input: ${actions.join(' ')}` : 'Input: nenhum');
  }
}
