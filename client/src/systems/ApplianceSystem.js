export const APPLIANCES = [
  { id: 'tv',      cost: 450, label: 'Smart TV',        emoji: '📺', happinessPerDay: 5, desc: '+5 happiness / day' },
  { id: 'ac',      cost: 600, label: 'Air Conditioner', emoji: '❄️', energyPerDay: 8,   desc: '+8 energy / day' },
  { id: 'washing', cost: 350, label: 'Washing Machine', emoji: '🧺', stabilityPerDay: 3, desc: '+3 stability / day' },
  { id: 'fridge',  cost: 280, label: 'Smart Fridge',    emoji: '🧊', foodSavePerDay: 5,  desc: 'Food decays 5 less / day' },
];

export class ApplianceSystem {
  constructor(playerSystem) {
    this._ps = playerSystem;
  }

  getOwned() { return this._ps.get('ownedAppliances') || []; }
  owns(id)   { return this.getOwned().includes(id); }

  buy(id) {
    const a = APPLIANCES.find(x => x.id === id);
    if (!a || this.owns(id))                return false;
    if (this._ps.get('money') < a.cost)     return false;
    this._ps.addMoney(-a.cost);
    this._ps.set('ownedAppliances', [...this.getOwned(), id]);
    return true;
  }

  applyDailyBonuses() {
    let happiness = 0, energy = 0, stability = 0, foodSave = 0;
    this.getOwned().forEach(id => {
      const a = APPLIANCES.find(x => x.id === id);
      if (!a) return;
      if (a.happinessPerDay) happiness += a.happinessPerDay;
      if (a.energyPerDay)    energy    += a.energyPerDay;
      if (a.stabilityPerDay) stability += a.stabilityPerDay;
      if (a.foodSavePerDay)  foodSave  += a.foodSavePerDay;
    });
    if (happiness) this._ps.addHappiness(happiness);
    if (energy)    this._ps.addEnergy(energy);
    if (stability) this._ps.addStability(stability);
    return { happiness, energy, stability, foodSave };
  }

  getFoodSavePerDay() {
    return this.getOwned().reduce((sum, id) => {
      const a = APPLIANCES.find(x => x.id === id);
      return sum + (a?.foodSavePerDay || 0);
    }, 0);
  }
}
