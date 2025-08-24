// HUD с информацией о состоянии игрока
import React from 'react';
import { PlayerState, InventorySlot } from '@/types/game';
import { gameData } from '@/lib/gameData';

interface MobileHUDProps {
  player: PlayerState;
  hotbar: InventorySlot[];
  selectedSlot: number;
  onSlotSelect: (slot: number) => void;
  onInventoryOpen: () => void;
  currentTime: number;
  className?: string;
}

export function MobileHUD({ 
  player, 
  hotbar, 
  selectedSlot, 
  onSlotSelect, 
  onInventoryOpen,
  currentTime,
  className = '' 
}: MobileHUDProps) {
  // Преобразование времени в часы:minute
  const getTimeString = (time: number) => {
    const hours = Math.floor(time / 1000) + 6; // Начинаем с 6:00
    const minutes = Math.floor((time % 1000) / 1000 * 60);
    const displayHours = hours % 24;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Определение времени суток
  const getTimeIcon = (time: number) => {
    const hour = Math.floor(time / 1000) + 6;
    const displayHour = hour % 24;
    if (displayHour >= 6 && displayHour < 18) return '☀️'; // день
    return '🌙'; // ночь
  };

  const renderHeart = (index: number, health: number) => {
    const heartValue = (index + 1) * 2;
    if (health >= heartValue) return '❤️'; // полное сердце
    if (health >= heartValue - 1) return '🧡'; // половина сердца
    return '💔'; // пустое сердце
  };

  const renderFood = (index: number, hunger: number) => {
    const foodValue = (index + 1) * 2;
    if (hunger >= foodValue) return '🍖'; // полная еда
    if (hunger >= foodValue - 1) return '🍞'; // половина
    return '🕳️'; // пусто
  };

  const getItemIcon = (slot: InventorySlot) => {
    if (!slot.itemId) return null;
    const item = gameData.getItem(slot.itemId) || gameData.getBlock(slot.itemId);
    if (!item) return '?';
    
    // Простые иконки для предметов
    const iconMap: Record<string, string> = {
      // Материалы
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
      // Инструменты
      'wooden_pickaxe': '⛏️',
      'stone_pickaxe': '⛏️',
      'iron_pickaxe': '⛏️',
      'wooden_axe': '🪓',
      'wooden_shovel': '🥄',
      'wooden_sword': '⚔️',
      // Материалы крафта
      'stick': '🌳',
      'coal': '⚫',
      'iron_ingot': '💰',
      'diamond': '💎'
    };
    
    return iconMap[slot.itemId] || '📎';
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Верхняя панель с информацией */}
      <div className="absolute top-safe left-0 right-0 p-4 bg-black/30 backdrop-blur-sm">
        <div className="flex justify-between items-start">
          {/* Здоровье */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className="text-lg">{renderHeart(i, player.health)}</span>
              ))}
            </div>
            {/* Голод */}
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className="text-lg">{renderFood(i, player.hunger)}</span>
              ))}
            </div>
          </div>
          
          {/* Время и опыт */}
          <div className="text-right text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getTimeIcon(currentTime)}</span>
              <span className="font-mono text-lg">{getTimeString(currentTime)}</span>
            </div>
            <div className="text-sm opacity-75">
              XP: {player.experience}
            </div>
          </div>
        </div>
      </div>
      
      {/* Нотбар (панель быстрого доступа) */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="flex gap-1 bg-black/60 backdrop-blur-sm p-2 rounded-lg">
          {hotbar.map((slot, index) => (
            <button
              key={index}
              className={`w-12 h-12 border-2 rounded-lg flex flex-col items-center justify-center relative transition-all ${
                selectedSlot === index 
                  ? 'border-white bg-white/20 scale-110' 
                  : 'border-gray-600 bg-gray-900/50 hover:border-gray-400'
              }`}
              onClick={() => onSlotSelect(index)}
            >
              {slot.itemId && (
                <>
                  <div className="text-lg">{getItemIcon(slot)}</div>
                  {slot.count > 1 && (
                    <div className="absolute bottom-0 right-0 text-xs text-white bg-gray-800 rounded-full w-4 h-4 flex items-center justify-center">
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
          ))}
        </div>
      </div>
      
      {/* Кнопка открытия инвентаря */}
      <div className="absolute top-safe right-4 pointer-events-auto">
        <button
          onClick={onInventoryOpen}
          className="w-12 h-12 rounded-lg bg-gray-900/60 backdrop-blur-sm border-2 border-gray-600 text-white text-xl hover:border-gray-400 transition-colors"
        >
          🎒
        </button>
      </div>
      
      {/* Мини-карта */}
      <div className="absolute top-20 right-4 w-20 h-20 bg-black/60 backdrop-blur-sm rounded-lg border-2 border-gray-600 pointer-events-auto">
        <div className="w-full h-full flex items-center justify-center text-white text-xs">
          <div className="text-center">
            <div>X: {Math.floor(player.position[0])}</div>
            <div>Y: {Math.floor(player.position[1])}</div>
            <div>Z: {Math.floor(player.position[2])}</div>
          </div>
        </div>
      </div>
    </div>
  );
}