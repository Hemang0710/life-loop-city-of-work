import Phaser from 'phaser';

const BASE_POSITIONS = [
  [130, 190], [480, 160], [820, 200], [1130, 180],
  [200, 480], [560, 510], [890, 460], [1100, 520],
  [300, 310], [680, 340], [960, 290], [1050, 390],
];

const TIER_CONFIG = {
  1: { maxDeliveries: 8 },
  2: { maxDeliveries: 10 },
  3: { maxDeliveries: 12 },
};

export class DeliveryGame {
  constructor(scene, tier = 1, skill = 1) {
    this.scene    = scene;
    this.score    = 0;
    this.maxScore = (TIER_CONFIG[tier] || TIER_CONFIG[1]).maxDeliveries;
    this._next    = 1;
    this._houses  = [];
    this._els     = [];
    this._routeGfx = null;
    this._lastX   = -1;
    this._lastY   = -1;
    this._gameActive = true;

    // Skill-scaled mechanics
    // Skill 4+: house number hides after a delay (memory challenge)
    this._hideNumberDelay = skill >= 4 ? Math.max(1200, 3500 - skill * 350) : 0;
    // Skill 5+: decoy "?" houses that waste time if clicked
    this._hasDecoys = skill >= 5;
    // Skill 7+: hidden houses slowly drift after their number disappears
    this._hasDrift = skill >= 7;
    // Skill 6+: only reveal next N houses ahead (rest start hidden)
    this._revealBatch = skill >= 6 ? (skill >= 8 ? 3 : 4) : 0;
  }

  start() {
    const hint = this.scene.add.text(640, 106,
      `Click houses in order: 1 → 2 → … → ${this.maxScore}` +
      (this._hideNumberDelay > 0 ? '  ⚠️ Numbers hide — remember them!' : ''), {
      fontSize: '14px', fontFamily: 'Arial', color: '#bdc3c7',
    }).setOrigin(0.5).setDepth(8);
    this._els.push(hint);

    this._routeGfx = this.scene.add.graphics().setDepth(8);
    this._els.push(this._routeGfx);

    this._nextLabel = this.scene.add.text(640, 650, 'Deliver to: #1', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#f1c40f',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);
    this._els.push(this._nextLabel);

    this._spawnHouses();
    if (this._hasDecoys) this._spawnDecoys();
  }

  _spawnHouses() {
    const positions = BASE_POSITIONS.slice(0, this.maxScore).map(([x, y]) => [
      x + Phaser.Math.Between(-20, 20),
      y + Phaser.Math.Between(-15, 15),
    ]);
    this._houses = positions.map((pos, i) => this._makeHouse(pos[0], pos[1], i + 1));
  }

  _makeHouse(x, y, num) {
    const container = this.scene.add.container(x, y).setDepth(10);

    const houseBg = this.scene.add.rectangle(0, 4, 56, 44, 0xecf0f1).setStrokeStyle(2, 0x95a5a6);
    const roof    = this.scene.add.triangle(0, -20, -32, 4, 32, 4, 0, -28, 0xe74c3c);
    const door    = this.scene.add.rectangle(0, 18, 14, 18, 0x8b6914);
    const numText = this.scene.add.text(0, -2, String(num), {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#2c3e50',
    }).setOrigin(0.5);

    container.add([houseBg, roof, door, numText]);
    container.setSize(60, 60).setInteractive({ useHandCursor: true });

    // Batch reveal — houses beyond first batch start hidden
    const initialAlpha = (this._revealBatch > 0 && num > this._revealBatch) ? 0 : 1;
    container.setAlpha(initialAlpha);

    container.on('pointerover', () => { if (!house.delivered) houseBg.setFillStyle(0x85c1e9); });
    container.on('pointerout',  () => { if (!house.delivered) houseBg.setFillStyle(0xecf0f1); });
    container.on('pointerdown', () => this._onHouseClick(house, x, y, numText, houseBg, roof));

    // Idle bounce
    const floatTween = this.scene.tweens.add({
      targets: container, y: y - 5, yoyo: true, repeat: -1,
      duration: 900 + Math.random() * 400, ease: 'Sine.InOut',
      delay: Math.random() * 500,
    });

    const house = { num, container, delivered: false, numText, houseBg, roof, floatTween, origX: x, origY: y };

    // Schedule number hide
    if (this._hideNumberDelay > 0) {
      house.hideTimer = this.scene.time.delayedCall(this._hideNumberDelay, () => {
        if (house.delivered || !numText.active) return;
        numText.setText('?').setColor('#888888');

        // Drift after number hides
        if (this._hasDrift && container.active) {
          const dx = Phaser.Math.Between(-28, 28);
          const dy = Phaser.Math.Between(-18, 18);
          this.scene.tweens.add({ targets: container, x: x + dx, y: y + dy, duration: 3200, ease: 'Sine.InOut' });
        }
      });
    }

    this._els.push(container);
    return house;
  }

  _spawnDecoys() {
    // 2 ghost houses that look slightly different — clicking wastes time
    const decoySpots = [
      [Phaser.Math.Between(120, 380), Phaser.Math.Between(220, 430)],
      [Phaser.Math.Between(850, 1150), Phaser.Math.Between(350, 600)],
    ];
    decoySpots.forEach(([x, y]) => {
      const container = this.scene.add.container(x, y).setDepth(9);
      const bg   = this.scene.add.rectangle(0, 4, 52, 40, 0xbbbbbb).setStrokeStyle(2, 0x777777, 0.8);
      const roof = this.scene.add.triangle(0, -18, -28, 4, 28, 4, 0, -24, 0x888888);
      const door = this.scene.add.rectangle(0, 17, 12, 16, 0x666666);
      const xt   = this.scene.add.text(0, -2, '?', {
        fontSize: '20px', fontFamily: 'Arial Black', color: '#777777',
      }).setOrigin(0.5);
      container.add([bg, roof, door, xt]);
      container.setSize(58, 58).setInteractive({ useHandCursor: true });

      container.on('pointerover', () => bg.setFillStyle(0xdddddd));
      container.on('pointerout',  () => bg.setFillStyle(0xbbbbbb));
      container.on('pointerdown', () => {
        this._feedback(x, y - 52, '❌ Decoy! Stay on route!', '#e74c3c');
        container.setAlpha(0.4);
        container.disableInteractive();
        this.scene.time.delayedCall(800, () => {
          if (container.active) { container.setAlpha(1); container.setInteractive({ useHandCursor: true }); }
        });
      });
      this.scene.tweens.add({ targets: container, y: y - 4, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.InOut' });
      this._els.push(container);
    });
  }

  _onHouseClick(house, ox, oy, numText, houseBg, roof) {
    if (house.delivered || !this._gameActive) return;

    if (house.num !== this._next) {
      this.scene.tweens.add({
        targets: house.container, x: house.container.x + 7, yoyo: true, repeat: 3, duration: 55,
        onComplete: () => { house.container.x = house.container.x; },
      });
      this._feedback(house.container.x, house.container.y - 50, `Wrong! Go to #${this._next}`, '#e74c3c');
      return;
    }

    // Correct delivery
    house.delivered = true;
    house.hideTimer?.remove();
    this.score++;
    this._next++;

    if (this._lastX >= 0) {
      this._routeGfx.lineStyle(3, 0x2ecc71, 0.7);
      this._routeGfx.lineBetween(this._lastX, this._lastY, ox, oy);
    }
    this._lastX = ox; this._lastY = oy;

    this.scene.tweens.killTweensOf(house.container);
    houseBg.setFillStyle(0x2ecc71, 1);
    roof.setFillStyle(0x1a7245);
    numText.setText('✓').setColor('#fff');
    house.container.disableInteractive();

    this._feedback(house.container.x, house.container.y - 50, '+1 Delivered!', '#2ecc71');
    this.scene._updateScoreText(this.score, this.maxScore);

    // Batch reveal — show next house in queue
    if (this._revealBatch > 0) {
      const revealNum = this._next + this._revealBatch - 1;
      const toReveal = this._houses.find(h => h.num === revealNum);
      if (toReveal && toReveal.container.alpha === 0) {
        this.scene.tweens.add({ targets: toReveal.container, alpha: 1, duration: 350 });
      }
    }

    if (this._next > this.maxScore) {
      this._feedback(640, 340, '🎉 All delivered!', '#f1c40f');
      this.scene.time.delayedCall(700, () => this.scene._triggerEarlyEnd());
    } else {
      this._nextLabel.setText(`Deliver to: #${this._next}`);
    }
  }

  _feedback(x, y, text, color) {
    const t = this.scene.add.text(x, y, text, {
      fontSize: '18px', fontFamily: 'Arial Black', color,
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: t, y: y - 40, alpha: 0, duration: 600,
      onComplete: () => t.destroy(),
    });
  }

  cleanup() {
    this._gameActive = false;
    this._houses.forEach(h => {
      h.hideTimer?.remove();
      this.scene.tweens.killTweensOf(h.container);
    });
    this._els.forEach(el => { if (el?.active) el.destroy(); });
  }

  getPerformance() { return this.score / this.maxScore; }
}
