import Phaser from 'phaser';

const SHELVES = [
  { id: 'produce', label: 'Produce', color: 0xe74c3c, emoji: '🍎', textColor: '#e74c3c' },
  { id: 'dairy',   label: 'Dairy',   color: 0x3498db, emoji: '🥛', textColor: '#3498db' },
  { id: 'grains',  label: 'Grains',  color: 0xf1c40f, emoji: '🌾', textColor: '#f1c40f' },
  { id: 'veggie',  label: 'Veggies', color: 0x27ae60, emoji: '🥦', textColor: '#2ecc71' },
];

const ITEMS = [
  { name: 'Apple',    shelf: 'produce', emoji: '🍎' },
  { name: 'Tomato',   shelf: 'produce', emoji: '🍅' },
  { name: 'Chicken',  shelf: 'produce', emoji: '🍗' },
  { name: 'Steak',    shelf: 'produce', emoji: '🥩' },
  { name: 'Milk',     shelf: 'dairy',   emoji: '🥛' },
  { name: 'Cheese',   shelf: 'dairy',   emoji: '🧀' },
  { name: 'Yogurt',   shelf: 'dairy',   emoji: '🍦' },
  { name: 'Butter',   shelf: 'dairy',   emoji: '🧈' },
  { name: 'Bread',    shelf: 'grains',  emoji: '🍞' },
  { name: 'Rice',     shelf: 'grains',  emoji: '🍚' },
  { name: 'Pasta',    shelf: 'grains',  emoji: '🍝' },
  { name: 'Cereal',   shelf: 'grains',  emoji: '🥣' },
  { name: 'Broccoli', shelf: 'veggie',  emoji: '🥦' },
  { name: 'Spinach',  shelf: 'veggie',  emoji: '🥬' },
  { name: 'Cucumber', shelf: 'veggie',  emoji: '🥒' },
  { name: 'Peas',     shelf: 'veggie',  emoji: '🫛' },
];

const TIER_CONFIG = {
  1: { maxItems: 14 },
  2: { maxItems: 18 },
  3: { maxItems: 24 },
};

export class ShopGame {
  constructor(scene, tier = 1, skill = 1) {
    this.scene    = scene;
    this.score    = 0;
    this.maxScore = (TIER_CONFIG[tier] || TIER_CONFIG[1]).maxItems;
    this._skill   = skill;
    this._els     = [];
    this._combo   = 0;
    this._queue   = [];
    this._currentItem  = null;
    this._shelfBtns    = [];
    this._itemDisplay  = null;
    this._comboText    = null;
    this._answered     = false;
    this._gameActive   = true;
    this._timerGfx     = null;
    this._timerEvent   = null;
    this._timerUpdateEvent = null;

    // Skill-scaled mechanics
    // Skill 3+: auto-advance if no answer within time limit
    this._autoAdvanceSec = skill >= 3 ? Math.max(1.6, 4.6 - skill * 0.38) : 0;
    // Skill 6+: item name hidden (emoji only — must know which emoji = which shelf)
    this._hideItemName   = skill >= 6;
    // Skill 9+: emoji also briefly hidden on entry (teaser mode — 0.8s blackout)
    this._teaserMode     = skill >= 9;
  }

  start() {
    let hint = 'Sort each item to the correct shelf category!';
    if (this._autoAdvanceSec > 0) hint += `  ⏱ ${this._autoAdvanceSec.toFixed(1)}s per item`;
    if (this._hideItemName)       hint += '  🙈 Names hidden!';
    if (this._teaserMode)         hint += '  ⚡ Teaser mode!';
    const h = this.scene.add.text(640, 106, hint, {
      fontSize: '14px', fontFamily: 'Arial', color: '#bdc3c7',
    }).setOrigin(0.5).setDepth(8);
    this._els.push(h);

    const pool = this.maxScore > ITEMS.length
      ? [...ITEMS, ...ITEMS].slice(0, this.maxScore)
      : [...ITEMS];
    this._queue = Phaser.Utils.Array.Shuffle(pool).slice(0, this.maxScore);

    this._buildShelves();
    this._buildItemDisplay();
    this._buildComboText();
    this._nextItem();
  }

  _buildShelves() {
    const configs = [
      { x: 105,  y: 300, shelf: SHELVES[0] },
      { x: 105,  y: 500, shelf: SHELVES[1] },
      { x: 1175, y: 300, shelf: SHELVES[2] },
      { x: 1175, y: 500, shelf: SHELVES[3] },
    ];
    configs.forEach(cfg => {
      const { x, y, shelf } = cfg;
      const btn = this.scene.add.rectangle(x, y, 170, 160, shelf.color, 0.18)
        .setStrokeStyle(3, shelf.color, 0.8).setDepth(9).setInteractive({ useHandCursor: true });
      const icon = this.scene.add.text(x, y - 28, shelf.emoji, { fontSize: '36px' }).setOrigin(0.5).setDepth(10);
      const lbl  = this.scene.add.text(x, y + 28, shelf.label, {
        fontSize: '16px', fontFamily: 'Arial Black', color: cfg.shelf.textColor,
      }).setOrigin(0.5).setDepth(10);

      btn.on('pointerover', () => btn.setFillStyle(shelf.color, 0.45));
      btn.on('pointerout',  () => btn.setFillStyle(shelf.color, 0.18));
      btn.on('pointerdown', () => this._onShelfClick(shelf.id, btn, shelf));

      this._els.push(btn, icon, lbl);
      this._shelfBtns.push({ btn, shelfId: shelf.id, shelf });
    });
  }

  _buildItemDisplay() {
    this._itemBg    = this.scene.add.rectangle(640, 380, 300, 220, 0x1a252f, 0.9).setStrokeStyle(3, 0x95a5a6, 0.6).setDepth(9);
    this._itemEmoji = this.scene.add.text(640, 340, '?', { fontSize: '72px' }).setOrigin(0.5).setDepth(10);
    this._itemName  = this.scene.add.text(640, 430, '', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ecf0f1',
    }).setOrigin(0.5).setDepth(10);
    this._els.push(this._itemBg, this._itemEmoji, this._itemName);
  }

  _buildComboText() {
    this._comboText = this.scene.add.text(640, 560, '', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#f39c12',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);
    this._els.push(this._comboText);
  }

  _nextItem() {
    if (!this._gameActive) return;
    if (this._queue.length === 0) { this.scene._triggerEarlyEnd(); return; }
    this._currentItem = this._queue.pop();
    this._answered    = false;

    const shelf = SHELVES.find(s => s.id === this._currentItem.shelf);
    this._itemBg.setStrokeStyle(3, shelf?.color || 0x95a5a6, 0.8);

    // Teaser mode: briefly show nothing then reveal emoji only
    if (this._teaserMode) {
      this._itemEmoji.setText('❔').setAlpha(1);
      this._itemName.setText('').setVisible(false);
      this.scene.time.delayedCall(800, () => {
        if (!this._gameActive || !this._itemEmoji?.active) return;
        this._itemEmoji.setText(this._currentItem.emoji);
        this.scene.tweens.add({
          targets: [this._itemEmoji], alpha: { from: 0, to: 1 }, scaleX: { from: 0.5, to: 1 }, scaleY: { from: 0.5, to: 1 },
          duration: 180, ease: 'Back.Out',
        });
        this._startItemTimer();
      });
      return;
    }

    // Normal reveal
    this._itemEmoji.setText(this._currentItem.emoji);
    this._itemName.setText(this._hideItemName ? '' : this._currentItem.name);
    this._itemName.setVisible(!this._hideItemName);

    this.scene.tweens.add({
      targets: [this._itemEmoji, this._itemName],
      alpha: { from: 0, to: 1 }, scaleX: { from: 0.5, to: 1 }, scaleY: { from: 0.5, to: 1 },
      duration: 180, ease: 'Back.Out',
    });

    this._startItemTimer();
  }

  _startItemTimer() {
    if (this._autoAdvanceSec <= 0) return;

    // Clear old timer
    this._timerEvent?.remove();
    this._timerUpdateEvent?.remove();
    if (this._timerGfx?.active) { this._timerGfx.destroy(); this._timerGfx = null; }

    const cx = 640, cy = 380, r = 132;
    const totalMs = this._autoAdvanceSec * 1000;
    const startTime = this.scene.time.now;

    this._timerGfx = this.scene.add.graphics().setDepth(8);
    this._els.push(this._timerGfx);

    // Arc countdown ring around the item box
    this._timerUpdateEvent = this.scene.time.addEvent({
      delay: 45,
      loop: true,
      callback: () => {
        if (!this._gameActive || !this._timerGfx?.active) return;
        const elapsed = this.scene.time.now - startTime;
        const frac = Math.max(0, 1 - elapsed / totalMs);
        this._timerGfx.clear();
        const color = frac > 0.5 ? 0x2ecc71 : frac > 0.25 ? 0xf39c12 : 0xe74c3c;
        this._timerGfx.lineStyle(5, color, 0.75);
        this._timerGfx.beginPath();
        this._timerGfx.arc(cx, cy, r, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + frac * 360), false);
        this._timerGfx.strokePath();
      },
    });

    // Auto-wrong when time runs out
    this._timerEvent = this.scene.time.delayedCall(totalMs, () => {
      if (this._answered || !this._gameActive) return;
      this._answered = true;
      this._combo = 0;
      this._comboText.setText('');
      this._timerGfx?.destroy(); this._timerGfx = null;
      this._timerUpdateEvent?.remove();
      this._feedback(640, 380, '⏰ Too slow!', '#e74c3c');
      const correctShelf = SHELVES.find(s => s.id === this._currentItem.shelf);
      this._feedback(640, 414, `→ ${correctShelf?.label}`, '#f39c12');
      this.scene.tweens.add({
        targets: [this._itemEmoji, this._itemName], alpha: 0, y: '-=30', duration: 220,
        onComplete: () => {
          if (!this._gameActive) return;
          if (this._itemEmoji?.active) this._itemEmoji.setY(340);
          if (this._itemName?.active)  this._itemName.setY(430);
          this.scene.time.delayedCall(80, () => this._nextItem());
        },
      });
    });
  }

  _cancelItemTimer() {
    this._timerEvent?.remove();
    this._timerUpdateEvent?.remove();
    if (this._timerGfx?.active) { this._timerGfx.destroy(); this._timerGfx = null; }
  }

  _onShelfClick(shelfId, btn, shelfObj) {
    if (this._answered || !this._currentItem || !this._gameActive) return;
    this._answered = true;
    this._cancelItemTimer();

    const correct = shelfId === this._currentItem.shelf;

    if (correct) {
      this.score++;
      this._combo++;
      btn.setFillStyle(shelfObj.color, 0.8);
      const bonusTxt = this._combo >= 3 ? ` 🔥 ${this._combo}x` : '';
      this._feedback(btn.x, btn.y, `✓${bonusTxt}`, '#2ecc71');
      this._comboText.setText(this._combo >= 3 ? `🔥 ${this._combo} Combo!` : '');
      this.scene._updateScoreText(this.score, this.maxScore);
    } else {
      this._combo = 0;
      this._comboText.setText('');
      const correctShelf = SHELVES.find(s => s.id === this._currentItem.shelf);
      this._feedback(640, 380, `No! → ${correctShelf?.label}`, '#e74c3c');
    }

    this.scene.tweens.add({
      targets: [this._itemEmoji, this._itemName], alpha: 0, y: '-=30', duration: 200,
      onComplete: () => {
        if (!this._gameActive) return;
        if (this._itemEmoji?.active) this._itemEmoji.setY(340);
        if (this._itemName?.active)  this._itemName.setY(430);
        const shelf = SHELVES.find(s => s.id === shelfId);
        if (shelf && btn?.active) btn.setFillStyle(shelf.color, 0.18);
        this.scene.time.delayedCall(60, () => this._nextItem());
      },
    });
  }

  _feedback(x, y, text, color) {
    const t = this.scene.add.text(x, y - 20, text, {
      fontSize: '20px', fontFamily: 'Arial Black', color,
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: t, y: y - 60, alpha: 0, duration: 550,
      onComplete: () => t.destroy(),
    });
  }

  cleanup() {
    this._gameActive = false;
    this._cancelItemTimer();
    this._els.forEach(el => { if (el?.active) el.destroy(); });
    if (this._itemBg?.active)    this._itemBg.destroy();
    if (this._itemEmoji?.active) this._itemEmoji.destroy();
    if (this._itemName?.active)  this._itemName.destroy();
    if (this._comboText?.active) this._comboText.destroy();
  }

  getPerformance() { return this.score / this.maxScore; }
}
