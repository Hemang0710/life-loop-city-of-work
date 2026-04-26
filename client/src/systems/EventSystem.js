import { EventBus } from './EventBus.js';

const EVENTS = [
  { id: 'tip',         text: 'Customer left a generous tip!',        money:  25, energy:   0, food:  0 },
  { id: 'bonus',       text: 'Performance bonus from manager!',       money:  40, energy:   0, food:  0 },
  { id: 'found',       text: 'Found some cash on the street!',        money:  12, energy:   0, food:  0 },
  { id: 'lunch',       text: 'Boss bought everyone lunch!',           money:   0, energy:  15, food: 25 },
  { id: 'coworker',    text: 'Coworker covered your break!',          money:   0, energy:  20, food:  0 },
  { id: 'celebration', text: 'Office party! Free cake!',              money:  10, energy:  10, food: 20 },
  { id: 'overtime',    text: 'Unexpected overtime payment!',          money:  30, energy: -15, food:  0 },
  // Decision events — player must Pay or Ignore
  { id: 'repair',   text: 'Equipment needs urgent repair.',     money: -20, energy: 0, food: 0, decision: true },
  { id: 'traffic',  text: 'Late delivery — fine issued.',       money: -15, energy: 0, food: 0, decision: true },
  { id: 'uniform',  text: 'Uniform replacement required.',     money: -10, energy: 0, food: 0, decision: true },
];

export class EventSystem {
  constructor(playerSystem) {
    this.player = playerSystem;
  }

  // 30% chance to fire an event after a job
  tryTriggerEvent() {
    if (Math.random() > 0.30) return null;
    const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    if (!evt.decision) {
      this._applyEvent(evt);
      EventBus.emit('randomEvent', evt);
    }
    // Decision events are returned but NOT applied yet — caller shows Pay/Ignore UI
    return evt;
  }

  // Called from MiniGameScene after the player makes a choice
  applyDecision(evt, accept) {
    if (accept) {
      this.player.addMoney(evt.money); // negative — deducts
    } else {
      this.player.addHappiness(-10);
      this.player.addStability(-5);
    }
    EventBus.emit('randomEvent', evt);
  }

  _applyEvent(evt) {
    if (evt.money  !== 0) this.player.addMoney(evt.money);
    if (evt.energy !== 0) this.player.addEnergy(evt.energy);
    if (evt.food   >   0) this.player.addFoodStatus(evt.food);
  }
}
