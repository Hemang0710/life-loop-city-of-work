// ─── World ─────────────────────────────────────────────────────────────────
export const WORLD_W = 2000;
export const WORLD_H = 1800;

// ─── Player ────────────────────────────────────────────────────────────────
export const PLAYER_SPEED      = 210;
export const PLAYER_SPEED_LOW  = 100; // when energy < 20
export const INTERACT_RADIUS   = 160;
export const SPAWN_X           = 780;
export const SPAWN_Y           = 760;

// ─── City road grid ────────────────────────────────────────────────────────
// Horizontal road center Y positions
export const H_ROADS = [100, 560, 960, 1360, 1760];
// Vertical road center X positions
export const V_ROADS = [100, 560, 1000, 1440, 1880];
export const ROAD_HALF = 35; // half-width of each road

// ─── Zone / Building definitions ───────────────────────────────────────────
// cx/cy = building center in world coordinates
export const ZONES = [
  // ── Job zones ──────────────────────────────────────────────────────────
  {
    id: 'restaurant', label: 'Restaurant', type: 'job', jobId: 'cook',
    cx: 330, cy: 330, w: 240, h: 180,
    color: 0xe74c3c, darkColor: 0x922b21,
    emoji: '🍳', description: 'Time your cooking! Click the dishes.',
  },
  {
    id: 'delivery', label: 'Delivery Hub', type: 'job', jobId: 'delivery',
    cx: 780, cy: 330, w: 240, h: 180,
    color: 0x3498db, darkColor: 0x1a5276,
    emoji: '📦', description: 'Click packages before they slip away!',
  },
  {
    id: 'cleaning', label: 'Cleaning Co.', type: 'job', jobId: 'cleaner',
    cx: 330, cy: 1160, w: 240, h: 180,
    color: 0x27ae60, darkColor: 0x1a7245,
    emoji: '🧹', description: 'Click the dirt spots to clean up!',
  },
  {
    id: 'shop', label: 'Corner Shop', type: 'job', jobId: 'shop',
    cx: 780, cy: 1160, w: 240, h: 180,
    color: 0xf39c12, darkColor: 0x9a6218,
    emoji: '🛒', description: 'Sort the shelves quickly!',
  },

  // ── Special zones ──────────────────────────────────────────────────────
  {
    id: 'home', label: 'Your Home', type: 'home',
    cx: 330, cy: 760, w: 200, h: 180,
    color: 0x9b59b6, darkColor: 0x6c3483,
    emoji: '🏠', description: 'Rest and manage your household',
  },
  {
    id: 'bank', label: 'City Bank', type: 'bank',
    cx: 1220, cy: 330, w: 220, h: 180,
    color: 0x1abc9c, darkColor: 0x148f77,
    emoji: '🏦', description: 'Deposit savings and grow your wealth',
  },
  {
    id: 'market', label: 'Market', type: 'market',
    cx: 1220, cy: 760, w: 240, h: 180,
    color: 0xe67e22, darkColor: 0x9a4e0e,
    emoji: '🛒', description: 'Buy food and essentials',
  },
  {
    id: 'training', label: 'Training Center', type: 'training',
    cx: 1220, cy: 1160, w: 240, h: 180,
    color: 0x8e44ad, darkColor: 0x5b2c6f,
    emoji: '📚', description: 'Improve your skills to earn more',
  },
  {
    id: 'housing', label: 'Housing Co.', type: 'housing',
    cx: 1680, cy: 760, w: 200, h: 160,
    color: 0x8e44ad, darkColor: 0x6c3483,
    emoji: '🏡', description: 'Upgrade your home for better living',
  },
  {
    id: 'vehicles', label: 'Vehicle Lot', type: 'vehicles',
    cx: 1680, cy: 330, w: 200, h: 160,
    color: 0xe67e22, darkColor: 0x9a4e0e,
    emoji: '🚗', description: 'Buy a vehicle to travel faster',
  },
  {
    id: 'business', label: 'Business Ctr.', type: 'business',
    cx: 1680, cy: 1160, w: 200, h: 160,
    color: 0x16a085, darkColor: 0x0e6655,
    emoji: '🏢', description: 'Own businesses for passive income',
  },

  // ── New zones ──────────────────────────────────────────────────────────
  {
    id: 'leisure', label: 'Leisure Center', type: 'leisure',
    cx: 330, cy: 1560, w: 200, h: 160,
    color: 0xe91e63, darkColor: 0xad1457,
    emoji: '🎪', description: 'Spend money on leisure activities',
  },
  {
    id: 'mall', label: 'Shopping Mall', type: 'mall',
    cx: 780, cy: 1560, w: 240, h: 180,
    color: 0xff9800, darkColor: 0xe65100,
    emoji: '🛍️', description: 'Buy appliances & decorations for home',
  },
  {
    id: 'portal', label: 'Vibe Jam Portal', type: 'portal',
    cx: 1680, cy: 1560, w: 180, h: 160,
    color: 0x7c3aed, darkColor: 0x4c1d95,
    emoji: '🌀', description: 'Travel to other Vibe Jam 2026 games',
  },
];

// ─── Job definitions ───────────────────────────────────────────────────────
export const JOBS = {
  cook:     { id: 'cook',     name: 'Restaurant',   basePay: 50, maxPay: 130, skill: 'cooking',      energyCost: 22 },
  delivery: { id: 'delivery', name: 'Delivery Hub', basePay: 45, maxPay: 115, skill: 'speed',        energyCost: 25 },
  cleaner:  { id: 'cleaner',  name: 'Cleaning Co.', basePay: 40, maxPay: 100, skill: 'organization', energyCost: 20 },
  shop:     { id: 'shop',     name: 'Corner Shop',  basePay: 42, maxPay: 108, skill: 'accuracy',     energyCost: 18 },
};

// ─── Skill definitions ─────────────────────────────────────────────────────
export const SKILL_NAMES = ['cooking', 'speed', 'organization', 'accuracy', 'planning', 'finance'];

// ─── Training costs ────────────────────────────────────────────────────────
export const TRAINING = {
  cooking:      { label: 'Cooking Skills',       cost: 40, skill: 'cooking' },
  speed:        { label: 'Speed & Stamina',       cost: 40, skill: 'speed' },
  organization: { label: 'Organization',          cost: 35, skill: 'organization' },
  accuracy:     { label: 'Accuracy Training',     cost: 35, skill: 'accuracy' },
  planning:     { label: 'Planning & Finance',    cost: 50, skill: 'planning' },
};

// ─── Starting player stats ─────────────────────────────────────────────────
export const STARTING_STATS = {
  money: 120,
  savings: 0,
  energy: 100,
  householdStability: 80,
  familyHappiness: 75,
  foodStatus: 70,
  rentDue: false,
  jobsCompleted: 0,
  dayCount: 1,
};

// ─── Housing upgrades ──────────────────────────────────────────────────────
export const HOUSING_UPGRADES = {
  mattress:    { cost: 200, label: 'Comfy Mattress',  desc: 'Full rest gives 100 energy (requires Lv 8)' },
  garden:      { cost: 350, label: 'Home Garden',     desc: 'Food cost reduced to $10/day (requires Lv 8)' },
  rentControl: { cost: 500, label: 'Rent Control',    desc: 'Rent locked at $60/day (requires Lv 8)' },
};

// Palette for player body colors
export const PLAYER_COLORS = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0xec407a];

// Utility
export function darkenColor(hex, amount = 40) {
  const r = Math.max(0, (hex >> 16 & 0xff) - amount);
  const g = Math.max(0, (hex >> 8  & 0xff) - amount);
  const b = Math.max(0, (hex        & 0xff) - amount);
  return (r << 16) | (g << 8) | b;
}
