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

export const ERA0_TIMELINE = '~1500 BC - ~83 BC';

export const ERA0_CHAPTERS: Era0ChapterProfile[] = [
  { label: 'Chapter I', name: 'Bronze Roots of the Rioni', years: '~1500 BC - ~800 BC', fromLevel: 1, toLevel: 5 },
  { label: 'Chapter II', name: 'Rise of the Colchian World', years: '~800 BC - ~600 BC', fromLevel: 6, toLevel: 10 },
  { label: 'Chapter III', name: 'Phasis, Medea, and the Golden Fleece', years: '~600 BC - ~300 BC', fromLevel: 11, toLevel: 15 },
  { label: 'Chapter IV', name: 'The Last Heart of Colchis', years: '~300 BC - ~83 BC', fromLevel: 16, toLevel: 20 },
];

