/**
 * Orientation.ts
 * Best-effort landscape lock for the v5 landscape-only game direction.
 *
 * Browser support is intentionally treated as optional: many mobile browsers only
 * allow orientation locking after a trusted user gesture and/or fullscreen entry.
 * If the lock fails, gameplay still works and the CSS portrait notice can guide
 * the player to rotate the device.
 */

let warnedAboutLandscapeLock = false;

export async function requestLandscapeOrientation(): Promise<void> {
  const orientation = screen.orientation as (ScreenOrientation & {
    lock?: (orientation: OrientationLockType) => Promise<void>;
  }) | undefined;

  if (!orientation?.lock) return;

  try {
    await orientation.lock('landscape');
  } catch (error) {
    if (!warnedAboutLandscapeLock) {
      warnedAboutLandscapeLock = true;
      console.info('Landscape orientation lock unavailable in this browser/context.', error);
    }
  }
}

export function isPortraitViewport(): boolean {
  return window.innerHeight > window.innerWidth;
}
