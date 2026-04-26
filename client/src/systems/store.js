import { PlayerSystem }      from './PlayerSystem.js';
import { JobSystem }         from './JobSystem.js';
import { MoneySystem }       from './MoneySystem.js';
import { EventSystem }       from './EventSystem.js';
import { LevelSystem }       from './LevelSystem.js';
import { DailyGoals }        from './DailyGoals.js';
import { AchievementSystem } from './AchievementSystem.js';
import { VehicleSystem }     from './VehicleSystem.js';
import { WeatherSystem }     from './WeatherSystem.js';
import { BusinessSystem }    from './BusinessSystem.js';
import { ApplianceSystem }   from './ApplianceSystem.js';
import { DecorationSystem }  from './DecorationSystem.js';
import { LeisureSystem }     from './LeisureSystem.js';
import { EventBus }          from './EventBus.js';

export const playerSystem      = new PlayerSystem();
export const jobSystem         = new JobSystem(playerSystem);
export const moneySystem       = new MoneySystem(playerSystem);
export const eventSystem       = new EventSystem(playerSystem);
export const levelSystem       = new LevelSystem(playerSystem);
export const dailyGoals        = new DailyGoals(playerSystem);
export const achievementSystem = new AchievementSystem(playerSystem);
export const vehicleSystem     = new VehicleSystem(playerSystem);
export const weatherSystem     = new WeatherSystem(playerSystem);
export const businessSystem    = new BusinessSystem(playerSystem);
export const applianceSystem   = new ApplianceSystem(playerSystem);
export const decorationSystem  = new DecorationSystem(playerSystem);
export const leisureSystem     = new LeisureSystem(playerSystem);

// Inject cross-dependencies into jobSystem
jobSystem.weatherSystem  = weatherSystem;
jobSystem.businessSystem = businessSystem;
leisureSystem.setLevelSystem(levelSystem);

// Roll first-day goals if none exist yet
if (!playerSystem.get('currentGoals')?.length) {
  dailyGoals.rollGoals();
}

// Wire up day-end system hooks
EventBus.on('dayEnd', (data) => {
  levelSystem.applyBankInterest();
  dailyGoals.checkAndReward(data, levelSystem);
  achievementSystem.check();
  weatherSystem.rollForDay(playerSystem.get('dayCount') || 1);
  applianceSystem.applyDailyBonuses();
  decorationSystem.applyDailyBonuses();
});
