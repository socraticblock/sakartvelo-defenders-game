export interface MapThemeProfile {
  terrainTint: number;
  fogColor: number;
  pathColor: number;
  propDensity: number;
  ambience: 'river' | 'forest' | 'coast' | 'mountain' | 'marsh' | 'ritual';
}

export interface LevelSignatureProfile {
  landmark: string;
  objectiveLabel: string;
  landmarkIntensity: number;
}

export interface HistoricalLevelProfile {
  title: string;
  chapter: number;
  dateBand: string;
  framing: 'myth' | 'history' | 'hybrid';
}

export interface BossEncounterProfile {
  bossId: string;
  cinematicTitle: string;
  vfxAccent: number;
}

export interface Era0ChapterProfile {
  label: string;
  name: string;
  years: string;
  fromLevel: number;
  toLevel: number;
}

/**
 * Era 0 uses a broad playable frame.
 *
 * Copy guidance:
 * - Public copy should call this “Ancient Colchis and its Bronze-Age roots”.
 * - Early chapters are archaeological / proto-Colchian inspiration, not documented royal history.
 * - The Kingdom of Colchis proper belongs mainly to the later 1st-millennium BC chapters.
 */
export const ERA0_TIMELINE = 'c. 1500 BC - 83 BC playable frame';

export const ERA0_CHAPTERS: Era0ChapterProfile[] = [
  { label: 'Chapter I', name: 'Bronze Roots of the Rioni', years: 'c. 1500 BC - c. 800 BC', fromLevel: 1, toLevel: 5 },
  { label: 'Chapter II', name: 'Rise of the Colchian World', years: 'c. 800 BC - c. 600 BC', fromLevel: 6, toLevel: 10 },
  { label: 'Chapter III', name: 'Phasis, Medea, and the Golden Fleece', years: 'c. 600 BC - c. 300 BC', fromLevel: 11, toLevel: 15 },
  { label: 'Chapter IV', name: 'The Last Heart of Colchis', years: 'c. 300 BC - 83 BC', fromLevel: 16, toLevel: 20 },
];
