import { EventBus } from './EventBus.js';

const GOAL_POOL = [
  { id: 'earn_150',   text: 'Earn $150 in one day',             icon: '💰', reward: { money: 40 },
    check: (d) => d.income >= 150 },
  { id: 'pay_all',    text: 'Pay all bills on time',             icon: '✅', reward: { money: 20, stability: 10 },
    check: (d) => d.rentPaid && d.foodPaid && d.transportPaid },
  { id: 'balance_300',text: 'End day with $300+',               icon: '💵', reward: { money: 60 },
    check: (d) => d.moneyAfter >= 300 },
  { id: 'gift_player',text: 'Gift another player today',         icon: '🎁', reward: { happiness: 15, money: 15 },
    check: (d, p) => (p.get('giftsGivenToday') || 0) >= 1 },
  { id: 'three_stars',text: 'Get ⭐⭐⭐ on any job today',       icon: '⭐', reward: { xp: 50 },
    check: (d, p) => (p.get('bestPerformanceToday') || 0) >= 0.85 },
  { id: 'save_50',    text: 'Deposit $50 at the bank',           icon: '🏦', reward: { money: 25 },
    check: (d, p) => (p.get('savedToday') || 0) >= 50 },
  { id: 'earn_200',   text: 'Earn $200 in one day',             icon: '💸', reward: { money: 70 },
    check: (d) => d.income >= 200 },
  { id: 'survive',    text: 'Survive without penalties',         icon: '🛡', reward: { stability: 20 },
    check: (d) => d.rentPaid && d.foodPaid },
];

export class DailyGoals {
  constructor(playerSystem) {
    this.player = playerSystem;
  }

  rollGoals() {
    const shuffled = [...GOAL_POOL].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 3).map(g => g.id);
    this.player.set('currentGoals', chosen);
    this.player.set('goalsCompleted', []);
  }

  checkAndReward(dayEndData, levelSystem) {
    const current = this.player.get('currentGoals') || [];
    if (current.length === 0) return;

    const doubled = (this.player.get('level') || 1) >= 15;
    const completed = [];

    current.forEach(id => {
      const goal = GOAL_POOL.find(g => g.id === id);
      if (!goal) return;
      if (!goal.check(dayEndData, this.player)) return;

      const alreadyDone = (this.player.get('goalsCompleted') || []).includes(id);
      if (alreadyDone) return;

      // Apply reward
      const r = goal.reward;
      const mult = doubled ? 2 : 1;
      if (r.money)     this.player.addMoney(r.money * mult);
      if (r.stability) this.player.addStability(r.stability * mult);
      if (r.happiness) this.player.addHappiness(r.happiness * mult);
      if (r.xp && levelSystem) levelSystem.addXP(r.xp * mult);

      completed.push({ id, text: goal.text, icon: goal.icon, reward: r, doubled });
    });

    if (completed.length > 0) {
      const prev = this.player.get('goalsCompleted') || [];
      this.player.set('goalsCompleted', [...prev, ...completed.map(c => c.id)]);
      EventBus.emit('goalsCompleted', { goals: completed });
    }

    // Roll new goals for next day
    this.rollGoals();
  }

  getGoals() {
    const current = this.player.get('currentGoals') || [];
    const done = this.player.get('goalsCompleted') || [];
    return current.map(id => {
      const goal = GOAL_POOL.find(g => g.id === id);
      if (!goal) return null;
      return { ...goal, completed: done.includes(id) };
    }).filter(Boolean);
  }
}
