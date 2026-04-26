# MASTER PROMPT — FULL END-TO-END DEVELOPMENT

## Life Loop: City of Work — Cursor Vibe Jam 2026

You are a senior game developer, senior full-stack engineer, and production architect building a complete jam-submission-ready browser multiplayer game.

Your task is to build a production-ready browser game called:

# Life Loop: City of Work

This is for Cursor Vibe Jam 2026.

You must make autonomous engineering decisions when needed and prioritize:
playable + polished + stable + fun

over

over-engineered + unfinished

---

# CRITICAL JAM REQUIREMENTS

This game MUST satisfy:

* brand-new game created during the jam
* browser playable instantly
* no login
* no signup
* no launcher
* no install
* no heavy loading screen
* immediate spawn into gameplay
* playable from one web domain/subdomain
* AI-generated implementation is the main development approach
* multiplayer preferred
* stable enough for public judging
* polished enough for submission

MUST include this script in HTML:

```html
<script async src="https://vibej.am/2026/widget.js"></script>
```

Do not forget this.

---

# PRIMARY GAME GOAL

Build a shared-city life simulation where players:

* take jobs
* earn money
* manage expenses
* improve skills
* handle household responsibilities
* make financial decisions
* survive realistic life tradeoffs
* cooperate with other players
* learn real-world money flow through fun gameplay

This game must feel:

FUN FIRST
EDUCATIONAL SECOND

not the reverse.

Never make it feel like homework.

---

# CORE PLAYER LOOP

Player should be able to:

1. Spawn instantly into a small city
2. Walk around freely
3. Choose a job location
4. Start a short minigame
5. Earn money based on performance
6. Spend money on life needs
7. Improve skills
8. Unlock better income opportunities
9. Handle random life events
10. Manage household happiness/stability
11. Interact with other players
12. Repeat loop with better decisions

This loop must feel satisfying within the first 60 seconds.

---

# RECOMMENDED TECH STACK (MANDATORY)

Use:

## Frontend

* Phaser 3

Why:
faster for jam
better for browser
better for minigames
lighter than Three.js
faster to polish

Do NOT use Three.js unless absolutely necessary.

---

## Backend

Use:

* Node.js
* Express
* Socket.IO

for:

* multiplayer presence
* player sync
* lightweight shared town
* trades
* cooperation
* future expansion

Do NOT overbuild MMO architecture.

Keep it lightweight.

---

## Persistence

Use:

* localStorage first

Optional:

* Supabase only if truly needed

Do NOT over-engineer backend persistence.

---

## Hosting

Frontend:
Vercel or Netlify

Backend:
Render or Railway

Must support free-tier deployment.

Prefer zero-cost development.

---

# REQUIRED GAME SYSTEMS

---

# 1. PLAYER SYSTEM

Implement:

* player name
* money
* savings
* current job
* skills
* energy
* household stability
* family happiness
* rent due
* food status
* movement in city
* lightweight persistence

Player should feel progression.

---

# 2. JOB SYSTEM

Include at least these jobs:

## Cook

Minigame:
timing + order accuracy

---

## Delivery

Minigame:
route speed + path efficiency

---

## Cleaner

Minigame:
target clicking + organization

---

## Shop Worker

Minigame:
sorting + customer speed

---

Each job must:

* be quick
* be replayable
* feel satisfying
* pay based on performance
* improve relevant skills

---

# 3. SKILL SYSTEM

Include:

* Speed
* Accuracy
* Planning
* Cooking
* Organization
* Finance

Skills must:

* increase through work
* increase through training
* unlock better rewards
* improve pay
* create visible progression

Do not make skills cosmetic.

They must matter.

---

# 4. MONEY SYSTEM

Must include:

Income:

* jobs

Expenses:

* food
* rent
* transport
* tools
* training
* emergencies

Also include:

* savings meter
* visible cause/effect
* budgeting choices
* short-term vs long-term decisions

Player must understand:

“where money goes”

without needing explanation.

---

# 5. HOME + FAMILY SYSTEM

Include:

* household budget
* recurring expenses
* food needs
* rent deadlines
* occasional family costs
* family happiness/stability meter

Examples:

* school fees
* medicine
* repairs
* celebration expenses

Choices must affect household stability.

This is one of the strongest systems.

Do not skip it.

---

# 6. EVENT SYSTEM

Add random events such as:

* illness
* repairs
* inflation
* school fees
* festival
* low groceries
* transport issue
* salary bonus
* sudden guest visit
* cousin wedding contribution
* broken phone
* promotion chance

Events must create decisions.

Not just notifications.

Good events create emotional memory.

---

# 7. MULTIPLAYER SYSTEM

Must include:

minimum:

* visible real-time players
* shared town
* synchronized movement
* visible names
* lightweight state sync

preferred:

* trading money/items
* helping other players
* cooperative work
* shared events

If full multiplayer becomes risky:

use lightweight shared presence fallback

but MUST still feel social.

---

# 8. UI SYSTEM

Create:

* clean HUD
* money display
* savings display
* skill display
* energy bar
* household meter
* family happiness meter
* job board panel
* shop panel
* household panel
* event popup system
* quick tutorial text
* interaction prompts

UI must be:

simple
clean
readable
fast

No clutter.

---

# 9. ART STYLE

Use:

* bright colors
* low-poly inspired 2D style
* cozy + slightly funny city
* readable zones
* fast-loading assets
* minimal asset weight

Avoid:

* huge textures
* realistic heavy art
* slow loading

Keep browser-first.

---

# 10. GAME FEEL

Add:

* satisfying money feedback
* level-up feedback
* popup feedback
* tiny sound effects
* ambient NPC movement if easy
* city life feeling
* humor in events

Game should feel alive.

Not like spreadsheets.

---

# PORTAL SUPPORT (IF IMPLEMENTED)

Support:

* portal URL query param detection
* instant spawn continuity
* preserve username/color/speed/ref if possible
* return portal flow

Do NOT add blocking start screens.

Spawn instantly.

---

# DEVELOPMENT STRATEGY (MANDATORY ORDER)

Follow EXACTLY this order:

---

# PHASE 1 — FOUNDATION

Build:

* project structure
* Phaser setup
* game config
* BootScene
* CityScene
* UIScene
* player movement
* city map
* collision
* job zones
* interaction prompts
* instant spawn

Goal:
first playable build immediately

This is highest priority.

---

# PHASE 2 — CORE LOOP

Build:

* job minigames
* money earning
* basic HUD
* first job payouts
* savings meter
* first progression loop

Goal:
player earns money quickly

---

# PHASE 3 — LIFE SYSTEMS

Build:

* expenses
* home system
* family happiness
* recurring bills
* event system
* household management

Goal:
real life simulation begins

---

# PHASE 4 — SKILLS

Build:

* skill progression
* unlock scaling
* better rewards
* training purchases

Goal:
long-term progression

---

# PHASE 5 — MULTIPLAYER

Build:

* Socket.IO server
* movement sync
* player presence
* simple trades
* shared city

Goal:
social gameplay

---

# PHASE 6 — POLISH

Build:

* balancing
* better UI
* sound effects
* animations
* humor events
* feedback polish
* bug fixes
* submission stability

Goal:
jam-ready submission

---

# IMPORTANT ENGINEERING RULES

Always:

* write production-quality code
* modular architecture
* clean folders
* reusable systems
* safe fallback handling
* graceful backend failure recovery
* browser-safe code
* low load time
* mobile-friendly if easy
* stable first

Never:

* over-engineer
* add unnecessary complexity
* delay playability for perfection
* break instant-start rule

Priority:

PLAYABLE > PERFECT

always.

---

# FILE STRUCTURE

Use professional structure like:

client/
server/
src/
systems/
scenes/
network/
ui/
config/
assets/

Include:

README.md

with:

* controls
* gameplay
* deployment steps

---

# OUTPUT RULES

You must provide:

REAL CODE FILES

not theory

not pseudo-code

not architecture-only explanations

not “you should”

Generate actual implementation.

Make autonomous decisions.

Keep momentum.

Think like a senior engineer shipping a real game.

If simplification is required:

preserve the core loop first.

Always.

---

# START NOW

Begin with:

## Complete Phaser production setup

including:

* package.json
* folder structure
* game config
* BootScene
* CityScene
* UIScene
* player movement
* starter city map
* job zones
* starter HUD
* Vibe Jam widget integration
* README

Then continue phase by phase without losing architecture consistency.

Build the full game end-to-end.
