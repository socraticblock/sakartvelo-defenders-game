import * as THREE from 'three';

type DisposeOptions = {
  disposeGeometry?: boolean;
  disposeMaterials?: boolean;
};

export function disposeObject3D(obj: THREE.Object3D, options: DisposeOptions = {}): void {
  const disposeGeometry = options.disposeGeometry ?? true;
  const disposeMaterials = options.disposeMaterials ?? true;

  obj.traverse((child: any) => {
    if (disposeGeometry && child.geometry && typeof child.geometry.dispose === 'function') {
      child.geometry.dispose();
    }

    if (!disposeMaterials) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : child.material
        ? [child.material]
        : [];

    for (const mat of materials) {
      for (const key of Object.keys(mat)) {
        const value = mat[key];
        if (value && typeof value.dispose === 'function') {
          value.dispose();
        }
      }
      if (typeof mat.dispose === 'function') {
        mat.dispose();
      }
    }
  });
}
