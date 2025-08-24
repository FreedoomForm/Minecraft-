// Загрузчик игровых данных из JSON файлов
import type { BlockData, ItemData, Recipe, Biome } from '@/types/game';

class GameDataLoader {
  private blocks: Map<string, BlockData> = new Map();
  private items: Map<string, ItemData> = new Map();
  private recipes: Map<string, Recipe> = new Map();
  private biomes: Map<string, Biome> = new Map();
  private loaded = false;
  private initialBlocksSet = false;

  constructor() {
    // Сразу инициализируем базовые блоки для предотвращения ошибок THREE.js
    this.initializeBasicBlocks();
  }

  // Инициализация базовых блоков для предотвращения ошибок при старте
  private initializeBasicBlocks(): void {
    if (this.initialBlocksSet) return;
    
    const baseBlocks = [
      'grass_block', 'dirt', 'stone', 'sand', 'water', 
      'wood_log', 'oak_log', 'oak_planks', 'cobblestone',
      'coal_ore', 'iron_ore', 'diamond_ore', 'glass', 
      'leaves', 'oak_leaves'
    ];
    
    baseBlocks.forEach((id, index) => {
      this.blocks.set(id, {
        id,
        name: id.replace('_', ' '),
        hardness: 1.5,
        bestTool: 'pickaxe',
        transparent: id === 'water' || id === 'glass',
        // Убираем зависимость от файлов текстур
        texture: `color:${id}`
      });
    });
    
    this.initialBlocksSet = true;
    console.log('Инициализированы базовые блоки для предотвращения ошибок THREE.js');
  }

  async loadGameData(): Promise<void> {
    if (this.loaded) return;

    try {
      // Если THREE.js запросит блоки до полной загрузки, у нас уже будут базовые
      if (!this.initialBlocksSet) {
        this.initializeBasicBlocks();
      }

      // Загрузка блоков
      try {
        const blockCatalog = await fetch('/data/blocks/block_catalog.json');
        const blockData = await blockCatalog.json();
        
        Object.values(blockData.block_catalog.categories).forEach((category: any) => {
          Object.entries(category.blocks).forEach(([id, block]: [string, any]) => {
            this.blocks.set(id, {
              ...block,
              id,
              // Используем строку с префиксом color: вместо файлов текстур
              texture: `color:${id}`
            });
          });
        });
        console.log('Блоки успешно загружены из JSON');
      } catch (blockError) {
        console.warn('Ошибка загрузки блоков из JSON, используются предварительно заданные блоки:', blockError);
        // Блоки уже инициализированы в constructor
      }

      // Загрузка предметов
      try {
        const itemCatalog = await fetch('/data/items/item_catalog.json');
        const itemData = await itemCatalog.json();
        
        Object.values(itemData.item_catalog.categories).forEach((category: any) => {
          Object.entries(category.items || category.sets || {}).forEach(([id, item]: [string, any]) => {
            if (typeof item === 'object' && item.name) {
              this.items.set(id, {
                id,
                name: item.name,
                type: category.description?.includes('инструмент') ? 'tool' : 
                      category.description?.includes('оружие') ? 'weapon' : 'material',
                stackSize: item.durability ? 1 : 64,
                // Используем строку с префиксом color: вместо файлов текстур
                texture: `color:${id}`,
                ...item
              });
            }
          });
        });
        console.log('Предметы успешно загружены из JSON');
      } catch (itemError) {
        console.warn('Ошибка загрузки предметов из JSON, используются предварительно заданные предметы:', itemError);
        // Инициализируем базовые предметы при ошибке
        ['dirt', 'stone', 'wood_log', 'wooden_pickaxe', 'wooden_axe'].forEach(id => {
          if (!this.items.has(id)) {
            this.items.set(id, {
              id,
              name: id.replace('_', ' '),
              type: id.includes('axe') || id.includes('pickaxe') ? 'tool' : 'material',
              stackSize: id.includes('axe') || id.includes('pickaxe') ? 1 : 64,
              // Используем строку с префиксом color: вместо файлов текстур
              texture: `color:${id}`
            });
          }
        });
      }

      // Загрузка рецептов - ДЕЛАЕМ БЕЗОПАСНУЮ ВЕРСИЮ С TRY/CATCH
      try {
        const recipeCatalog = await fetch('/data/recipes/recipe_catalog.json');
        const recipeData = await recipeCatalog.json();
        
        try {
          Object.values(recipeData.recipe_catalog.crafting_recipes).forEach((category: any) => {
            try {
              Object.entries(category).forEach(([id, recipe]: [string, any]) => {
                this.recipes.set(id, { ...recipe, id });
              });
            } catch (innerError) {
              console.warn('Ошибка при обработке категории рецептов:', innerError);
            }
          });
        } catch (categoryError) {
          console.warn('Ошибка при обработке категорий рецептов:', categoryError);
        }
        console.log('Рецепты успешно загружены из JSON');
      } catch (recipeError) {
        console.warn('Ошибка загрузки рецептов из JSON:', recipeError);
        // Рецепты не критичны для отображения, можно оставить пустыми
      }

      // Инициализация базовых биомов
      this.initializeBiomes();
      
      this.loaded = true;
      console.log(`Загружено: ${this.blocks.size} блоков, ${this.items.size} предметов, ${this.recipes.size} рецептов`);
    } catch (error) {
      console.error('Ошибка загрузки игровых данных:', error);
      // Даже при общей ошибке мы уже инициализировали базовые блоки
    }
  }

  private initializeBiomes(): void {
    const baseBiomes: Biome[] = [
      {
        id: 'plains',
        name: 'Равнина',
        temperature: 0.8,
        humidity: 0.4,
        topBlock: 'grass_block',
        fillBlock: 'dirt',
        decorations: ['tall_grass', 'flowers'],
        structures: ['village']
      },
      {
        id: 'forest',
        name: 'Лес',
        temperature: 0.7,
        humidity: 0.8,
        topBlock: 'grass_block',
        fillBlock: 'dirt',
        decorations: ['oak_log', 'oak_leaves'],
        structures: ['woodland_mansion']
      },
      {
        id: 'desert',
        name: 'Пустыня',
        temperature: 2.0,
        humidity: 0.0,
        topBlock: 'sand',
        fillBlock: 'sand',
        decorations: ['cactus', 'dead_bush'],
        structures: ['desert_temple']
      },
      {
        id: 'ocean',
        name: 'Океан',
        temperature: 0.5,
        humidity: 0.5,
        topBlock: 'water',
        fillBlock: 'water',
        decorations: ['kelp', 'sea_grass'],
        structures: ['ocean_ruin']
      }
    ];

    baseBiomes.forEach(biome => this.biomes.set(biome.id, biome));
  }

  getBlock(id: string): BlockData | undefined {
    return this.blocks.get(id);
  }

  getItem(id: string): ItemData | undefined {
    return this.items.get(id);
  }

  getRecipe(id: string): Recipe | undefined {
    return this.recipes.get(id);
  }

  getBiome(id: string): Biome | undefined {
    return this.biomes.get(id);
  }

  getAllBlocks(): BlockData[] {
    return Array.from(this.blocks.values());
  }

  getAllItems(): ItemData[] {
    return Array.from(this.items.values());
  }

  getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  getAllBiomes(): Biome[] {
    return Array.from(this.biomes.values());
  }

  isLoaded(): boolean {
    return this.loaded || this.initialBlocksSet;
  }
}

export const gameData = new GameDataLoader();