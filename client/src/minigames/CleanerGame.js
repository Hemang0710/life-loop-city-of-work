import Phaser from 'phaser';

const TIER_CONFIG = {
  1: { maxMess: 18, spawnDelay: 1300 },
  2: { maxMess: 22, spawnDelay: 1000 },
  3: { maxMess: 28, spawnDelay:  750 },
};

const DIRT_COLORS  = [0xd35400, 0xe67e22, 0xb7950b, 0x935116];
const SPARK_COLOR  = 0x5dade2;
const MORPH_WARN   = 0xf1c40f;

export class CleanerGame {
  constructor(scene, tier = 1, skill = 1) {
    this.scene = scene;
    const cfg = TIER_CONFIG[tier] || TIER_CONFIG[1];
    this.score    = 0;
    this.maxScore = cfg.maxMess;
    this._skill   = skill;
    this._spots   = [];
    this._els     = [];
    this._spawnTimer  = null;
    this._gameActive  = true;
    this._missCount   = 0;

    // Tier sets spawn rate; skill shrinks lifespan and adds mechanics
    this._spawnDelay     = cfg.spawnDelay;
    this._dirtyLifespan  = Math.max(750, 2200 - (skill - 1) * 165);  // 2200ms → 750ms across Lv1-10
    this._sparkLifespan  = Math.max(1000, 3000 - (skill - 1) * 220);

    // New mechanics by skill
    this._morphChance    = skill >= 5 ? (skill >= 8 ? 0.40 : 0.28) : 0;  // dirt→sparkle transform
    this._driftChance    = skill >= 7 ? 0.30 : 0;                          // spots slowly move
    this._stubbornChance = skill >= 8 ? 0.18 : 0;                          // needs 2 clicks to clean
  }

  start() {
    this._buildBackground();

    let hint = 'Click DIRT SPOTS 🟧  —  AVOID SPARKLES ✨';
    if (this._morphChance > 0) hint += '  ⚡ Dirt can transform!';
    if (this._stubbornChance > 0) hint += '  🔶 Some need 2 clicks!';
    const h = this.scene.add.text(640, 106, hint, {
      fontSize: '14px', fontFamily: 'Arial', color: '#ecf0f1',
    }).setOrigin(0.5).setDepth(8);
    this._els.push(h);

    this._missText = this.scene.add.text(1220, 660, 'Oops: 0', {
      fontSize: '15px', fontFamily: 'Arial Black', color: '#e74c3c',
    }).setOrigin(1, 1).setDepth(10);
    this._els.push(this._missText);

    this._spawnTimer = this.scene.time.addEvent({
      delay: this._spawnDelay, callback: this._spawnSpot, callbackScope: this, loop: true,
    });
    this.scene.time.delayedCall(220, this._spawnSpot, [], this);
    this.scene.time.delayedCall(800, this._spawnSpot, [], this);
  }

  _buildBackground() {
    const floor = this.scene.add.rectangle(640, 400, 1180, 570, 0xf5f0e8, 0.09)
      .setStrokeStyle(1, 0xc8a97a, 0.25).setDepth(2);
    this._els.push(floor);
    const grid = this.scene.add.graphics().setDepth(2);
    grid.lineStyle(1, 0xffffff, 0.04);
    for (let x = 100; x < 1200; x += 80) grid.lineBetween(x, 120, x, 690);
    for (let y = 140; y < 700; y += 80) grid.lineBetween(60, y, 1220, y);
    this._els.push(grid);
  }

  _spawnSpot() {
    if (!this._gameActive) return;

    const sparkleCount = this._spots.filter(s => s.isSparkle).length;
    const isSparkle = sparkleCount < 5 && Math.random() < 0.22;

    // Stubborn check (only dirt spots)
    const isStubborn = !isSparkle && Math.random() < this._stubbornChance;
    const isDrifting = !isSparkle && Math.random() < this._driftChance;
    const willMorph  = !isSparkle && !isStubborn && Math.random() < this._morphChance;

    const x      = Phaser.Math.Between(90, 1190);
    const y      = Phaser.Math.Between(135, 670);
    const radius = isStubborn ? Phaser.Math.Between(38, 55) : Phaser.Math.Between(22, 44);

    const color = isSparkle
      ? SPARK_COLOR
      : isStubborn ? 0x7d3c98
      : DIRT_COLORS[Math.floor(Math.random() * DIRT_COLORS.length)];

    const circle = this.scene.add.circle(x, y, radius, color, isStubborn ? 0.95 : 0.9)
      .setStrokeStyle(3, isSparkle ? 0xadd8e6 : isStubborn ? 0x9b59b6 : 0xc0392b, 0.8)
      .setDepth(11).setAlpha(0).setScale(0.1).setInteractive({ useHandCursor: true });

    const emojiChoices = isSparkle ? '✨'
      : isStubborn ? '🟫'
      : ['🟧', '💦', '🟫'][Math.floor(Math.random() * 3)];
    const emojiSize = Math.round(radius * 0.8);
    const emojiTxt = this.scene.add.text(x, y, emojiChoices, { fontSize: `${emojiSize}px` })
      .setOrigin(0.5).setDepth(12).setAlpha(0).setScale(0.1);

    this.scene.tweens.add({
      targets: [circle, emojiTxt], alpha: 1, scaleX: 1, scaleY: 1, duration: 180, ease: 'Back.Out',
    });

    const lifespan = isSparkle ? this._sparkLifespan : this._dirtyLifespan;
    const spot = { circle, emojiTxt, isSparkle, x, y, isStubborn, hitsLeft: isStubborn ? 2 : 1, morphed: false };
    this._spots.push(spot);
    this._els.push(circle, emojiTxt);

    circle.on('pointerdown', () => this._onSpotClick(spot));

    // Drift movement
    if (isDrifting) {
      const tx = Phaser.Math.Between(90, 1190);
      const ty = Phaser.Math.Between(135, 670);
      this.scene.tweens.add({ targets: [circle, emojiTxt], x: tx, y: ty, duration: lifespan * 0.85, ease: 'Sine.InOut' });
    }

    // Morph: flash warning then become sparkle
    if (willMorph) {
      const morphDelay = lifespan * 0.52;
      this.scene.time.delayedCall(morphDelay, () => {
        if (!circle.active || spot.morphed) return;
        // Warning flash
        this.scene.tweens.add({
          targets: [circle, emojiTxt], alpha: 0.3, yoyo: true, repeat: 5, duration: 120,
          onComplete: () => {
            if (!circle.active || spot.morphed) return;
            spot.isSparkle = true;
            spot.morphed   = true;
            circle.setFillStyle(SPARK_COLOR, 0.9).setStrokeStyle(3, 0xadd8e6, 0.9);
            emojiTxt.setText('✨');
          },
        });
      });
    }

    // Auto-disappear
    const autoTimer = this.scene.time.delayedCall(lifespan, () => {
      if (!circle.active) return;
      this.scene.tweens.add({
        targets: [circle, emojiTxt], alpha: 0, duration: 200,
        onComplete: () => {
          this._removeSpot(spot);
          if (circle.active)   circle.destroy();
          if (emojiTxt.active) emojiTxt.destroy();
        },
      });
    });
    spot.autoTimer = autoTimer;
  }

  _onSpotClick(spot) {
    if (!spot.circle.active || !this._gameActive) return;

    if (spot.isSparkle) {
      spot.circle.disableInteractive();
      this._missCount++;
      this._missText?.setText(`Oops: ${this._missCount}`);
      this._feedback(spot.circle.x, spot.circle.y, 'Oops! ✨', '#5dade2');
      this.scene.tweens.add({
        targets: [spot.circle, spot.emojiTxt], alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 200,
        onComplete: () => { spot.circle.destroy(); spot.emojiTxt.destroy(); },
      });
      this._removeSpot(spot);
      spot.autoTimer?.remove();
      return;
    }

    // Dirt or stubborn
    spot.hitsLeft--;

    if (spot.hitsLeft > 0) {
      // First hit on stubborn spot — shrink and change color
      this._feedback(spot.circle.x, spot.circle.y, '🔨 Hit 1/2!', '#f39c12');
      this.scene.tweens.add({ targets: spot.circle, radius: spot.circle.radius * 0.65, duration: 200 });
      this.scene.tweens.add({ targets: spot.emojiTxt, scaleX: 0.7, scaleY: 0.7, duration: 200 });
      spot.circle.setFillStyle(0x9b59b6, 0.6);
      return;
    }

    // Cleaned
    this.score++;
    spot.circle.disableInteractive();
    this._removeSpot(spot);
    spot.autoTimer?.remove();
    this._feedback(spot.circle.x, spot.circle.y, spot.isStubborn ? 'Clean! ✓✓' : 'Clean! ✓', '#2ecc71');
    this.scene._updateScoreText(this.score, this.maxScore);

    this.scene.tweens.add({
      targets: [spot.circle, spot.emojiTxt], scaleX: 2, scaleY: 2, alpha: 0, duration: 220,
      onComplete: () => { spot.circle.destroy(); spot.emojiTxt.destroy(); },
    });

    if (this.score >= this.maxScore) {
      this._gameActive = false;
      this.scene.time.delayedCall(350, () => this.scene._triggerEarlyEnd());
    }
  }

  _removeSpot(spot) {
    this._spots = this._spots.filter(s => s !== spot);
  }

  _feedback(x, y, text, color) {
    const t = this.scene.add.text(x, y - 12, text, {
      fontSize: '18px', fontFamily: 'Arial Black', color,
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: t, y: y - 55, alpha: 0, duration: 550,
      onComplete: () => { if (t.active) t.destroy(); },
    });
  }

  cleanup() {
    this._gameActive = false;
    this._spawnTimer?.remove();
    this._spots.forEach(s => {
      s.autoTimer?.remove();
      if (s.circle?.active)   s.circle.destroy();
      if (s.emojiTxt?.active) s.emojiTxt.destroy();
    });
    this._els.forEach(el => { if (el?.active) el.destroy(); });
    this._spots = [];
  }

  getPerformance() {
    return Math.max(0, this.score - this._missCount) / this.maxScore;
  }
}
