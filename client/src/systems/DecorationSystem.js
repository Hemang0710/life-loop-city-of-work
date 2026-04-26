export const DECORATIONS = [
  { id: 'plants',    cost: 80,  label: 'Plant Collection', emoji: '🌿', happinessPerDay: 3,  desc: '+3 happiness / day' },
  { id: 'paintings', cost: 150, label: 'Wall Art',         emoji: '🖼️', happinessPerDay: 5,  desc: '+5 happiness / day' },
  { id: 'lights',    cost: 120, label: 'LED Lights',       emoji: '💡', happinessPerDay: 2,  desc: '+2 happiness / day' },
  { id: 'furniture', cost: 200, label: 'Modern Furniture', emoji: '🛋️', happinessPerDay: 7,  desc: '+7 happiness / day' },
  { id: 'gaming',    cost: 300, label: 'Gaming Setup',     emoji: '🎮', happinessPerDay: 10, desc: '+10 happiness / day' },
];

export class DecorationSystem {
  constructor(playerSystem) {
    this._ps = playerSystem;
  }

  getOwned() { return this._ps.get('ownedDecorations') || []; }
  owns(id)   { return this.getOwned().includes(id); }

  buy(id) {
    const d = DECORATIONS.find(x => x.id === id);
    if (!d || this.owns(id))               return false;
    if (this._ps.get('money') < d.cost)    return false;
    this._ps.addMoney(-d.cost);
    this._ps.set('ownedDecorations', [...this.getOwned(), id]);
    return true;
  }

  applyDailyBonuses() {
    let happiness = 0;
    this.getOwned().forEach(id => {
      const d = DECORATIONS.find(x => x.id === id);
      if (d?.happinessPerDay) happiness += d.happinessPerDay;
    });
    if (happiness) this._ps.addHappiness(happiness);
    return { happiness };
  }

  getTotalHappinessPerDay() {
    return this.getOwned().reduce((sum, id) => {
      const d = DECORATIONS.find(x => x.id === id);
      return sum + (d?.happinessPerDay || 0);
    }, 0);
  }
}
