// Мобильный Minecraft с базовым интерфейсом
import React, { useState, useEffect, Suspense } from 'react';
import { MobileHUD } from '@/components/MobileHUD';
import { MobileInventory } from '@/components/MobileInventory';
import { MobileControls } from '@/components/MobileControls';
import { MinecraftEngine } from '@/components/MinecraftEngine';
import { gameData } from '@/lib/gameData';
import { WorldGenerator } from '@/lib/worldGenerator';
import type { GameState, TouchControls, InventorySlot } from '@/types/game';

// Компонент загрузки для игры
function GameLoadingFallback() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-4xl font-bold mb-4">🎮 Minecraft Mobile</div>
        <div className="text-xl mb-8">Загрузка игры...</div>
        <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto">
          <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  );
}

// Начальное состояние игры
const createInitialGameState = (): GameState => {
  // Создаем начальные предметы для хотбара
  const initialHotbar: InventorySlot[] = [
    { itemId: 'dirt', count: 64 },
    { itemId: 'stone', count: 64 },
    { itemId: 'wood_log', count: 64 },
    { itemId: 'wooden_pickaxe', count: 1, durability: 100 },
    { itemId: 'wooden_axe', count: 1, durability: 100 },
    { itemId: null, count: 0 },
    { itemId: null, count: 0 },
    { itemId: null, count: 0 },
    { itemId: null, count: 0 }
  ];

  const initialInventory: InventorySlot[] = Array(27).fill(0).map((_, i) => {
    if (i < 5) {
      const items = ['coal', 'iron_ore', 'cobblestone', 'oak_planks', 'stick'];
      return { itemId: items[i], count: 32 };
    }
    return { itemId: null, count: 0 };
  });

  return {
    player: {
      position: [0, 65, 0], // Начинаем на высоте
      rotation: [0, 0],
      health: 20,
      hunger: 20,
      experience: 0,
      gameMode: 'survival'
    },
    inventory: initialInventory,
    hotbar: initialHotbar,
    selectedSlot: 0,
    chunks: new Map(),
    time: 6000, // Начинаем с утра
    weather: 'clear'
  };
};

export function MobileMinecraft() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [controls, setControls] = useState<TouchControls>({
    moveStick: { x: 0, y: 0 },
    lookSensitivity: 2,
    jumpPressed: false,
    sprintPressed: false,
    crouchPressed: false,
    actionPressed: false
  });
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [worldGenerator] = useState(() => new WorldGenerator(123456)); // Фиксированный сид для стабильности

  // Инициализация игры
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Загружаем данные игры
        await gameData.loadGameData();
        
        // Инициализируем состояние игры
        const initialState = createInitialGameState();
        setGameState(initialState);
        
        // Пробуем загрузить сохраненную игру
        const savedGame = localStorage.getItem('minecraft-mobile-save');
        if (savedGame) {
          try {
            const parsedSave = JSON.parse(savedGame);
            if (parsedSave.player && parsedSave.inventory) {
              setGameState(prev => ({ ...prev!, ...parsedSave }));
            }
          } catch (e) {
            console.warn('Ошибка загрузки сохраненной игры:', e);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Ошибка инициализации игры:', err);
        setError('Ошибка загрузки игры. Попробуйте обновить страницу.');
        setIsLoading(false);
      }
    };

    initializeGame();
  }, []);

  // Автосохранение
  useEffect(() => {
    if (!gameState) return;
    
    const saveGame = () => {
      try {
        const saveData = {
          player: gameState.player,
          inventory: gameState.inventory,
          hotbar: gameState.hotbar,
          selectedSlot: gameState.selectedSlot,
          time: gameState.time
        };
        localStorage.setItem('minecraft-mobile-save', JSON.stringify(saveData));
      } catch (e) {
        console.warn('Ошибка сохранения игры:', e);
      }
    };

    const saveInterval = setInterval(saveGame, 30000); // Сохраняем каждые 30 сек
    return () => clearInterval(saveInterval);
  }, [gameState]);

  // Игровой цикл (время)
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        const newTime = (prev.time + 20) % 24000; // 20 тиков в секунду
        return { ...prev, time: newTime };
      });
      setGameTime(prev => prev + 20);
    }, 1000 / 2); // 2 TPS для экономии ресурсов

    return () => clearInterval(timeInterval);
  }, []);

  // Обработка контроллеров
  const handleControlsChange = (newControls: TouchControls) => {
    setControls(newControls);
  };

  // Обновление состояния игрока
  const handlePlayerUpdate = (updates: Partial<GameState['player']>) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        player: { ...prev.player, ...updates }
      };
    });
  };

  // Обработка выбора слота в хотбаре
  const handleSlotSelect = (slot: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, selectedSlot: slot };
    });
  };

  // Обработка изменений в инвентаре
  const handleInventoryChange = (newInventory: InventorySlot[]) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, inventory: newInventory };
    });
  };

  const handleHotbarChange = (newHotbar: InventorySlot[]) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, hotbar: newHotbar };
    });
  };

  // Обработка разрушения блока
  const handleBlockBreak = (x: number, y: number, z: number) => {
    console.log(`Разрушен блок на позиции [${x}, ${y}, ${z}]`);
    // Реализация удаления блока из чанка
  };

  // Обработка установки блока
  const handleBlockPlace = (x: number, y: number, z: number) => {
    console.log(`Установлен блок на позиции [${x}, ${y}, ${z}]`);
    // Реализация добавления блока в чанк
  };

  // Предотвращение скроллинга на мобильных устройствах
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1 || (e.target as Element)?.closest('.scrollable')) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener('touchstart', preventDefault, { passive: false });
    document.addEventListener('touchmove', preventDefault, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', preventDefault);
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  if (isLoading) {
    return <GameLoadingFallback />;
  }

  if (error || !gameState) {
    return (
      <div className="w-full h-screen bg-red-900 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-2xl font-bold mb-4">❌ Ошибка</div>
          <div className="text-lg mb-4">{error || 'Неизвестная ошибка'}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg font-medium"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  // Время дня для фона
  const getBackgroundGradient = (time: number) => {
    const hour = (Math.floor(time / 1000) + 6) % 24;
    
    if (hour >= 6 && hour < 8) return 'from-orange-300 to-blue-300'; // Рассвет
    if (hour >= 8 && hour < 18) return 'from-blue-400 to-blue-600'; // День
    if (hour >= 18 && hour < 20) return 'from-orange-500 to-purple-900'; // Закат
    return 'from-blue-900 to-gray-900'; // Ночь
  };

  return (
    <div className={`w-full h-screen overflow-hidden relative bg-gradient-to-b ${getBackgroundGradient(gameState.time)}`}>
      {/* 3D мир игры */}
      <Suspense fallback={<GameLoadingFallback />}>
        <MinecraftEngine
          playerState={gameState.player}
          controls={controls}
          chunks={gameState.chunks}
          onPlayerUpdate={handlePlayerUpdate}
          onBlockBreak={handleBlockBreak}
          onBlockPlace={handleBlockPlace}
          worldGenerator={worldGenerator}
        />
      </Suspense>
      
      {/* Мобильные контроллы */}
      <MobileControls 
        onControlsChange={handleControlsChange}
      />
      
      {/* HUD с информацией */}
      <MobileHUD
        player={gameState.player}
        hotbar={gameState.hotbar}
        selectedSlot={gameState.selectedSlot}
        currentTime={gameState.time}
        onSlotSelect={handleSlotSelect}
        onInventoryOpen={() => setIsInventoryOpen(true)}
      />
      
      {/* Модальное окно инвентаря */}
      <MobileInventory
        isOpen={isInventoryOpen}
        inventory={gameState.inventory}
        hotbar={gameState.hotbar}
        onInventoryChange={handleInventoryChange}
        onHotbarChange={handleHotbarChange}
        onClose={() => setIsInventoryOpen(false)}
      />
      
      {/* Полноэкранный режим */}
      <button
        onClick={() => {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        }}
        className="absolute top-4 left-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-lg border border-gray-600 text-white hover:bg-black/70 transition-colors z-40"
        title="Полный экран"
      >
        ⛶
      </button>
      
      {/* Информация о позиции */}
      <div className="absolute bottom-4 left-4 text-white text-xs bg-black/70 p-2 rounded font-mono">
        <div>Pos: {gameState.player.position.map(p => p.toFixed(1)).join(', ')}</div>
        <div>Time: {gameState.time} ({Math.floor((gameState.time + 6000) / 1000 % 24)}:{Math.floor(((gameState.time + 6000) % 1000) / 1000 * 60).toString().padStart(2, '0')})</div>
        <div>Game Mode: {gameState.player.gameMode}</div>
      </div>
    </div>
  );
}