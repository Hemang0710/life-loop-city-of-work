import { EventBus } from './EventBus.js';

export const BUSINESSES = {
  restaurant: { id: 'restaurant', label: 'Mini Restaurant', emoji: '🍳', cost: 1500, requiredLevel: 10, incomePerDay: 40,  desc: 'Earns $40 passive income per day' },
  delivery:   { id: 'delivery',   label: 'Delivery Co.',    emoji: '📦', cost: 2000, requiredLevel: 12, incomePerDay: 55,  desc: 'Earns $55 passive income per day' },
  shop:       { id: 'shop',       label: 'Corner Store',    emoji: '🛒', cost: 2500, requiredLevel: 15, incomePerDay: 70,  desc: 'Earns $70 passive income per day' },
};

export class BusinessSystem {
  constructor(playerSystem) {
    this.player = playerSystem;
  }

  getOwned() {
    const ids = this.player.get('ownedBusinesses') || [];
    return ids.map(id => BUSINESSES[id]).filter(Boolean);
  }

  getDailyIncome() {
    return this.getOwned().reduce((sum, b) => sum + b.incomePerDay, 0);
  }

  canBuy(id) {
    const b = BUSINESSES[id];
    if (!b) return false;
    const owned = this.player.get('ownedBusinesses') || [];
    if (owned.includes(id)) return false;
    return (this.player.get('level') || 1) >= b.requiredLevel;
  }

  buy(id) {
    const b = BUSINESSES[id];
    if (!b || !this.canBuy(id)) return false;
    if ((this.player.get('money') || 0) < b.cost) return false;
    this.player.addMoney(-b.cost);
    const owned = [...(this.player.get('ownedBusinesses') || []), id];
    this.player.set('ownedBusinesses', owned);
    EventBus.emit('businessPurchased', b);
    return true;
  }
}
