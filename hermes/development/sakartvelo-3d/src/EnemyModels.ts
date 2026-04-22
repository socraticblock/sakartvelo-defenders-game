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
  type EnemyRig,
  P,
  makePart,
} from './EnemyBuilders';
export { type EnemyRig, P, makePart };
export type { EnemyArchetype } from './EnemyBuilders';

export function createEnemyModel(type: string): EnemyRig {
  switch (type) {
    case 'infantry':
      return createHumanoid({
        bodyColor: P.fur, skirtColor: P.leather, beltColor: P.leather,
        headColor: P.skin, weaponType: 'axe', shieldColor: P.wood,
      });
    case 'cavalry':
      return createHumanoid({
        bodyColor: P.threat_orange, skirtColor: P.wood, beltColor: P.gold,
        headColor: P.skin, helmet: true, helmetColor: P.bone,
        weaponType: 'spear', scale: 1.1,
      });
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
