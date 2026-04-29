export interface BestiaryEntry {
  id: string;
  name: string;
  icon: string;
  stats: string;
  lore: string;
  tips: string;
  firstEncounter: string;
}

export const BESTIARY_ENTRIES: Record<string, BestiaryEntry> = {
  infantry: {
    id: 'infantry',
    name: 'Colchian Raider',
    icon: '⚔',
    stats: 'HP 60 · Speed 2.0 · Reward 8g · Lives 1',
    lore: 'Local raiders and rival bands test the river villages before larger armies arrive.',
    tips: 'Build archers near bends and use poison when raiders bunch at walls.',
    firstEncounter: 'Era 0, Level 1',
  },
  cavalry: {
    id: 'cavalry',
    name: 'Horseman of Colchis',
    icon: '♞',
    stats: 'HP 100 · Speed 3.2 · Reward 12g · Lives 1',
    lore: 'Mounted fighters moved quickly along river roads and forest paths, striking before villages could fully prepare.',
    tips: 'Use walls to force a stop, then let nearby archers exploit the stationary target.',
    firstEncounter: 'Era 0',
  },
  siege: {
    id: 'siege',
    name: 'Bronze Siege Ram',
    icon: '▣',
    stats: 'HP 180 · Speed 1.3 · Reward 20g · Lives 2',
    lore: 'Heavy rams represent organized war reaching Colchis, where wooden palisades and gates must hold.',
    tips: 'Catapults and Medea command link are your best answers to siege pressure.',
    firstEncounter: 'Era 0',
  },
  flying: {
    id: 'flying',
    name: 'Sky Wolf',
    icon: '◆',
    stats: 'HP 45 · Speed 3.8 · Reward 15g · Lives 1',
    lore: 'A mythic beast of the mountains, inspired by Georgian tales where wild nature itself becomes an enemy.',
    tips: 'Use long lines of sight and upgraded archer range.',
    firstEncounter: 'Era 0',
  },
  boss: {
    id: 'boss',
    name: 'Mythic Boss',
    icon: '♛',
    stats: 'HP 500 · Speed 1.5 · Reward 150g · Lives 5',
    lore: 'Colchian myth speaks of Devi, dragons, and guardians tied to sacred treasure and wild places.',
    tips: 'Save Colchian Fire and fight near your strongest linked tower.',
    firstEncounter: 'Era 0 boss waves',
  },
};
