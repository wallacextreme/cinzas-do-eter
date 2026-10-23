/**
 * src/art/AssetLoader.ts
 * Carregador de assets orientado ao manifesto (art/assets.manifest.json).
 * Suporta spritesheets, imagens simples, validação de integridade e
 * fallback determinístico para texturas procedurais quando um asset não existir.
 */

export interface AssetRow {
  name: string;
  frames: number;
  fps: number;
  baseline?: number;
  hold?: number;
}

export interface AssetEntry {
  id: string;
  path: string;
  type:
    | 'char'
    | 'npc'
    | 'enemy'
    | 'boss'
    | 'portrait'
    | 'tileset'
    | 'tile'
    | 'prop'
    | 'icon'
    | 'ui'
    | 'bg'
    | 'fx'
    | 'font';
  frame?: [number, number];
  grid?: [number, number];
  rows?: AssetRow[];
  origin?: 'ai-processed' | 'procedural' | 'hand';
  source?: string;
  promptRef?: string;
  generator?: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED';
  evidence?: string[];
  maxColors?: number;
  outline?: string[];
  softAlpha?: boolean;
}

export interface AssetManifest {
  version: number;
  strict: boolean;
  assets: AssetEntry[];
}

/**
 * Valida a estrutura básica de um manifesto de assets (compatível com Node e Browser)
 */
export function validateManifestStructure(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Manifesto inválido: esperado um objeto JSON.'] };
  }

  const manifest = data as Partial<AssetManifest>;
  if (typeof manifest.version !== 'number') {
    errors.push('Campo "version" numérico obrigatório ausente.');
  }
  if (typeof manifest.strict !== 'boolean') {
    errors.push('Campo "strict" booleano obrigatório ausente.');
  }
  if (!Array.isArray(manifest.assets)) {
    errors.push('Campo "assets" array obrigatório ausente.');
  } else {
    const seenIds = new Set<string>();
    manifest.assets.forEach((asset, idx) => {
      if (!asset.id || typeof asset.id !== 'string') {
        errors.push(`Asset #${idx}: "id" obrigatório ausente.`);
      } else if (seenIds.has(asset.id)) {
        errors.push(`Asset #${idx}: id duplicado "${asset.id}".`);
      } else {
        seenIds.add(asset.id);
      }

      if (!asset.path || typeof asset.path !== 'string') {
        errors.push(`Asset "${asset.id || idx}": "path" obrigatório ausente.`);
      }

      if (!asset.type || typeof asset.type !== 'string') {
        errors.push(`Asset "${asset.id || idx}": "type" obrigatório ausente.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Busca entrada de asset por id no manifesto
 */
export function getAssetById(manifest: AssetManifest, id: string): AssetEntry | undefined {
  return manifest.assets.find(a => a.id === id);
}

/**
 * Filtra assets por categoria/tipo
 */
export function getAssetsByType(manifest: AssetManifest, type: AssetEntry['type']): AssetEntry[] {
  return manifest.assets.filter(a => a.type === type);
}

/**
 * Gerenciador de carregamento de assets para o Phaser
 */
export class AssetLoader {
  private manifest: AssetManifest | null = null;
  private loadedAssets: Set<string> = new Set();
  private failedAssets: Set<string> = new Set();

  constructor(manifest?: AssetManifest) {
    if (manifest) {
      this.setManifest(manifest);
    }
  }

  public setManifest(manifest: AssetManifest): void {
    const check = validateManifestStructure(manifest);
    if (!check.valid) {
      console.warn('[AssetLoader] Manifesto com erros de estrutura:', check.errors);
    }
    this.manifest = manifest;
  }

  public getManifest(): AssetManifest | null {
    return this.manifest;
  }

  /**
   * Enfileira assets do manifesto no LoaderPlugin do Phaser (se disponível)
   */
  public queueManifestAssets(scene: any): number {
    if (!this.manifest || !scene || !scene.load) {
      return 0;
    }

    let queuedCount = 0;
    for (const asset of this.manifest.assets) {
      // Se já está na textura do Phaser, não precisa carregar de novo
      if (scene.textures && scene.textures.exists(asset.id)) {
        this.loadedAssets.add(asset.id);
        continue;
      }

      // Configura listener de erro para acionar fallback
      scene.load.once(`filecomplete-${asset.id}`, () => {
        this.loadedAssets.add(asset.id);
      });

      scene.load.once(`loaderror-${asset.id}`, () => {
        console.warn(`[AssetLoader] Falha ao carregar ${asset.id} (${asset.path}). Fallback será usado.`);
        this.failedAssets.add(asset.id);
      });

      const url = asset.path.startsWith('public/') ? asset.path.slice('public/'.length) : asset.path;
      if (asset.frame && Array.isArray(asset.frame)) {
        scene.load.spritesheet(asset.id, url, {
          frameWidth: asset.frame[0],
          frameHeight: asset.frame[1],
        });
      } else {
        scene.load.image(asset.id, url);
      }
      queuedCount++;
    }

    return queuedCount;
  }

  public isLoaded(id: string): boolean {
    return this.loadedAssets.has(id);
  }

  public hasFailed(id: string): boolean {
    return this.failedAssets.has(id);
  }
}
