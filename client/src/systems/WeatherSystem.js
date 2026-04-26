import { EventBus } from './EventBus.js';

export const WEATHERS = [
  { id: 'sunny',    emoji: '☀️',  label: 'Sunny',     tint: 0xffe8a0, alpha: 0.07, speedMult: 1.0,  earningsMult: 1.10, energyMult: 1.0, foodExtra: 0,  desc: '+10% all earnings' },
  { id: 'cloudy',   emoji: '☁️',  label: 'Cloudy',    tint: 0x000000, alpha: 0.0,  speedMult: 1.0,  earningsMult: 1.0,  energyMult: 1.0, foodExtra: 0,  desc: 'Normal conditions' },
  { id: 'cloudy',   emoji: '☁️',  label: 'Cloudy',    tint: 0x000000, alpha: 0.0,  speedMult: 1.0,  earningsMult: 1.0,  energyMult: 1.0, foodExtra: 0,  desc: 'Normal conditions' },
  { id: 'rain',     emoji: '🌧',  label: 'Rainy',     tint: 0x4a6fa8, alpha: 0.14, speedMult: 0.80, earningsMult: 0.95, energyMult: 1.0, foodExtra: 5,  desc: '-20% speed, food +$5' },
  { id: 'storm',    emoji: '⛈',  label: 'Storm',     tint: 0x2c3e50, alpha: 0.20, speedMult: 0.70, earningsMult: 0.90, energyMult: 1.5, foodExtra: 5,  desc: '-30% speed, energy drains fast' },
  { id: 'heatwave', emoji: '🌡',  label: 'Heat Wave', tint: 0xff6b35, alpha: 0.09, speedMult: 0.90, earningsMult: 1.05, energyMult: 1.3, foodExtra: 0,  desc: '+5% earnings, energy drains faster' },
];

export class WeatherSystem {
  constructor(playerSystem) {
    this.player = playerSystem;
    this._current = this._forDay(playerSystem.get('dayCount') || 1);
  }

  _forDay(day) {
    // Deterministic weather per day — same day always gives same weather
    const idx = ((day * 13 + 7) % WEATHERS.length + WEATHERS.length) % WEATHERS.length;
    return WEATHERS[idx];
  }

  rollForDay(day) {
    const next = this._forDay(day);
    const changed = next.id !== this._current.id;
    this._current = next;
    if (changed) EventBus.emit('weatherChanged', this._current);
    return this._current;
  }

  getCurrent()       { return this._current; }
  getSpeedMult()     { return this._current.speedMult; }
  getEarningsMult()  { return this._current.earningsMult; }
  getEnergyMult()    { return this._current.energyMult; }
  getFoodExtra()     { return this._current.foodExtra; }
  isRaining()        { return this._current.id === 'rain' || this._current.id === 'storm'; }
}
