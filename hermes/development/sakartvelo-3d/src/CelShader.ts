/**
 * CelShader.ts — Cel-shading pipeline for Sakartvelo Defenders
 *
 * Three components:
 * 1. GradientMap — discrete light steps for MeshToonMaterial
 * 2. toon() factory — creates MeshToonMaterial from a color
 * 3. OutlineMesh — inverted-hull outline wrapper around any mesh
 */

import * as THREE from 'three';

// ─── GRADIENT MAP ───────────────────────────────────────────
// 4 discrete shading steps (shadow → dark-mid → mid → highlight)
const GRADIENT_SIZE = 4;
const gradientData = new Uint8Array(GRADIENT_SIZE);
for (let i = 0; i < GRADIENT_SIZE; i++) {
  // Values: shadow=50, dark-mid=100, mid=180, highlight=255
  gradientData[i] = Math.floor(50 + (i / (GRADIENT_SIZE - 1)) * 205);
}
const gradientMap = new THREE.DataTexture(
  gradientData,
  GRADIENT_SIZE,
  1,
  THREE.RedFormat
);
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
gradientMap.needsUpdate = true;

// ─── MATERIAL CACHE ─────────────────────────────────────────
const toonMatCache = new Map<number, THREE.MeshToonMaterial>();
const outlineMatCache = new Map<number, THREE.MeshBasicMaterial>();

export function toon(color: number): THREE.MeshToonMaterial {
  if (toonMatCache.has(color)) return toonMatCache.get(color)!;
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap,
  });
  toonMatCache.set(color, mat);
  return mat;
}

// Outline color: dark brownish-black (works on forest floor)
const OUTLINE_COLOR = 0x1a1a1a;
const OUTLINE_THICKNESS = 0.03; // world units of normal expansion

export function outlineMat(color: number): THREE.MeshBasicMaterial {
  if (outlineMatCache.has(color)) return outlineMatCache.get(color)!;
  const mat = new THREE.MeshBasicMaterial({
    color: 0x1A1A1A, // From the Art Style Guide v3.0
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.8
  });
  outlineMatCache.set(color, mat);
  return mat;
}

// ─── OUTLINE WRAPPER ────────────────────────────────────────
// Wraps a mesh (or Group) with an inverted-hull outline.
// Call addOutlineTo(mesh, parent) to add an outline child.
export function addOutlineTo(mesh: THREE.Object3D, parent: THREE.Object3D): void {
  // Clone the geometry (for meshes) or create a box (for groups)
  if (mesh instanceof THREE.Mesh && mesh.geometry) {
    const outlineMesh = new THREE.Mesh(
      mesh.geometry,
      outlineMat(OUTLINE_COLOR)
    );
    // Copy transform
    outlineMesh.position.copy(mesh.position);
    outlineMesh.rotation.copy(mesh.rotation);
    outlineMesh.scale.copy(mesh.scale);
    // Expand along normals (inverted hull trick)
    outlineMesh.scale.addScalar(OUTLINE_THICKNESS);
    outlineMesh.renderOrder = -1; // render behind
    parent.add(outlineMesh);
  }
}

// ─── OUTLINE ALL CHILDREN HELPER ────────────────────────────
// Walks a group and adds outlines to every mesh inside it.
export function outlineGroup(group: THREE.Object3D): void {
  group.traverse(child => {
    if (child instanceof THREE.Mesh && child.geometry) {
      addOutlineTo(child, group);
    }
  });
}

// ─── REUSABLE OUTLINE MESH (for animated objects) ───────────
// For meshes that change geometry, pre-create the outline mesh.
export class OutlineMesh {
  mesh: THREE.Mesh;
  private child: THREE.Mesh;

  constructor(geometry: THREE.BufferGeometry) {
    this.child = new THREE.Mesh(geometry, outlineMat(OUTLINE_COLOR));
    this.child.renderOrder = -1;
    this.mesh = this.child;
  }

  /** Sync transform to the source mesh each frame */
  sync(source: THREE.Object3D): void {
    this.child.position.copy(source.position);
    this.child.rotation.copy(source.rotation);
    this.child.scale.set(
      source.scale.x + OUTLINE_THICKNESS,
      source.scale.y + OUTLINE_THICKNESS,
      source.scale.z + OUTLINE_THICKNESS
    );
  }

  addTo(parent: THREE.Object3D): void {
    parent.add(this.child);
  }

  remove(): void {
    this.child.parent?.remove(this.child);
  }

  setVisible(v: boolean): void {
    this.child.visible = v;
  }
}

// ─── ANIMATED OUTLINE ───────────────────────────────────────
// For rig parts that animate (arms, legs), we need to sync
// outline geometry each frame. Creates outline meshes for each
// rig mesh and provides a syncAll() call.
export class RigOutlines {
  private outlines: Map<THREE.Object3D, THREE.Mesh> = new Map();
  private sourceMap: Map<THREE.Object3D, THREE.Object3D> = new Map();

  constructor(rig: THREE.Object3D) {
    rig.traverse(child => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const outlineMesh = new THREE.Mesh(
          child.geometry,
          outlineMat(OUTLINE_COLOR)
        );
        outlineMesh.renderOrder = -1;
        this.outlines.set(child, outlineMesh);
        this.sourceMap.set(child, child.parent!);
      }
    });
  }

  addToParent(): void {
    for (const [source, outline] of this.outlines) {
      source.parent?.add(outline);
    }
  }

  /** Call once per frame after rig animation updates */
  sync(): void {
    for (const [source, outline] of this.outlines) {
      const parent = this.sourceMap.get(source)!;
      // Get world position of source, convert to local of parent
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      source.getWorldPosition(worldPos);
      source.getWorldQuaternion(worldQuat);
      source.getWorldScale(worldScale);

      // Convert world position/quat to parent's local space
      const localPos = parent.worldToLocal(worldPos.clone());
      const localQuat = parent.quaternion.clone().invert().multiply(worldQuat);
      const localScale = worldScale;

      outline.position.copy(localPos);
      outline.quaternion.copy(localQuat);
      outline.scale.set(
        localScale.x + OUTLINE_THICKNESS,
        localScale.y + OUTLINE_THICKNESS,
        localScale.z + OUTLINE_THICKNESS
      );
    }
  }

  setVisible(v: boolean): void {
    for (const outline of this.outlines.values()) {
      outline.visible = v;
    }
  }
}
