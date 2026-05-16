import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const levelsPath = path.join(root, 'public', 'data', 'levels.json');
const balanceConfigPath = path.join(root, 'src', 'BalanceConfig.ts');
const raw = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
const levels = Array.isArray(raw) ? raw : raw.levels;
const balanceConfigText = fs.readFileSync(balanceConfigPath, 'utf8');

function readNumberFromBlock(blockName, key, fallback) {
  const block = balanceConfigText.match(new RegExp(`export const ${blockName} = \\{([\\s\\S]*?)\\} as const;`))?.[1];
  if (!block) return fallback;
  const match = block.match(new RegExp(`${key}:\\s*([0-9.]+)`));
  return match ? Number(match[1]) : fallback;
}

const friendlyInfantry = {
  cost: readNumberFromBlock('FRIENDLY_INFANTRY_BALANCE', 'cost', 65),
  damage: readNumberFromBlock('FRIENDLY_INFANTRY_BALANCE', 'attackDamage', 7),
  cooldown: readNumberFromBlock('FRIENDLY_INFANTRY_BALANCE', 'cooldown', 20),
  attackCooldown: readNumberFromBlock('FRIENDLY_INFANTRY_BALANCE', 'attackCooldown', 0.9),
  maxActive: readNumberFromBlock('FRIENDLY_INFANTRY_BALANCE', 'maxActive', 2),
};

const enemyConfigs = {
  infantry: { hp: 75, speed: 2.2, reward: 7, livesCost: 1, role: 'baseline ground' },
  cavalry: { hp: 125, speed: 3.4, reward: 10, livesCost: 1, role: 'fast ground' },
  siege: { hp: 250, speed: 1.4, reward: 18, livesCost: 2, role: 'wall breaker' },
  flying: { hp: 55, speed: 4.0, reward: 14, livesCost: 1, role: 'air / ignores blockers' },
  boss: { hp: 800, speed: 1.6, reward: 120, livesCost: 5, role: 'boss' },
};

const towerConfigs = {
  archer: { cost: 85, dps: 15, role: 'single target + anti-air' },
  catapult: { cost: 175, dps: 16, role: 'ground splash' },
  wall: { cost: 50, dps: 0, role: 'ground blocker' },
  infantry: {
    cost: friendlyInfantry.cost,
    dps: friendlyInfantry.damage / friendlyInfantry.attackCooldown,
    role: `emergency blocker, cooldown ${friendlyInfantry.cooldown}s, max ${friendlyInfantry.maxActive}`,
  },
};

function pathLength(waypoints) {
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [x1, y1] = waypoints[i];
    const [x2, y2] = waypoints[i + 1];
    total += Math.hypot(x2 - x1, y2 - y1);
  }
  return total;
}

function waveStats(wave) {
  const stats = {
    hp: 0,
    reward: 0,
    livesRisk: 0,
    count: 0,
    flying: 0,
    cavalry: 0,
    siege: 0,
    boss: 0,
    byType: {},
  };

  for (const group of wave.enemies) {
    const cfg = enemyConfigs[group.type];
    if (!cfg) {
      stats.byType[group.type] = (stats.byType[group.type] ?? 0) + group.count;
      continue;
    }
    const hpMult = group.hp_mult ?? 1;
    const count = group.count ?? 0;
    stats.hp += cfg.hp * hpMult * count;
    stats.reward += cfg.reward * count;
    stats.livesRisk += cfg.livesCost * count;
    stats.count += count;
    stats.byType[group.type] = (stats.byType[group.type] ?? 0) + count;
    if (group.type === 'flying') stats.flying += count;
    if (group.type === 'cavalry') stats.cavalry += count;
    if (group.type === 'siege') stats.siege += count;
    if (group.type === 'boss') stats.boss += count;
  }

  return stats;
}

function formatTypes(byType) {
  return Object.entries(byType)
    .map(([type, count]) => `${type}:${count}`)
    .join(', ');
}

function levelWarnings(level, waveSummaries) {
  const warnings = [];
  const canOpenArcher = level.starting_gold >= towerConfigs.archer.cost;
  if (!canOpenArcher) warnings.push('starting gold cannot buy an opening Archer');

  if (level.level <= 2 && waveSummaries.some(w => w.flying > 0)) {
    warnings.push('flying appears before wall basics are taught');
  }

  for (let i = 1; i < waveSummaries.length; i++) {
    const prev = waveSummaries[i - 1].hp;
    const cur = waveSummaries[i].hp;
    if (prev > 0 && cur / prev > 1.45) {
      warnings.push(`wave ${i + 1} HP jumps ${Math.round((cur / prev - 1) * 100)}% over previous wave`);
    }
  }

  const firstSiege = waveSummaries.findIndex(w => w.siege > 0);
  if (firstSiege >= 0 && level.level <= 2) warnings.push('siege appears very early; make sure walls were taught first');

  const totalFlying = waveSummaries.reduce((sum, w) => sum + w.flying, 0);
  const firstWaveFlying = waveSummaries[0]?.flying ?? 0;
  const totalGroundHp = waveSummaries.reduce((sum, w) => sum + (w.hp - w.flying * enemyConfigs.flying.hp), 0);
  if (totalFlying > 0 && level.starting_gold < towerConfigs.archer.cost * 2) {
    warnings.push('flying pressure exists but starting economy may not support enough anti-air');
  }
  if (firstWaveFlying >= 10) {
    warnings.push(`opens with ${firstWaveFlying} flying enemies; this is harsh now that flying ignores walls/infantry/catapults`);
  }
  if (totalFlying >= 25 && level.level <= 6) {
    warnings.push(`high early flying count (${totalFlying}); verify anti-air tutorial and starting economy`);
  }

  if (totalGroundHp > 0 && level.starting_gold >= towerConfigs.catapult.cost && waveSummaries.every(w => w.count <= 3)) {
    warnings.push('catapult is affordable but waves may be too sparse for splash value');
  }

  return warnings;
}

console.log('\nSakartvelo Defenders — Era 0 Balance Report');
console.log('================================================');
console.log('Tower / unit roles:');
for (const [type, cfg] of Object.entries(towerConfigs)) {
  console.log(`- ${type.padEnd(9)} cost=${String(cfg.cost).padStart(3)} dps≈${cfg.dps.toFixed(1).padStart(4)} role=${cfg.role}`);
}
console.log('');

for (const level of levels.filter(l => l.era === 0).sort((a, b) => a.level - b.level)) {
  const len = pathLength(level.path_waypoints);
  const waveSummaries = level.waves.map(waveStats);
  const totalHp = waveSummaries.reduce((sum, w) => sum + w.hp, 0);
  const totalReward = waveSummaries.reduce((sum, w) => sum + w.reward, 0);
  const totalFlying = waveSummaries.reduce((sum, w) => sum + w.flying, 0);
  const warnings = levelWarnings(level, waveSummaries);

  console.log(`\nLevel ${level.level}: ${level.name}`);
  console.log(`  startGold=${level.starting_gold} lives=${level.starting_lives} waves=${level.waves.length} path≈${len.toFixed(1)} tiles totalHp≈${Math.round(totalHp)} reward=${totalReward} flying=${totalFlying}`);
  for (let i = 0; i < waveSummaries.length; i++) {
    const w = waveSummaries[i];
    console.log(`  W${i + 1}: hp≈${Math.round(w.hp).toString().padStart(4)} reward=${String(w.reward).padStart(3)} count=${String(w.count).padStart(3)} types=[${formatTypes(w.byType)}]`);
  }
  if (warnings.length) {
    for (const warning of warnings) console.log(`  ⚠ ${warning}`);
  } else {
    console.log('  OK: no structural balance warnings');
  }
}

console.log('\nUse this report before tuning wave counts, gold, or enemy multipliers.\n');
