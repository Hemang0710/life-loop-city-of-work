import Phaser from 'phaser';
import { jobSystem, eventSystem, levelSystem, achievementSystem, playerSystem } from '../systems/store.js';
import { CookGame }     from '../minigames/CookGame.js';
import { DeliveryGame } from '../minigames/DeliveryGame.js';
import { CleanerGame }  from '../minigames/CleanerGame.js';
import { ShopGame }     from '../minigames/ShopGame.js';
import { JOBS }         from '../config/GameConfig.js';

const W = 1280;
const H = 720;
const GAME_DURATION = 30;

const GAME_MAP = {
  cook:     CookGame,
  delivery: DeliveryGame,
  cleaner:  CleanerGame,
  shop:     ShopGame,
};

const TIER_COLORS = { 1: 0x95a5a6, 2: 0xf39c12, 3: 0x9b59b6 };
const TIER_LABELS = { 1: '', 2: '🚀 TIER 2', 3: '💫 TIER 3' };

export class MiniGameScene extends Phaser.Scene {
  constructor() { super({ key: 'MiniGameScene' }); }

  init(data) {
    this._job        = data;
    this._timeLeft   = GAME_DURATION;
    this._gameEnded  = false;
    this._game       = null;
    const jobDef     = JOBS[data.jobId];
    this._tier       = levelSystem.getTier(jobDef?.skill || 'cooking');
    this._skillLevel = Math.max(1, Math.floor(playerSystem.getSkillLevel(jobDef?.skill || 'cooking')));
  }

  create() {
    this._drawBackground();
    this._buildSharedUI();

    const GameClass = GAME_MAP[this._job.jobId];
    if (GameClass) {
      this._game = new GameClass(this, this._tier, this._skillLevel);
      this._game.start();
    }

    this._startCountdown();
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  // ─────────────────────────── background ──────────────────────────────────

  _drawBackground() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x080810).setDepth(0);
    const gfx = this.add.graphics().setDepth(0);
    gfx.fillStyle(this._job.color, 0.08); gfx.fillRect(0, 0, W, H);
    gfx.lineStyle(2, this._job.color, 0.3);
    gfx.strokeRect(10, 10, W - 20, H - 20);

    this.add.rectangle(W / 2, H / 2 + 30, W - 60, H - 100, 0x0d0d18, 0.88)
      .setStrokeStyle(1, this._job.color, 0.25).setDepth(1);
  }

  // ─────────────────────────── shared HUD ──────────────────────────────────

  _buildSharedUI() {
    this.add.rectangle(W / 2, 34, W, 60, this._job.color, 0.88).setDepth(5);
    this.add.text(W / 2, 26, `${this._job.emoji}  ${this._job.jobName}`, {
      fontSize: '24px', fontFamily: 'Arial Black', color: '#fff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    // Tier badge
    if (this._tier > 1) {
      const tierColor = TIER_COLORS[this._tier];
      this.add.rectangle(100, 26, 110, 28, tierColor, 0.85)
        .setStrokeStyle(2, 0xffffff, 0.5).setDepth(6);
      this.add.text(100, 26, TIER_LABELS[this._tier], {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#fff',
      }).setOrigin(0.5).setDepth(7);
    }

    // Skill difficulty badge
    const sk = this._skillLevel;
    const skColor = sk >= 8 ? '#e74c3c' : sk >= 5 ? '#f39c12' : '#95a5a6';
    const skLabel = sk >= 8 ? `⚡ Skill Lv${sk} — HARD` : sk >= 5 ? `Skill Lv${sk} — MED` : `Skill Lv${sk}`;
    this.add.text(W - 14, 88, skLabel, {
      fontSize: '11px', fontFamily: 'Arial', color: skColor,
    }).setOrigin(1, 0).setDepth(6);

    const trackW = W - 100;
    this.add.rectangle(W / 2, 72, trackW, 14, 0x1e2b38).setDepth(6);
    this._timerFill = this.add.rectangle(W / 2, 72, trackW, 10, 0x2ecc71)
      .setOrigin(0.5).setDepth(7);
    this._timerOriginX = W / 2;
    this._trackW       = trackW;

    this._scoreText = this.add.text(W - 20, 88, `0 / ?`, {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#f1c40f',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(6);

    this._timerText = this.add.text(20, 88, `${GAME_DURATION}s`, {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#ecf0f1',
    }).setOrigin(0, 0).setDepth(6);
  }

  _updateScoreText(score, max) {
    this._scoreText.setText(`${score} / ${max}`);
  }

  // ─────────────────────────── timer ───────────────────────────────────────

  _startCountdown() {
    this._countdown = this.time.addEvent({
      delay: 1000, repeat: GAME_DURATION - 1,
      callback: () => {
        this._timeLeft--;
        const ratio = this._timeLeft / GAME_DURATION;
        this._timerFill.setSize(this._trackW * ratio, 10);
        this._timerFill.setX(this._timerOriginX - this._trackW * (1 - ratio) / 2);
        this._timerFill.setFillStyle(ratio > 0.5 ? 0x2ecc71 : ratio > 0.25 ? 0xf39c12 : 0xe74c3c);
        this._timerText.setText(`${this._timeLeft}s`);
        if (this._timeLeft <= 5) this._timerText.setColor('#e74c3c');
        if (this._timeLeft <= 0) this._triggerEarlyEnd();
      },
    });
  }

  _triggerEarlyEnd() {
    if (this._gameEnded) return;
    this._gameEnded = true;
    this._countdown?.remove();

    const perf = this._game?.getPerformance() ?? 0;
    this.tweens.killAll();
    this._game?.cleanup();
    this._finalize(perf);
  }

  _finalize(performance) {
    // Track best performance for daily goals
    const prevBest = playerSystem.get('bestPerformanceToday') || 0;
    if (performance > prevBest) playerSystem.set('bestPerformanceToday', performance);

    // Track highest tier
    const prevTier = playerSystem.get('highestTier') || 1;
    if (this._tier > prevTier) playerSystem.set('highestTier', this._tier);

    const result = jobSystem.completeJob(this._job.jobId, performance, this._tier);

    // Award XP
    levelSystem.addXP(result.xp);

    // Check achievements
    achievementSystem.check();

    const event = eventSystem.tryTriggerEvent();
    this._showResult(performance, result.pay, result.skill, result.xp, event);
  }

  // ─────────────────────────── result screen ───────────────────────────────

  _showResult(performance, pay, skill, xp, event) {
    this.time.delayedCall(300, () => {
      const hasDecision = event?.decision;
      const hasEvent    = !!event;
      const boxH        = hasDecision ? 440 : hasEvent ? 400 : 360;

      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(20);
      this.add.rectangle(W / 2, H / 2, 480, boxH, 0x12121e, 0.97)
        .setStrokeStyle(3, this._job.color).setDepth(21);

      const stars  = performance >= 0.85 ? '⭐⭐⭐' : performance >= 0.6 ? '⭐⭐' : '⭐';
      const grade  = performance >= 0.85 ? 'Excellent!' : performance >= 0.6 ? 'Good Job!' : 'Keep Trying!';
      const gColor = performance >= 0.85 ? '#2ecc71' : performance >= 0.6 ? '#f39c12' : '#e74c3c';

      this.add.text(W / 2, H / 2 - 155, stars, { fontSize: '34px' }).setOrigin(0.5).setDepth(22);
      this.add.text(W / 2, H / 2 - 115, grade, {
        fontSize: '30px', fontFamily: 'Arial Black', color: gColor,
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(22);

      const pct = Math.round(performance * 100);
      this.add.text(W / 2, H / 2 - 74, `Performance: ${pct}%`, {
        fontSize: '17px', fontFamily: 'Arial', color: '#ecf0f1',
      }).setOrigin(0.5).setDepth(22);

      // Pay box
      this.add.rectangle(W / 2, H / 2 - 26, 300, 46, 0x0d2918, 0.9)
        .setStrokeStyle(2, 0x2ecc71).setDepth(22);
      this.add.text(W / 2, H / 2 - 26, `💰  +$${pay}`, {
        fontSize: '26px', fontFamily: 'Arial Black', color: '#2ecc71',
      }).setOrigin(0.5).setDepth(23);

      // Tier badge in result
      if (this._tier > 1) {
        const tc = TIER_COLORS[this._tier];
        const tHex = '#' + tc.toString(16).padStart(6, '0');
        this.add.text(W / 2, H / 2 + 14, TIER_LABELS[this._tier] + ' Bonus!', {
          fontSize: '13px', fontFamily: 'Arial Black', color: tHex,
        }).setOrigin(0.5).setDepth(22);
      }

      this.add.text(W / 2, H / 2 + 34, `📈 ${skill} skill improved`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#f39c12',
      }).setOrigin(0.5).setDepth(22);

      this.add.text(W / 2, H / 2 + 54, `✨ +${xp} XP`, {
        fontSize: '13px', fontFamily: 'Arial', color: '#9b59b6',
      }).setOrigin(0.5).setDepth(22);

      // Random event
      if (event) {
        if (hasDecision) {
          const dY = H / 2 + 95;
          this.add.rectangle(W / 2, dY, 420, 68, 0x1a1a2e, 0.94)
            .setStrokeStyle(1, 0xe74c3c, 0.85).setDepth(22);
          this.add.text(W / 2, dY - 16, `⚡ ${event.text}`, {
            fontSize: '13px', fontFamily: 'Arial', color: '#ecf0f1',
          }).setOrigin(0.5).setDepth(23);

          const payBtn = this.add.text(W / 2 - 88, dY + 16,
            `💸 Pay $${Math.abs(event.money)}`, {
            fontSize: '13px', fontFamily: 'Arial Black', color: '#e74c3c',
            backgroundColor: 'rgba(231,76,60,0.22)', padding: { x: 10, y: 6 },
          }).setOrigin(0.5).setDepth(23).setInteractive({ useHandCursor: true });

          const skipBtn = this.add.text(W / 2 + 88, dY + 16,
            `Ignore (−😊10)`, {
            fontSize: '13px', fontFamily: 'Arial Black', color: '#7f8c8d',
            backgroundColor: 'rgba(127,140,141,0.22)', padding: { x: 10, y: 6 },
          }).setOrigin(0.5).setDepth(23).setInteractive({ useHandCursor: true });

          const resolve = (accept) => {
            eventSystem.applyDecision(event, accept);
            payBtn.destroy(); skipBtn.destroy();
          };
          payBtn.on('pointerover',  () => payBtn.setStyle({ backgroundColor: 'rgba(231,76,60,0.45)' }));
          payBtn.on('pointerout',   () => payBtn.setStyle({ backgroundColor: 'rgba(231,76,60,0.22)' }));
          payBtn.on('pointerdown',  () => resolve(true));
          skipBtn.on('pointerover', () => skipBtn.setStyle({ backgroundColor: 'rgba(127,140,141,0.45)' }));
          skipBtn.on('pointerout',  () => skipBtn.setStyle({ backgroundColor: 'rgba(127,140,141,0.22)' }));
          skipBtn.on('pointerdown', () => resolve(false));
        } else {
          const evColor  = event.money >= 0 ? '#2ecc71' : '#e74c3c';
          const evPrefix = event.money > 0 ? `💰 +$${event.money}  ` : event.money < 0 ? `💸 -$${Math.abs(event.money)}  ` : '';
          this.add.rectangle(W / 2, H / 2 + 92, 420, 36, 0x1a1a2e, 0.9)
            .setStrokeStyle(1, 0x5d6d7e).setDepth(22);
          this.add.text(W / 2, H / 2 + 92, `⚡ ${evPrefix}${event.text}`, {
            fontSize: '14px', fontFamily: 'Arial', color: evColor,
          }).setOrigin(0.5).setDepth(23);
        }
      }

      const btnY = H / 2 + (hasDecision ? 178 : hasEvent ? 148 : 120);
      const btn = this.add.text(W / 2, btnY, '[ Return to City ]', {
        fontSize: '20px', fontFamily: 'Arial Black', color: '#3498db',
        backgroundColor: 'rgba(52,152,219,0.15)', padding: { x: 20, y: 12 },
      }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ color: '#85c1e9', backgroundColor: 'rgba(52,152,219,0.3)' }));
      btn.on('pointerout',  () => btn.setStyle({ color: '#3498db', backgroundColor: 'rgba(52,152,219,0.15)' }));
      btn.on('pointerdown', () => this._returnToCity());
      this.input.keyboard.once('keydown', () => this._returnToCity());
    });
  }

  _returnToCity() {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(220, () => {
      this.scene.stop();
      const city = this.scene.get('CityScene');
      city.scene.resume();
      city.onMiniGameComplete();
    });
  }
}
