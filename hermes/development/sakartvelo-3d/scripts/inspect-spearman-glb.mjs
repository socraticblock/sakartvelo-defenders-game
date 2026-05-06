import fs from 'node:fs/promises';
import path from 'node:path';

const COMPONENT_TYPE_BYTES = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
};

const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

const MODE_TRIANGLE_MULTIPLIER = {
  4: 3, // TRIANGLES
  5: 1, // TRIANGLE_STRIP
  6: 1, // TRIANGLE_FAN
};

function mb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readGlb(buffer) {
  const magic = buffer.toString('utf8', 0, 4);
  if (magic !== 'glTF') throw new Error('Not a GLB file');

  let offset = 12;
  let json = null;
  let bin = null;

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.toString('utf8', offset + 4, offset + 8);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkType === 'JSON') {
      json = JSON.parse(buffer.toString('utf8', chunkStart, chunkEnd));
    } else if (chunkType === 'BIN\0' || chunkType === 'BIN') {
      bin = buffer.subarray(chunkStart, chunkEnd);
    }

    offset = chunkEnd;
  }

  if (!json) throw new Error('Missing JSON chunk');
  return { json, bin };
}

function nodeName(nodes, index) {
  const node = nodes?.[index];
  return node?.name || `(node ${index})`;
}

function buildLocalMatrix(node) {
  if (node.matrix?.length === 16) return node.matrix.slice();

  const t = node.translation || [0, 0, 0];
  const r = node.rotation || [0, 0, 0, 1];
  const s = node.scale || [1, 1, 1];
  const [x, y, z, w] = r;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;

  const sx = s[0], sy = s[1], sz = s[2];

  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    t[0], t[1], t[2], 1,
  ];
}

function multiplyMatrices(a, b) {
  const out = new Array(16).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      out[col + row * 4] =
        a[row * 4 + 0] * b[col + 0] +
        a[row * 4 + 1] * b[col + 4] +
        a[row * 4 + 2] * b[col + 8] +
        a[row * 4 + 3] * b[col + 12];
    }
  }
  return out;
}

function transformPoint(m, p) {
  const x = p[0], y = p[1], z = p[2];
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

function bboxCorners(min, max) {
  return [
    [min[0], min[1], min[2]],
    [min[0], min[1], max[2]],
    [min[0], max[1], min[2]],
    [min[0], max[1], max[2]],
    [max[0], min[1], min[2]],
    [max[0], min[1], max[2]],
    [max[0], max[1], min[2]],
    [max[0], max[1], max[2]],
  ];
}

function accessorByteLength(accessor) {
  return accessor.count * TYPE_COMPONENTS[accessor.type] * COMPONENT_TYPE_BYTES[accessor.componentType];
}

function accessorView(json, bin, accessorIndex) {
  const accessor = json.accessors?.[accessorIndex];
  if (!accessor || !bin) return null;
  const view = json.bufferViews?.[accessor.bufferView];
  if (!view) return null;

  const componentBytes = COMPONENT_TYPE_BYTES[accessor.componentType];
  const components = TYPE_COMPONENTS[accessor.type];
  const stride = view.byteStride || (componentBytes * components);
  const baseOffset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  return { accessor, view, stride, baseOffset, componentBytes, components };
}

function readScalarIndices(json, bin, accessorIndex) {
  const meta = accessorView(json, bin, accessorIndex);
  if (!meta) return [];
  const { accessor, baseOffset, stride, componentType } = meta.accessor;
  const values = [];
  for (let i = 0; i < accessor.count; i++) {
    const offset = meta.baseOffset + i * meta.stride;
    switch (meta.accessor.componentType) {
      case 5121: values.push(bin.readUInt8(offset)); break;
      case 5123: values.push(bin.readUInt16LE(offset)); break;
      case 5125: values.push(bin.readUInt32LE(offset)); break;
      default: return [];
    }
  }
  return values;
}

function computeTriangleCount(json, bin) {
  let triangles = 0;
  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const mode = primitive.mode ?? 4;
      if (!(mode in MODE_TRIANGLE_MULTIPLIER)) continue;

      let vertexCount = 0;
      if (primitive.indices !== undefined) {
        const accessor = json.accessors?.[primitive.indices];
        vertexCount = accessor?.count || 0;
      } else if (primitive.attributes?.POSITION !== undefined) {
        const accessor = json.accessors?.[primitive.attributes.POSITION];
        vertexCount = accessor?.count || 0;
      }

      if (mode === 4) triangles += Math.floor(vertexCount / 3);
      else if (vertexCount >= 3) triangles += vertexCount - 2;
    }
  }
  return triangles;
}

function computeWorldMatrices(json) {
  const nodes = json.nodes || [];
  const parents = new Map();
  nodes.forEach((node, index) => {
    for (const child of node.children || []) parents.set(child, index);
  });

  const world = new Array(nodes.length);
  function resolve(index) {
    if (world[index]) return world[index];
    const local = buildLocalMatrix(nodes[index] || {});
    const parentIndex = parents.get(index);
    world[index] = parentIndex === undefined ? local : multiplyMatrices(resolve(parentIndex), local);
    return world[index];
  }

  for (let i = 0; i < nodes.length; i++) resolve(i);
  return world;
}

function computeBoundingBox(json) {
  const nodes = json.nodes || [];
  const meshes = json.meshes || [];
  const world = computeWorldMatrices(json);
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];

  nodes.forEach((node, nodeIndex) => {
    if (node.mesh === undefined) return;
    const mesh = meshes[node.mesh];
    if (!mesh) return;
    for (const primitive of mesh.primitives || []) {
      const posAccessor = json.accessors?.[primitive.attributes?.POSITION];
      if (!posAccessor?.min || !posAccessor?.max) continue;
      for (const corner of bboxCorners(posAccessor.min, posAccessor.max)) {
        const worldPoint = transformPoint(world[nodeIndex], corner);
        min = [
          Math.min(min[0], worldPoint[0]),
          Math.min(min[1], worldPoint[1]),
          Math.min(min[2], worldPoint[2]),
        ];
        max = [
          Math.max(max[0], worldPoint[0]),
          Math.max(max[1], worldPoint[1]),
          Math.max(max[2], worldPoint[2]),
        ];
      }
    }
  });

  if (!Number.isFinite(min[0])) return null;
  return {
    min,
    max,
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
  };
}

function summarizeHierarchy(json) {
  const nodes = json.nodes || [];
  const scenes = json.scenes || [];
  const lines = [];

  function walk(nodeIndex, depth) {
    lines.push(`${'  '.repeat(depth)}- ${nodeName(nodes, nodeIndex)}`);
    for (const child of nodes[nodeIndex]?.children || []) walk(child, depth + 1);
  }

  scenes.forEach((scene, sceneIndex) => {
    lines.push(`Scene ${sceneIndex}${scene.name ? ` (${scene.name})` : ''}`);
    for (const root of scene.nodes || []) walk(root, 1);
  });

  return lines;
}

function collectSkinnedMeshNames(json) {
  const names = [];
  for (const [index, node] of (json.nodes || []).entries()) {
    if (node.mesh !== undefined && node.skin !== undefined) {
      names.push(node.name || `(node ${index})`);
    }
  }
  return names;
}

function collectMeshNames(json) {
  const names = new Set();
  for (const mesh of json.meshes || []) {
    names.add(mesh.name || '(unnamed mesh)');
  }
  for (const [index, node] of (json.nodes || []).entries()) {
    if (node.mesh !== undefined) names.add(node.name || `(node ${index})`);
  }
  return [...names];
}

function collectMaterialNames(json) {
  return [...new Set((json.materials || []).map((m, i) => m.name || `(material ${i})`))];
}

function collectBones(json) {
  const nodes = json.nodes || [];
  const skins = json.skins || [];
  const boneNames = [];
  const skeletonRoots = [];

  skins.forEach((skin, skinIndex) => {
    if (skin.skeleton !== undefined) skeletonRoots.push(nodeName(nodes, skin.skeleton));
    for (const joint of skin.joints || []) {
      boneNames.push(nodeName(nodes, joint));
    }
    if ((skin.joints || []).length === 0) {
      skeletonRoots.push(`(skin ${skinIndex} has no joints)`);
    }
  });

  return {
    boneNames: [...new Set(boneNames)],
    skeletonRoots: [...new Set(skeletonRoots)],
  };
}

function clipTrackName(json, clip, channelIndex) {
  const channel = clip.channels?.[channelIndex];
  const sampler = clip.samplers?.[channel?.sampler];
  const targetNodeName = nodeName(json.nodes || [], channel?.target?.node);
  return `${targetNodeName}.${channel?.target?.path || 'unknown'} <- input ${sampler?.input ?? '?'} / output ${sampler?.output ?? '?'}`;
}

function collectClipSummaries(json) {
  return (json.animations || []).map((clip, index) => {
    let duration = 0;
    for (const sampler of clip.samplers || []) {
      const accessor = json.accessors?.[sampler.input];
      const max = accessor?.max?.[0] || 0;
      duration = Math.max(duration, max);
    }
    return {
      index,
      name: clip.name || `(animation ${index})`,
      duration,
      trackCount: clip.channels?.length || 0,
      firstTrackNames: (clip.channels || []).slice(0, 10).map((_, i) => clipTrackName(json, clip, i)),
    };
  });
}

function summarizeAnimationTargets(json) {
  const targets = new Set();
  for (const clip of json.animations || []) {
    for (const channel of clip.channels || []) {
      if (channel.target?.node !== undefined) {
        targets.add(nodeName(json.nodes || [], channel.target.node));
      }
    }
  }
  return [...targets];
}

function compatibilitySummary(characterInfo, animationInfo) {
  const charBones = new Set(characterInfo.bones.boneNames);
  const animBones = new Set(animationInfo.bones.boneNames);
  const animationTargets = summarizeAnimationTargets(animationInfo.json);
  const sharedBones = animationTargets.filter((name) => charBones.has(name));

  const compatible =
    charBones.size > 0 &&
    (sharedBones.length >= Math.min(10, charBones.size) ||
      [...animBones].filter((name) => charBones.has(name)).length >= Math.min(10, charBones.size));

  return {
    compatible,
    sharedTargetCount: sharedBones.length,
    sharedTargetsSample: sharedBones.slice(0, 20),
  };
}

async function inspect(filePath) {
  const fullPath = path.resolve(filePath);
  const fileBuffer = await fs.readFile(fullPath);
  const stat = await fs.stat(fullPath);
  const { json, bin } = readGlb(fileBuffer);

  return {
    path: fullPath,
    sizeBytes: stat.size,
    sizeMb: mb(stat.size),
    json,
    hierarchy: summarizeHierarchy(json),
    meshNames: collectMeshNames(json),
    skinnedMeshNames: collectSkinnedMeshNames(json),
    materialNames: collectMaterialNames(json),
    bones: collectBones(json),
    clips: collectClipSummaries(json),
    animationTargets: summarizeAnimationTargets(json),
    boundingBox: computeBoundingBox(json),
    triangleCount: computeTriangleCount(json, bin),
  };
}

function printSection(title, value) {
  console.log(`\n${title}`);
  if (Array.isArray(value)) {
    if (value.length === 0) console.log('(none)');
    else value.forEach((line) => console.log(line));
  } else if (value && typeof value === 'object') {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(value);
  }
}

const character = await inspect('public/models/era0_spearman/character.glb');
const animations = await inspect('public/models/era0_spearman/animations.glb');
const compatibility = compatibilitySummary(character, animations);

console.log('=== CHARACTER GLB ===');
printSection('Path', character.path);
printSection('File size', `${character.sizeBytes} bytes (${character.sizeMb})`);
printSection('Scene hierarchy', character.hierarchy);
printSection('Mesh names', character.meshNames);
printSection('Skinned mesh names', character.skinnedMeshNames);
printSection('Material names', character.materialNames);
printSection('Bone names', character.bones.boneNames);
printSection('Skeleton root names', character.bones.skeletonRoots);
printSection('Animation clips', character.clips.map((clip) => ({
  index: clip.index,
  name: clip.name,
  duration: Number(clip.duration.toFixed(3)),
  trackCount: clip.trackCount,
  firstTrackNames: clip.firstTrackNames,
})));
printSection('Contains animations?', character.clips.length > 0 ? 'yes' : 'no');
printSection('Bounding box', character.boundingBox ? {
  min: character.boundingBox.min.map((n) => Number(n.toFixed(4))),
  max: character.boundingBox.max.map((n) => Number(n.toFixed(4))),
  size: character.boundingBox.size.map((n) => Number(n.toFixed(4))),
} : 'unavailable');
printSection('Approx triangle count', character.triangleCount);

console.log('\n=== ANIMATIONS GLB ===');
printSection('Path', animations.path);
printSection('File size', `${animations.sizeBytes} bytes (${animations.sizeMb})`);
printSection('Scene hierarchy', animations.hierarchy);
printSection('Mesh names', animations.meshNames);
printSection('Skinned mesh names', animations.skinnedMeshNames);
printSection('Material names', animations.materialNames);
printSection('Bone names', animations.bones.boneNames);
printSection('Skeleton root names', animations.bones.skeletonRoots);
printSection('Animation clips', animations.clips.map((clip) => ({
  index: clip.index,
  name: clip.name,
  duration: Number(clip.duration.toFixed(3)),
  trackCount: clip.trackCount,
  firstTrackNames: clip.firstTrackNames,
})));
printSection('Contains animations?', animations.clips.length > 0 ? 'yes' : 'no');
printSection('Approx triangle count', animations.triangleCount);

console.log('\n=== COMPATIBILITY ===');
printSection('Animation targets', animations.animationTargets);
printSection('Character vs animation skeleton compatibility', compatibility);
