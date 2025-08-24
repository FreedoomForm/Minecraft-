// Мобильные touch-контроллы для Minecraft
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TouchControls } from '@/types/game';

interface MobileControlsProps {
  onControlsChange: (controls: TouchControls) => void;
  className?: string;
}

export function MobileControls({ onControlsChange, className = '' }: MobileControlsProps) {
  const [controls, setControls] = useState<TouchControls>({
    moveStick: { x: 0, y: 0 },
    lookSensitivity: 2,
    jumpPressed: false,
    sprintPressed: false,
    crouchPressed: false,
    actionPressed: false
  });

  const moveStickRef = useRef<HTMLDivElement>(null);
  const lookAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastLookPos, setLastLookPos] = useState({ x: 0, y: 0 });

  // Обновление контроллеров
  const updateControls = useCallback((newControls: Partial<TouchControls>) => {
    setControls(prev => {
      const updated = { ...prev, ...newControls };
      onControlsChange(updated);
      return updated;
    });
  }, [onControlsChange]);

  // Обработка движения стика
  const handleMoveStickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = moveStickRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setDragStart({ x: centerX, y: centerY });
    setIsDragging(true);
  }, []);

  const handleMoveStickMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !moveStickRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = moveStickRef.current.getBoundingClientRect();
    const maxDistance = rect.width / 2;
    
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Ограничиваем стик в пределах окружности
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    
    const x = clampedDistance * Math.cos(angle) / maxDistance;
    const y = clampedDistance * Math.sin(angle) / maxDistance;
    
    updateControls({ moveStick: { x, y: -y } }); // инвертируем Y
  }, [isDragging, dragStart, updateControls]);

  const handleMoveStickEnd = useCallback(() => {
    setIsDragging(false);
    updateControls({ moveStick: { x: 0, y: 0 } });
  }, [updateControls]);

  // Обработка обзора (камеры)
  const handleLookStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setLastLookPos({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleLookMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastLookPos.x;
    const deltaY = touch.clientY - lastLookPos.y;
    
    // Отправляем дельту камеры (в радианах)
    const sensitivity = controls.lookSensitivity * 0.002;
    const newControls = {
      ...controls,
      cameraRotation: {
        deltaX: deltaX * sensitivity,
        deltaY: deltaY * sensitivity
      }
    };
    onControlsChange(newControls as any);
    
    setLastLookPos({ x: touch.clientX, y: touch.clientY });
  }, [lastLookPos, controls, onControlsChange]);

  // Подписка на события touch
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleMoveStickMove(e);
      } else {
        handleLookMove(e);
      }
    };

    const handleTouchEnd = () => {
      handleMoveStickEnd();
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    } else {
      document.addEventListener('touchmove', handleLookMove, { passive: true });
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchmove', handleLookMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMoveStickMove, handleMoveStickEnd, handleLookMove]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Область обзора (камеры) */}
      <div 
        ref={lookAreaRef}
        className="absolute inset-0 pointer-events-auto"
        onTouchStart={handleLookStart}
        style={{ touchAction: 'none' }}
      />
      
      {/* Виртуальный стик движения */}
      <div className="absolute bottom-20 left-6 pointer-events-auto">
        <div 
          ref={moveStickRef}
          className="w-24 h-24 rounded-full border-4 border-gray-800 bg-gray-900/50 backdrop-blur-sm relative touch-none"
          onTouchStart={handleMoveStickStart}
          style={{ touchAction: 'none' }}
        >
          <div 
            className="absolute w-8 h-8 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `50%`,
              top: `50%`,
              transform: `translate(-50%, -50%) translate(${controls.moveStick.x * 32}px, ${controls.moveStick.y * 32}px)`
            }}
          />
        </div>
        <div className="text-center mt-2 text-white text-xs opacity-70">Движение</div>
      </div>
      
      {/* Кнопки действий */}
      <div className="absolute bottom-20 right-6 flex flex-col gap-3 pointer-events-auto">
        {/* Прыжок */}
        <button
          className={`w-16 h-16 rounded-full border-4 border-gray-800 font-bold text-white transition-colors ${
            controls.jumpPressed ? 'bg-blue-500' : 'bg-gray-900/50 backdrop-blur-sm'
          }`}
          onTouchStart={() => updateControls({ jumpPressed: true })}
          onTouchEnd={() => updateControls({ jumpPressed: false })}
          style={{ touchAction: 'none' }}
        >
          ↑
        </button>
        
        {/* Приседание */}
        <button
          className={`w-16 h-16 rounded-full border-4 border-gray-800 font-bold text-white transition-colors ${
            controls.crouchPressed ? 'bg-yellow-500' : 'bg-gray-900/50 backdrop-blur-sm'
          }`}
          onTouchStart={() => updateControls({ crouchPressed: true })}
          onTouchEnd={() => updateControls({ crouchPressed: false })}
          style={{ touchAction: 'none' }}
        >
          ↓
        </button>
      </div>
      
      {/* Кнопка действия справа */}
      <div className="absolute bottom-32 right-24 pointer-events-auto">
        <button
          className={`w-20 h-20 rounded-full border-4 border-gray-800 font-bold text-white text-2xl transition-colors ${
            controls.actionPressed ? 'bg-red-500' : 'bg-gray-900/50 backdrop-blur-sm'
          }`}
          onTouchStart={() => updateControls({ actionPressed: true })}
          onTouchEnd={() => updateControls({ actionPressed: false })}
          style={{ touchAction: 'none' }}
        >
          ⚙️
        </button>
        <div className="text-center mt-1 text-white text-xs opacity-70">Действие</div>
      </div>
      
      {/* Кнопка бега */}
      <div className="absolute bottom-6 left-32 pointer-events-auto">
        <button
          className={`px-4 py-2 rounded-lg border-2 border-gray-800 font-bold text-white text-sm transition-colors ${
            controls.sprintPressed ? 'bg-green-500' : 'bg-gray-900/50 backdrop-blur-sm'
          }`}
          onTouchStart={() => updateControls({ sprintPressed: true })}
          onTouchEnd={() => updateControls({ sprintPressed: false })}
          style={{ touchAction: 'none' }}
        >
          Бег
        </button>
      </div>
    </div>
  );
}