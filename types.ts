import * as THREE from 'three';

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface DualPosition {
  tree: THREE.Vector3;
  scatter: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  speed: number; // For floating animation
  phase: number;
}

export interface OrnamentData extends DualPosition {
  id: number;
  type: 'sphere' | 'cuboid';
  color: THREE.Color;
  dimensions?: THREE.Vector3; // Specific dimensions for cuboids
}