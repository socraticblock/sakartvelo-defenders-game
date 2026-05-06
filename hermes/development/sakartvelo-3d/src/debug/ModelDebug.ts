import * as THREE from 'three';

export function logObjectTree(root: THREE.Object3D, label: string): void {
  console.group(`[ModelDebug] Object Tree: ${label}`);
  root.traverse((obj) => {
    console.log(`${obj.type}: ${obj.name} (uuid: ${obj.uuid})`);
  });
  console.groupEnd();
}

export function logBoneNames(root: THREE.Object3D, label: string): void {
  console.group(`[ModelDebug] Bones: ${label}`);
  root.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) {
      console.log(`Bone: ${obj.name}`);
    }
  });
  console.groupEnd();
}

export function logAnimationClips(clips: THREE.AnimationClip[], label: string): void {
  console.group(`[ModelDebug] Animations: ${label}`);
  clips.forEach((clip, index) => {
    console.log(`Clip ${index}: ${clip.name} (duration: ${clip.duration.toFixed(2)}s, tracks: ${clip.tracks.length})`);
  });
  console.groupEnd();
}

export function logBoundingBox(root: THREE.Object3D, label: string): void {
  const box = new THREE.Box3().setFromObject(root);
  console.log(`[ModelDebug] Bounding Box for ${label}:`, {
    min: box.min.toArray(),
    max: box.max.toArray(),
    size: new THREE.Vector3().subVectors(box.max, box.min).toArray()
  });
}

export function countMeshesAndTriangles(root: THREE.Object3D, label: string): void {
  let meshes = 0;
  let triangles = 0;
  
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      meshes++;
      if (obj.geometry && obj.geometry.index) {
        triangles += obj.geometry.index.count / 3;
      } else if (obj.geometry && obj.geometry.attributes.position) {
        triangles += obj.geometry.attributes.position.count / 3;
      }
    }
  });
  
  console.log(`[ModelDebug] ${label} - Meshes: ${meshes}, Triangles: ${Math.round(triangles)}`);
}
