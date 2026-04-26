import { EventBus } from './EventBus.js';

export const VEHICLES = {
  bike:  { id: 'bike',  label: 'Bicycle',    emoji: '🚲', cost: 300,  requiredLevel: 3,  speedMult: 1.45, trailColor: 0x27ae60, desc: '+45% move speed' },
  moped: { id: 'moped', label: 'Moped',      emoji: '🛵', cost: 900,  requiredLevel: 7,  speedMult: 1.9,  trailColor: 0xf39c12, desc: '+90% move speed' },
  car:   { id: 'car',   label: 'Sports Car', emoji: '🚗', cost: 2200, requiredLevel: 12, speedMult: 2.4,  trailColor: 0x3498db, desc: '+140% move speed + prestige' },
};

export class VehicleSystem {
  constructor(playerSystem) {
    this.player = playerSystem;
  }

  getVehicle() { return VEHICLES[this.player.get('vehicle')] || null; }
  getSpeedMult() { return this.getVehicle()?.speedMult || 1.0; }

  canBuy(id) {
    const v = VEHICLES[id];
    if (!v) return false;
    if (this.player.get('vehicle') === id) return false;
    return (this.player.get('level') || 1) >= v.requiredLevel;
  }

  buy(id) {
    const v = VEHICLES[id];
    if (!v) return false;
    if (!this.canBuy(id)) return false;
    if ((this.player.get('money') || 0) < v.cost) return false;
    this.player.addMoney(-v.cost);
    this.player.set('vehicle', id);
    EventBus.emit('vehicleChanged', v);
    return true;
  }

  sell() {
    const v = this.getVehicle();
    if (!v) return false;
    this.player.addMoney(Math.floor(v.cost * 0.4)); // 40% resale
    this.player.set('vehicle', null);
    EventBus.emit('vehicleChanged', null);
    return true;
  }
}
