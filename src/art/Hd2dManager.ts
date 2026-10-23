/**
 * src/art/Hd2dManager.ts
 * Gerenciador de atmosfera e iluminação HD-2D-lite.
 * Implementa halos aditivos, sombras blob, vinheta, partículas ambientes e color grading.
 * Conforme STYLE_GUIDE.md v2.0 (Decisão D1) e QA.md Cat. 5.1–5.5.
 */

import { DISPLAY, PALETTE } from '@config/constants.ts';

export type QualityPreset = 'low' | 'medium' | 'high';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
}

export class Hd2dManager {
  private scene: any;
  private preset: QualityPreset = 'high';
  private timeOfDay: TimeOfDay = 'day';
  private reduceFlashes: boolean = false;

  private haloObjects: any[] = [];
  private shadowObjects: Map<any, any> = new Map();
  private particleList: any[] = [];
  private vignetteImage?: any;
  private colorGradeRect?: any;

  private isInternal3x: boolean = false;

  constructor(scene: any) {
    this.scene = scene;
    if (this.scene && typeof this.scene.add !== 'undefined') {
      this.initTextures();
    }
  }

  public getPreset(): QualityPreset {
    return this.preset;
  }

  public getTimeOfDay(): TimeOfDay {
    return this.timeOfDay;
  }

  public getReduceFlashes(): boolean {
    return this.reduceFlashes;
  }

  public setReduceFlashes(reduce: boolean): void {
    this.reduceFlashes = reduce;
  }

  public getIsInternal3x(): boolean {
    return this.isInternal3x;
  }

  private initTextures(): void {
    if (!this.scene?.textures || this.scene.textures.exists('hd2d_halo_amber')) {
      return;
    }

    // 1. Textura de Halo Aditivo (Gradiente radial âmbar)
    const haloG = this.scene.add.graphics();
    const haloRadius = 48;
    const center = haloRadius;
    const rings = 12;

    for (let r = rings; r > 0; r--) {
      const currentR = (r / rings) * haloRadius;
      const alpha = Math.pow(1 - (r / rings), 1.8) * 0.45;
      haloG.fillStyle(PALETTE.AMBER_LIGHT, alpha);
      haloG.fillCircle(center, center, currentR);
    }
    haloG.fillStyle(PALETTE.WHITE_HIGHLIGHT, 0.7);
    haloG.fillCircle(center, center, 4);

    haloG.generateTexture('hd2d_halo_amber', haloRadius * 2, haloRadius * 2);
    haloG.destroy();

    // 2. Textura de Sombra Blob (Elipse suave)
    const shadowG = this.scene.add.graphics();
    shadowG.fillStyle(PALETTE.SHADOW_PURPLE, 0.55);
    shadowG.fillEllipse(12, 6, 20, 8);
    shadowG.generateTexture('hd2d_blob_shadow', 24, 12);
    shadowG.destroy();

    // 3. Textura de Partícula de Éter
    const partG = this.scene.add.graphics();
    partG.fillStyle(PALETTE.AMBER_LIGHT, 0.9);
    partG.fillRect(0, 0, 2, 2);
    partG.fillStyle(PALETTE.WHITE_HIGHLIGHT, 0.8);
    partG.fillRect(0, 0, 1, 1);
    partG.generateTexture('hd2d_particle_amber', 2, 2);
    partG.destroy();

    // 4. Textura de Vinheta para 384x216
    const vigG = this.scene.add.graphics();
    const w = DISPLAY.WIDTH;
    const h = DISPLAY.HEIGHT;
    
    // Gradiente de cantos escuros
    vigG.fillStyle(PALETTE.SHADOW_DARKEST, 0.45);
    // Cantos externos
    vigG.fillRect(0, 0, w, 16);
    vigG.fillRect(0, h - 16, w, 16);
    vigG.fillRect(0, 0, 16, h);
    vigG.fillRect(w - 16, 0, 16, h);

    vigG.fillStyle(PALETTE.SHADOW_DARKEST, 0.25);
    vigG.fillRect(16, 16, w - 32, 12);
    vigG.fillRect(16, h - 28, w - 32, 12);
    vigG.fillRect(16, 16, 12, h - 32);
    vigG.fillRect(w - 28, 16, 12, h - 32);

    vigG.generateTexture('hd2d_vignette', w, h);
    vigG.destroy();
  }

  public setupLumenAtmosphere(lights: LightSource[]): void {
    if (!this.scene || !this.scene.add) return;

    this.clearAtmosphere();

    // 1. Color Grading Retângulo (Overlay ambiente âmbar suave)
    if (this.preset !== 'low') {
      this.colorGradeRect = this.scene.add.rectangle(
        0,
        0,
        DISPLAY.WIDTH,
        DISPLAY.HEIGHT,
        PALETTE.AMBER_LIGHT,
        0.05
      ).setOrigin(0, 0).setScrollFactor(0).setDepth(995);

      if (this.scene.renderer && typeof Phaser !== 'undefined' && Phaser.BlendModes) {
        this.colorGradeRect.setBlendMode(Phaser.BlendModes.ADD);
      }
    }

    // 2. Vinheta de Câmera
    if (this.preset !== 'low') {
      this.vignetteImage = this.scene.add.image(0, 0, 'hd2d_vignette')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(996)
        .setAlpha(0.65);
    }

    // 3. Halos Aditivos em Luzes Chave
    if (this.preset !== 'low') {
      lights.forEach(light => {
        const halo = this.scene.add.image(light.x, light.y, 'hd2d_halo_amber')
          .setOrigin(0.5, 0.5)
          .setDepth(light.y > 0 ? 12 : 8)
          .setAlpha(light.intensity);

        if (this.scene.renderer && typeof Phaser !== 'undefined' && Phaser.BlendModes) {
          halo.setBlendMode(Phaser.BlendModes.ADD);
        }

        if (this.preset === 'high' && this.scene.tweens) {
          this.scene.tweens.add({
            targets: halo,
            alpha: light.intensity * 0.75,
            scale: 1.08,
            duration: 1800 + Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }

        this.haloObjects.push(halo);
      });
    }

    // 4. Partículas Ambientes (Poeira de Éter / Vagalumes)
    const particleCount = this.preset === 'high' ? 24 : this.preset === 'medium' ? 10 : 0;
    for (let i = 0; i < particleCount; i++) {
      const px = Math.random() * DISPLAY.WIDTH * 2;
      const py = Math.random() * DISPLAY.HEIGHT * 2;
      const p = this.scene.add.image(px, py, 'hd2d_particle_amber')
        .setDepth(15)
        .setAlpha(0.3 + Math.random() * 0.5);

      (p as any).__baseY = py;
      (p as any).__speedY = 0.2 + Math.random() * 0.3;
      (p as any).__driftX = (Math.random() - 0.5) * 0.3;

      this.particleList.push(p);
    }
  }

  public registerEntityShadow(entity: any): void {
    if (!this.scene || !this.scene.add || this.preset === 'low') return;
    if (this.shadowObjects.has(entity)) return;

    const shadow = this.scene.add.image(entity.x || 0, (entity.y || 0) + 18, 'hd2d_blob_shadow')
      .setOrigin(0.5, 0.5)
      .setDepth(9)
      .setAlpha(0.55);

    this.shadowObjects.set(entity, shadow);
  }

  public unregisterEntityShadow(entity: any): void {
    if (this.shadowObjects.has(entity)) {
      const shadow = this.shadowObjects.get(entity);
      shadow.destroy();
      this.shadowObjects.delete(entity);
    }
  }

  public update(): void {
    // Atualiza posição das sombras para seguir entidades
    for (const [entity, shadow] of this.shadowObjects.entries()) {
      if (!entity || !entity.active) {
        shadow.destroy();
        this.shadowObjects.delete(entity);
      } else {
        shadow.setPosition(entity.x, entity.y + 18);
      }
    }

    // Animação leve das partículas
    const boundsW = DISPLAY.WIDTH * 2;
    const boundsH = DISPLAY.HEIGHT * 2;
    for (const p of this.particleList) {
      p.y -= (p as any).__speedY || 0.25;
      p.x += (p as any).__driftX || 0.1;
      if (p.y < 0) {
        p.y = boundsH;
        p.x = Math.random() * boundsW;
      }
    }
  }

  public setQuality(q: QualityPreset): void {
    this.preset = q;
    if (this.vignetteImage) {
      this.vignetteImage.setVisible(q !== 'low');
    }
    if (this.colorGradeRect) {
      this.colorGradeRect.setVisible(q !== 'low');
    }
    this.haloObjects.forEach(h => h.setVisible(q !== 'low'));
    this.particleList.forEach(p => p.setVisible(q !== 'low'));
    for (const shadow of this.shadowObjects.values()) {
      shadow.setVisible(q !== 'low');
    }
  }

  public setTimeOfDay(time: TimeOfDay): void {
    this.timeOfDay = time;
    if (!this.colorGradeRect) return;

    switch (time) {
      case 'dawn':
        this.colorGradeRect.setFillStyle(PALETTE.AMBER_LIGHT, 0.08);
        break;
      case 'day':
        this.colorGradeRect.setFillStyle(PALETTE.AMBER_MID, 0.04);
        break;
      case 'dusk':
        this.colorGradeRect.setFillStyle(PALETTE.VIOLET_MID, 0.1);
        break;
      case 'night':
        this.colorGradeRect.setFillStyle(PALETTE.SHADOW_PURPLE, 0.18);
        break;
    }
  }

  public setInternalScale(mode: 'native' | '3x'): void {
    if (!this.scene?.game?.scale) return;

    if (mode === '3x') {
      this.isInternal3x = true;
      this.scene.game.scale.resize(DISPLAY.WIDTH * 3, DISPLAY.HEIGHT * 3);
      if (this.scene.cameras?.main) {
        this.scene.cameras.main.setZoom(3);
      }
    } else {
      this.isInternal3x = false;
      this.scene.game.scale.resize(DISPLAY.WIDTH, DISPLAY.HEIGHT);
      if (this.scene.cameras?.main) {
        this.scene.cameras.main.setZoom(1);
      }
    }
  }

  public clearAtmosphere(): void {
    this.haloObjects.forEach(h => h.destroy());
    this.haloObjects = [];

    this.particleList.forEach(p => p.destroy());
    this.particleList = [];

    if (this.vignetteImage) {
      this.vignetteImage.destroy();
      this.vignetteImage = undefined;
    }

    if (this.colorGradeRect) {
      this.colorGradeRect.destroy();
      this.colorGradeRect = undefined;
    }
  }
}
