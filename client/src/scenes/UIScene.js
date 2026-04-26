import Phaser from 'phaser';
import { playerSystem, levelSystem, dailyGoals, vehicleSystem, weatherSystem } from '../systems/store.js';
import { EventBus } from '../systems/EventBus.js';
import { ZONES, WORLD_W, WORLD_H } from '../config/GameConfig.js';
import { SoundSystem } from '../systems/SoundSystem.js';

const W = 1280;
const H = 720;
const BAR_W = 110;
const BAR_H = 12;

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    this._buildHUD();
    this._buildPrompt();
    this._buildNotice();
    this._buildDayEndModal();
    this._cityEventModal = [];

    // CityScene events
    this.scene.get('CityScene').events.on('nearZone',    this._onNearZone,    this);
    this.scene.get('CityScene').events.on('leaveZone',   this._onLeaveZone,   this);
    this.scene.get('CityScene').events.on('statsUpdated',this._refreshHUD,    this);
    this.scene.get('CityScene').events.on('showNotice',  this._triggerNotice, this);
    this.scene.get('CityScene').events.on('playerCount', this._onPlayerCount, this);

    // Global events
    EventBus.on('dayEnd',          (d) => this._showDayEnd(d));
    EventBus.on('levelUp',         (d) => { SoundSystem.levelUp(); this._triggerNotice(`⭐ ${d.skill} leveled up to Lv ${d.level}!`, 0xf1c40f); });
    EventBus.on('playerLevelUp',   (d) => this._showLevelUpNotice(d));
    EventBus.on('achievement',     (d) => this._showAchievementNotice(d));
    EventBus.on('goalsCompleted',  (d) => this._showGoalsCompleted(d));
    EventBus.on('cityEvent',       (d) => this._showCityEventBanner(d));
    EventBus.on('gameOver',        (d) => this._showGameOver(d));
    EventBus.on('leaderboardUpdate', () => { if (this._lbPanel) this._fetchAndDrawLeaderboard(); });

    this.time.addEvent({ delay: 600, callback: this._refreshHUD, callbackScope: this, loop: true });
    this._buildMinimap();
  }

  // ─────────────────────────────── HUD ─────────────────────────────────────

  _buildHUD() {
    this.add.rectangle(W / 2, 30, W, 52, 0x0a0a14, 0.82).setScrollFactor(0).setDepth(20);

    // ── Money ────
    this.add.text(16, 14, '💰', { fontSize: '20px' }).setScrollFactor(0).setDepth(21);
    this._moneyText = this.add.text(44, 15, '$0', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#f1c40f',
    }).setScrollFactor(0).setDepth(21);

    // ── Savings ────
    this.add.text(140, 14, '💾', { fontSize: '20px' }).setScrollFactor(0).setDepth(21);
    this._savingsText = this.add.text(168, 15, '$0', {
      fontSize: '16px', fontFamily: 'Arial', color: '#1abc9c',
    }).setScrollFactor(0).setDepth(21);

    // ── Day + Level ────
    this._dayText = this.add.text(W - 90, 5, 'Day 1', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#95a5a6',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(21);
    this._levelText = this.add.text(W - 90, 21, 'Lv 1', {
      fontSize: '11px', fontFamily: 'Arial', color: '#9b59b6',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(21);

    // ── Online count ────
    this._onlineText = this.add.text(W - 12, 8, '🌐 1', {
      fontSize: '13px', fontFamily: 'Arial', color: '#5dade2',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(21);

    // ── Stat bars ─────────────────────────────────────────────────────────────
    const barConfigs = [
      { label: '⚡', key: '_energyBar',    color: 0x2ecc71, stat: 'energy',            x: 310 },
      { label: '🍞', key: '_foodBar',      color: 0xe67e22, stat: 'foodStatus',         x: 470 },
      { label: '🏠', key: '_stabilityBar', color: 0x3498db, stat: 'householdStability', x: 630 },
      { label: '😊', key: '_happyBar',     color: 0xec407a, stat: 'familyHappiness',    x: 790 },
    ];

    barConfigs.forEach(cfg => {
      this.add.text(cfg.x, 14, cfg.label, { fontSize: '17px' }).setScrollFactor(0).setDepth(21);
      this.add.rectangle(cfg.x + 26 + BAR_W / 2, 24, BAR_W, BAR_H, 0x2c3e50)
        .setScrollFactor(0).setDepth(21);
      const fill = this.add.rectangle(cfg.x + 26, 24, BAR_W, BAR_H, cfg.color)
        .setScrollFactor(0).setDepth(22).setOrigin(0, 0.5);
      this[cfg.key] = { fill, color: cfg.color, stat: cfg.stat, baseX: cfg.x + 26 };
      const pct = this.add.text(cfg.x + 26 + BAR_W + 4, 24, '100%', {
        fontSize: '11px', fontFamily: 'Arial', color: '#95a5a6',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(22);
      this[cfg.key].pctText = pct;
    });

    // ── Job progress dots — 4 circles tracking current day cycle ────────────
    this.add.text(1010, 11, 'TODAY', {
      fontSize: '8px', fontFamily: 'Arial', color: '#4a4a6a',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(21);
    this._jobDots = [];
    for (let i = 0; i < 4; i++) {
      const dot = this.add.circle(988 + i * 16, 30, 5, 0x2c3e50)
        .setScrollFactor(0).setDepth(21).setStrokeStyle(1.5, 0x4a4a6a);
      this._jobDots.push(dot);
    }

    // ── XP bar (thin strip at bottom of HUD) ─────────────────────────────────
    this.add.rectangle(W / 2, 58, W, 5, 0x1a1a2e).setScrollFactor(0).setDepth(20);
    this._xpFill = this.add.rectangle(0, 58, 0, 5, 0x9b59b6)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5);

    // ── Weather badge ──────────────────────────────────────────────────────
    this._weatherBadge = this.add.text(310, 36, '', {
      fontSize: '12px', fontFamily: 'Arial', color: '#ecf0f1',
      backgroundColor: 'rgba(0,0,0,0.45)', padding: { x: 5, y: 2 },
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(21);

    // ── Vehicle badge ──────────────────────────────────────────────────────
    this._vehicleBadge = this.add.text(395, 36, '', {
      fontSize: '12px', fontFamily: 'Arial', color: '#e67e22',
      backgroundColor: 'rgba(0,0,0,0.45)', padding: { x: 5, y: 2 },
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(21);

    // ── Prestige stars ─────────────────────────────────────────────────────
    this._prestigeText = this.add.text(W - 90, 38, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#f1c40f',
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(21);

    EventBus.on('weatherChanged', () => this._refreshHUD());
    EventBus.on('vehicleChanged', () => this._refreshHUD());

    // ── Copyright credit (always visible, bottom-left) ──────────────────────
    this.add.text(8, H - 8, '© 2026 Hemang Patel  ·  Cursor Vibe Jam 2026', {
      fontSize: '10px', fontFamily: 'Arial', color: '#2a2a3d',
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(20);

    // ── Tutorial button ────────────────────────────────────────────────────
    const tutBtn = this.add.text(260, 45, '❓ How to Play', {
      fontSize: '11px', fontFamily: 'Arial', color: '#7f8c8d',
      backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 6, y: 3 },
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(21).setInteractive({ useHandCursor: true });
    tutBtn.on('pointerover', () => tutBtn.setStyle({ color: '#5dade2' }));
    tutBtn.on('pointerout',  () => tutBtn.setStyle({ color: '#7f8c8d' }));
    tutBtn.on('pointerdown', () => this._showTutorialPanel());

    // ── Credits button ─────────────────────────────────────────────────────
    const credBtn = this.add.text(388, 45, '👤 Credits', {
      fontSize: '11px', fontFamily: 'Arial', color: '#7f8c8d',
      backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 6, y: 3 },
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(21).setInteractive({ useHandCursor: true });
    credBtn.on('pointerover', () => credBtn.setStyle({ color: '#f1c40f' }));
    credBtn.on('pointerout',  () => credBtn.setStyle({ color: '#7f8c8d' }));
    credBtn.on('pointerdown', () => this._showCredits());

    // ── Skills panel (bottom-right, toggleable) ─────────────────────────────
    this._skillsVisible = false;
    this._skillBtn = this.add.text(W - 12, 45, '📊 Skills', {
      fontSize: '12px', fontFamily: 'Arial', color: '#7f8c8d',
      backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 6, y: 3 },
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(21).setInteractive({ useHandCursor: true });
    this._skillBtn.on('pointerdown', () => this._toggleSkills());

    // ── Goals button ────────────────────────────────────────────────────────
    this._goalsPanel = null;
    this._goalsBtn = this.add.text(W - 160, 45, '📋 Goals', {
      fontSize: '12px', fontFamily: 'Arial', color: '#7f8c8d',
      backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 6, y: 3 },
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(21).setInteractive({ useHandCursor: true });
    this._goalsBtn.on('pointerdown', () => this._toggleGoals());

    // ── Leaderboard button ──────────────────────────────────────────────────
    this._lbPanel = null;
    this._lbRefreshTimer = null;
    this._lbBtn = this.add.text(W - 86, 45, '🏆 Top', {
      fontSize: '12px', fontFamily: 'Arial', color: '#7f8c8d',
      backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 6, y: 3 },
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(21).setInteractive({ useHandCursor: true });
    this._lbBtn.on('pointerdown', () => this._toggleLeaderboard());

    this._skillsPanel = this._buildSkillsPanel();
    this._skillsPanel.forEach(el => el.setVisible(false));

    this._refreshHUD();
  }

  _buildSkillsPanel() {
    const els = [];
    const px = W - 10, py = 60;
    const bg = this.add.rectangle(px - 105, py + 90, 200, 195, 0x0a0a14, 0.9)
      .setScrollFactor(0).setDepth(30).setOrigin(0, 0);
    els.push(bg);
    const title = this.add.text(px - 5, py + 8, 'Skills', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ecf0f1',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(31);
    els.push(title);

    const skills = ['cooking', 'speed', 'organization', 'accuracy', 'planning', 'finance'];
    const icons  = { cooking: '🍳', speed: '🏃', organization: '📋', accuracy: '🎯', planning: '📐', finance: '💹' };

    this._skillTexts = {};
    skills.forEach((s, i) => {
      const y = py + 32 + i * 26;
      const nameEl = this.add.text(px - 105, y, icons[s] + ' ' + s, {
        fontSize: '12px', fontFamily: 'Arial', color: '#bdc3c7',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);
      const lv = this.add.text(px - 5, y, 'Lv 1', {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#f1c40f',
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(31);
      this._skillTexts[s] = lv;
      els.push(nameEl, lv);
    });
    return els;
  }

  _toggleSkills() {
    if (this._lbPanel) {
      this._lbPanel.forEach(el => el?.destroy()); this._lbPanel = null;
      if (this._lbRefreshTimer) { clearInterval(this._lbRefreshTimer); this._lbRefreshTimer = null; }
    }
    this._skillsVisible = !this._skillsVisible;
    this._skillsPanel.forEach(el => el.setVisible(this._skillsVisible));
    if (this._skillsVisible) this._refreshSkills();
  }

  _refreshSkills() {
    Object.entries(this._skillTexts).forEach(([s, el]) => {
      el.setText(`Lv ${Math.floor(playerSystem.getSkillLevel(s))}`);
    });
  }

  _toggleLeaderboard() {
    if (this._lbPanel) {
      this._lbPanel.forEach(el => el?.destroy());
      this._lbPanel = null;
      if (this._lbRefreshTimer) { clearInterval(this._lbRefreshTimer); this._lbRefreshTimer = null; }
      return;
    }
    if (this._skillsVisible) {
      this._skillsVisible = false;
      this._skillsPanel.forEach(el => el.setVisible(false));
    }
    if (this._goalsPanel) { this._goalsPanel.forEach(el => el?.destroy()); this._goalsPanel = null; }

    this._fetchAndDrawLeaderboard();

    // Auto-refresh every 20 s while panel is open
    this._lbRefreshTimer = setInterval(() => {
      if (!this._lbPanel) { clearInterval(this._lbRefreshTimer); this._lbRefreshTimer = null; return; }
      this._fetchAndDrawLeaderboard();
    }, 20000);
  }

  _fetchAndDrawLeaderboard() {
    // Destroy only the data rows (not bg / title), or rebuild everything
    if (this._lbPanel) {
      this._lbPanel.forEach(el => el?.destroy());
      this._lbPanel = null;
    }

    this._lbPanel = [];
    const px = W - 10, py = 60;
    const panelW = 250, panelH = 270;

    const bg = this.add.rectangle(px - panelW / 2, py + panelH / 2, panelW, panelH, 0x0a0a14, 0.95)
      .setScrollFactor(0).setDepth(30).setStrokeStyle(1, 0xf1c40f, 0.5);
    const title = this.add.text(px - panelW / 2 + panelW / 2, py + 12, '🏆 Top Earners', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#f1c40f',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(31);
    const subTitle = this.add.text(px - panelW / 2 + panelW / 2, py + 28, 'live · refreshes every 20s', {
      fontSize: '9px', fontFamily: 'Arial', color: '#4a4a6a',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(31);
    this._lbPanel.push(bg, title, subTitle);

    const loadTxt = this.add.text(px - panelW / 2 + panelW / 2, py + panelH / 2, 'Loading…', {
      fontSize: '11px', fontFamily: 'Arial', color: '#5d6d7e',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    this._lbPanel.push(loadTxt);

    const myName = playerSystem.get('name');
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    fetch(`${serverUrl}/leaderboard`)
      .then(r => r.json())
      .then(board => {
        if (!loadTxt.active) return;
        loadTxt.destroy();
        const entries = board.slice(0, 8);
        if (!entries.length) {
          const none = this.add.text(px - panelW / 2 + panelW / 2, py + panelH / 2, 'No players online', {
            fontSize: '11px', fontFamily: 'Arial', color: '#5d6d7e',
          }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
          if (this._lbPanel) this._lbPanel.push(none);
          return;
        }
        entries.forEach((entry, i) => {
          if (!this._lbPanel) return;
          const ey = py + 50 + i * 27;
          const medal    = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          const isSelf   = entry.name === myName;
          const prestige = entry.prestige > 0 ? ` ⭐${entry.prestige}` : '';
          const lvlStr   = `Lv${entry.level}`;
          const nameStr  = (entry.name || '?').slice(0, 9);
          const rowClr   = isSelf ? '#2ecc71' : i < 3 ? '#f1c40f' : '#bdc3c7';

          const row = this.add.text(px - panelW + 14, ey,
            `${medal} ${nameStr}${prestige}`, {
            fontSize: '11px', fontFamily: isSelf ? 'Arial Black' : 'Arial', color: rowClr,
          }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

          const earnEl = this.add.text(px - 12, ey, `$${entry.earned}`, {
            fontSize: '11px', fontFamily: 'Arial Black', color: rowClr,
          }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(31);

          const lvlEl = this.add.text(px - panelW + 14, ey + 11, lvlStr, {
            fontSize: '9px', fontFamily: 'Arial', color: '#5d6d7e',
          }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

          this._lbPanel.push(row, earnEl, lvlEl);
        });

        // Show "You" marker if self not in top 8
        const selfInBoard = entries.some(e => e.name === myName);
        if (!selfInBoard) {
          const youEl = this.add.text(px - panelW / 2 + panelW / 2, py + panelH - 20,
            `▶ You: ${myName}  (not in top 8)`, {
            fontSize: '9px', fontFamily: 'Arial', color: '#2ecc71',
          }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(31);
          if (this._lbPanel) this._lbPanel.push(youEl);
        }
      })
      .catch(() => {
        if (!loadTxt.active) return;
        loadTxt.setText('Server offline');
      });
  }

  // ────────────────────────────── prompt ───────────────────────────────────

  _buildPrompt() {
    this._promptBg = this.add.rectangle(W / 2, H - 44, 360, 36, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(20).setVisible(false);
    this._promptText = this.add.text(W / 2, H - 44, '', {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#f1c40f',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21).setVisible(false);
  }

  _onNearZone(zone) {
    const label = zone.type === 'job'
      ? `Press E — Work at ${zone.label}  |  T: Chat  |  G: Gift`
      : `Press E — Enter ${zone.label}  |  T: Chat`;
    this._promptText.setText(label);
    this._promptBg.setVisible(true);
    this._promptText.setVisible(true);
    this._promptBg.setSize(this._promptText.width + 24, 36);
  }

  _onLeaveZone() {
    this._promptBg.setVisible(false);
    this._promptText.setVisible(false);
  }

  // ────────────────────────────── notice ───────────────────────────────────

  _buildNotice() {
    this._noticeBg = this.add.rectangle(W / 2, H / 2 - 80, 440, 52, 0x1a252f, 0.95)
      .setScrollFactor(0).setDepth(40).setVisible(false).setStrokeStyle(2, 0xf1c40f);
    this._noticeText = this.add.text(W / 2, H / 2 - 80, '', {
      fontSize: '17px', fontFamily: 'Arial Black', color: '#f1c40f',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41).setVisible(false);
    this._noticeTween = null;
  }

  _triggerNotice(message, color = 0xf1c40f) {
    if (this._noticeTween) { this._noticeTween.stop(); }
    this._noticeText.setText(message).setColor(Phaser.Display.Color.IntegerToColor(color).rgba);
    this._noticeBg.setVisible(true).setAlpha(1).setStrokeStyle(2, color);
    this._noticeText.setVisible(true).setAlpha(1);
    this._noticeTween = this.tweens.add({
      targets: [this._noticeBg, this._noticeText],
      alpha: 0, delay: 2000, duration: 600,
      onComplete: () => {
        this._noticeBg.setVisible(false);
        this._noticeText.setVisible(false);
      },
    });
  }

  // ──────────────────── online count ───────────────────────────────────────

  _onPlayerCount(count) {
    this._onlineText.setText(`🌐 ${count}`);
  }

  // ──────────────────── city event banner ──────────────────────────────────

  _showCityEventBanner(data) {
    SoundSystem.cityEvent();
    // Dismiss any existing banner
    this._cityEventModal.forEach(el => { if (el?.active) el.destroy(); });
    this._cityEventModal = [];

    const cx = W / 2;
    const cy = 160;

    const bg = this.add.rectangle(cx, cy, 700, 72, 0x0d1b2a, 0.96)
      .setStrokeStyle(2, 0x5dade2).setScrollFactor(0).setDepth(50);

    const icon = data.money > 0 ? '📣' : data.money < 0 ? '⚠️' : '🌆';

    let effectStr = '';
    if (data.money)     effectStr += `  ${data.money > 0 ? '+' : ''}$${data.money}`;
    if (data.happiness) effectStr += `  😊${data.happiness > 0 ? '+' : ''}${data.happiness}`;
    if (data.food)      effectStr += `  🍞${data.food > 0 ? '+' : ''}${data.food}`;
    if (data.energy)    effectStr += `  ⚡${data.energy > 0 ? '+' : ''}${data.energy}`;

    const title = this.add.text(cx, cy - 12, `${icon} CITY EVENT`, {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#5dade2',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    const body = this.add.text(cx, cy + 12, `${data.text}${effectStr}`, {
      fontSize: '15px', fontFamily: 'Arial', color: '#ecf0f1',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    this._cityEventModal.push(bg, title, body);

    // Slide in from top
    const startY = -40;
    bg.setY(startY); title.setY(startY - 12); body.setY(startY + 12);
    this.tweens.add({
      targets: [bg, title, body], y: `+=${cy - startY}`,
      duration: 350, ease: 'Back.Out',
    });

    // Auto-dismiss after 6s
    this.time.delayedCall(6000, () => {
      if (!bg.active) return;
      this.tweens.add({
        targets: [bg, title, body], alpha: 0, duration: 500,
        onComplete: () => {
          this._cityEventModal.forEach(el => { if (el?.active) el.destroy(); });
          this._cityEventModal = [];
        },
      });
    });
  }

  // ────────────────────────── HUD refresh ──────────────────────────────────

  _refreshHUD() {
    const money   = playerSystem.get('money')    || 0;
    const savings = playerSystem.get('savings')  || 0;
    const day     = playerSystem.get('dayCount') || 1;

    this._moneyText.setText(`$${money}`);
    this._savingsText.setText(`$${savings}`);
    this._dayText.setText(`Day ${day}`);
    this._moneyText.setColor(money < 50 ? '#e74c3c' : '#f1c40f');

    [this._energyBar, this._foodBar, this._stabilityBar, this._happyBar].forEach(bar => {
      const val = Math.max(0, Math.min(100, playerSystem.get(bar.stat) || 0));
      const pct = val / 100;
      bar.fill.setSize(Math.max(2, BAR_W * pct), BAR_H);
      bar.pctText.setText(`${val}%`);

      if (val < 25)      bar.fill.setFillStyle(0xe74c3c);
      else if (val < 50) bar.fill.setFillStyle(0xf39c12);
      else               bar.fill.setFillStyle(bar.color);
    });

    if (this._skillsVisible) this._refreshSkills();

    // Weather / vehicle / prestige badges
    const w = weatherSystem.getCurrent();
    this._weatherBadge.setText(`${w.emoji} ${w.label}`);
    const v = vehicleSystem.getVehicle();
    this._vehicleBadge.setText(v ? `${v.emoji} ${v.label}` : '');
    const prestige = playerSystem.get('prestige') || 0;
    this._prestigeText.setText(prestige > 0 ? `${'⭐'.repeat(Math.min(prestige, 5))} P${prestige}` : '');

    // Job progress dots
    const jobsDone = (playerSystem.get('jobsCompleted') || 0) % 4;
    this._jobDots.forEach((dot, i) => {
      if (i < jobsDone) {
        dot.setFillStyle(0xf1c40f).setStrokeStyle(1.5, 0xe67e22);
      } else {
        dot.setFillStyle(0x2c3e50).setStrokeStyle(1.5, 0x4a4a6a);
      }
    });

    // XP bar + level
    const prog = levelSystem.getProgress();
    this._xpFill.setSize(Math.round(W * prog.pct), 5);
    this._levelText.setText(`Lv ${prog.level}`);

    if (playerSystem.get('foodStatus') < 20) {
      this._triggerNotice('🍞 Family is hungry! Visit the Market.', 0xe67e22);
    }
  }

  // ─────────────────────────── goals panel ─────────────────────────────────

  _toggleGoals() {
    if (this._goalsPanel) {
      this._goalsPanel.forEach(el => el?.destroy());
      this._goalsPanel = null;
      return;
    }
    if (this._lbPanel) { this._lbPanel.forEach(el => el?.destroy()); this._lbPanel = null; }
    if (this._skillsVisible) { this._skillsVisible = false; this._skillsPanel.forEach(el => el.setVisible(false)); }

    const goals = dailyGoals.getGoals();
    this._goalsPanel = [];

    const panelW = 260, panelH = 130 + goals.length * 38;
    const px = W - 170, py = 66;

    const bg = this.add.rectangle(px, py + panelH / 2, panelW, panelH, 0x0a0a14, 0.93)
      .setScrollFactor(0).setDepth(30).setStrokeStyle(1, 0x27ae60, 0.5).setOrigin(0.5, 0);
    const title = this.add.text(px, py + 12, '📋 Daily Goals', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#2ecc71',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(31);
    this._goalsPanel.push(bg, title);

    if (!goals.length) {
      const none = this.add.text(px, py + 44, 'No goals yet', {
        fontSize: '12px', fontFamily: 'Arial', color: '#5d6d7e',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(31);
      this._goalsPanel.push(none);
      return;
    }

    goals.forEach((g, i) => {
      const gy = py + 42 + i * 38;
      const clr = g.completed ? '#2ecc71' : '#bdc3c7';
      const status = g.completed ? '✅' : g.icon;
      const row = this.add.text(px - panelW / 2 + 10, gy,
        `${status} ${g.text}`, {
        fontSize: '12px', fontFamily: 'Arial', color: clr, wordWrap: { width: panelW - 20 },
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(31);
      this._goalsPanel.push(row);

      const rewardKeys = Object.entries(g.reward).map(([k, v]) => `+${v} ${k}`).join(', ');
      const rewardRow = this.add.text(px - panelW / 2 + 10, gy + 16,
        `Reward: ${rewardKeys}`, {
        fontSize: '10px', fontFamily: 'Arial', color: '#5d6d7e',
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(31);
      this._goalsPanel.push(rewardRow);
    });

    const hint = this.add.text(px, py + panelH - 14, 'Goals reset each day', {
      fontSize: '10px', fontFamily: 'Arial', color: '#3d3c55',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(31);
    this._goalsPanel.push(hint);
  }

  // ───────────��─── level-up / achievement / goals notices ──────────────────

  _showLevelUpNotice(data) {
    SoundSystem.levelUp();
    const cx = W / 2, cy = H / 2 - 60;
    const els = [];

    const overlay = this.add.rectangle(cx, cy, 540, data.perk ? 120 : 90, 0x1a0a2e, 0.97)
      .setStrokeStyle(3, 0x9b59b6).setScrollFactor(0).setDepth(80);
    const lvlTxt = this.add.text(cx, cy - 22, `🌟 Level Up! → Level ${data.level}`, {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#9b59b6',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(81);
    els.push(overlay, lvlTxt);

    if (data.perk) {
      const perkTxt = this.add.text(cx, cy + 16, data.perk, {
        fontSize: '14px', fontFamily: 'Arial', color: '#f1c40f',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(81);
      els.push(perkTxt);
    }

    this.tweens.add({
      targets: els, alpha: 0, delay: 3500, duration: 600,
      onComplete: () => els.forEach(e => { if (e.active) e.destroy(); }),
    });
  }

  _showAchievementNotice(data) {
    SoundSystem.levelUp();
    this._triggerNotice(`${data.icon} Achievement: ${data.title} — ${data.desc}`, 0xf1c40f);
  }

  _showGoalsCompleted(data) {
    data.goals.forEach((g, i) => {
      this.time.delayedCall(i * 1200, () => {
        this._triggerNotice(`${g.icon} Goal: ${g.text} — Reward claimed!`, 0x2ecc71);
      });
    });
  }

  _showTutorialPanel() {
    const cx = W / 2, cy = H / 2;
    const els = [];

    const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(90).setInteractive();
    const box = this.add.rectangle(cx, cy, 560, 400, 0x0f0e1f, 0.98)
      .setStrokeStyle(2, 0x3498db).setScrollFactor(0).setDepth(91);

    const title = this.add.text(cx, cy - 168, '❓ How to Play', {
      fontSize: '24px', fontFamily: 'Arial Black', color: '#3498db',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    const lines = [
      ['WASD / Arrows', 'Move your character'],
      ['E',             'Interact with nearby building'],
      ['ESC',           'Close panel'],
      ['T',             'Open chat (type + Enter)'],
      ['G',             'Gift $15 to nearest player'],
      ['📊 Skills',     'View your skill levels'],
      ['🏆 Top',        'Leaderboard — top earners'],
      ['📋 Goals',      'View today\'s bonus goals'],
    ];

    lines.forEach(([key, desc], i) => {
      const y = cy - 120 + i * 34;
      const keyEl = this.add.text(cx - 200, y, key, {
        fontSize: '14px', fontFamily: 'Arial Black', color: '#f1c40f',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(92);
      const descEl = this.add.text(cx + 200, y, desc, {
        fontSize: '14px', fontFamily: 'Arial', color: '#bdc3c7',
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(92);
      els.push(keyEl, descEl);
    });

    const closeBtn = this.add.text(cx, cy + 168, '[ Close ]', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#3498db',
      backgroundColor: 'rgba(52,152,219,0.15)', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92).setInteractive({ useHandCursor: true });

    const closeAll = () => {
      [overlay, box, title, closeBtn, ...els].forEach(e => { if (e?.active) e.destroy(); });
    };
    overlay.on('pointerdown', closeAll);
    closeBtn.on('pointerdown', closeAll);
    closeBtn.on('pointerover', () => closeBtn.setStyle({ backgroundColor: 'rgba(52,152,219,0.3)' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ backgroundColor: 'rgba(52,152,219,0.15)' }));
    this.input.keyboard.once('keydown-ESC', closeAll);

    els.push(overlay, box, title, closeBtn);
  }

  _showCredits() {
    const cx = W / 2, cy = H / 2;
    const els = [];

    const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.82)
      .setScrollFactor(0).setDepth(90).setInteractive();
    const box = this.add.rectangle(cx, cy, 560, 440, 0x0b0c1a, 0.99)
      .setStrokeStyle(2, 0xf1c40f).setScrollFactor(0).setDepth(91);

    // Title
    const gameName = this.add.text(cx, cy - 188, 'Life Loop: City of Work', {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#f1c40f',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);
    const jam = this.add.text(cx, cy - 156, 'Cursor Vibe Jam 2026', {
      fontSize: '14px', fontFamily: 'Arial', color: '#5dade2',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    // Divider
    const div1 = this.add.rectangle(cx, cy - 136, 460, 1, 0x2c3e50).setScrollFactor(0).setDepth(92);

    // Creator block
    const madeBy = this.add.text(cx, cy - 110, '✦ Created by', {
      fontSize: '12px', fontFamily: 'Arial', color: '#7f8c8d',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);
    const author = this.add.text(cx, cy - 82, 'Hemang Patel', {
      fontSize: '28px', fontFamily: 'Arial Black', color: '#2ecc71',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);
    const year = this.add.text(cx, cy - 50, '© 2026', {
      fontSize: '14px', fontFamily: 'Arial', color: '#7f8c8d',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    const div2 = this.add.rectangle(cx, cy - 28, 460, 1, 0x2c3e50).setScrollFactor(0).setDepth(92);

    // Tech stack
    const builtWith = this.add.text(cx, cy - 6, '✦ Built with', {
      fontSize: '12px', fontFamily: 'Arial', color: '#7f8c8d',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);
    const stack = this.add.text(cx, cy + 24,
      'Phaser 3  ·  Vite 5  ·  Node.js  ·  Express  ·  Socket.IO', {
      fontSize: '13px', fontFamily: 'Arial', color: '#bdc3c7',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    const div3 = this.add.rectangle(cx, cy + 50, 460, 1, 0x2c3e50).setScrollFactor(0).setDepth(92);

    // Features summary
    const feat = this.add.text(cx, cy + 76,
      '4 Minigames  ·  6 Skills  ·  20 Levels  ·  Tier System\nWeather · Vehicles · Business Ownership · Prestige\n' +
      'Daily Goals · 15 Achievements · Housing Upgrades\nReal-time Multiplayer · Chat · Gifting · City Events', {
      fontSize: '12px', fontFamily: 'Arial', color: '#7f8c8d',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    const div4 = this.add.rectangle(cx, cy + 148, 460, 1, 0x2c3e50).setScrollFactor(0).setDepth(92);

    const email = this.add.text(cx, cy + 166, 'hemangpatel0710@gmail.com', {
      fontSize: '11px', fontFamily: 'Arial', color: '#3d5a80',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    // Close
    const closeBtn = this.add.text(cx, cy + 196, '[ Close ]', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#f1c40f',
      backgroundColor: 'rgba(241,196,15,0.12)', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92).setInteractive({ useHandCursor: true });

    const closeAll = () => {
      [overlay, box, gameName, jam, div1, madeBy, author, year, div2,
       builtWith, stack, div3, feat, div4, email, closeBtn, ...els
      ].forEach(e => { if (e?.active) e.destroy(); });
    };
    overlay.on('pointerdown', closeAll);
    closeBtn.on('pointerdown', closeAll);
    closeBtn.on('pointerover', () => closeBtn.setStyle({ backgroundColor: 'rgba(241,196,15,0.28)' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ backgroundColor: 'rgba(241,196,15,0.12)' }));
    this.input.keyboard.once('keydown-ESC', closeAll);
  }

  // ─────────────────────────── day-end modal ───────────────────────────────

  _buildDayEndModal() {
    this._dayModal = [];
  }

  // ───────────────────────────── minimap ───────────────────────────────────

  _buildMinimap() {
    const MM_W = 140, MM_H = 110;
    this._MM_X = W - 10 - MM_W; // 1130
    this._MM_Y = H - 10 - MM_H; // 600

    this.add.rectangle(
      this._MM_X + MM_W / 2, this._MM_Y + MM_H / 2, MM_W, MM_H, 0x07080f, 0.88,
    ).setScrollFactor(0).setDepth(25).setStrokeStyle(1, 0x2c3e50);

    this.add.text(this._MM_X + MM_W / 2, this._MM_Y - 1, 'MAP', {
      fontSize: '9px', fontFamily: 'Arial', color: '#3d3c55',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(26);

    const zGfx = this.add.graphics().setScrollFactor(0).setDepth(26);
    ZONES.forEach(z => {
      const mx = this._MM_X + (z.cx / WORLD_W) * MM_W;
      const my = this._MM_Y + (z.cy / WORLD_H) * MM_H;
      const r  = Math.max(3, Math.round((z.w / WORLD_W) * MM_W * 0.45));
      zGfx.fillStyle(z.color, 0.65);
      zGfx.fillRect(mx - r, my - r, r * 2, r * 2);
    });

    this._mmSelf = this.add.circle(0, 0, 3, 0xf1c40f).setScrollFactor(0).setDepth(28);
    this._mmRemote = {};
    this._MM_W = MM_W;
    this._MM_H = MM_H;

    this.time.addEvent({ delay: 150, callback: this._updateMinimap, callbackScope: this, loop: true });
  }

  _updateMinimap() {
    const city = this.scene.get('CityScene');
    if (!city?.player) return;

    const toMX = wx => this._MM_X + (wx / WORLD_W) * this._MM_W;
    const toMY = wy => this._MM_Y + (wy / WORLD_H) * this._MM_H;

    this._mmSelf.setPosition(toMX(city.player.x), toMY(city.player.y));

    const seen = new Set();
    Object.entries(city._remotePlayers || {}).forEach(([id, rp]) => {
      if (!rp.sprite?.active) return;
      seen.add(id);
      const dx = toMX(rp.sprite.x), dy = toMY(rp.sprite.y);
      if (!this._mmRemote[id]) {
        this._mmRemote[id] = this.add.circle(dx, dy, 2, 0x5dade2).setScrollFactor(0).setDepth(27);
      } else {
        this._mmRemote[id].setPosition(dx, dy);
      }
    });
    Object.keys(this._mmRemote).forEach(id => {
      if (!seen.has(id)) { this._mmRemote[id].destroy(); delete this._mmRemote[id]; }
    });
  }

  // ─────────────────────────── game over ───────────────────────────────────

  _showGameOver(data) {
    const cx = W / 2, cy = H / 2;

    this.add.rectangle(cx, cy, W, H, 0x000000, 0.9)
      .setScrollFactor(0).setDepth(100).setInteractive();

    this.add.text(cx, cy - 170, '💸', { fontSize: '72px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.add.text(cx, cy - 100, 'BANKRUPT', {
      fontSize: '52px', fontFamily: 'Arial Black', color: '#e74c3c',
      stroke: '#7b241c', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.add.text(cx, cy - 30, 'Missed rent AND food two days in a row.', {
      fontSize: '17px', fontFamily: 'Arial', color: '#7f8c8d', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.add.text(cx, cy + 30,
      `Days survived: ${data.day}\nTotal earned: $${data.totalEarned}`, {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ecf0f1',
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const btn = this.add.text(cx, cy + 130, '[ Try Again ]', {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#2ecc71',
      backgroundColor: 'rgba(39,174,96,0.18)', padding: { x: 28, y: 14 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: 'rgba(39,174,96,0.38)' }));
    btn.on('pointerdown', () => { playerSystem.reset(); window.location.reload(); });
  }

  _showDayEnd(data) {
    SoundSystem.dayEnd();
    this._dayModal.forEach(el => el?.destroy());
    this._dayModal = [];

    const cx = W / 2;
    const cy = H / 2;

    const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.6)
      .setScrollFactor(0).setDepth(60).setInteractive();
    const boxH = data.businessIncome > 0 ? 420 : 380;
    const box = this.add.rectangle(cx, cy, 460, boxH, 0x0f1420, 0.97)
      .setStrokeStyle(3, 0xf1c40f).setScrollFactor(0).setDepth(61);

    const titleTxt = this.add.text(cx, cy - 156, `🌙 Day ${data.day - 1} Complete`, {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#f1c40f',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(62);

    const tPaid = data.transportPaid !== undefined ? data.transportPaid : true;
    const tCost = data.transportCost || 5;
    const lines = [
      [`📈 Income today:`,  `+$${data.income}`,                                   '#2ecc71'],
      ...(data.businessIncome > 0 ? [[`🏢 Business income:`, `+$${data.businessIncome}`, '#1abc9c']] : []),
      [`🏠 Rent:`,          data.rentPaid ? `-$${data.rentCost}` : '⚠️ MISSED',   '#e74c3c'],
      [`🍞 Food:`,          data.foodPaid ? `-$${data.foodCost}` : '⚠️ MISSED',   '#e67e22'],
      [`🚌 Transport:`,     tPaid ? `-$${tCost}` : '⚠️ MISSED',                  '#8e44ad'],
      [`💰 Balance now:`,   `$${data.moneyAfter}`, data.moneyAfter > 50 ? '#2ecc71' : '#e74c3c'],
    ];

    lines.forEach(([label, value, color], i) => {
      const y = cy - 102 + i * 42;
      const lbl = this.add.text(cx - 170, y, label, {
        fontSize: '15px', fontFamily: 'Arial', color: '#bdc3c7',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(62);
      const val = this.add.text(cx + 170, y, value, {
        fontSize: '15px', fontFamily: 'Arial Black', color,
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(62);
      const div = this.add.rectangle(cx, y + 20, 380, 1, 0x2c3e50, 0.6)
        .setScrollFactor(0).setDepth(62);
      this._dayModal.push(lbl, val, div);
    });

    const nextDayBtn = this.add.text(cx, cy + 150, `[ Start Day ${data.day} → ]`, {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#2ecc71',
      backgroundColor: 'rgba(39,174,96,0.15)', padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(62).setInteractive({ useHandCursor: true });

    const close = () => {
      this._dayModal.forEach(el => { if (el?.active) el.destroy(); });
      this._dayModal = [];
      this._refreshHUD();
    };

    nextDayBtn.on('pointerover', () => nextDayBtn.setStyle({ backgroundColor: 'rgba(39,174,96,0.35)' }));
    nextDayBtn.on('pointerdown', close);
    overlay.on('pointerdown', close);
    this.time.delayedCall(8000, close);

    this._dayModal.push(overlay, box, titleTxt, nextDayBtn);
  }
}
