import { STARTING_STATS, SKILL_NAMES, PLAYER_COLORS, SPAWN_X, SPAWN_Y } from '../config/GameConfig.js';
import { EventBus } from './EventBus.js';

const SAVE_KEY = 'lifeloop_v1_player';

export class PlayerSystem {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults so new fields are always present
        return { ...this._defaults(), ...parsed };
      }
    } catch (_) {}
    return this._defaults();
  }

  _defaults() {
    const idx = Math.floor(Math.random() * PLAYER_COLORS.length);
    const id = Math.floor(1000 + Math.random() * 9000);
    const skills = {};
    SKILL_NAMES.forEach(s => { skills[s] = 1; });
    return {
      id,
      name: `Worker_${id}`,
      color: PLAYER_COLORS[idx],
      x: SPAWN_X,
      y: SPAWN_Y,
      ...STARTING_STATS,
      skills,
      totalEarned: 0,
      xp: 0,
      level: 1,
      highestTier: 1,
      houseUpgrades: { mattress: false, garden: false, rentControl: false },
      achievements: [],
      currentGoals: [],
      goalsCompleted: [],
      giftsGivenToday: 0,
      giftsGivenTotal: 0,
      bestPerformanceToday: 0,
      savedToday: 0,
      tutorialSeen: false,
      vehicle: null,
      prestige: 0,
      ownedBusinesses: [],
      ownedAppliances: [],
      ownedDecorations: [],
    };
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (_) {}
  }

  get(key) { return this.data[key]; }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  addMoney(amount) {
    this.data.money = Math.max(0, this.data.money + amount);
    if (amount > 0) this.data.totalEarned += amount;
    this.save();
    return this.data.money;
  }

  addSavings(amount) {
    if (amount > 0) {
      const deduct = Math.min(amount, this.data.money);
      this.data.money -= deduct;
      this.data.savings += deduct;
    } else {
      const withdraw = Math.min(Math.abs(amount), this.data.savings);
      this.data.savings -= withdraw;
      this.data.money += withdraw;
    }
    this.save();
  }

  addEnergy(amount) {
    this.data.energy = Math.max(0, Math.min(100, this.data.energy + amount));
    this.save();
    return this.data.energy;
  }

  addFoodStatus(amount) {
    this.data.foodStatus = Math.max(0, Math.min(100, this.data.foodStatus + amount));
    this.save();
  }

  addHappiness(amount) {
    this.data.familyHappiness = Math.max(0, Math.min(100, this.data.familyHappiness + amount));
    this.save();
  }

  addStability(amount) {
    this.data.householdStability = Math.max(0, Math.min(100, this.data.householdStability + amount));
    this.save();
  }

  addSkillXP(skill, amount) {
    if (this.data.skills[skill] === undefined) return;
    const prevLevel = Math.floor(this.data.skills[skill]);
    this.data.skills[skill] = Math.min(10, this.data.skills[skill] + amount);
    const newLevel = Math.floor(this.data.skills[skill]);
    if (newLevel > prevLevel) {
      EventBus.emit('levelUp', { skill, level: newLevel });
    }
    this.save();
  }

  getSkillLevel(skill) {
    return this.data.skills[skill] || 1;
  }

  getSkillMultiplier(skill) {
    return 1 + (this.getSkillLevel(skill) - 1) * 0.12;
  }

  incrementDay() {
    this.data.dayCount += 1;
    // Daily decay
    this.data.foodStatus      = Math.max(0, this.data.foodStatus - 15);
    this.data.familyHappiness = Math.max(0, this.data.familyHappiness - 5);
    // Reset daily tracking
    this.data.giftsGivenToday    = 0;
    this.data.bestPerformanceToday = 0;
    this.data.savedToday         = 0;
    this.save();
  }

  reset() {
    localStorage.removeItem(SAVE_KEY);
    this.data = this._defaults();
  }
}
