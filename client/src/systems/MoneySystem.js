export class MoneySystem {
  constructor(playerSystem) {
    this.player = playerSystem;
    this.ledger = [];
  }

  addTransaction(type, amount, description) {
    this.ledger.push({ type, amount, description, ts: Date.now() });
    if (this.ledger.length > 60) this.ledger.shift();
  }

  earn(amount, description) {
    this.player.addMoney(amount);
    this.addTransaction('income', amount, description);
  }

  spend(amount, description) {
    const money = this.player.get('money');
    if (money < amount) return false;
    this.player.addMoney(-amount);
    this.addTransaction('expense', amount, description);
    return true;
  }

  canAfford(amount) {
    return this.player.get('money') >= amount;
  }

  getRecent(n = 8) {
    return this.ledger.slice(-n).reverse();
  }
}
