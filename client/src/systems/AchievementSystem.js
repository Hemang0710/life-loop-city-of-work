import { EventBus } from './EventBus.js';

const ACHIEVEMENTS = [
  { id: 'first_job',  icon: '🎯', title: 'First Shift',    desc: 'Complete your first job',
    check: p => (p.get('jobsCompleted') || 0) >= 1 },
  { id: 'earn_100',   icon: '💰', title: 'First $100',     desc: 'Earn $100 total',
    check: p => (p.get('totalEarned') || 0) >= 100 },
  { id: 'earn_1000',  icon: '💵', title: 'Four Figures',   desc: 'Earn $1,000 total',
    check: p => (p.get('totalEarned') || 0) >= 1000 },
  { id: 'earn_5000',  icon: '🤑', title: 'High Earner',    desc: 'Earn $5,000 total',
    check: p => (p.get('totalEarned') || 0) >= 5000 },
  { id: 'save_500',   icon: '🏦', title: 'Nest Egg',       desc: 'Save $500 in the bank',
    check: p => (p.get('savings') || 0) >= 500 },
  { id: 'day_10',     icon: '📅', title: 'Survivor',       desc: 'Survive 10 days',
    check: p => (p.get('dayCount') || 1) >= 10 },
  { id: 'day_20',     icon: '🗓', title: 'Veteran',        desc: 'Survive 20 days',
    check: p => (p.get('dayCount') || 1) >= 20 },
  { id: 'level_5',    icon: '⭐', title: 'Rising Star',    desc: 'Reach Level 5',
    check: p => (p.get('level') || 1) >= 5 },
  { id: 'level_10',   icon: '🌟', title: 'Seasoned Pro',   desc: 'Reach Level 10',
    check: p => (p.get('level') || 1) >= 10 },
  { id: 'skill_5',    icon: '🔝', title: 'Specialist',     desc: 'Reach skill level 5 in any job',
    check: p => { const s = p.get('skills') || {}; return Object.values(s).some(v => v >= 5); } },
  { id: 'skill_max',  icon: '💎', title: 'Master',         desc: 'Max out any skill',
    check: p => { const s = p.get('skills') || {}; return Object.values(s).some(v => v >= 9.9); } },
  { id: 'gift_5',     icon: '🎁', title: 'Generous',       desc: 'Gift other players 5 times',
    check: p => (p.get('giftsGivenTotal') || 0) >= 5 },
  { id: 'tier2',      icon: '🚀', title: 'Pro Worker',     desc: 'Complete a Tier 2 job',
    check: p => (p.get('highestTier') || 1) >= 2 },
  { id: 'tier3',      icon: '💫', title: 'Expert Worker',  desc: 'Complete a Tier 3 job',
    check: p => (p.get('highestTier') || 1) >= 3 },
  { id: 'homeowner',  icon: '🏠', title: 'Homeowner',      desc: 'Purchase a home upgrade',
    check: p => { const u = p.get('houseUpgrades') || {}; return Object.values(u).some(Boolean); } },
];

export class AchievementSystem {
  constructor(playerSystem) {
    this.player = playerSystem;
  }

  check() {
    const unlocked = new Set(this.player.get('achievements') || []);
    const newOnes = [];

    ACHIEVEMENTS.forEach(ach => {
      if (unlocked.has(ach.id)) return;
      try {
        if (ach.check(this.player)) {
          unlocked.add(ach.id);
          newOnes.push(ach);
        }
      } catch (_) {}
    });

    if (newOnes.length > 0) {
      this.player.set('achievements', [...unlocked]);
      newOnes.forEach(ach => {
        EventBus.emit('achievement', ach);
      });
    }
  }

  getAll() {
    const unlocked = new Set(this.player.get('achievements') || []);
    return ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.has(a.id) }));
  }
}
