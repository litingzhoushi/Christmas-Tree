import * as THREE from 'three';

export const COLORS = {
  EMERALD_DEEP: new THREE.Color('#012b0a'),
  EMERALD_MID: new THREE.Color('#046307'),
  EMERALD_LIGHT: new THREE.Color('#1a8c23'),
  GOLD_METALLIC: new THREE.Color('#D4AF37'),
  GOLD_HIGHLIGHT: new THREE.Color('#F7E7CE'),
  RED_LUXURY: new THREE.Color('#8a0b0b'),
};

export const GREEN_PALETTE = [
  new THREE.Color('#1a472a'), // Hunter Green
  new THREE.Color('#2e8b57'), // Sea Green
  new THREE.Color('#556b2f'), // Dark Olive
];

export const CONFIG = {
  FOLIAGE_COUNT: 12000,
  ORNAMENT_COUNT: 500, // Increased slightly for more density
  TREE_HEIGHT: 12,
  TREE_RADIUS_BASE: 4.5,
  SCATTER_RADIUS: 15,
  TRANSITION_SPEED: 2.5, // Lerp speed
};

// Golden Angle for spiral distribution
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));