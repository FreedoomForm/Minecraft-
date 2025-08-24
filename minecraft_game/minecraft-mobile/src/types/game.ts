// Типы для игрового движка Minecraft
export interface BlockData {
  id: string;
  name: string;
  hardness: number;
  bestTool?: string;
  minimumToolLevel?: string;
  drops?: string[];
  texture: string;
  transparent?: boolean;
  solid?: boolean;
  luminance?: number;
  physics?: 'falls' | 'flows';
}

export interface ItemData {
  id: string;
  name: string;
  type: 'tool' | 'weapon' | 'block' | 'food' | 'material';
  durability?: number;
  efficiency?: number;
  damage?: number;
  stackSize: number;
  texture: string;
}

export interface Recipe {
  type: 'shaped' | 'shapeless' | 'smelting';
  pattern?: string[];
  key?: Record<string, string>;
  ingredients?: string[];
  result: {
    item: string;
    count: number;
  };
  cookingTime?: number;
}

export interface WorldChunk {
  x: number;
  z: number;
  blocks: Uint16Array; // 16x16x64 = 16384 блоков
  generated: boolean;
}

export interface PlayerState {
  position: [number, number, number];
  rotation: [number, number]; // pitch, yaw
  health: number;
  hunger: number;
  experience: number;
  gameMode: 'survival' | 'creative' | 'adventure';
}

export interface InventorySlot {
  itemId: string | null;
  count: number;
  durability?: number;
}

export interface GameState {
  player: PlayerState;
  inventory: InventorySlot[];
  hotbar: InventorySlot[];
  selectedSlot: number;
  chunks: Map<string, WorldChunk>;
  time: number; // время в тиках (0-24000)
  weather: 'clear' | 'rain' | 'storm';
}

export interface TouchControls {
  moveStick: { x: number; y: number };
  lookSensitivity: number;
  jumpPressed: boolean;
  sprintPressed: boolean;
  crouchPressed: boolean;
  actionPressed: boolean;
}

// Биомы для генерации мира
export interface Biome {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  topBlock: string;
  fillBlock: string;
  decorations: string[];
  structures: string[];
}

// Структуры для процедурной генерации
export interface Structure {
  id: string;
  name: string;
  blocks: Array<{
    position: [number, number, number];
    blockId: string;
  }>;
  size: [number, number, number];
}

// Настройки производительности для мобильных устройств
export interface PerformanceSettings {
  renderDistance: number;
  maxFPS: number;
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  particleCount: number;
  enableVSync: boolean;
  antiAliasing: boolean;
}

// События игры
export type GameEvent = 
  | { type: 'BLOCK_BREAK'; position: [number, number, number]; blockId: string }
  | { type: 'BLOCK_PLACE'; position: [number, number, number]; blockId: string }
  | { type: 'ITEM_PICKUP'; itemId: string; count: number }
  | { type: 'PLAYER_DAMAGE'; amount: number; source: string }
  | { type: 'RECIPE_CRAFT'; recipeId: string; count: number }
  | { type: 'TIME_CHANGE'; newTime: number }
  | { type: 'WEATHER_CHANGE'; newWeather: string };

export interface GameConfig {
  worldSeed: string;
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
  enableCheats: boolean;
  generateStructures: boolean;
  performance: PerformanceSettings;
}