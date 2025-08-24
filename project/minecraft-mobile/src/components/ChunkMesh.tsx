import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { WorldChunk } from '@/types/game';
import { WorldGenerator } from '@/lib/worldGenerator';

interface ChunkMeshProps {
  chunk: WorldChunk;
  worldGenerator: WorldGenerator;
}

// Простое сопоставление имени блока с цветом
const BLOCK_COLOR_MAP: Record<string, string> = {
  grass_block: '#4a9c4a',
  dirt: '#8b4513',
  stone: '#808080',
  sand: '#f4e4bc',
  water: '#1e90ff',
  wood_log: '#8B4513',
  oak_log: '#8B4513',
  oak_planks: '#deb887',
  cobblestone: '#696969',
  coal_ore: '#2f2f2f',
  iron_ore: '#cd853f',
  diamond_ore: '#87ceeb',
  glass: '#e0f6ff',
  leaves: '#228b22',
  oak_leaves: '#228b22',
  bedrock: '#2b2b2b'
};

function getBlockColorHex(blockName: string | undefined): string {
  if (!blockName) return '#ffffff';
  return BLOCK_COLOR_MAP[blockName] || '#ffffff';
}

function getBlockIndex(x: number, y: number, z: number): number {
  return y * 256 + z * 16 + x;
}

export function ChunkMesh({ chunk, worldGenerator }: ChunkMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { matrices, colors, count } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];

    const baseX = chunk.x * 16;
    const baseZ = chunk.z * 16;

    // Включаем только "видимые" блоки (если есть сосед-воздух)
    const isSolid = (x: number, y: number, z: number) => {
      if (x < 0 || x >= 16 || z < 0 || z >= 16 || y < 0 || y >= 64) return false;
      const id = chunk.blocks[getBlockIndex(x, y, z)];
      return id > 0;
    };

    for (let y = 0; y < 64; y++) {
      for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) {
          const blockId = chunk.blocks[getBlockIndex(x, y, z)];
          if (blockId === 0) continue;

          // Проверяем соседей: если все соседи твердые, пропускаем внутренний блок
          const neighborSolidCount = (
            (isSolid(x + 1, y, z) ? 1 : 0) +
            (isSolid(x - 1, y, z) ? 1 : 0) +
            (isSolid(x, y + 1, z) ? 1 : 0) +
            (isSolid(x, y - 1, z) ? 1 : 0) +
            (isSolid(x, y, z + 1) ? 1 : 0) +
            (isSolid(x, y, z - 1) ? 1 : 0)
          );
          if (neighborSolidCount === 6) continue;

          const worldX = baseX + x + 0.5;
          const worldY = y + 0.5;
          const worldZ = baseZ + z + 0.5;

          dummy.position.set(worldX, worldY, worldZ);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());

          const name = worldGenerator.getBlockNameById(blockId);
          color.set(getBlockColorHex(name));
          colors.push(color.clone());
        }
      }
    }

    return { matrices, colors, count: matrices.length };
  }, [chunk, worldGenerator]);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, matrices[i]);
      color.copy(colors[i]);
      mesh.setColorAt(i, color);
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

export default ChunkMesh;

