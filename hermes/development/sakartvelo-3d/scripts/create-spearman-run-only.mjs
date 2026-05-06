import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { dedup, prune, resample } from '@gltf-transform/functions';

const input = 'public/models/era0_spearman/animations.glb';
const output = 'public/models/era0_spearman/spearman_run_only.glb';

const io = new NodeIO();

const document = await io.read(input);
const root = document.getRoot();
const animations = root.listAnimations();

console.log('Input animations:', animations.map((clip) => clip.getName()));

const keep = animations.find((clip) => clip.getName() === 'Running');
if (!keep) {
  throw new Error('Could not find exact Running animation clip.');
}

for (const clip of animations) {
  if (clip !== keep) {
    clip.dispose();
  }
}

await document.transform(resample(), dedup(), prune());
await io.write(output, document);

const outputDocument = await io.read(output);
const outputRoot = outputDocument.getRoot();
const outputAnimations = outputRoot.listAnimations().map((clip) => clip.getName());
const meshNames = outputRoot.listMeshes().map((mesh) => mesh.getName()).filter(Boolean);
const stat = fs.statSync(output);

console.log('Wrote:', output);
console.log('Output size MB:', (stat.size / 1024 / 1024).toFixed(2));
console.log('Output animations:', outputAnimations);
console.log('Output meshes:', meshNames);

if (outputAnimations.length !== 1 || outputAnimations[0] !== 'Running') {
  throw new Error(`Output must contain only Running. Found: ${outputAnimations.join(', ')}`);
}

console.log('Confirmed only Running remains.');
