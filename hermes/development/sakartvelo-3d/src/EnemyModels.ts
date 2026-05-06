/**
 * EnemyModels.ts
 * Enemy model factory — creates rigged enemy meshes.
 * Geometry builders are in EnemyBuilders.ts; animations in EnemyAnimations.ts.
 */
import {
  createHumanoid,
  createWolf,
  createSiegeRam,
  createDevi,
  createColchianRaider,
  createColchianHorseman,
  type EnemyRig,
  P,
  makePart,
} from './EnemyBuilders';
export { type EnemyRig, P, makePart };
export type { EnemyArchetype } from './EnemyBuilders';

export function createEnemyModel(type: string): EnemyRig {
  switch (type) {
    case 'infantry':
      return createColchianRaider();
    case 'cavalry':
      return createColchianHorseman();
    case 'siege':
      return createSiegeRam({});
    case 'flying':
      return createWolf({ furColor: P.threat_blue, scale: 0.8 });
    case 'boss':
      return createDevi();
    default:
      return createHumanoid({
        bodyColor: P.threat_green, skirtColor: P.fur, beltColor: P.leather,
        headColor: P.skin, weaponType: 'sword',
      });
  }
}
