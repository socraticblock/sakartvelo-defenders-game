/**
 * EnemyAnimations.ts
 * Enemy rig animation logic.
 * Extracted from EnemyModels.ts.
 */
import type { EnemyRig } from './EnemyBuilders';

export function animateRig(rig: EnemyRig, time: number, moving: boolean, isWheeled = false) {
  if (!moving) {
    rig.leftArm.rotation.x = Math.sin(time * 2) * 0.05;
    rig.rightArm.rotation.x = Math.sin(time * 2 + 1) * 0.05;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    return;
  }

  if (isWheeled) {
    const spin = time * rig.walkSpeed * 2;
    rig.leftArm.rotation.z = spin;
    rig.rightArm.rotation.z = spin;
    rig.leftLeg.rotation.z = spin;
    rig.rightLeg.rotation.z = spin;
    rig.leftArm.rotation.x = 0;
    rig.rightArm.rotation.x = 0;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
  } else {
    const ws = rig.walkSpeed;
    const wa = rig.walkAmp;
    rig.leftArm.rotation.x = Math.sin(time * ws) * wa;
    rig.rightArm.rotation.x = Math.sin(time * ws + Math.PI) * wa;
    rig.leftLeg.rotation.x = Math.sin(time * ws + Math.PI) * wa;
    rig.rightLeg.rotation.x = Math.sin(time * ws) * wa;
  }

  rig.head.rotation.y = Math.sin(time * (rig.walkSpeed * 0.5)) * 0.08;
}
