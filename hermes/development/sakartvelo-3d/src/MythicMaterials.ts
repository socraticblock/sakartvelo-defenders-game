import * as THREE from 'three';

export class MythicMaterialFactory {
  private static instance: MythicMaterialFactory;
  private cache: Map<string, THREE.MeshStandardMaterial> = new Map();

  private constructor() {}

  public static getInstance(): MythicMaterialFactory {
    if (!MythicMaterialFactory.instance) {
      MythicMaterialFactory.instance = new MythicMaterialFactory();
    }
    return MythicMaterialFactory.instance;
  }

  public create(color: number, metalness = 0.1, roughness = 0.8, emissive = 0x000000): THREE.MeshStandardMaterial {
    const key = `${color}-${metalness}-${roughness}-${emissive}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    // Use Pure MeshStandardMaterial for now to guarantee visibility
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      emissive,
      emissiveIntensity: emissive !== 0x000000 ? 1.0 : 0,
    });

    this.cache.set(key, mat);
    return mat;
  }
}

export const mythic = (color: number, metal = 0.1, rough = 0.8, emissive = 0x000000) => 
  MythicMaterialFactory.getInstance().create(color, metal, rough, emissive);
