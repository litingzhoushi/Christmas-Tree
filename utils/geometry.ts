import * as THREE from 'three';
import { CONFIG, GOLDEN_ANGLE } from '../constants';

/**
 * Calculates a point on a cone surface using golden spiral distribution
 */
export const getConeSpiralPosition = (i: number, total: number): THREE.Vector3 => {
  const y = 1 - (i / (total - 1)); // 1 (top) to 0 (bottom)
  const radius = Math.sqrt(1 - y) * CONFIG.TREE_RADIUS_BASE; 
  const theta = i * GOLDEN_ANGLE;

  const x = radius * Math.cos(theta);
  const z = radius * Math.sin(theta);
  // Remap Y to actual world height (centered somewhat)
  const worldY = (y * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);

  return new THREE.Vector3(x, worldY, z);
};

/**
 * Calculates a random point inside a sphere
 */
export const getScatterPosition = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius; // Cubic root for uniform distribution

  const sinPhi = Math.sin(phi);
  const x = r * sinPhi * Math.cos(theta);
  const y = r * sinPhi * Math.sin(theta);
  const z = r * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};