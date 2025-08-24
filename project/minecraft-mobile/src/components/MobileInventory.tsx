// Мобильный инвентарь с поддержкой drag&drop
import React, { useState, useRef } from 'react';
import { InventorySlot, Recipe } from '@/types/game';
import { gameData } from '@/lib/gameData';

interface MobileInventoryProps {
  isOpen: boolean;
  inventory: InventorySlot[];
  hotbar: InventorySlot[];
  onInventoryChange: (newInventory: InventorySlot[]) => void;
  onHotbarChange: (newHotbar: InventorySlot[]) => void;
  onClose: () => void;
}

export function MobileInventory({ 
  isOpen, 
  inventory, 
  hotbar, 
  onInventoryChange, 
  onHotbarChange, 
  onClose 
}: MobileInventoryProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [selectedSlot, setSelectedSlot] = useState<{type: 'inventory' | 'hotbar' | 'crafting', index: number} | null>(null);
  const [craftingGrid, setCraftingGrid] = useState<InventorySlot[]>(Array(9).fill({ itemId: null, count: 0 }));
  const [draggedItem, setDraggedItem] = useState<{ slot: InventorySlot, source: { type: string, index: number } } | null>(null);

  if (!isOpen) return null;

  const getItemIcon = (slot: InventorySlot) => {
    if (!slot.itemId) return null;
    const item = gameData.getItem(slot.itemId) || gameData.getBlock(slot.itemId);
    if (!item) return '?';
    
    const iconMap: Record<string, string> = {
      'dirt': '🟧',
      'stone': '⚫',
      'grass_block': '🌿',
      'wood_log': '🪵',
      'oak_log': '🪵',
      'sand': '🟡',
      'cobblestone': '⚫',
      'oak_planks': '🟦',
      'glass': '🔺',
      'coal_ore': '⚫',
      'iron_ore': '🔘',
      'diamond_ore': '💎',
      'crafting_table': '🪵',
      'furnace': '🔥',
      'chest': '📦',
      'torch': '🕯️',
      'water': '🌊',
      'wooden_pickaxe': '⛏️',
      'stone_pickaxe': '⛏️',
      'iron_pickaxe': '⛏️',
      'wooden_axe': '🪓',
      'wooden_shovel': '🥄',
      'wooden_sword': '⚔️',
      'stick': '🌳',
      'coal': '⚫',
      'iron_ingot': '💰',
      'diamond': '💎'
    };
    
    return iconMap[slot.itemId] || '📎';
  };

  const handleSlotClick = (slot: InventorySlot, type: 'inventory' | 'hotbar' | 'crafting', index: number) => {
    if (!slot.itemId) return;
    
    if (selectedSlot && selectedSlot.type !== 'crafting' && type !== 'crafting') {
      // Переместить предметы между слотами
      swapSlots(selectedSlot, { type, index });
      setSelectedSlot(null);
    } else {
      setSelectedSlot({ type, index });
    }
  };

  const swapSlots = (from: {type: string, index: number}, to: {type: string, index: number}) => {
    const fromArray = from.type === 'hotbar' ? hotbar : inventory;
    const toArray = to.type === 'hotbar' ? hotbar : inventory;
    
    const fromItem = { ...fromArray[from.index] };
    const toItem = { ...toArray[to.index] };
    
    const newFromArray = [...fromArray];
    const newToArray = [...toArray];
    
    newFromArray[from.index] = toItem;
    newToArray[to.index] = fromItem;
    
    if (from.type === 'hotbar') {
      onHotbarChange(newFromArray);
    } else {
      onInventoryChange(newFromArray);
    }
    
    if (to.type === 'hotbar' && from.type !== 'hotbar') {
      onHotbarChange(newToArray);
    } else if (to.type === 'inventory' && from.type !== 'inventory') {
      onInventoryChange(newToArray);
    }
  };

  const findCraftingRecipe = (): Recipe | null => {
    const recipes = gameData.getAllRecipes();
    
    // Простой поиск 2x2 рецептов в левом верхнем углу
    const craftingPattern = [
      craftingGrid[0].itemId || '',
      craftingGrid[1].itemId || '',
      craftingGrid[3].itemId || '',
      craftingGrid[4].itemId || ''
    ];
    
    return recipes.find(recipe => {
      if (recipe.type === 'shapeless') {
        // Простой поиск бесформенных рецептов
        const ingredients = recipe.ingredients || [];
        const craftingItems = craftingGrid.filter(slot => slot.itemId).map(slot => slot.itemId);
        return ingredients.length === craftingItems.length && 
               ingredients.every(ing => craftingItems.includes(ing));
      }
      return false;
    }) || null;
  };

  const executeCrafting = () => {
    const recipe = findCraftingRecipe();
    if (!recipe) return;
    
    // Удаляем ингредиенты из сетки крафта
    const newCraftingGrid = craftingGrid.map(slot => {
      if (slot.itemId && slot.count > 1) {
        return { ...slot, count: slot.count - 1 };
      }
      return { itemId: null, count: 0 };
    });
    
    setCraftingGrid(newCraftingGrid);
    
    // Добавляем результат в инвентарь
    const newInventory = [...inventory];
    const resultItem = recipe.result;
    
    // Находим пустой слот или слот с тем же предметом
    const emptySlotIndex = newInventory.findIndex(slot => 
      !slot.itemId || (slot.itemId === resultItem.item && slot.count + resultItem.count <= 64)
    );
    
    if (emptySlotIndex !== -1) {
      if (!newInventory[emptySlotIndex].itemId) {
        newInventory[emptySlotIndex] = { itemId: resultItem.item, count: resultItem.count };
      } else {
        newInventory[emptySlotIndex].count += resultItem.count;
      }
      onInventoryChange(newInventory);
    }
  };

  const renderSlot = (slot: InventorySlot, type: 'inventory' | 'hotbar' | 'crafting', index: number) => {
    const isSelected = selectedSlot?.type === type && selectedSlot?.index === index;
    
    return (
      <button
        key={`${type}-${index}`}
        className={`w-12 h-12 border-2 rounded-lg flex flex-col items-center justify-center relative transition-all ${
          isSelected 
            ? 'border-yellow-400 bg-yellow-400/20 scale-105' 
            : 'border-gray-600 bg-gray-800/50 hover:border-gray-400'
        }`}
        onClick={() => handleSlotClick(slot, type, index)}
      >
        {slot.itemId && (
          <>
            <div className="text-lg">{getItemIcon(slot)}</div>
            {slot.count > 1 && (
              <div className="absolute bottom-0 right-0 text-xs text-white bg-gray-900 rounded-full w-4 h-4 flex items-center justify-center">
                {slot.count > 99 ? '99+' : slot.count}
              </div>
            )}
            {slot.durability !== undefined && slot.durability < 100 && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-b"
                style={{ width: `${slot.durability}%` }}
              />
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-gray-700 w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Инвентарь</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl p-1"
          >
            ×
          </button>
        </div>
        
        {/* Вкладки */}
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'inventory' ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('inventory')}
          >
            🎒 Предметы
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'crafting' ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('crafting')}
          >
            ⚙️ Крафт
          </button>
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'inventory' && (
            <div className="p-4 space-y-4">
              {/* Панель быстрого доступа */}
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Панель быстрого доступа:</h3>
                <div className="grid grid-cols-9 gap-1">
                  {hotbar.map((slot, index) => renderSlot(slot, 'hotbar', index))}
                </div>
              </div>
              
              {/* Основной инвентарь */}
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Основной инвентарь:</h3>
                <div className="grid grid-cols-9 gap-1">
                  {inventory.map((slot, index) => renderSlot(slot, 'inventory', index))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'crafting' && (
            <div className="p-4 space-y-4">
              {/* Сетка крафта 2x2 */}
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Крафтинг (2x2):</h3>
                <div className="flex items-center gap-4">
                  <div className="grid grid-cols-3 gap-1 p-3 bg-gray-800 rounded-lg">
                    {craftingGrid.slice(0, 9).map((slot, index) => (
                      <button
                        key={index}
                        className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center relative ${
                          (index < 2 || (index >= 3 && index < 5)) ? 'border-gray-500 bg-gray-700' : 'border-gray-700 bg-gray-800'
                        }`}
                        onClick={() => {
                          if (selectedSlot && selectedSlot.type !== 'crafting') {
                            const sourceArray = selectedSlot.type === 'hotbar' ? hotbar : inventory;
                            const sourceItem = sourceArray[selectedSlot.index];
                            
                            if (sourceItem.itemId) {
                              const newCraftingGrid = [...craftingGrid];
                              newCraftingGrid[index] = { itemId: sourceItem.itemId, count: 1 };
                              setCraftingGrid(newCraftingGrid);
                              
                              // Удаляем предмет из источника
                              const newSourceArray = [...sourceArray];
                              if (newSourceArray[selectedSlot.index].count > 1) {
                                newSourceArray[selectedSlot.index].count--;
                              } else {
                                newSourceArray[selectedSlot.index] = { itemId: null, count: 0 };
                              }
                              
                              if (selectedSlot.type === 'hotbar') {
                                onHotbarChange(newSourceArray);
                              } else {
                                onInventoryChange(newSourceArray);
                              }
                              setSelectedSlot(null);
                            }
                          }
                        }}
                        disabled={!(index < 2 || (index >= 3 && index < 5))}
                      >
                        {slot.itemId && (index < 2 || (index >= 3 && index < 5)) && (
                          <div className="text-lg">{getItemIcon(slot)}</div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-white text-2xl">→</div>
                  
                  {/* Результат */}
                  <div className="w-12 h-12 border-2 border-green-500 bg-green-500/20 rounded-lg flex items-center justify-center">
                    {(() => {
                      const recipe = findCraftingRecipe();
                      return recipe ? getItemIcon({ itemId: recipe.result.item, count: recipe.result.count }) : null;
                    })()}
                  </div>
                </div>
                
                {/* Кнопка крафта */}
                <button
                  onClick={executeCrafting}
                  disabled={!findCraftingRecipe()}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    findCraftingRecipe() 
                      ? 'bg-green-600 hover:bg-green-500 text-white' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {findCraftingRecipe() ? 'Скрафтить' : 'Нет рецепта'}
                </button>
              </div>
              
              {/* Популярные рецепты */}
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Популярные рецепты:</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-white font-medium">Доски</div>
                    <div className="text-gray-400">1x Бревно → 4x Доски</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-white font-medium">Палки</div>
                    <div className="text-gray-400">2x Доски → 4x Палки</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-white font-medium">Верстак</div>
                    <div className="text-gray-400">4x Доски → Верстак</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-white font-medium">Факел</div>
                    <div className="text-gray-400">1x Уголь + 1x Палка</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}