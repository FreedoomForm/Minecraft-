// Упрощенный 3D движок для Minecraft
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { TouchControls, PlayerState } from '@/types/game';

// Простой блок
function Block({ position, color, onClick }: {
  position: [number, number, number];
  color: string;
  onClick?: () => void;
}) {
  return (
    <Box
      position={position}
      args={[1, 1, 1]}
      onClick={onClick}
    >
      <meshBasicMaterial color={color} />
    </Box>
  );
}

// Простой игрок
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
    </group>
  );
}

// Простой мир
function SimpleWorld({ onBlockClick }: { onBlockClick: (x: number, y: number, z: number) => void }) {
  const blocks: JSX.Element[] = [];
  
  // Создаем простую поверхность
  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      // Земля
      blocks.push(
        <Block
          key={`ground-${x}-0-${z}`}
          position={[x, 0, z]}
          color="#4a9c4a"
          onClick={() => onBlockClick(x, 0, z)}
        />
      );
      
      // Подземные слои
      for (let y = -1; y >= -3; y--) {
        blocks.push(
          <Block
            key={`underground-${x}-${y}-${z}`}
            position={[x, y, z]}
            color={y === -1 ? "#8b4513" : "#808080"}
            onClick={() => onBlockClick(x, y, z)}
          />
        );
      }
    }
  }
  
  // Добавляем дерево
  blocks.push(
    <Block key="tree1" position={[3, 1, 3]} color="#8B4513" onClick={() => onBlockClick(3, 1, 3)} />,
    <Block key="tree2" position={[3, 2, 3]} color="#8B4513" onClick={() => onBlockClick(3, 2, 3)} />,
    <Block key="tree3" position={[3, 3, 3]} color="#8B4513" onClick={() => onBlockClick(3, 3, 3)} />
  );

  return <>{blocks}</>;
}

// Простая камера
function SimpleCamera({ playerPosition }: { playerPosition: [number, number, number] }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Фиксированная позиция камеры
    camera.position.set(
      playerPosition[0] - 5,
      playerPosition[1] + 8,
      playerPosition[2] + 5
    );
    
    // Смотрим на игрока
    camera.lookAt(playerPosition[0], playerPosition[1], playerPosition[2]);
  });

  return null;
}

interface MinecraftEngineProps {
  playerState: PlayerState;
  controls: TouchControls;
  onPlayerUpdate: (newState: Partial<PlayerState>) => void;
  onBlockBreak: (x: number, y: number, z: number) => void;
  onBlockPlace: (x: number, y: number, z: number) => void;
  className?: string;
}

export function MinecraftEngine({
  playerState,
  controls,
  onPlayerUpdate,
  onBlockBreak,
  onBlockPlace,
  className = ''
}: MinecraftEngineProps) {
  const [isError, setIsError] = useState(false);

  // Простое движение
  const handleMovement = useCallback((delta: number) => {
    if (!controls.moveStick || (controls.moveStick.x === 0 && controls.moveStick.y === 0)) return;
    
    const speed = 3;
    const moveDistance = speed * delta;
    
    const newPosition: [number, number, number] = [
      playerState.position[0] + controls.moveStick.x * moveDistance,
      playerState.position[1] + (controls.jumpPressed ? 0.1 : controls.crouchPressed ? -0.05 : 0),
      playerState.position[2] + controls.moveStick.y * moveDistance
    ];
    
    onPlayerUpdate({
      position: newPosition
    });
  }, [controls, playerState.position, onPlayerUpdate]);

  useFrame((_, delta) => {
    handleMovement(delta);
  });

  const handleBlockClick = (x: number, y: number, z: number) => {
    if (controls.actionPressed) {
      onBlockBreak(x, y, z);
    }
  };

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
          antialias: false,
          powerPreference: 'low-power',
          alpha: false,
          depth: true
        }}
        dpr={[1, 1]}
        frameloop="always"
        shadows={false}
      >
        <SimpleCamera playerPosition={playerState.position} />
        
        {/* Освещение */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 10]} intensity={0.5} />
        
        {/* Мир */}
        <SimpleWorld onBlockClick={handleBlockClick} />
        
        {/* Игрок */}
        <Player position={playerState.position} />
        
        {/* Небо */}
        <Sphere args={[500]} position={[0, 0, 0]}>
          <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
        </Sphere>
      </Canvas>
      
      {/* Прицел */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-4 h-4 border-2 border-white rounded-full opacity-60" />
      </div>
      
      {/* Подсказка */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm max-w-sm text-center">
        Minecraft Mobile. Используйте джойстик для перемещения.
      </div>
    </div>
  );
}