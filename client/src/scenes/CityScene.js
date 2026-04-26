import Phaser from 'phaser';
import {
  WORLD_W, WORLD_H, PLAYER_SPEED, PLAYER_SPEED_LOW,
  INTERACT_RADIUS, SPAWN_X, SPAWN_Y,
  H_ROADS, V_ROADS, ROAD_HALF,
  ZONES, TRAINING,
  darkenColor,
} from '../config/GameConfig.js';
import { playerSystem, jobSystem, moneySystem, achievementSystem, levelSystem, vehicleSystem, weatherSystem, businessSystem, applianceSystem, decorationSystem, leisureSystem } from '../systems/store.js';
import { VEHICLES } from '../systems/VehicleSystem.js';
import { BUSINESSES } from '../systems/BusinessSystem.js';
import { APPLIANCES } from '../systems/ApplianceSystem.js';
import { DECORATIONS } from '../systems/DecorationSystem.js';
import { LEISURE_ACTIVITIES } from '../systems/LeisureSystem.js';
import { EventBus } from '../systems/EventBus.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { SocketManager } from '../network/SocketManager.js';
import { initTouchControls, touchState } from '../ui/TouchControls.js';

const PANEL_W    = 420;
const PANEL_H    = 420;
const VW         = 1280;
const VH         = 720;
const GIFT_RADIUS = 150; // world-space pixels to gift another player

export class CityScene extends Phaser.Scene {
  constructor() { super({ key: 'CityScene' }); }

  // ─────────────────────────────────────────── create ──────────────────────

  create() {
    this._generateTextures();
    this._buildCity();
    this._spawnPlayer();
    this._spawnNPCs();
    this._setupCamera();
    this._setupInput();
    this._activeZone   = null;
    this._panel        = null;
    this._panelOpen    = false;
    this._moveEmitAcc  = 0;
    this._chatActive   = false;
    this._chatInputEl  = null;
    this._selfBubble   = null;

    // Gift proximity highlight — persistent circle, shown when a player is in range
    this._giftHighlight = this.add.circle(0, 0, 36, 0xf39c12, 0.15)
      .setStrokeStyle(2, 0xf39c12, 0.9).setDepth(6).setVisible(false);

    // Weather overlay (full-world tint rectangle)
    this._weatherOverlay = this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x000000, 0)
      .setDepth(19);
    this._rainEmitter = null;
    this._applyWeatherVisual(weatherSystem.getCurrent());

    // Vehicle trail emitter (particles behind player when riding)
    this._vehicleTrail = null;
    this._buildVehicleTrail();

    // EventBus hooks for visual reactions
    EventBus.on('weatherChanged', (w) => this._applyWeatherVisual(w));
    EventBus.on('vehicleChanged', () => this._buildVehicleTrail());
    EventBus.on('playerLevelUp', () => this.cameras.main.shake(280, 0.006));
    EventBus.on('achievement',   () => this.cameras.main.shake(180, 0.004));

    // Multiplayer
    this._net = new SocketManager();
    this._remotePlayers = {};
    this._setupNetworkHandlers();

    this._net.join({
      name:        playerSystem.get('name'),
      x:           SPAWN_X,
      y:           SPAWN_Y,
      color:       playerSystem.get('color'),
      totalEarned: playerSystem.get('totalEarned') || 0,
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ─────────────────────────── texture generation ──────────────────────────

  _generateTextures() {
    if (!this.textures.exists('pixel')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff); g.fillRect(0, 0, 1, 1);
      g.generateTexture('pixel', 1, 1); g.destroy();
    }

    const color = playerSystem.get('color') || 0x3498db;
    if (!this.textures.exists('player_self')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color);          g.fillCircle(20, 32, 13);
      g.fillStyle(0xfae5c4);       g.fillCircle(20, 12, 11);
      g.fillStyle(0x2c3e50);       g.fillCircle(16, 11, 2.5); g.fillCircle(24, 11, 2.5);
      g.fillStyle(0xe8a87c);       g.fillRect(16, 17, 8, 3);
      g.fillStyle(color);          g.fillRect(8, 36, 10, 10); g.fillRect(22, 36, 10, 10);
      g.generateTexture('player_self', 40, 48); g.destroy();
    }

    if (!this.textures.exists('player_remote')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x95a5a6);       g.fillCircle(18, 30, 12);
      g.fillStyle(0xddd);          g.fillCircle(18, 11, 10);
      g.generateTexture('player_remote', 36, 44); g.destroy();
    }
  }

  // ──────────────────────────── city drawing ────────────────────────────────

  _buildCity() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x82c855); bg.fillRect(0, 0, WORLD_W, WORLD_H);

    const patchGfx = this.add.graphics().setDepth(0);
    patchGfx.fillStyle(0x78be4e, 0.4);
    for (let i = 0; i < 60; i++) {
      patchGfx.fillEllipse(
        Phaser.Math.Between(0, WORLD_W), Phaser.Math.Between(0, WORLD_H),
        Phaser.Math.Between(30, 100),    Phaser.Math.Between(20, 60),
      );
    }

    const roadGfx = this.add.graphics().setDepth(1);
    roadGfx.fillStyle(0x6d7a8a);
    H_ROADS.forEach(y => roadGfx.fillRect(0, y - ROAD_HALF, WORLD_W, ROAD_HALF * 2));
    V_ROADS.forEach(x => roadGfx.fillRect(x - ROAD_HALF, 0, ROAD_HALF * 2, WORLD_H));
    roadGfx.fillStyle(0xffffff, 0.35);
    H_ROADS.forEach(y => {
      for (let x = 80; x < WORLD_W; x += 80) roadGfx.fillRect(x, y - 3, 40, 6);
    });
    V_ROADS.forEach(x => {
      for (let y = 80; y < WORLD_H; y += 80) roadGfx.fillRect(x - 3, y, 6, 40);
    });
    roadGfx.fillStyle(0xb0b8c5, 0.6);
    H_ROADS.forEach(y => {
      roadGfx.fillRect(0, y - ROAD_HALF - 10, WORLD_W, 10);
      roadGfx.fillRect(0, y + ROAD_HALF,      WORLD_W, 10);
    });
    V_ROADS.forEach(x => {
      roadGfx.fillRect(x - ROAD_HALF - 10, 0, 10, WORLD_H);
      roadGfx.fillRect(x + ROAD_HALF,      0, 10, WORLD_H);
    });

    const parkGfx = this.add.graphics().setDepth(2);
    parkGfx.fillStyle(0x5cb85c, 0.5); parkGfx.fillRect(595, 595, 370, 330);
    parkGfx.fillStyle(0x4cae4c, 0.4); parkGfx.fillEllipse(780, 760, 220, 180);
    parkGfx.fillStyle(0x5dade2, 0.9); parkGfx.fillCircle(780, 760, 30);
    parkGfx.fillStyle(0x85c1e9, 0.8); parkGfx.fillCircle(780, 760, 18);
    parkGfx.fillStyle(0xd6eaf8, 0.9); parkGfx.fillCircle(780, 760, 6);

    // Fountain spray particles
    this.add.particles(780, 748, 'pixel', {
      speed: { min: 25, max: 65 },
      angle: { min: 248, max: 292 },
      scale: { start: 3, end: 0 },
      alpha: { start: 0.75, end: 0 },
      tint: [0x5dade2, 0x85c1e9, 0xaed6f1],
      lifespan: 900,
      gravityY: 180,
      frequency: 70,
      quantity: 1,
    }).setDepth(3);
    [[670,660],[890,660],[650,880],[910,880],[780,680],[780,840]].forEach(([tx,ty]) => {
      parkGfx.fillStyle(0x2d6a27, 1); parkGfx.fillCircle(tx, ty, 22);
      parkGfx.fillStyle(0x3a8a32, 1); parkGfx.fillCircle(tx - 4, ty - 4, 16);
      parkGfx.fillStyle(0x8b5e3c, 1); parkGfx.fillRect(tx - 4, ty + 10, 8, 16);
    });

    const bldGfx = this.add.graphics().setDepth(3);
    this._buildingBodies = this.physics.add.staticGroup();

    ZONES.forEach(z => {
      this._drawBuilding(bldGfx, z);
      const body = this._buildingBodies.create(z.cx, z.cy, 'pixel');
      body.setDisplaySize(z.w - 10, z.h - 10).refreshBody().setAlpha(0);
    });

    const treeGfx = this.add.graphics().setDepth(3);
    const treePts = [
      [200,600],[450,600],[200,1000],[450,1000],
      [700,600],[700,1000],[700,1400],
      [1150,600],[1150,1000],[1150,1400],
      [1600,600],[1600,1000],[300,1400],[900,1400],[1400,1400],
    ];
    treePts.forEach(([tx, ty]) => {
      treeGfx.fillStyle(0x2d6a27); treeGfx.fillCircle(tx, ty, 18);
      treeGfx.fillStyle(0x3a8a32); treeGfx.fillCircle(tx - 3, ty - 3, 13);
      treeGfx.fillStyle(0x8b5e3c); treeGfx.fillRect(tx - 4, ty + 10, 8, 14);
    });

    ZONES.forEach(z => {
      this.add.text(z.cx, z.cy - z.h / 2 + 14, z.emoji, {
        fontSize: '22px',
      }).setOrigin(0.5).setDepth(5);
      this.add.text(z.cx, z.cy + 8, z.label, {
        fontSize: '13px', fontFamily: 'Arial Black, sans-serif',
        color: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
    });

    this._zoneRings = {};
    ZONES.forEach(z => {
      const ring = this.add.graphics().setDepth(2);
      ring.lineStyle(3, z.color, 0.7);
      ring.strokeCircle(z.cx, z.cy, INTERACT_RADIUS - 20);
      ring.setAlpha(0);
      this._zoneRings[z.id] = ring;
    });
  }

  _drawBuilding(gfx, z) {
    const { cx, cy, w, h, color, darkColor } = z;
    const x = cx - w / 2;
    const y = cy - h / 2;

    gfx.fillStyle(0x000000, 0.22); gfx.fillRect(x + 7, y + 7, w, h);
    gfx.fillStyle(color, 1);       gfx.fillRect(x, y, w, h);
    gfx.fillStyle(darkColor, 1);   gfx.fillRect(x, y, w, Math.round(h * 0.25));
    gfx.fillStyle(0x000000, 0.08); gfx.fillRect(x + w - 10, y + Math.round(h * 0.25), 10, h - Math.round(h * 0.25));

    gfx.fillStyle(0xadd8e6, 0.88);
    const wCols = Math.floor(w / 55);
    for (let c = 0; c < wCols; c++) {
      const wx = x + 22 + c * Math.floor((w - 44) / Math.max(1, wCols - 1));
      gfx.fillRect(wx, y + Math.round(h * 0.32), 28, 20);
      gfx.fillStyle(0xffffff, 0.25);
      gfx.fillRect(wx + 13, y + Math.round(h * 0.32), 2, 20);
      gfx.fillStyle(0xadd8e6, 0.88);
    }

    const dw = 32, dh = 38;
    gfx.fillStyle(0x2c3e50); gfx.fillRect(cx - dw / 2, cy + h / 2 - dh, dw, dh);
    gfx.fillStyle(0xf1c40f); gfx.fillRect(cx + dw / 2 - 9, cy + h / 2 - dh / 2, 4, 4);
    gfx.lineStyle(2, 0xffffff, 0.25);
    gfx.lineBetween(x, y, x + w, y);
  }

  // ────────────────────────────── player ───────────────────────────────────

  _spawnPlayer() {
    const x = playerSystem.get('x') || SPAWN_X;
    const y = playerSystem.get('y') || SPAWN_Y;

    this.player = this.physics.add.sprite(x, y, 'player_self').setDepth(8);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(26, 30).setOffset(7, 18);

    this.physics.add.collider(this.player, this._buildingBodies);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    this._nameTag = this.add.text(x, y - 34, playerSystem.get('name'), {
      fontSize: '12px', fontFamily: 'Arial, sans-serif',
      color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setDepth(9);

    this._playerShadow = this.add.ellipse(x, y + 18, 28, 10, 0x000000, 0.25).setDepth(7);
  }

  _spawnNPCs() {
    this._npcs = [];
    const npcDefs = [
      { name: 'Maya',    color: 0xe74c3c, path: [{ x: 200, y: 560 },  { x: 950, y: 560 }] },
      { name: 'Carlos',  color: 0x27ae60, path: [{ x: 560, y: 180 },  { x: 560, y: 950 }] },
      { name: 'Priya',   color: 0x8e44ad, path: [{ x: 1000, y: 560 }, { x: 1440, y: 560 }] },
      { name: 'Sam',     color: 0xf39c12, path: [{ x: 1000, y: 200 }, { x: 1000, y: 950 }] },
      { name: 'Yuki',    color: 0x1abc9c, path: [{ x: 200, y: 960 },  { x: 950, y: 960 }] },
      { name: 'Omar',    color: 0x3498db, path: [{ x: 560, y: 960 },  { x: 560, y: 1360 }] },
      { name: 'Nina',    color: 0xec407a, path: [{ x: 200, y: 1360 }, { x: 950, y: 1360 }] },
      { name: 'Leo',     color: 0xf1c40f, path: [{ x: 1440, y: 200 }, { x: 1440, y: 950 }] },
    ];

    npcDefs.forEach((cfg) => {
      const start = cfg.path[0];
      const gfx = this.add.graphics();
      gfx.fillStyle(cfg.color);    gfx.fillCircle(0, 4, 11);
      gfx.fillStyle(0xfae5c4);     gfx.fillCircle(0, -10, 9);
      gfx.fillStyle(0x2c3e50);     gfx.fillCircle(-3, -11, 2); gfx.fillCircle(3, -11, 2);
      gfx.fillStyle(cfg.color, 0.7); gfx.fillRect(-5, -2, 10, 5);

      const nameTag = this.add.text(0, -26, cfg.name, {
        fontSize: '9px', fontFamily: 'Arial', color: '#ecf0f1',
        backgroundColor: 'rgba(0,0,0,0.45)', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1);

      const npc = this.add.container(start.x, start.y, [gfx, nameTag]).setDepth(6);
      const [a, b] = cfg.path;
      const duration = Phaser.Math.Between(4500, 8000);
      const tween = this.tweens.add({
        targets: npc, x: b.x, y: b.y,
        duration, yoyo: true, repeat: -1, ease: 'Sine.InOut',
        delay: Phaser.Math.Between(0, 3000),
      });

      // Occasionally show speech bubble
      this.time.addEvent({
        delay: Phaser.Math.Between(12000, 25000),
        loop: true,
        callback: () => this._npcSpeech(npc),
      });

      this._npcs.push({ container: npc, tween, name: cfg.name });
    });
  }

  _npcSpeech(npc) {
    const lines = [
      'Busy day!', 'Need coffee ☕', 'Rent is due 😬',
      'Great weather!', 'Got a raise!', 'So tired...',
      'Hello! 👋', 'Keep going!', 'Pay day! 💰',
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    const bubble = this.add.text(npc.x, npc.y - 38, text, {
      fontSize: '10px', fontFamily: 'Arial', color: '#2c3e50',
      backgroundColor: '#ecf0f1', padding: { x: 5, y: 3 },
    }).setOrigin(0.5, 1).setDepth(10);
    this.tweens.add({
      targets: bubble, alpha: 0, y: bubble.y - 18,
      delay: 1800, duration: 500,
      onComplete: () => { if (bubble.active) bubble.destroy(); },
    });
  }

  _applyWeatherVisual(weather) {
    if (!weather || weather.alpha === 0) {
      this._weatherOverlay.setAlpha(0);
    } else {
      this._weatherOverlay.setFillStyle(weather.tint, weather.alpha);
      this._weatherOverlay.setAlpha(1);
    }

    if (this._rainEmitter) { this._rainEmitter.destroy(); this._rainEmitter = null; }

    if (weather?.id === 'rain' || weather?.id === 'storm') {
      const qty = weather.id === 'storm' ? 4 : 2;
      this._rainEmitter = this.add.particles(VW / 2, -15, 'pixel', {
        x: { min: -VW / 2 - 60, max: VW / 2 + 60 },
        y: { min: -5, max: 5 },
        speedX: { min: -55, max: 5 },
        speedY: { min: 290, max: 480 },
        scale: { start: 3, end: 0.5 },
        alpha: { start: 0.55, end: 0.05 },
        tint: [0x6aa9d8, 0x5b9ec9],
        lifespan: 750,
        frequency: weather.id === 'storm' ? 14 : 28,
        quantity: qty,
      }).setScrollFactor(0).setDepth(20);
    }
  }

  _buildVehicleTrail() {
    if (this._vehicleTrail) { this._vehicleTrail.destroy(); this._vehicleTrail = null; }
    const vehicle = vehicleSystem.getVehicle();
    if (!vehicle) return;
    this._vehicleTrail = this.add.particles(this.player.x, this.player.y, 'pixel', {
      speed: { min: 5, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 4, end: 0 },
      alpha: { start: 0.65, end: 0 },
      tint: vehicle.trailColor,
      lifespan: 380,
      frequency: 35,
      quantity: 1,
    }).setDepth(7);
  }

  // ─────────────────────────── camera & input ───────────────────────────────

  _setupCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.0);
  }

  _setupInput() {
    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd = this.input.keyboard.addKeys({
      up:       Phaser.Input.Keyboard.KeyCodes.W,
      down:     Phaser.Input.Keyboard.KeyCodes.S,
      left:     Phaser.Input.Keyboard.KeyCodes.A,
      right:    Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      esc:      Phaser.Input.Keyboard.KeyCodes.ESC,
    });
    this._chatKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this._giftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);

    initTouchControls({
      interact: () => { if (this._activeZone && !this._panelOpen && !this._chatActive) this._enterZone(this._activeZone); },
      chat:     () => this._openChatInput(),
      gift:     () => this._tryGift(),
      esc:      () => this._closePanel(),
    });
  }

  // ──────────────────────────── multiplayer ────────────────────────────────

  _setupNetworkHandlers() {
    this._net.on('currentPlayers', (players) => {
      players.forEach(p => {
        if (p.id !== this._net.getSocketId()) this._addRemotePlayer(p);
      });
    });
    this._net.on('playerJoined', p  => this._addRemotePlayer(p));
    this._net.on('playerMoved',  p  => this._moveRemotePlayer(p.id, p.x, p.y));
    this._net.on('playerLeft',   id => this._removeRemotePlayer(id));

    this._net.on('chatMessage', (data) => {
      this._showChatBubble(data.id, data.text);
    });

    this._net.on('giftReceived', (data) => {
      playerSystem.addMoney(data.amount);
      this.events.emit('statsUpdated');
      this.events.emit('showNotice', `🎁 ${data.fromName} gifted you $${data.amount}!`, 0x2ecc71);
    });

    this._net.on('giftSent', (_data) => {
      // Local notice already shown in _tryGift; just update HUD in case server was slow
      this.events.emit('statsUpdated');
    });

    this._net.on('cityEvent', (data) => {
      if (data.money)     playerSystem.addMoney(data.money);
      if (data.happiness) playerSystem.addHappiness(data.happiness);
      if (data.food)      playerSystem.addFoodStatus(data.food);
      if (data.energy)    playerSystem.addEnergy(data.energy);
      this.events.emit('statsUpdated');
      EventBus.emit('cityEvent', data);
      const pos = (data.money > 0) || (data.happiness > 0) || (data.food > 0) || (data.energy > 0);
      const neg = (data.money < 0) || (data.happiness < 0) || (data.food < 0) || (data.energy < 0);
      if (pos)      this.cameras.main.flash(300,   0, 160,  80, true);
      else if (neg) this.cameras.main.flash(300, 160,   0,   0, true);
    });

    this._net.on('playerCount', (count) => {
      this.events.emit('playerCount', count);
    });

    this._net.on('leaderboardUpdate', () => {
      EventBus.emit('leaderboardUpdate');
    });
  }

  _addRemotePlayer(data) {
    if (this._remotePlayers[data.id]) return;
    const sprite = this.physics.add.sprite(data.x, data.y, 'player_remote').setDepth(7);
    sprite.setTint(data.color || 0x95a5a6);
    const label = this.add.text(data.x, data.y - 30, data.name || '?', {
      fontSize: '11px', fontFamily: 'Arial', color: '#ecf0f1',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(9);
    this._remotePlayers[data.id] = { sprite, label, name: data.name || '?', bubble: null };
  }

  _moveRemotePlayer(id, x, y) {
    const rp = this._remotePlayers[id];
    if (!rp) return;
    this.tweens.add({ targets: rp.sprite, x, y, duration: 60 });
    rp.label.setPosition(x, y - 30);
    if (rp.bubble?.active) rp.bubble.setPosition(x, y - 54);
  }

  _removeRemotePlayer(id) {
    const rp = this._remotePlayers[id];
    if (!rp) return;
    rp.sprite.destroy();
    rp.label.destroy();
    if (rp.bubble?.active) rp.bubble.destroy();
    delete this._remotePlayers[id];
  }

  // ─────────────────────────── chat bubbles ────────────────────────────────

  _showChatBubble(id, text) {
    const isSelf = id === this._net.getSocketId();
    let targetX, targetY, existing;

    if (isSelf) {
      targetX = this.player.x;
      targetY = this.player.y - 54;
      existing = this._selfBubble;
    } else {
      const rp = this._remotePlayers[id];
      if (!rp) return;
      targetX = rp.sprite.x;
      targetY = rp.sprite.y - 54;
      existing = rp.bubble;
    }

    if (existing?.active) existing.destroy();

    const bubble = this.add.text(targetX, targetY, `💬 ${text}`, {
      fontSize: '13px', fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(26,37,47,0.93)',
      padding: { x: 8, y: 5 },
      wordWrap: { width: 200 },
    }).setOrigin(0.5, 1).setDepth(15);

    if (isSelf) {
      this._selfBubble = bubble;
    } else {
      this._remotePlayers[id].bubble = bubble;
    }

    this.time.delayedCall(3500, () => {
      if (!bubble.active) return;
      this.tweens.add({
        targets: bubble, alpha: 0, duration: 500,
        onComplete: () => { if (bubble.active) bubble.destroy(); },
      });
    });
  }

  // ─────────────────────────── chat input ──────────────────────────────────

  _openChatInput() {
    if (this._chatActive) return;
    this._chatActive = true;

    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed', 'bottom:62px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:9999', 'display:flex', 'gap:8px', 'align-items:center',
    ].join(';');

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 120;
    input.placeholder = 'Say something… (Enter to send, Esc to cancel)';
    input.style.cssText = [
      'width:360px', 'padding:8px 14px', 'font-size:15px', 'font-family:Arial',
      'border-radius:6px', 'border:2px solid #3498db',
      'background:#1a252f', 'color:#ecf0f1', 'outline:none',
    ].join(';');

    const btn = document.createElement('button');
    btn.textContent = 'Send';
    btn.style.cssText = [
      'padding:8px 16px', 'font-size:14px', 'font-family:Arial Black',
      'background:#3498db', 'color:#fff', 'border:none',
      'border-radius:6px', 'cursor:pointer',
    ].join(';');

    const close = (send) => {
      const text = input.value.trim();
      if (document.body.contains(wrap)) document.body.removeChild(wrap);
      this._chatActive = false;
      this._chatInputEl = null;
      if (send && text) this._net.sendChat(text);
    };

    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter')  close(true);
      if (e.key === 'Escape') close(false);
    });
    btn.addEventListener('click', () => close(true));

    wrap.appendChild(input);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
    input.focus();
    this._chatInputEl = wrap;
  }

  // ─────────────────────────── gifting ─────────────────────────────────────

  _tryGift() {
    let nearest = null;
    let nearestDist = Infinity;

    Object.entries(this._remotePlayers).forEach(([id, rp]) => {
      if (!rp.sprite?.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, rp.sprite.x, rp.sprite.y);
      if (dist < GIFT_RADIUS && dist < nearestDist) {
        nearest = { id, rp };
        nearestDist = dist;
      }
    });

    if (!nearest) {
      this.events.emit('showNotice', '👥 No player nearby to gift! (G key)', 0x7f8c8d);
      return;
    }

    if (playerSystem.get('money') < 15) {
      this.events.emit('showNotice', '💸 Need at least $15 to send a gift.', 0xe74c3c);
      return;
    }

    playerSystem.addMoney(-15);

    // Show immediate local confirmation — don't wait for server
    this.events.emit('showNotice', `🎁 Gifted $15 to ${nearest.rp.name}!`, 0xf39c12);
    this.events.emit('statsUpdated');

    this._net.sendGift(nearest.id, 15);

    const today = (playerSystem.get('giftsGivenToday') || 0) + 1;
    const total = (playerSystem.get('giftsGivenTotal') || 0) + 1;
    playerSystem.set('giftsGivenToday', today);
    playerSystem.set('giftsGivenTotal', total);
    achievementSystem.check();
  }

  // ─────────────────────────────── update ──────────────────────────────────

  update(time, delta) {
    this._updateGiftHighlight();

    if (this._panelOpen || this._chatActive) {
      this.player.body.setVelocity(0, 0);
      this._nameTag.setPosition(this.player.x, this.player.y - 38);
      this._playerShadow.setPosition(this.player.x, this.player.y + 18);
      return;
    }

    this._movePlayer();
    if (this._vehicleTrail) this._vehicleTrail.setPosition(this.player.x, this.player.y);
    this._checkZoneProximity();
    this._checkPlayerKeys();

    this._moveEmitAcc += delta;
    if (this._moveEmitAcc >= 50) {
      this._net.sendMove(this.player.x, this.player.y);
      this._moveEmitAcc = 0;
    }
  }

  _movePlayer() {
    const energy    = playerSystem.get('energy');
    const baseSpeed = energy <= 15 ? PLAYER_SPEED_LOW : PLAYER_SPEED;
    const speed     = Math.round(baseSpeed * vehicleSystem.getSpeedMult() * weatherSystem.getSpeedMult());

    const left  = this._cursors.left.isDown  || this._wasd.left.isDown  || touchState.left;
    const right = this._cursors.right.isDown || this._wasd.right.isDown || touchState.right;
    const up    = this._cursors.up.isDown    || this._wasd.up.isDown    || touchState.up;
    const down  = this._cursors.down.isDown  || this._wasd.down.isDown  || touchState.down;

    let vx = 0, vy = 0;
    if (left)  vx = -speed;
    if (right) vx =  speed;
    if (up)    vy = -speed;
    if (down)  vy =  speed;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.player.body.setVelocity(vx, vy);

    // Walking bob
    if (vx !== 0 || vy !== 0) {
      const bob = Math.sin(this.time.now * 0.013) * 0.04;
      this.player.setScale(1 + bob, 1 - bob * 0.6);
    } else {
      this.player.setScale(1, 1);
    }

    this._nameTag.setPosition(this.player.x, this.player.y - 38);
    this._playerShadow.setPosition(this.player.x, this.player.y + 18);

    if (this._selfBubble?.active) {
      this._selfBubble.setPosition(this.player.x, this.player.y - 54);
    }

    if (Math.random() < 0.008) {
      playerSystem.set('x', Math.round(this.player.x));
      playerSystem.set('y', Math.round(this.player.y));
    }
  }

  _checkPlayerKeys() {
    if (Phaser.Input.Keyboard.JustDown(this._chatKey)) this._openChatInput();
    if (Phaser.Input.Keyboard.JustDown(this._giftKey)) this._tryGift();
  }

  _checkZoneProximity() {
    let nearest = null;
    let nearestDist = Infinity;

    ZONES.forEach(z => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, z.cx, z.cy);
      if (dist < INTERACT_RADIUS && dist < nearestDist) {
        nearest = z; nearestDist = dist;
      }
    });

    if (nearest !== this._activeZone) {
      if (this._activeZone) {
        this.tweens.add({ targets: this._zoneRings[this._activeZone.id], alpha: 0, duration: 200 });
      }
      this._activeZone = nearest;

      if (nearest) {
        this.tweens.add({ targets: this._zoneRings[nearest.id], alpha: 1, duration: 200 });
        this.events.emit('nearZone', nearest);
      } else {
        this.events.emit('leaveZone');
      }
    }

    if (nearest && Phaser.Input.Keyboard.JustDown(this._wasd.interact)) {
      this._enterZone(nearest);
    }
    if (Phaser.Input.Keyboard.JustDown(this._wasd.esc)) {
      this._closePanel();
    }
  }

  // ─────────────────────────── zone interaction ─────────────────────────────

  _enterZone(zone) {
    if (zone.type === 'job') {
      const energy = playerSystem.get('energy');
      if (energy < 10) {
        this.events.emit('showNotice', '😴 Too tired! Go home to rest first.', 0xe74c3c);
        return;
      }
      this._launchMiniGame(zone);
    } else {
      this._openPanel(zone);
    }
  }

  _launchMiniGame(zone) {
    this.scene.pause();
    this.scene.launch('MiniGameScene', {
      jobId:       zone.jobId,
      jobName:     zone.label,
      color:       zone.color,
      emoji:       zone.emoji,
      description: zone.description,
    });
  }

  onMiniGameComplete() {
    this.scene.resume();
    this._net.sendStats(
      playerSystem.get('totalEarned') || 0,
      playerSystem.get('level')       || 1,
      playerSystem.get('prestige')    || 0,
    );
    this._burstParticles(this.player.x, this.player.y);
    this.events.emit('statsUpdated');
  }

  _burstParticles(x, y) {
    const emitter = this.add.particles(x, y, 'pixel', {
      speed: { min: 80, max: 220 },
      angle: { min: 245, max: 295 },
      scale: { start: 5, end: 1 },
      alpha: { start: 1, end: 0 },
      tint: [0xf1c40f, 0xf39c12, 0xffd700],
      lifespan: 700,
      gravityY: 380,
      emitting: false,
    }).setDepth(20);
    emitter.explode(20);
    this.time.delayedCall(900, () => { if (emitter?.active) emitter.destroy(); });
  }

  _updateGiftHighlight() {
    let nearest = null, nearestDist = Infinity;
    Object.values(this._remotePlayers).forEach(rp => {
      if (!rp.sprite?.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, rp.sprite.x, rp.sprite.y,
      );
      if (dist < GIFT_RADIUS && dist < nearestDist) {
        nearest = rp; nearestDist = dist;
      }
    });
    if (nearest) {
      this._giftHighlight.setPosition(nearest.sprite.x, nearest.sprite.y).setVisible(true);
    } else {
      this._giftHighlight.setVisible(false);
    }
  }

  // ─────────────────────────────── panels ──────────────────────────────────

  _openPanel(zone) {
    this._closePanel();
    this._panelOpen = true;
    this.events.emit('leaveZone');

    const px = VW / 2;
    const py = VH / 2;
    const panelW = zone.type === 'mall' ? 500 : PANEL_W;
    const panelH = zone.type === 'mall' ? 520 : PANEL_H;

    const overlay = this.add.rectangle(px, py, VW, VH, 0x000000, 0.45)
      .setScrollFactor(0).setDepth(50).setInteractive();
    overlay.on('pointerdown', () => this._closePanel());

    const bg = this.add.rectangle(px, py, panelW, panelH, 0x1a252f, 0.97)
      .setScrollFactor(0).setDepth(51).setStrokeStyle(2, zone.color);

    const title = this.add.text(px, py - panelH / 2 + 28, `${zone.emoji} ${zone.label}`, {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ecf0f1',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

    const closeBtn = this.add.text(px + panelW / 2 - 16, py - panelH / 2 + 16, '✕', {
      fontSize: '16px', fontFamily: 'Arial', color: '#e74c3c',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this._closePanel());

    const hint = this.add.text(px, py + panelH / 2 - 16, 'Press E or ESC to close', {
      fontSize: '12px', fontFamily: 'Arial', color: '#5d6d7e',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

    const elements = [overlay, bg, title, closeBtn, hint];
    elements.push(...this._buildPanelButtons(zone, px, py, panelW, panelH));
    this._panel = elements;
  }

  _buildPanelButtons(zone, px, py, panelW = PANEL_W, panelH = PANEL_H) {
    const els = [];
    const addBtn = (label, yOffset, color, action, disabled = false) => {
      const btn = this.add.text(px, py + yOffset, label, {
        fontSize: '17px', fontFamily: 'Arial', color: disabled ? '#7f8c8d' : color,
        backgroundColor: 'rgba(44,62,80,0.8)',
        padding: { x: 18, y: 10 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setAlpha(disabled ? 0.4 : 1);

      if (!disabled) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: 'rgba(52,73,94,0.95)' }));
        btn.on('pointerout',  () => btn.setStyle({ backgroundColor: 'rgba(44,62,80,0.8)' }));
        btn.on('pointerdown', () => {
          action();
          this._closePanel();
          this.events.emit('statsUpdated');
        });
      }
      els.push(btn);
    };

    // Compact button for dense panels (leisure / mall)
    const addSmallBtn = (label, yOffset, color, action, disabled = false) => {
      const btn = this.add.text(px, py + yOffset, label, {
        fontSize: '13px', fontFamily: 'Arial', color: disabled ? '#7f8c8d' : color,
        backgroundColor: 'rgba(44,62,80,0.8)',
        padding: { x: 14, y: 7 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setAlpha(disabled ? 0.4 : 1);

      if (!disabled) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: 'rgba(52,73,94,0.95)' }));
        btn.on('pointerout',  () => btn.setStyle({ backgroundColor: 'rgba(44,62,80,0.8)' }));
        btn.on('pointerdown', () => {
          action();
          this._closePanel();
          this.events.emit('statsUpdated');
        });
      }
      els.push(btn);
    };

    const addSectionHeader = (text, yOffset, color = '#bdc3c7') => {
      const el = this.add.text(px, py + yOffset, text, {
        fontSize: '13px', fontFamily: 'Arial Black', color,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      els.push(el);
    };

    const addDivider = (yOffset) => {
      const el = this.add.rectangle(px, py + yOffset, panelW - 60, 1, 0x2c3e50)
        .setScrollFactor(0).setDepth(52);
      els.push(el);
    };

    const stats = () => ({
      money:    playerSystem.get('money'),
      energy:   playerSystem.get('energy'),
      savings:  playerSystem.get('savings'),
      food:     playerSystem.get('foodStatus'),
      happy:    playerSystem.get('familyHappiness'),
      stability:playerSystem.get('householdStability'),
    });

    if (zone.type === 'home') {
      const s = stats();
      const level   = playerSystem.get('level') || 1;
      const prestige = playerSystem.get('prestige') || 0;

      const applCount = applianceSystem.getOwned().length;
      const decorCount = decorationSystem.getOwned().length;
      const decorHappy = decorationSystem.getTotalHappinessPerDay();
      const info = this.add.text(px, py - 95,
        `⚡ Energy: ${s.energy}/100    🍞 Food: ${s.food}/100\n🏠 Stability: ${s.stability}/100    😊 Happy: ${s.happy}/100\n📺 Appliances: ${applCount}/4    🎨 Decor: ${decorCount}/5 (+${decorHappy}😊/day)`,
        { fontSize: '13px', fontFamily: 'Arial', color: '#bdc3c7', align: 'center' },
      ).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      els.push(info);

      addBtn('⚡ Rest — Restore 50 energy (Free)',     -30, '#2ecc71', () => { playerSystem.addEnergy(50); });
      addBtn('🛌 Full Rest — Restore all (+$10 cost)',  25, '#f39c12',
        () => { if (moneySystem.spend(10, 'Full rest')) { playerSystem.addEnergy(100); } }, s.money < 10);
      addBtn('💸 Pay rent — $80',                       80, '#e74c3c',
        () => {
          if (!moneySystem.spend(80, 'Monthly rent')) {
            playerSystem.addStability(-15); playerSystem.addHappiness(-10);
          } else {
            playerSystem.addStability(10); playerSystem.addHappiness(5);
          }
        }, s.money < 80);

      // Reset / new game
      const resetBtn = this.add.text(px, py + 135, '🔄 New Game — reset all progress', {
        fontSize: '13px', fontFamily: 'Arial', color: '#5d6d7e',
        backgroundColor: 'rgba(44,62,80,0.5)', padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setInteractive({ useHandCursor: true });
      resetBtn.on('pointerover', () => resetBtn.setStyle({ color: '#e74c3c' }));
      resetBtn.on('pointerout',  () => resetBtn.setStyle({ color: '#5d6d7e' }));
      resetBtn.on('pointerdown', () => {
        if (window.confirm('Reset ALL progress and start a new game?\nThis cannot be undone.')) {
          playerSystem.reset();
          window.location.reload();
        }
      });
      els.push(resetBtn);

      // Prestige — unlocks at level 20
      if (level >= 20) {
        const stars = '⭐'.repeat(Math.min(prestige, 5)) || '';
        const prestigeBtn = this.add.text(px, py + 178,
          `✨ PRESTIGE ${stars} — Reset & keep +15% earnings forever`, {
          fontSize: '13px', fontFamily: 'Arial Black', color: '#f1c40f',
          backgroundColor: 'rgba(44,62,80,0.7)', padding: { x: 12, y: 7 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setInteractive({ useHandCursor: true });
        prestigeBtn.on('pointerover', () => prestigeBtn.setStyle({ backgroundColor: 'rgba(241,196,15,0.18)' }));
        prestigeBtn.on('pointerout',  () => prestigeBtn.setStyle({ backgroundColor: 'rgba(44,62,80,0.7)' }));
        prestigeBtn.on('pointerdown', () => {
          if (window.confirm(
            `Start Prestige ${prestige + 1}?\n\nYou earn +15% permanently per prestige level.\nVehicle, achievements & name are kept.\nAll other progress resets.`,
          )) {
            const kept = {
              prestige: prestige + 1,
              vehicle:      playerSystem.get('vehicle'),
              achievements: playerSystem.get('achievements'),
              name:         playerSystem.get('name'),
              color:        playerSystem.get('color'),
            };
            playerSystem.reset();
            Object.entries(kept).forEach(([k, v]) => playerSystem.set(k, v));
            window.location.reload();
          }
        });
        els.push(prestigeBtn);
      }

    } else if (zone.type === 'market') {
      const s = stats();
      const info = this.add.text(px, py - 75, `🍞 Food Status: ${s.food}/100    💰 Cash: $${s.money}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#bdc3c7',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      els.push(info);

      addBtn('🥗 Small groceries  +25 food  ($15)',   0, '#2ecc71',
        () => { if (moneySystem.spend(15, 'Groceries'))    { playerSystem.addFoodStatus(25); } }, stats().money < 15);
      addBtn('🛒 Weekly shop     +55 food  ($35)',    55, '#3498db',
        () => { if (moneySystem.spend(35, 'Weekly shop'))  { playerSystem.addFoodStatus(55); playerSystem.addHappiness(8); } }, stats().money < 35);
      addBtn('🍕 Family feast    +80 food  ($60)',   110, '#f39c12',
        () => { if (moneySystem.spend(60, 'Family feast')) { playerSystem.addFoodStatus(80); playerSystem.addHappiness(15); } }, stats().money < 60);

    } else if (zone.type === 'bank') {
      const s = stats();
      const info = this.add.text(px, py - 75,
        `💰 Cash: $${s.money}   💾 Savings: $${s.savings}`,
        { fontSize: '15px', fontFamily: 'Arial', color: '#bdc3c7' },
      ).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      els.push(info);

      addBtn('📥 Deposit $20 to savings',    0,  '#1abc9c', () => {
        playerSystem.addSavings(20);
        playerSystem.set('savedToday', (playerSystem.get('savedToday') || 0) + 20);
        achievementSystem.check();
      }, s.money < 20);
      addBtn('📥 Deposit $50 to savings',   55,  '#1abc9c', () => {
        playerSystem.addSavings(50);
        playerSystem.set('savedToday', (playerSystem.get('savedToday') || 0) + 50);
        achievementSystem.check();
      }, s.money < 50);
      addBtn('📤 Withdraw $20 from savings',110,  '#e67e22', () => playerSystem.addSavings(-20), s.savings < 20);

    } else if (zone.type === 'training') {
      const s = stats();
      let offset = -80;
      Object.values(TRAINING).forEach((t, i) => {
        const lvl = playerSystem.getSkillLevel(t.skill);
        addBtn(`${t.label}  (Lv ${lvl}) — $${t.cost}`, offset + i * 55, '#8e44ad',
          () => {
            if (moneySystem.spend(t.cost, `Training: ${t.label}`)) {
              playerSystem.addSkillXP(t.skill, 1);
              this.events.emit('showNotice', `✅ ${t.label} improved!`, 0x8e44ad);
            }
          }, s.money < t.cost);
      });

    } else if (zone.type === 'housing') {
      const level = playerSystem.get('level') || 1;
      const upgrades = playerSystem.get('houseUpgrades') || {};

      if (level < 8) {
        const lockMsg = this.add.text(px, py - 20,
          `🔒 Housing upgrades unlock at Level 8\n(You are Level ${level})`, {
            fontSize: '15px', fontFamily: 'Arial', color: '#7f8c8d', align: 'center',
          }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
        els.push(lockMsg);
      } else {
        const s = stats();

        const mattressCost = 200;
        const gardenCost   = 350;
        const rentCtrlCost = 500;

        const mattressLabel = upgrades.mattress
          ? '✅ Comfy Mattress — Owned'
          : `🛏 Comfy Mattress  ($${mattressCost}) — Full rest = 100 energy`;
        const gardenLabel   = upgrades.garden
          ? '✅ Home Garden — Owned'
          : `🌱 Home Garden  ($${gardenCost}) — Food cost $10/day`;
        const rentCtrlLabel = upgrades.rentControl
          ? '✅ Rent Control — Owned'
          : `🔑 Rent Control  ($${rentCtrlCost}) — Rent locked at $60/day`;

        addBtn(mattressLabel, -70, '#9b59b6',
          () => {
            if (!upgrades.mattress && moneySystem.spend(mattressCost, 'Mattress upgrade')) {
              const u = { ...playerSystem.get('houseUpgrades'), mattress: true };
              playerSystem.set('houseUpgrades', u);
              achievementSystem.check();
              this.events.emit('showNotice', '🛏 Comfy Mattress installed!', 0x9b59b6);
            }
          }, upgrades.mattress || s.money < mattressCost);

        addBtn(gardenLabel, 0, '#27ae60',
          () => {
            if (!upgrades.garden && moneySystem.spend(gardenCost, 'Garden upgrade')) {
              const u = { ...playerSystem.get('houseUpgrades'), garden: true };
              playerSystem.set('houseUpgrades', u);
              achievementSystem.check();
              this.events.emit('showNotice', '🌱 Home Garden planted!', 0x27ae60);
            }
          }, upgrades.garden || s.money < gardenCost);

        addBtn(rentCtrlLabel, 70, '#e74c3c',
          () => {
            if (!upgrades.rentControl && moneySystem.spend(rentCtrlCost, 'Rent control')) {
              const u = { ...playerSystem.get('houseUpgrades'), rentControl: true };
              playerSystem.set('houseUpgrades', u);
              achievementSystem.check();
              this.events.emit('showNotice', '🔑 Rent locked at $60/day!', 0xe74c3c);
            }
          }, upgrades.rentControl || s.money < rentCtrlCost);
      }

    } else if (zone.type === 'vehicles') {
      const level = playerSystem.get('level') || 1;
      const money = playerSystem.get('money') || 0;
      const current = vehicleSystem.getVehicle();

      const statusLine = current
        ? `${current.emoji} Riding: ${current.label}  (×${current.speedMult} speed)`
        : '🚶 No vehicle — on foot';
      const infoEl = this.add.text(px, py - 95, statusLine, {
        fontSize: '13px', fontFamily: 'Arial', color: '#bdc3c7', align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      els.push(infoEl);

      Object.values(VEHICLES).forEach((v, i) => {
        const owned   = playerSystem.get('vehicle') === v.id;
        const locked  = level < v.requiredLevel;
        const broke   = money < v.cost;
        const lockTxt = locked ? `  🔒 Lv${v.requiredLevel}` : '';
        const label   = owned
          ? `✅ ${v.emoji} ${v.label} — Owned (${v.desc})`
          : `${v.emoji} ${v.label}  $${v.cost}${lockTxt}  ${v.desc}`;
        addBtn(label, -45 + i * 58, '#e67e22', () => {
          if (vehicleSystem.buy(v.id)) {
            this._buildVehicleTrail();
            this.events.emit('showNotice', `${v.emoji} ${v.label} purchased!`, 0xe67e22);
          }
        }, owned || locked || broke);
      });

      if (current) {
        const refund = Math.floor(current.cost * 0.4);
        addBtn(`💸 Sell ${current.label} — Get $${refund} back`, 142, '#e74c3c', () => {
          vehicleSystem.sell();
          this._buildVehicleTrail();
          this.events.emit('showNotice', `Sold for $${refund}`, 0x95a5a6);
        });
      }

    } else if (zone.type === 'business') {
      const level       = playerSystem.get('level') || 1;
      const money       = playerSystem.get('money') || 0;
      const dailyIncome = businessSystem.getDailyIncome();

      const infoEl = this.add.text(px, py - 95,
        `💼 Passive income: $${dailyIncome}/day`, {
        fontSize: '15px', fontFamily: 'Arial Black', color: '#1abc9c',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      els.push(infoEl);

      Object.values(BUSINESSES).forEach((b, i) => {
        const owned  = (playerSystem.get('ownedBusinesses') || []).includes(b.id);
        const locked = level < b.requiredLevel;
        const broke  = money < b.cost;
        const lockTxt = locked ? `  🔒 Lv${b.requiredLevel}` : '';
        const label  = owned
          ? `✅ ${b.emoji} ${b.label} — Owned ($${b.incomePerDay}/day)`
          : `${b.emoji} ${b.label}  $${b.cost}${lockTxt}  $${b.incomePerDay}/day`;
        addBtn(label, -45 + i * 60, '#16a085', () => {
          if (businessSystem.buy(b.id)) {
            this.events.emit('showNotice', `${b.emoji} ${b.label} bought! +$${b.incomePerDay}/day`, 0x16a085);
          }
        }, owned || locked || broke);
      });

    } else if (zone.type === 'leisure') {
      const money = playerSystem.get('money');
      const happy = playerSystem.get('familyHappiness');
      const info = this.add.text(px, py - 155,
        `😊 Happiness: ${happy}/100    💰 Cash: $${money}`, {
        fontSize: '13px', fontFamily: 'Arial', color: '#bdc3c7',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      els.push(info);

      LEISURE_ACTIVITIES.forEach((act, i) => {
        const broke = money < act.cost;
        const energyStr = act.energy > 0 ? `  +${act.energy}⚡` : act.energy < 0 ? `  ${act.energy}⚡` : '';
        const foodStr   = act.food   > 0 ? `  +${act.food}🍞` : '';
        const xpStr     = act.xpBonus ? '  +XP' : '';
        const label     = `${act.emoji} ${act.label}  ($${act.cost})  +${act.happiness}😊${energyStr}${foodStr}${xpStr}`;
        addSmallBtn(label, -115 + i * 36, '#e91e63', () => {
          const result = leisureSystem.doActivity(act.id);
          if (result.ok) {
            this.events.emit('showNotice', `${act.emoji} ${act.label} — Enjoyed!`, 0xe91e63);
          }
        }, broke);
      });

    } else if (zone.type === 'mall') {
      const money = playerSystem.get('money');
      const ownedAppl  = applianceSystem.getOwned().length;
      const ownedDecor = decorationSystem.getOwned().length;
      const info = this.add.text(px, py - panelH / 2 + 52,
        `💰 Cash: $${money}    🏠 ${ownedAppl}/4 appliances    🎨 ${ownedDecor}/5 decorations`, {
        fontSize: '13px', fontFamily: 'Arial', color: '#bdc3c7',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
      els.push(info);

      // ── Appliances ─────────────────────────────────────────────────────
      addSectionHeader('📺  Appliances  (passive daily bonuses)', -195, '#ff9800');

      APPLIANCES.forEach((a, i) => {
        const owned = applianceSystem.owns(a.id);
        const broke = !owned && money < a.cost;
        const label = owned
          ? `✅ ${a.emoji} ${a.label} — ${a.desc}`
          : `${a.emoji} ${a.label}  $${a.cost}  —  ${a.desc}`;
        addSmallBtn(label, -168 + i * 38, owned ? '#2ecc71' : '#ff9800', () => {
          if (!owned && applianceSystem.buy(a.id)) {
            this.events.emit('showNotice', `${a.emoji} ${a.label} installed!`, 0xff9800);
          }
        }, owned || broke);
      });

      addDivider(-15);

      // ── Decorations ────────────────────────────────────────────────────
      addSectionHeader('🎨  Home Decorations  (+happiness daily)', 5, '#ff9800');

      DECORATIONS.forEach((d, i) => {
        const owned = decorationSystem.owns(d.id);
        const broke = !owned && money < d.cost;
        const label = owned
          ? `✅ ${d.emoji} ${d.label} — ${d.desc}`
          : `${d.emoji} ${d.label}  $${d.cost}  —  ${d.desc}`;
        addSmallBtn(label, 32 + i * 38, owned ? '#2ecc71' : '#e91e63', () => {
          if (!owned && decorationSystem.buy(d.id)) {
            this.events.emit('showNotice', `${d.emoji} ${d.label} added to your home!`, 0xe91e63);
          }
        }, owned || broke);
      });
    }

    return els;
  }

  _closePanel() {
    if (this._panel) {
      this._panel.forEach(el => el.destroy());
      this._panel = null;
    }
    this._panelOpen = false;
    if (this._activeZone) this.events.emit('nearZone', this._activeZone);
  }
}
