import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS, GOLDEN_ANGLE, GREEN_PALETTE } from '../constants';
import { getScatterPosition } from '../utils/geometry';
import { TreeState, OrnamentData } from '../types';

interface OrnamentsProps {
  treeState: TreeState;
}

// 4 Different variations of cuboid sizes
const CUBOID_SIZES = [
  new THREE.Vector3(0.4, 0.4, 0.4),  // Small Cube
  new THREE.Vector3(0.2, 0.8, 0.2),  // Tall Pillar
  new THREE.Vector3(0.6, 0.2, 0.6),  // Flat Slab
  new THREE.Vector3(0.3, 0.5, 0.3),  // Rectangular Block
];

// Helper to generate Red/Yellow Stripe texture
const useStripeTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background Yellow
      ctx.fillStyle = '#D4AF37'; 
      ctx.fillRect(0, 0, 64, 64);
      // Red Stripes
      ctx.fillStyle = '#8a0b0b';
      for (let i = 0; i < 64; i += 8) {
        ctx.fillRect(i, 0, 4, 64);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);
};

export const Ornaments: React.FC<OrnamentsProps> = ({ treeState }) => {
  const sphereRef = useRef<THREE.InstancedMesh>(null);
  const cuboidRef = useRef<THREE.InstancedMesh>(null);
  const bowRef = useRef<THREE.InstancedMesh>(null);
  const [dummy] = useState(() => new THREE.Object3D());
  const [dummyBow] = useState(() => new THREE.Object3D());
  
  const stripeMap = useStripeTexture();

  // Separate data for different geometries
  const { spheres, cuboids, bows } = useMemo(() => {
    const sphereData: OrnamentData[] = [];
    const cuboidData: OrnamentData[] = [];
    const bowData: OrnamentData[] = []; // Bows track specific cuboids

    const total = CONFIG.ORNAMENT_COUNT;

    for (let i = 0; i < total; i++) {
      // Normalize height (1 = top, 0 = bottom)
      const yNorm = 1 - (i / total);

      // Reduce density in top 1/3 (yNorm > 0.66)
      if (yNorm > 0.66 && Math.random() < 0.4) {
        continue;
      }

      // Calculate Tree Position
      const y = (yNorm * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
      // Vary radius slightly to create depth
      const radiusVariation = Math.random() * 0.5 + 0.9;
      const radius = Math.sqrt(1 - yNorm) * CONFIG.TREE_RADIUS_BASE * radiusVariation; 
      const theta = i * GOLDEN_ANGLE * 2.5;

      const treePos = new THREE.Vector3(
        radius * Math.cos(theta),
        y,
        radius * Math.sin(theta)
      );

      const scatterPos = getScatterPosition(CONFIG.SCATTER_RADIUS * 1.2);
      
      const common = {
        id: i,
        tree: treePos,
        scatter: scatterPos,
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        speed: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
      };

      // Determine Type
      // 50% Cuboids (Green palette)
      // 50% Spheres (Gold/Red)
      if (Math.random() > 0.5) {
         // CUBOID
         // Pick random size preset
         const sizeIdx = Math.floor(Math.random() * CUBOID_SIZES.length);
         const dim = CUBOID_SIZES[sizeIdx];
         
         const cuboidItem = {
             ...common,
             type: 'cuboid' as const,
             scale: 1, 
             dimensions: dim,
             color: GREEN_PALETTE[Math.floor(Math.random() * GREEN_PALETTE.length)],
         };
         cuboidData.push(cuboidItem);

         // 1/3 Chance to have a bow tie
         if (Math.random() < 0.33) {
             bowData.push(cuboidItem); // Share logic/targets with parent cuboid
         }

      } else {
         // SPHERE
         let color;
         const r = Math.random();
         if (r > 0.6) color = COLORS.GOLD_METALLIC;
         else if (r > 0.25) color = COLORS.RED_LUXURY;
         else color = GREEN_PALETTE[0]; 

         sphereData.push({
             ...common,
             type: 'sphere' as const,
             scale: Math.random() * 0.25 + 0.15,
             color: color,
         });
      }
    }
    return { spheres: sphereData, cuboids: cuboidData, bows: bowData };
  }, []);

  // Update loop
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const isTree = treeState === TreeState.TREE_SHAPE;

    // --- Update Spheres (Still rotate and float) ---
    if (sphereRef.current) {
        spheres.forEach((item, i) => {
            const target = isTree ? item.tree : item.scatter;
            const floatAmp = isTree ? 0.05 : 0.5;
            const floatY = Math.sin(time * item.speed + item.phase) * floatAmp;

            sphereRef.current!.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

            dummy.position.lerp(target.clone().add(new THREE.Vector3(0, floatY, 0)), delta * CONFIG.TRANSITION_SPEED);
            
            // Spheres rotate
            if (isTree) {
                dummy.rotation.x = THREE.MathUtils.lerp(dummy.rotation.x, 0, delta);
                dummy.rotation.y += delta * 0.2;
                dummy.rotation.z = THREE.MathUtils.lerp(dummy.rotation.z, 0, delta);
            } else {
                dummy.rotation.x += delta * 0.5 * item.speed;
                dummy.rotation.y += delta * 0.5 * item.speed;
            }
            
            dummy.scale.setScalar(THREE.MathUtils.lerp(dummy.scale.x, item.scale, delta * 2));
            dummy.updateMatrix();
            sphereRef.current!.setMatrixAt(i, dummy.matrix);
            sphereRef.current!.setColorAt(i, item.color);
        });
        sphereRef.current.instanceMatrix.needsUpdate = true;
        if (sphereRef.current.instanceColor) sphereRef.current.instanceColor.needsUpdate = true;
    }

    // --- Update Cuboids (NO SHAKING in Tree Mode) ---
    if (cuboidRef.current) {
        cuboids.forEach((item, i) => {
            const target = isTree ? item.tree : item.scatter;
            const floatAmp = isTree ? 0.02 : 0.5; // Less float for heavy boxes in tree mode
            const floatY = Math.sin(time * item.speed + item.phase) * floatAmp;

            cuboidRef.current!.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

            dummy.position.lerp(target.clone().add(new THREE.Vector3(0, floatY, 0)), delta * CONFIG.TRANSITION_SPEED);

            if (isTree) {
                // STABILIZE: Lerp rotation to 0 or a fixed nice angle, do not increment
                dummy.rotation.x = THREE.MathUtils.lerp(dummy.rotation.x, 0, delta);
                dummy.rotation.z = THREE.MathUtils.lerp(dummy.rotation.z, 0, delta);
                // We leave Y rotation fixed (or slowly lerp to initial random phase) so they aren't all uniform
                // but we DO NOT add delta, so they don't spin.
            } else {
                // Spin in chaos mode
                dummy.rotation.x += delta * 0.5 * item.speed;
                dummy.rotation.y += delta * 0.5 * item.speed;
            }

            // Scale logic
            if (item.dimensions) {
                dummy.scale.set(
                    THREE.MathUtils.lerp(dummy.scale.x, item.dimensions.x, delta * 2),
                    THREE.MathUtils.lerp(dummy.scale.y, item.dimensions.y, delta * 2),
                    THREE.MathUtils.lerp(dummy.scale.z, item.dimensions.z, delta * 2)
                );
            }

            dummy.updateMatrix();
            cuboidRef.current!.setMatrixAt(i, dummy.matrix);
            cuboidRef.current!.setColorAt(i, item.color);
        });
        cuboidRef.current.instanceMatrix.needsUpdate = true;
        if (cuboidRef.current.instanceColor) cuboidRef.current.instanceColor.needsUpdate = true;
    }

    // --- Update Bow Ties (Follow their cuboids) ---
    if (bowRef.current) {
        bows.forEach((item, i) => {
            const target = isTree ? item.tree : item.scatter;
            const floatAmp = isTree ? 0.02 : 0.5;
            const floatY = Math.sin(time * item.speed + item.phase) * floatAmp;

            bowRef.current!.getMatrixAt(i, dummyBow.matrix);
            dummyBow.matrix.decompose(dummyBow.position, dummyBow.quaternion, dummyBow.scale);

            // Same position as parent cuboid
            const pos = target.clone().add(new THREE.Vector3(0, floatY, 0));
            dummyBow.position.lerp(pos, delta * CONFIG.TRANSITION_SPEED);

            // Same rotation logic as cuboid so it sticks to it
            if (isTree) {
                 dummyBow.rotation.x = THREE.MathUtils.lerp(dummyBow.rotation.x, 0, delta);
                 dummyBow.rotation.z = THREE.MathUtils.lerp(dummyBow.rotation.z, 0, delta);
            } else {
                 dummyBow.rotation.x += delta * 0.5 * item.speed;
                 dummyBow.rotation.y += delta * 0.5 * item.speed;
            }
            
            // Adjust scale (Bows are uniform, but depend on box size generally)
            // We make them look like a bowtie
            dummyBow.scale.setScalar(THREE.MathUtils.lerp(dummyBow.scale.x, 0.25, delta * 2));

            dummyBow.updateMatrix();
            bowRef.current!.setMatrixAt(i, dummyBow.matrix);
        });
        bowRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* SPHERES */}
      <instancedMesh
        ref={sphereRef}
        args={[undefined, undefined, spheres.length]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={2.0}
        />
      </instancedMesh>

      {/* CUBOIDS (Green Palette Boxes) */}
      <instancedMesh
        ref={cuboidRef}
        args={[undefined, undefined, cuboids.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} /> 
        <meshStandardMaterial 
          metalness={0.4} 
          roughness={0.6}
          envMapIntensity={1.0}
        />
      </instancedMesh>

      {/* BOW TIES (Red-Yellow Stripe) */}
      <instancedMesh
        ref={bowRef}
        args={[undefined, undefined, bows.length]}
        castShadow
      >
        {/* Double Cone shape roughly approximates a bow tie */}
        <coneGeometry args={[0.5, 1.5, 8]} /> 
        <meshStandardMaterial 
            map={stripeMap}
            metalness={0.2}
            roughness={0.8}
        />
      </instancedMesh>
    </group>
  );
};