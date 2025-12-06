import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';
import { getConeSpiralPosition, getScatterPosition } from '../utils/geometry';
import { TreeState } from '../types';

// Custom Shader Material for performant morphing
const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMorphFactor: { value: 0 }, // 0 = Scatter, 1 = Tree
    uColorDeep: { value: COLORS.EMERALD_DEEP },
    uColorLight: { value: COLORS.EMERALD_LIGHT },
    uColorGold: { value: COLORS.GOLD_HIGHLIGHT },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMorphFactor;
    attribute vec3 aTargetPosition;
    attribute float aSize;
    attribute float aRandom;
    
    varying vec3 vColor;
    varying float vAlpha;

    // Simplex noise function simplified
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      // 1. Calculate positions
      vec3 startPos = position; // Scatter position
      vec3 endPos = aTargetPosition; // Tree position
      
      // 2. Mix based on morph factor (cubic ease in-out approximation)
      float t = uMorphFactor;
      float ease = t * t * (3.0 - 2.0 * t);
      vec3 currentPos = mix(startPos, endPos, ease);

      // 3. Add Breathing/Floating noise
      float noiseFreq = 0.5;
      float noiseAmp = mix(0.5, 0.1, ease); // Move more when scattered
      float time = uTime * 0.5 + aRandom * 10.0;
      
      vec3 noiseOffset = vec3(
        snoise(vec3(currentPos.x * noiseFreq, time, 0.0)),
        snoise(vec3(time, currentPos.y * noiseFreq, 0.0)),
        snoise(vec3(0.0, currentPos.z * noiseFreq, time))
      ) * noiseAmp;

      vec4 mvPosition = modelViewMatrix * vec4(currentPos + noiseOffset, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // 4. Point Size scaling
      gl_PointSize = aSize * (300.0 / -mvPosition.z);

      // 5. Pass color info to fragment
      vAlpha = 0.8 + 0.2 * sin(uTime * 2.0 + aRandom * 10.0);
      // Gold highlights at tips/randomly
      vColor = aRandom > 0.8 ? vec3(1.0, 0.9, 0.5) : vec3(0.0, 1.0, 0.2); 
    }
  `,
  fragmentShader: `
    uniform vec3 uColorDeep;
    uniform vec3 uColorLight;
    uniform vec3 uColorGold;
    
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if(dist > 0.5) discard;

      // Soft edge glow
      float glow = 1.0 - (dist * 2.0);
      glow = pow(glow, 1.5);

      vec3 finalColor = mix(uColorDeep, uColorLight, vColor.z); // Green gradient
      // Add gold sparkle
      if(vColor.x > 0.8) {
         finalColor = mix(finalColor, uColorGold, 0.8);
      }

      gl_FragColor = vec4(finalColor * 2.0, vAlpha * glow); 
    }
  `
};

interface FoliageProps {
  treeState: TreeState;
}

export const Foliage: React.FC<FoliageProps> = ({ treeState }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Generate geometry data
  const { positions, targets, sizes, randoms } = useMemo(() => {
    const posArr = [];
    const tarArr = [];
    const szArr = [];
    const rndArr = [];

    const totalParticles = CONFIG.FOLIAGE_COUNT;

    for (let i = 0; i < totalParticles; i++) {
      // Logic to reduce density in the upper 1/3 of the tree
      // getConeSpiralPosition maps index 0 to top? No, y calculation is 1 - (i/total).
      // So i=0 is y=1 (Top), i=max is y=0 (Bottom).
      
      const normalizedY = 1 - (i / (totalParticles - 1));
      
      // If we are in the top 1/3 (normalizedY > 0.66)
      // Randomly skip 30% of foliage to reduce density
      if (normalizedY > 0.66 && Math.random() < 0.3) {
        continue;
      }

      // Scatter Position
      const s = getScatterPosition(CONFIG.SCATTER_RADIUS);
      posArr.push(s.x, s.y, s.z);

      // Tree Position
      const t = getConeSpiralPosition(i, totalParticles);
      // Add slight jitter
      t.x += (Math.random() - 0.5) * 0.5;
      t.z += (Math.random() - 0.5) * 0.5;
      tarArr.push(t.x, t.y, t.z);

      // Size
      szArr.push(Math.random() * 0.25 + 0.15);
      rndArr.push(Math.random());
    }

    return { 
      positions: new Float32Array(posArr), 
      targets: new Float32Array(tarArr), 
      sizes: new Float32Array(szArr), 
      randoms: new Float32Array(rndArr) 
    };
  }, []);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Animate Morph Factor
      const targetMorph = treeState === TreeState.TREE_SHAPE ? 1.0 : 0.0;
      shaderRef.current.uniforms.uMorphFactor.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uMorphFactor.value,
        targetMorph,
        delta * CONFIG.TRANSITION_SPEED * 0.5
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPosition"
          count={targets.length / 3}
          array={targets}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[FoliageShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};