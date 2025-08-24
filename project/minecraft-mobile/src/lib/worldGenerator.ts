// Генератор процедурного мира Minecraft
import type { WorldChunk, Biome } from '@/types/game';
import { gameData } from './gameData';

class SimpleNoise {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Простой шум на основе sin/cos функций
  noise2D(x: number, z: number): number {
    const n = Math.sin(x * 0.1 + this.seed) * Math.cos(z * 0.1 + this.seed);
    return (n + 1) / 2; // нормализация [0,1]
  }

  // Октавный шум для более реалистичной генерации
  octaveNoise2D(x: number, z: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 0.01;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }
}

export class WorldGenerator {
  private noise: SimpleNoise;
  private blockIds: Map<string, number> = new Map();
  private idToBlockName: Map<number, string> = new Map();
  private biomesArray: Biome[] = [];

  constructor(seed: number | string) {
    const seedNumber = typeof seed === 'string' ? this.stringToSeed(seed) : seed;
    this.noise = new SimpleNoise(seedNumber);
    
    // Инициализация ID блоков для быстрого доступа
    this.initializeBlockIds();
  }

  private stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private initializeBlockIds(): void {
    const blocks = gameData.getAllBlocks();
    blocks.forEach((block, index) => {
      this.blockIds.set(block.id, index + 1); // 0 = воздух
      this.idToBlockName.set(index + 1, block.id);
    });
    
    this.biomesArray = gameData.getAllBiomes();
  }

  generateChunk(chunkX: number, chunkZ: number): WorldChunk {
    const blocks = new Uint16Array(16 * 16 * 64); // 16x16x64
    
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const worldX = chunkX * 16 + x;
        const worldZ = chunkZ * 16 + z;
        
        // Определение биома
        const biome = this.getBiome(worldX, worldZ);
        
        // Генерация высоты ландшафта (0-63)
        const height = Math.floor(this.noise.octaveNoise2D(worldX, worldZ, 4) * 32 + 16);
        
        // Заполнение чанка блоками
        for (let y = 0; y < 64; y++) {
          const blockIndex = this.getBlockIndex(x, y, z);
          
          if (y === 0) {
            // Бедрок на дне
            blocks[blockIndex] = this.getBlockId('bedrock') || this.getBlockId('stone') || 1;
          } else if (y < height - 3) {
            // Камень внизу
            blocks[blockIndex] = this.getBlockId('stone') || 1;
          } else if (y < height - 1) {
            // Грязь перед поверхностью
            blocks[blockIndex] = this.getBlockId(biome.fillBlock) || this.getBlockId('dirt') || 1;
          } else if (y === height - 1) {
            // Поверхностный блок
            blocks[blockIndex] = this.getBlockId(biome.topBlock) || this.getBlockId('grass_block') || 1;
          } else if (y < 32) {
            // Вода на низких уровнях
            blocks[blockIndex] = this.getBlockId('water') || 0;
          }
          // Выше - воздух (0)
        }
        
        // Генерация руды
        this.generateOres(blocks, x, z, height);
        
        // Простая генерация деревьев
        if (biome.id === 'forest' && Math.random() < 0.1) {
          this.generateTree(blocks, x, height, z);
        }
      }
    }

    return {
      x: chunkX,
      z: chunkZ,
      blocks,
      generated: true
    };
  }

  private getBiome(x: number, z: number): Biome {
    if (this.biomesArray.length === 0) return {
      id: 'plains',
      name: 'Равнина',
      temperature: 0.8,
      humidity: 0.4,
      topBlock: 'grass_block',
      fillBlock: 'dirt',
      decorations: [],
      structures: []
    };

    // Простое определение биома на основе координат
    const biomeNoise = this.noise.noise2D(x * 0.001, z * 0.001);
    const biomeIndex = Math.floor(biomeNoise * this.biomesArray.length);
    return this.biomesArray[biomeIndex] || this.biomesArray[0];
  }

  private generateOres(blocks: Uint16Array, x: number, z: number, maxHeight: number): void {
    // Простая генерация угля
    if (Math.random() < 0.05 && maxHeight > 10) {
      const oreY = Math.floor(Math.random() * (maxHeight - 5)) + 1;
      const oreIndex = this.getBlockIndex(x, oreY, z);
      blocks[oreIndex] = this.getBlockId('coal_ore') || this.getBlockId('stone') || 1;
    }

    // Железная руда реже
    if (Math.random() < 0.02 && maxHeight > 15) {
      const oreY = Math.floor(Math.random() * (maxHeight - 10)) + 1;
      const oreIndex = this.getBlockIndex(x, oreY, z);
      blocks[oreIndex] = this.getBlockId('iron_ore') || this.getBlockId('stone') || 1;
    }
  }

  private generateTree(blocks: Uint16Array, x: number, baseY: number, z: number): void {
    const treeHeight = 4 + Math.floor(Math.random() * 3);
    const logId = this.getBlockId('oak_log') || this.getBlockId('wood_log') || 1;
    const leavesId = this.getBlockId('oak_leaves') || logId;

    // Ствол
    for (let y = baseY; y < baseY + treeHeight && y < 63; y++) {
      const logIndex = this.getBlockIndex(x, y, z);
      blocks[logIndex] = logId;
    }

    // Крона (простая)
    const crownY = baseY + treeHeight - 1;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (x + dx >= 0 && x + dx < 16 && z + dz >= 0 && z + dz < 16) {
          if (Math.abs(dx) + Math.abs(dz) < 3 && crownY < 63) {
            const leavesIndex = this.getBlockIndex(x + dx, crownY, z + dz);
            blocks[leavesIndex] = leavesId;
          }
        }
      }
    }
  }

  private getBlockIndex(x: number, y: number, z: number): number {
    return y * 256 + z * 16 + x; // 16*16 = 256 блоков на слой
  }

  private getBlockId(blockName: string): number | undefined {
    return this.blockIds.get(blockName) || this.blockIds.get(blockName.replace('_', ''));
  }

  getBlockNameById(id: number): string | undefined {
    return this.idToBlockName.get(id);
  }

  // Публичный метод для получения ID блока по имени
  getBlockIdByName(blockName: string): number | undefined {
    return this.getBlockId(blockName);
  }

  getChunkKey(x: number, z: number): string {
    return `${x},${z}`;
  }
}