/**
 * Constants — Cinzas do Éter
 *
 * Global constants shared across all systems.
 * Palette colors, sprite dimensions, and other shared values.
 *
 * Source of truth: STYLE_GUIDE.md
 */

// ============================================================
// PALETTE — Decadência Luminosa
// ============================================================

export const PALETTE = {
  // Primary: Amber (Ether glow, warmth, life)
  AMBER_LIGHT: 0xE8C876,
  AMBER_MID: 0xD4A24E,
  AMBER_DARK: 0xA67B2E,

  // Primary: Violet (Shadows, mystery, decay)
  VIOLET_LIGHT: 0x9B6DD7,
  VIOLET_MID: 0x6B3FA0,
  VIOLET_DARK: 0x4A2875,

  // Primary: Crystal (Ether crystals, magic, resonance)
  CRYSTAL_LIGHT: 0x7DE8F0,
  CRYSTAL_MID: 0x4EC8D4,
  CRYSTAL_DARK: 0x2E9AA5,

  // Shadow tones
  SHADOW_PURPLE: 0x2A1F3D,
  SHADOW_DEEP: 0x3D2E52,
  SHADOW_DARKEST: 0x0A0612,

  // Earth tones
  EARTH_LIGHT: 0x8B6B4A,
  EARTH_MID: 0x5C4433,
  EARTH_DARK: 0x3A2B1F,

  // Highlight
  GOLD_HIGHLIGHT: 0xFFE4A0,
  WHITE_HIGHLIGHT: 0xF5F0E1,

  // Living zone
  GREEN_ALIVE: 0x4A8B5C,
  GREEN_DARK: 0x2E5A3A,

  // Dead zone
  GRAY_DEAD: 0x7A7A7A,
  GRAY_ASH: 0x4A4A4A,
  GRAY_BONE: 0x9B9286,

  // UI
  UI_BG_DARK: 0x1A0F2E,
  UI_BORDER: 0x6B3FA0,
  UI_TEXT: 0xE8C876,
  UI_TEXT_DIM: 0x9B9286,

  // Status bars
  HP_GREEN: 0x4A8B5C,
  HP_RED: 0xC04040,
  MP_BLUE: 0x4EC8D4,
  XP_GOLD: 0xD4A24E,

  // Paleta v2 (Aprovada D1)
  OUTLINE_DARK: 0x1D1528,
  GOLD_PALE: 0xFFF1C5,
  AMBER_DEEP: 0x785418,
  EARTH_PALE: 0xB8936E,
  EARTH_DEEP: 0x261B13,
  WOOD_DARKEST: 0x19110B,
  SKIN_FAIR_HI: 0xFFE8D1,
  SKIN_FAIR_BASE: 0xEBCBB0,
  SKIN_FAIR_SHADOW: 0xC49E82,
  SKIN_WARM_BASE: 0xD9A066,
  SKIN_WARM_SHADOW: 0x99663E,
  HAIR_DARK_BROWN: 0x61391D,
  CRYSTAL_HI: 0xB8F6FA,
  CRYSTAL_DEEP: 0x1D6D78,
  WATER_ABYSS: 0x11454C,
  SKY_PALE: 0x8BB5E8,
  SKY_MID: 0x5384C7,
  NIGHT_BLUE: 0x2F5294,
  NIGHT_DEEP: 0x1A2F5E,
  NIGHT_DARKEST: 0x0E1A38,
  VIOLET_HI: 0xC8A8F2,
  VIOLET_DEEP: 0x321854,
  VIOLET_VOID: 0x1D0B33,
  GREEN_HI: 0x76C289,
  GREEN_DEEP: 0x1E3E26,
  HEAL_GLOW: 0x62D96B,
  HEAL_MID: 0x35A844,
  POISON_HI: 0xA7F249,
  POISON_MID: 0x72C924,
  POISON_DARK: 0x4A8712,
  POISON_DEEP: 0x2A5408,
  POISON_ABYSS: 0x153003,
  GRAY_PALE: 0xC4BEB3,
  GRAY_CHARCOAL: 0x2C2C2C,
  GRAY_SLATE: 0x1A1A1A,
  FIRE_CORE_AMBER: 0xFFAE42,
  FIRE_HI: 0xFF7A59,
  FIRE_MID: 0xE64A35,
  HP_DARK: 0x8F2020,
  HP_DEEP: 0x5E1212,
  CREAM_SUBTLE: 0xEAE3CE,
  UI_PANEL_LIGHT: 0x483466,
  UI_PANEL_MID: 0x312347,
  UI_PANEL_DARK: 0x251838,
  UI_ACCENT_GOLD: 0xD1B06A,
} as const;

// ============================================================
// SPRITE DIMENSIONS
// ============================================================

export const SPRITE = {
  /** Character sprite width */
  CHAR_WIDTH: 32,
  /** Character sprite height */
  CHAR_HEIGHT: 48,
  /** Tile size */
  TILE_SIZE: 16,
  /** Small enemy sprite */
  ENEMY_SMALL: 32,
  /** Medium enemy sprite */
  ENEMY_MEDIUM: 48,
  /** Large enemy / boss sprite */
  ENEMY_LARGE: 64,
  /** Portrait size */
  PORTRAIT_SIZE: 48,
  /** Outline width in pixels */
  OUTLINE_WIDTH: 2,
} as const;

// ============================================================
// DISPLAY
// ============================================================

export const DISPLAY = {
  /** Logical game resolution width */
  WIDTH: 384,
  /** Logical game resolution height */
  HEIGHT: 216,
  /** Target framerate */
  FPS: 60,
} as const;

// ============================================================
// ANIMATION
// ============================================================

export const ANIMATION = {
  /** Walk cycle frame count */
  WALK_FRAMES: 4,
  /** Walk animation framerate */
  WALK_FPS: 8,
  /** Idle animation framerate */
  IDLE_FPS: 4,
  /** Battle animation framerate */
  BATTLE_FPS: 12,
  /** UI transition duration in ms */
  UI_TRANSITION_MS: 200,
} as const;
