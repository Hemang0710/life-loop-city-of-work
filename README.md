# Life Loop: City of Work

**Cursor Vibe Jam 2026** — Browser multiplayer life simulation

Walk around a shared city, take jobs, earn money, manage household expenses, improve skills, and survive realistic life tradeoffs. Learn real-world money flow through fun gameplay.

---

## Quick Start

```bash
npm install
npm run dev          # Vite dev server → http://localhost:5173
npm run server       # Multiplayer server → http://localhost:3000
```

For production:
```bash
npm run build        # Outputs to dist/
npm start            # Serves dist/ on port 3000
```

---

## Controls

| Key / Input | Action |
|---|---|
| WASD / Arrow Keys | Move player |
| E | Interact with nearby building |
| ESC | Close panel |
| T | Open chat (type + Enter to send) |
| G | Gift $15 to nearest player (within range) |
| 📊 Skills (top-right HUD) | Toggle skill levels |
| 🏆 Top (top-right HUD) | Leaderboard — top earners |
| 📋 Goals (top-right HUD) | Today's daily goals + rewards |
| ❓ How to Play (top HUD) | In-game controls reference |
| Touch D-pad (mobile) | Move (bottom-left) |
| Touch E / 💬 / 🎁 (mobile) | Interact / Chat / Gift (bottom-right) |

---

## Gameplay

### City Zones

| Building | Type | Action |
|---|---|---|
| 🍳 Restaurant | Job | Cook minigame — click pots in order |
| 📦 Delivery Hub | Job | Delivery minigame — click houses on route |
| 🧹 Cleaning Co. | Job | Cleaning minigame — click dirty spots |
| 🛒 Corner Shop | Job | Shop minigame — sort customers by shelf |
| 🏠 Your Home | Rest | Restore energy, pay rent, start new game |
| 🛒 Market | Shop | Buy food to keep family fed |
| 🏦 City Bank | Finance | Deposit / withdraw savings |
| 📚 Training Center | Skills | Pay to improve skills |
| 🏡 Housing Co. | Upgrades | Unlock home upgrades (Level 8+) |
| 🚗 Vehicle Lot | Vehicles | Buy bike/moped/car for speed boosts |
| 🏢 Business Ctr. | Business | Own businesses for passive income |

### Core Loop

1. Spawn in the city park — enter your name, press **PLAY NOW** (tutorial shown on first play)
2. Walk to a job building, press **E**
3. Play the 30-second minigame
4. Earn money based on performance + skill level + tier
5. After every **4 jobs** → day ends (rent + food + transport auto-deducted)
6. Visit Market to buy food if family is hungry
7. Visit Home to rest and recover energy
8. Train skills at Training Center to earn more per job
9. Level up to unlock Tier 2 and Tier 3 jobs for massive pay increases
10. Complete Daily Goals for bonus cash rewards
11. Interact with other players — chat (T), gift $15 (G)
12. Survive! Miss rent AND food 2 days in a row → game over

### Day Cycle

Every 4 jobs completed = 1 day. The **TODAY** dots in the HUD (top-center) show your progress: 0–3 filled circles. At day-end a summary modal shows income, rent, food, transport, and balance. Daily Goals are also checked and rewards distributed at day-end.

### Stats

| Stat | Effect when low |
|---|---|
| 💰 Money | Turns red below $50 — watch it carefully |
| 💾 Savings | Safe money at the Bank — earns 3% daily interest at Lv 12+ |
| ⚡ Energy | Below 15 → move slower; 0 → can't work |
| 🍞 Food | Below 20 → hunger warning; missed daily → happiness drops |
| 🏠 Stability | Drops if rent missed; hits 0 → family crisis |
| 😊 Happiness | Drops if food/rent missed; city events affect it |

---

## Level System

Every job earns **XP** (15–50 XP based on performance). The XP bar is shown below the HUD.

| Level | Perk |
|---|---|
| 2 | Daily overnight energy +5 |
| 3 | Positive events more likely |
| **5** | 🚀 **Tier 2 jobs unlocked — 60% more pay!** |
| 8 | 🏠 Housing upgrades available |
| **10** | 💫 **Tier 3 jobs unlocked — 150% more pay!** |
| 12 | 🏦 Bank pays 3% daily interest on savings |
| 15 | 📋 Daily goal rewards doubled |
| 20 | 👑 Life Master — Prestige available |

---

## Job Tiers

Higher levels + skills unlock more lucrative versions of every job:

| Tier | Requirement | Pay Multiplier |
|---|---|---|
| Tier 1 | Default | 1× base pay |
| 🚀 Tier 2 | Level 5 + Skill ≥ 4 | **1.6× base pay** |
| 💫 Tier 3 | Level 10 + Skill ≥ 7 | **2.5× base pay** |

Higher tiers also have more challenging minigames (more targets, faster pace, longer recipes).

---

## Daily Goals

Each day you get **3 random goals**. Complete them for bonus rewards. Goals reset every day.

| Example Goal | Reward |
|---|---|
| Earn $150 in one day | +$40 cash |
| Pay all bills on time | +$20 + 10 stability |
| End day with $300+ | +$60 cash |
| Gift another player | +$15 + 15 happiness |
| Get ⭐⭐⭐ on any job | +50 XP |
| Deposit $50 at the bank | +$25 cash |
| Earn $200 in one day | +$70 cash |
| Survive without penalties | +20 stability |

At **Level 15+** all goal rewards are **doubled**.

---

## Achievements

Unlock 15 achievements for lifetime milestones:

🎯 First Shift · 💰 First $100 · 💵 Four Figures · 🤑 High Earner · 🏦 Nest Egg · 📅 Survivor · 🗓 Veteran · ⭐ Rising Star · 🌟 Seasoned Pro · 🔝 Specialist · 💎 Master · 🎁 Generous · 🚀 Pro Worker · 💫 Expert Worker · 🏠 Homeowner

---

## Housing Upgrades

Unlock at **Level 8** by visiting 🏡 Housing Co.:

| Upgrade | Cost | Benefit |
|---|---|---|
| 🛏 Comfy Mattress | $200 | Full rest restores 100 energy |
| 🌱 Home Garden | $350 | Food cost reduced to $10/day (was $15) |
| 🔑 Rent Control | $500 | Rent locked at $60/day (was $80) |

---

## Skills

Every job improves a related skill. Higher skill = higher pay (**+12% per level**, up to Lv 10). Skill level also contributes to unlocking Tier 2 and Tier 3 jobs.

| Skill | Job | Improves |
|---|---|---|
| 🍳 Cooking | Restaurant | Cook pay |
| 🏃 Speed | Delivery | Delivery pay |
| 📋 Organization | Cleaning Co. | Cleaner pay |
| 🎯 Accuracy | Corner Shop | Shop pay |
| 📐 Planning | Any | General multiplier |
| 💹 Finance | Bank/Training | Savings efficiency |

---

## Random Events

After each job there is a 30% chance of a **random event**:
- Positive events (tips, bonuses, free lunch) are applied automatically
- **Decision events** (repair bill, traffic fine, uniform cost) show a **Pay / Ignore** choice:
  - **Pay** — spend the money, problem solved
  - **Ignore** — save the money but lose 10 happiness + 5 stability

---

## City Events

Every 3 minutes the server broadcasts a **city-wide event** affecting all players (bonuses, storms, festivals, tax day, etc). Effects are applied automatically and shown as a banner.

---

## Tutorial

First-time players are shown a **5-slide interactive tutorial** covering movement, jobs, bills, leveling, and multiplayer. It can also be accessed anytime via the **❓ How to Play** button in the HUD.

---

## Multiplayer

- Real-time player positions sync over Socket.IO
- See other players' names floating above them
- **Chat**: press T to open chat bar; messages appear as speech bubbles (3.5 sec)
- **Gift**: press G to send $15 to the nearest player within 150px
- **Minimap**: bottom-right corner — shows all players as dots
- **Leaderboard**: 🏆 Top button shows top 7 earners currently online
- City events affect every connected player simultaneously

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Phaser 3.87 + Vite 5 |
| Backend | Node.js + Express + Socket.IO |
| Persistence | localStorage |
| Audio | Web Audio API (procedural, no files) |
| Multiplayer | Socket.IO — graceful solo fallback |
| Hosting | Vercel (frontend) + Render/Railway (backend) |

---

## Deployment

**Frontend** (Vercel / Netlify):
1. Run `npm run build`
2. Deploy the `dist/` folder
3. Set env var: `VITE_SERVER_URL=https://your-server.render.com`

**Backend** (Render / Railway):
1. Deploy `server/index.js` (Node.js service)
2. Set `NODE_ENV=production` to also serve the built frontend
3. The `/leaderboard` and `/health` endpoints are publicly accessible

---

## Phase Status

- [x] **Phase 1** — City map, player movement, 4 job zones, zone panels, interaction prompts
- [x] **Phase 2** — 4 distinct minigames (Cook, Delivery, Cleaner, Shop), day cycle, HUD bars
- [x] **Phase 3** — Multiplayer presence, real-time movement, chat (T), gifting (G), shared city events
- [x] **Phase 4** — Skills, training, leaderboard, job progress dots, sound effects, gold particles
- [x] **Phase 5** — Mobile touch controls, minimap, game-over screen, walking animation, fountain particles, camera flash, event decisions, transport expense, overnight energy recovery
- [x] **Phase 6** — Level system (XP bar, 20 levels, perks), Job Tiers (Tier 2/3 with 1.6×/2.5× pay), Daily Goals (3/day, 8-goal pool, doubled rewards at Lv15), 15 Achievements, Housing Upgrades (3 upgrades, Lv8+), Tutorial overlay (5 slides + in-game reference), Housing Co. building
- [x] **Phase 7** — Vehicle System (Bicycle/Moped/Sports Car, level-gated, speed multipliers, colored trail), Weather System (6 types, deterministic per day, affects speed/earnings/energy/food cost, rain particles), Business Ownership (3 passive-income businesses, level-gated), Prestige System (Lv20+, permanent +15% per prestige), Enhanced NPCs (8 named NPCs with speech bubbles), Credits screen

---

## Credits

**Created by:** Hemang Patel
**Email:** hemangpatel0710@gmail.com
**Submitted for:** Cursor Vibe Jam 2026
**© 2026 Hemang Patel** — All rights reserved
