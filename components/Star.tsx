import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { CONFIG, COLORS } from '../constants';
import { getScatterPosition } from '../utils/geometry';

interface StarProps {
  treeState: TreeState;
}

export const Star: React.FC<StarProps> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const internalScale = useRef(new THREE.Vector3(1.5, 1.5, 1.5));
  
  // Define positions for the star
  const { treePos, scatterPos } = useMemo(() => {
    return {
      // Place precisely at the top of the tree height, moved up slightly (+1.5 instead of +0.5)
      treePos: new THREE.Vector3(0, CONFIG.TREE_HEIGHT / 2 + 1.5, 0),
      scatterPos: getScatterPosition(CONFIG.SCATTER_RADIUS)
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const isTree = treeState === TreeState.TREE_SHAPE;
    const targetPos = isTree ? treePos : scatterPos;
    
    // Lerp position
    groupRef.current.position.lerp(targetPos, delta * CONFIG.TRANSITION_SPEED);
    
    // Scale Logic: Full size (1.5) when Tree, Half size (0.75) when Scattered
    const targetScaleVal = isTree ? 1.5 : 0.75;
    const targetScale = new THREE.Vector3(targetScaleVal, targetScaleVal, targetScaleVal);
    internalScale.current.lerp(targetScale, delta * CONFIG.TRANSITION_SPEED);
    groupRef.current.scale.copy(internalScale.current);
    
    // Rotate constantly for shine
    groupRef.current.rotation.y += delta * 0.2;
    // Gentle bobbing
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.002;
  });

  // Generate 5 points for the star (Geometric 5-point star)
  const points = useMemo(() => {
    const items = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      items.push({
        rotation: [0, 0, angle], 
        position: [Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0]
      });
    }
    return items;
  }, []);

  return (
    <group ref={groupRef}>
      {/* 5-Pointed Star Construction */}
      <group>
        {points.map((p, i) => (
          <group key={i} rotation={new THREE.Euler(0, 0, p.rotation[2])}>
             {/* The Spike */}
             <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                {/* Cone: Radius, Height, Segments */}
                <coneGeometry args={[0.18, 1.4, 4]} />
                <meshStandardMaterial 
                  color={COLORS.GOLD_METALLIC}
                  emissive={COLORS.GOLD_HIGHLIGHT}
                  emissiveIntensity={0.6}
                  metalness={1.0}
                  roughness={0.15}
                  envMapIntensity={2.5}
                />
             </mesh>
          </group>
        ))}
        
        {/* Central Geometric Hub */}
        <mesh>
          <dodecahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial 
            color={COLORS.GOLD_METALLIC}
            emissive={COLORS.GOLD_HIGHLIGHT}
            emissiveIntensity={0.8}
            metalness={1.0}
            roughness={0.1}
          />
        </mesh>

        {/* Inner Light */}
        <pointLight intensity={80} distance={10} color={COLORS.GOLD_HIGHLIGHT} decay={2} />
      </group>
    </group>
  );
};