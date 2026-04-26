export const LEISURE_ACTIVITIES = [
  { id: 'picnic',  cost: 15,  label: 'Park Picnic',   emoji: '🧺', happiness: 15, energy: 8,   food: 10, desc: 'Relax outdoors' },
  { id: 'movie',   cost: 25,  label: 'Movie Night',   emoji: '🎬', happiness: 20, energy: 5,   food: 0,  desc: 'Relax with a film' },
  { id: 'gaming',  cost: 20,  label: 'Gaming Cafe',   emoji: '🕹️', happiness: 22, energy: 5,   food: 0,  desc: 'Online gaming session' },
  { id: 'gym',     cost: 30,  label: 'Gym Session',   emoji: '💪', happiness: 12, energy: -5,  food: 0,  xpBonus: 50, desc: 'Stay fit (+50 XP)' },
  { id: 'bowling', cost: 35,  label: 'Bowling Night', emoji: '🎳', happiness: 20, energy: 0,   food: 0,  desc: 'Fun for all' },
  { id: 'spa',     cost: 60,  label: 'Spa Treatment', emoji: '🧖', happiness: 35, energy: 25,  food: 0,  desc: 'Full body relaxation' },
  { id: 'concert', cost: 100, label: 'Live Concert',  emoji: '🎵', happiness: 50, energy: -10, food: 0,  desc: 'Epic night out' },
];

export class LeisureSystem {
  constructor(playerSystem) {
    this._ps = playerSystem;
    this._ls = null; // injected after construction
  }

  setLevelSystem(ls) { this._ls = ls; }

  doActivity(id) {
    const act = LEISURE_ACTIVITIES.find(a => a.id === id);
    if (!act) return { ok: false };
    if (this._ps.get('money') < act.cost) return { ok: false, msg: `Need $${act.cost}` };
    this._ps.addMoney(-act.cost);
    if (act.happiness) this._ps.addHappiness(act.happiness);
    if (act.energy)    this._ps.addEnergy(act.energy);
    if (act.food)      this._ps.addFoodStatus(act.food);
    if (act.xpBonus && this._ls) this._ls.addXP(act.xpBonus);
    return { ok: true, act };
  }
}
