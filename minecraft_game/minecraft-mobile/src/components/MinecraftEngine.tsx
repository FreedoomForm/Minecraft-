// 3D мовимент для Minecraft с оптимизациями для мобильных устройств
import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { WorldChunk, TouchControls, PlayerState } from '@/types/game';
import { WorldGenerator } from '@/lib/worldGenerator';
import { gameData } from '@/lib/gameData';

// Компонент загрузки для 3D сцены
function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <div className="text-2xl mb-4">🎮</div>
        <div className="text-lg">Загрузка 3D мира...</div>
      </div>
    </div>
  );
}

// Упрощенный компонент для рендеринга блока
function Block({ position, blockType, onClick }: {
  position: [number, number, number];
  blockType: string;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Определение цвета блока без зависимости от gameData
  const getBlockColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'grass_block': '#4a9c4a',
      'dirt': '#8b4513',
      'stone': '#808080',
      'sand': '#f4e4bc',
      'water': '#1e90ff',
      'wood_log': '#8B4513',
      'oak_log': '#8B4513',
      'oak_planks': '#deb887',
      'cobblestone': '#696969',
      'coal_ore': '#2f2f2f',
      'iron_ore': '#cd853f',
      'diamond_ore': '#87ceeb',
      'glass': '#e0f6ff',
      'leaves': '#228b22',
      'oak_leaves': '#228b22'
    };
    return colorMap[type] || '#ffffff';
  };

  // Определяем, является ли блок прозрачным
  const isTransparent = ['water', 'glass'].includes(blockType);

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[1, 1, 1]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshBasicMaterial 
        color={hovered ? '#ffff00' : getBlockColor(blockType)}
        transparent={isTransparent}
        opacity={isTransparent ? 0.7 : 1.0}
      />
    </Box>
  );
}

// Упрощенный компонент демонстрационного чанка
function DemoChunk({ onBlockClick }: {
  onBlockClick: (x: number, y: number, z: number) => void;
}) {
  // Создаем простой чанк с базовыми блоками для демонстрации
  const blocks: JSX.Element[] = [];
  
  // Демо-ландшафт
  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      // Базовая поверхность
      blocks.push(
        <Block
          key={`ground-${x}-0-${z}`}
          position={[x, 0, z]}
          blockType="grass_block"
          onClick={() => onBlockClick(x, 0, z)}
        />
      );
      
      // Подземные слои
      for (let y = -1; y >= -3; y--) {
        blocks.push(
          <Block
            key={`underground-${x}-${y}-${z}`}
            position={[x, y, z]}
            blockType={y === -1 ? "dirt" : "stone"}
            onClick={() => onBlockClick(x, y, z)}
          />
        );
      }
    }
  }
  
  // Добавляем несколько демо-объектов
  blocks.push(
    <Block key="tree-base" position={[3, 1, 3]} blockType="oak_log" onClick={() => onBlockClick(3, 1, 3)} />,
    <Block key="tree-mid" position={[3, 2, 3]} blockType="oak_log" onClick={() => onBlockClick(3, 2, 3)} />,
    <Block key="tree-top" position={[3, 3, 3]} blockType="oak_log" onClick={() => onBlockClick(3, 3, 3)} />,
    <Block key="leaf1" position={[2, 3, 3]} blockType="leaves" onClick={() => onBlockClick(2, 3, 3)} />,
    <Block key="leaf2" position={[3, 4, 3]} blockType="leaves" onClick={() => onBlockClick(3, 4, 3)} />,
    <Block key="leaf3" position={[4, 3, 3]} blockType="leaves" onClick={() => onBlockClick(4, 3, 3)} />,
    <Block key="leaf4" position={[3, 3, 2]} blockType="leaves" onClick={() => onBlockClick(3, 3, 2)} />,
    <Block key="leaf5" position={[3, 3, 4]} blockType="leaves" onClick={() => onBlockClick(3, 3, 4)} />
  );
  
  // Водоем
  blocks.push(
    <Block key="water1" position={[-3, 0, -3]} blockType="water" onClick={() => onBlockClick(-3, 0, -3)} />,
    <Block key="water2" position={[-3, 0, -2]} blockType="water" onClick={() => onBlockClick(-3, 0, -2)} />,
    <Block key="water3" position={[-2, 0, -3]} blockType="water" onClick={() => onBlockClick(-2, 0, -3)} />,
    <Block key="water4" position={[-2, 0, -2]} blockType="water" onClick={() => onBlockClick(-2, 0, -2)} />
  );

  return <>{blocks}</>;
}

// Компонент игрока
function Player({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], position[1] + 0.9, position[2]]}>
      {/* Голова */}
      <Box args={[0.6, 0.6, 0.6]} position={[0, 0.3, 0]}>
        <meshBasicMaterial color="#ffdbac" />
      </Box>
      
      {/* Тело */}
      <Box args={[0.6, 1.2, 0.3]} position={[0, -0.6, 0]}>
        <meshBasicMaterial color="#0066cc" />
      </Box>
      
      {/* Руки */}
      <Box args={[0.3, 1.2, 0.3]} position={[-0.45, -0.6, 0]}>
        <meshBasicMaterial color="#ffdbac" />
      </Box>
      <Box args={[0.3, 1.2, 0.3]} position={[0.45, -0.6, 0]}>
        <meshBasicMaterial color="#ffdbac" />
      </Box>
      
      {/* Ноги */}
      <Box args={[0.3, 1.2, 0.3]} position={[-0.15, -1.8, 0]}>
        <meshBasicMaterial color="#333333" />
      </Box>
      <Box args={[0.3, 1.2, 0.3]} position={[0.15, -1.8, 0]}>
        <meshBasicMaterial color="#333333" />
      </Box>
    </group>
  );
}

// Упрощенный контроллер камеры
function CameraController({ 
  controls, 
  playerPosition,
  onCameraChange
}: { 
  controls: TouchControls;
  playerPosition: [number, number, number];
  onCameraChange: (rotation: [number, number]) => void;
}) {
  const { camera } = useThree();
  
  // Устанавливаем фиксированную позицию и ориентацию для стабильности
  useFrame(() => {
    try {
      // Позиция камеры (немного отступаем и поднимаемся выше для обзора)
      camera.position.set(
        playerPosition[0] - 5,
        playerPosition[1] + 8,
        playerPosition[2] + 5
      );
      
      // Направляем камеру в центр сцены
      camera.lookAt(playerPosition[0], playerPosition[1], playerPosition[2]);
      
      // Фиксированное вращение для стабильности
      onCameraChange([Math.PI * -0.25, Math.PI * 0.25]);
    } catch (error) {
      console.warn('Ошибка обновления камеры:', error);
    }
  });

  return null;
}

interface MinecraftEngineProps {
  playerState: PlayerState;
  controls: TouchControls;
  chunks: Map<string, WorldChunk>;
  onPlayerUpdate: (newState: Partial<PlayerState>) => void;
  onBlockBreak: (x: number, y: number, z: number) => void;
  onBlockPlace: (x: number, y: number, z: number) => void;
  worldGenerator: WorldGenerator;
  className?: string;
}

// Упрощенный 3D мотор для стабильной работы
export function MinecraftEngine({
  playerState,
  controls,
  onPlayerUpdate,
  onBlockBreak,
  onBlockPlace,
  className = ''
}: MinecraftEngineProps) {
  // Используем фиксированное вращение камеры
  const [cameraRotation, setCameraRotation] = useState<[number, number]>([0, 0]);
  const [isError, setIsError] = useState(false);

  // Обработка движения игрока с упрощенной логикой
  const handleMovement = useCallback((delta: number) => {
    try {
      if (!controls.moveStick || (controls.moveStick.x === 0 && controls.moveStick.y === 0)) return;
      
      const speed = controls.sprintPressed ? 5 : 3; // блоков в секунду
      const moveDistance = speed * delta;
      
      // Более простая логика перемещения
      const newPosition: [number, number, number] = [
        playerState.position[0] + controls.moveStick.x * moveDistance,
        playerState.position[1] + (controls.jumpPressed ? 0.1 : controls.crouchPressed ? -0.05 : 0),
        playerState.position[2] + controls.moveStick.y * moveDistance
      ];
      
      onPlayerUpdate({
        position: newPosition,
        rotation: cameraRotation
      });
    } catch (error) {
      console.warn('Ошибка обработки движения:', error);
    }
  }, [controls, playerState.position, cameraRotation, onPlayerUpdate]);

  // Обработка движения в useFrame
  useFrame((_, delta) => {
    handleMovement(delta);
  });

  const handleBlockClick = (x: number, y: number, z: number) => {
    if (controls.actionPressed) {
      onBlockBreak(x, y, z);
    }
  };

  // Обработка ошибок Three.js
  const handleError = useCallback((error: any) => {
    console.error('Ошибка Three.js:', error);
    setIsError(true);
  }, []);

  if (isError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-red-900 text-white ${className}`}>
        <div className="text-center p-4">
          <div className="text-2xl mb-4">❌</div>
          <div className="text-lg mb-2">Ошибка 3D движка</div>
          <button 
            onClick={() => setIsError(false)}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: [0, 10, 10]
        }}
        gl={{ 
          antialias: false, // Отключаем для производительности
          powerPreference: 'low-power', // Оптимизация для мобильных
          alpha: false, // Отключаем прозрачность для производительности
          depth: true,  // Включаем буфер глубины
          stencil: false, // Отключаем stencil буфер для производительности
          logarithmicDepthBuffer: false // Отключаем для производительности
        }}
        dpr={[1, 1]} // Фиксированный DPR для стабильности
        frameloop="always" // Всегда рендерим для стабильности
        shadows={false} // Отключаем тени для производительности
      >
        <Suspense fallback={null}>
          <CameraController 
            controls={controls}
            playerPosition={playerState.position}
            onCameraChange={setCameraRotation}
          />
          
          {/* Освещение */}
          <ambientLight intensity={0.8} />
          <directionalLight 
            position={[10, 20, 10]} 
            intensity={0.5}
            castShadow={false}
          />
          
          {/* Упрощенный демо-мир вместо генерации чанков */}
          <DemoChunk onBlockClick={handleBlockClick} />
          
          {/* Игрок (показываем в третьем лице) */}
          <Player position={playerState.position} />
          
          {/* Небо/горизонт */}
          <Sphere args={[500]} position={[0, 0, 0]}>
            <meshBasicMaterial 
              color="#87CEEB" 
              side={THREE.BackSide} 
              fog={false}
            />
          </Sphere>
        </Suspense>
      </Canvas>
      
      {/* Прицел */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-4 h-4 border-2 border-white rounded-full opacity-60" />
      </div>
      
      {/* Подсказка */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm max-w-sm text-center">
        Демо-режим Minecraft. Используйте виртуальный джойстик для перемещения.
      </div>
    </div>
  );
}