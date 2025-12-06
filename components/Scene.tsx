import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Star } from './Star';
import { TreeState } from '../types';
import { COLORS } from '../constants';

interface SceneProps {
  treeState: TreeState;
}

export const Scene: React.FC<SceneProps> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);

  // Rotate the whole tree group slowly
  useFrame((state, delta) => {
    if (groupRef.current && treeState === TreeState.TREE_SHAPE) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  // Dynamic Camera Movement
  useFrame((state) => {
    if (!controlsRef.current) return;
    
    // Slight ease of camera target based on state?
    // Kept simple: OrbitControls with damping handles most interactivity
    // We could add an auto-rotate here if idle
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 30]} fov={45} />
      <OrbitControls 
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={10}
        maxDistance={50}
        maxPolarAngle={Math.PI / 1.5}
        autoRotate={treeState === TreeState.SCATTERED} // Auto rotate when scattered for chaos view
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
      />

      {/* Lighting System */}
      <ambientLight intensity={0.2} color={COLORS.EMERALD_DEEP} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={200} 
        color={COLORS.GOLD_HIGHLIGHT} 
        castShadow 
      />
      <pointLight position={[-10, -10, -10]} intensity={50} color="#00ff44" distance={20} />
      
      {/* Environment for Reflections */}
      <Environment preset="city" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Main Content */}
      <group ref={groupRef}>
        <Foliage treeState={treeState} />
        <Ornaments treeState={treeState} />
        <Star treeState={treeState} />
        
        {/* Central Trunk Glow (Only visible in tree mode usually) */}
        <mesh position={[0, 0, 0]} scale={[0.5, 12, 0.5]}>
          <cylinderGeometry args={[0.5, 2, 1, 16]} />
          <meshBasicMaterial color={COLORS.GOLD_METALLIC} transparent opacity={0.1} />
        </mesh>
      </group>

      {/* Post Processing for Cinematic Feel */}
      <EffectComposer enableNormalPass={false}>
        {/* Luxurious Bloom */}
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        {/* Color Grading */}
        <ToneMapping
          adaptive={true} 
          resolution={256} 
          middleGrey={0.6} 
          maxLuminance={16.0} 
          averageLuminance={1.0} 
          adaptationRate={1.0} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};