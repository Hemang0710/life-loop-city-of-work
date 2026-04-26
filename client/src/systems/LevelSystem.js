import { EventBus } from './EventBus.js';

const XP_TABLE = [0, 80, 200, 360, 560, 800, 1080, 1400, 1760, 2160, 2600, 3080, 3600, 4160, 4760, 5400, 6100, 6860, 7680, 8560];

export const LEVEL_PERKS = {
  2:  'Daily overnight energy +5',
  3:  'Positive events more likely',
  5:  '🚀 Tier 2 jobs unlocked — 60% more pay!',
  8:  '🏠 Housing upgrades available',
  10: '💫 Tier 3 jobs unlocked — 150% more pay!',
  12: '🏦 Bank pays 3% daily interest on savings',
  15: '📋 Daily goal rewards doubled',
  20: '👑 Life Master — Prestige unlocked!',
};

export class LevelSystem {
  constructor(playerSystem) {
    this.player = playerSystem;
  }

  addXP(amount) {
    const prevLevel = this.player.get('level') || 1;
    const newXP = (this.player.get('xp') || 0) + amount;
    this.player.set('xp', newXP);

    const newLevel = this._calcLevel(newXP);
    if (newLevel > prevLevel) {
      this.player.set('level', newLevel);
      EventBus.emit('playerLevelUp', {
        level: newLevel,
        perk: LEVEL_PERKS[newLevel] || null,
      });
    }
  }

  _calcLevel(xp) {
    let level = 1;
    for (let i = 1; i < XP_TABLE.length; i++) {
      if (xp >= XP_TABLE[i]) level = i + 1;
      else break;
    }
    return Math.min(level, XP_TABLE.length);
  }

  getProgress() {
    const level = this.player.get('level') || 1;
    const xp = this.player.get('xp') || 0;
    const idx = level - 1;
    const curXP = xp - (XP_TABLE[idx] || 0);
    const nextXP = XP_TABLE[idx + 1] ? XP_TABLE[idx + 1] - (XP_TABLE[idx] || 0) : 999;
    const pct = Math.min(1, curXP / nextXP);
    return { level, xp, curXP, nextXP, pct };
  }

  getTier(jobSkill) {
    const level = this.player.get('level') || 1;
    const skillVal = this.player.getSkillLevel(jobSkill);
    if (level >= 10 && skillVal >= 7) return 3;
    if (level >= 5  && skillVal >= 4) return 2;
    return 1;
  }

  applyBankInterest() {
    const level = this.player.get('level') || 1;
    if (level < 12) return 0;
    const savings = this.player.get('savings') || 0;
    const interest = Math.floor(savings * 0.03);
    if (interest > 0) {
      this.player.addMoney(interest);
    }
    return interest;
  }
}
