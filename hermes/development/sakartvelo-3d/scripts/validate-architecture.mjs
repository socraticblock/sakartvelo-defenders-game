import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const registryPath = path.join(srcDir, 'assets', 'ActorAssetRegistry.ts');

const forbiddenLiterals = [
  'era0_spearman/animations.glb',
  'era0_spearman/character.glb',
  'era0_spearman/spearman_run_only.glb',
  'Spartan_Kick',
  'Punch_Combo',
  'isStaticGltfInfantry',
  'Era0SpearmanGltf',
];

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function fail(message) {
  console.error(`[validate-architecture] ${message}`);
  process.exitCode = 1;
}

const srcFiles = listFiles(srcDir).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));
for (const file of srcFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of forbiddenLiterals) {
    if (text.includes(needle)) {
      fail(`Forbidden string "${needle}" found in ${path.relative(root, file)}`);
    }
  }

  if (
    text.includes('era0_spearman/animations.glb') &&
    path.resolve(file) !== path.resolve(registryPath)
  ) {
    fail(`Forbidden string "era0_spearman/animations.glb" found outside ${path.relative(root, registryPath)} in ${path.relative(root, file)}`);
  }

  if (
    text.includes('era0_spearman/character.glb') &&
    path.resolve(file) !== path.resolve(registryPath)
  ) {
    fail(`Forbidden string "era0_spearman/character.glb" found outside ${path.relative(root, registryPath)} in ${path.relative(root, file)}`);
  }
}

const registryText = fs.readFileSync(registryPath, 'utf8');
const infantryMatch = registryText.match(/infantry:\s*\{([\s\S]*?)\n\s*\},/);
if (!infantryMatch) {
  fail('Could not locate infantry entry in src/assets/ActorAssetRegistry.ts');
} else {
  const infantryBlock = infantryMatch[1];
  const requiredSnippets = [
    "modelUrl: '/models/era0_spearman/spearman_walk_only.glb'",
    'staticOnly: false',
    "staticPose: 'none'",
    "walk: 'Walking'",
  ];
  const forbiddenSnippets = [
    'animationsUrl',
    'staticOnly: true',
    'Dead',
    'Stumble_Walk',
    'Spartan_Kick',
    'Punch_Combo',
    'attack:',
    'death:',
    'idle:',
    "walk: 'Running'",
  ];

  for (const snippet of requiredSnippets) {
    if (!infantryBlock.includes(snippet)) {
      fail(`Infantry registry is missing required snippet: ${snippet}`);
    }
  }

  for (const snippet of forbiddenSnippets) {
    if (infantryBlock.includes(snippet)) {
      fail(`Infantry registry still contains forbidden snippet: ${snippet}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('[validate-architecture] OK');
