import { JOBS } from '../config/GameConfig.js';
import { EventBus } from './EventBus.js';

const RENT_BASE  = 80;
const FOOD_BASE  = 15;
const TRANSPORT  = 5;

export class JobSystem {
  constructor(playerSystem) {
    this.player = playerSystem;
    this._dayIncome = 0;
    // weatherSystem and businessSystem injected after store init to avoid circular deps
    this.weatherSystem  = null;
    this.businessSystem = null;
  }

  getJob(id) { return JOBS[id] || null; }

  calculatePay(jobId, performanceScore, tier = 1) {
    const job = JOBS[jobId];
    if (!job) return 0;
    const skillMult   = this.player.getSkillMultiplier(job.skill);
    const tierMult    = tier === 3 ? 2.5 : tier === 2 ? 1.6 : 1.0;
    const prestigeMult= 1 + (this.player.get('prestige') || 0) * 0.15;
    const weatherMult = this.weatherSystem?.getEarningsMult() || 1.0;
    const range = job.maxPay - job.basePay;
    return Math.round(
      (job.basePay + range * Math.max(0, Math.min(1, performanceScore)))
      * skillMult * tierMult * prestigeMult * weatherMult,
    );
  }

  completeJob(jobId, performanceScore, tier = 1) {
    const job = JOBS[jobId];
    if (!job) return { pay: 0, skill: '', xp: 0 };

    const pay = this.calculatePay(jobId, performanceScore, tier);
    // Energy costs amplified by heat wave / storm
    const energyMult = this.weatherSystem?.getEnergyMult() || 1.0;
    const energyCost = Math.round(job.energyCost * energyMult);

    this.player.addMoney(pay);
    this.player.addSkillXP(job.skill, 0.15 + 0.1 * performanceScore);
    this.player.addEnergy(-energyCost);
    this._dayIncome += pay;

    const xp = 15 + Math.round(performanceScore * 35);

    const completed = (this.player.get('jobsCompleted') || 0) + 1;
    this.player.set('jobsCompleted', completed);

    if (completed % 4 === 0) {
      this._endOfDay();
    }

    return { pay, skill: job.skill, xp };
  }

  _endOfDay() {
    this.player.incrementDay();

    // Overnight energy recovery (mattress upgrade gives full restore)
    const hasMattress = this.player.get('houseUpgrades')?.mattress;
    this.player.addEnergy(hasMattress ? 100 : 35);

    const day    = this.player.get('dayCount');
    const income = this._dayIncome;
    this._dayIncome = 0;

    // Passive business income
    const businessIncome = this.businessSystem?.getDailyIncome() || 0;
    if (businessIncome > 0) {
      this.player.addMoney(businessIncome);
    }

    // Housing upgrade effects on costs
    const upgrades  = this.player.get('houseUpgrades') || {};
    const weatherFoodExtra = this.weatherSystem?.getFoodExtra() || 0;
    const foodCost  = (upgrades.garden ? 10 : FOOD_BASE) + weatherFoodExtra;
    const rentCost  = upgrades.rentControl ? 60 : RENT_BASE;

    // Food cost
    const foodPaid = this.player.get('money') >= foodCost;
    if (foodPaid) {
      this.player.addMoney(-foodCost);
    } else {
      this.player.addFoodStatus(-20);
      this.player.addHappiness(-8);
    }

    // Rent
    const rentPaid = this.player.get('money') >= rentCost;
    if (rentPaid) {
      this.player.addMoney(-rentCost);
      this.player.addStability(5);
      this.player.addHappiness(3);
    } else {
      this.player.addStability(-15);
      this.player.addHappiness(-12);
    }

    // Transport
    const transportPaid = this.player.get('money') >= TRANSPORT;
    if (transportPaid) {
      this.player.addMoney(-TRANSPORT);
    } else {
      this.player.addHappiness(-5);
    }

    // Game-over: bankrupt 2 days in a row (missed both rent AND food)
    if (!rentPaid && !foodPaid) {
      const missed = (this.player.get('missedDays') || 0) + 1;
      this.player.set('missedDays', missed);
      if (missed >= 2) {
        EventBus.emit('gameOver', {
          day, totalEarned: this.player.get('totalEarned') || 0,
        });
        return;
      }
    } else {
      this.player.set('missedDays', 0);
    }

    EventBus.emit('dayEnd', {
      day,
      income,
      businessIncome,
      rentPaid,
      foodPaid,
      transportPaid,
      rentCost,
      foodCost,
      transportCost: TRANSPORT,
      moneyAfter: this.player.get('money'),
    });
  }
}
