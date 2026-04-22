/**
 * TowerFactory.ts
 * Creates tower instances. One function, no state.
 */
import { Tower } from './Tower';

export function createTower(
  type: string,
  gx: number,
  gy: number,
  isOnPath = false,
): Tower {
  return new Tower(type, gx, gy, isOnPath);
}
