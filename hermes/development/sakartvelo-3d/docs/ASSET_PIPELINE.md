# Asset Pipeline & Model Integration

## Architecture
The game uses a strict Model-View separation for enemy visuals:
- `Enemy.ts` handles pure gameplay state (HP, speed, grid pathing).
- `EnemyView` (interface) provides a generic contract for visual updates.
- `ProceduralEnemyView` wraps programmatic THREE.js groups (for siege, flying, cavalry, etc.).
- `GltfEnemyView` wraps imported `.glb` models (e.g. Era 0 Spearman).

## Asset Loading
- All GLB models are loaded via `ActorAssetLoader.ts`.
- GLB assets are cached so a file is downloaded and parsed only once per level.
- `SkeletonUtils.clone` is used to instantiate models efficiently while sharing geometry and materials across multiple enemies.
- Models declare `preserveSharedResources = true` so the disposal logic in `GameState.ts` does not prematurely destroy shared buffers.

## Asset Size Guidelines
- **Common enemies:** Avoid models larger than 2–5 MB. Do not load separate 30 MB animation files for basic swarming units.
- **Triangle Count:** Keep it modest (below 5k-10k per mob) to preserve mobile performance.
- **Props:** Use procedural weapon props (defined in `WeaponProps.ts`) instead of duplicating high-poly weapons inside every character GLB.

## Current State & Next Steps
- The Era 0 Spearman is currently imported as a static mesh to avoid animation playback glitches (Sparta kick bug).
- Animation integration using `THREE.AnimationMixer` should be built incrementally using `ModelDebug.ts` to inspect clip names, tracks, and durations before wiring them into the gameplay loop.
- Use tools like `gltf-transform` to compress and optimize Meshy exports prior to integration.
