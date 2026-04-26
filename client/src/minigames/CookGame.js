import Phaser from 'phaser';

const INGREDIENTS = [
  { id: 'tomato',  emoji: '🍅', color: 0xe74c3c },
  { id: 'onion',   emoji: '🧅', color: 0xf39c12 },
  { id: 'garlic',  emoji: '🧄', color: 0xfdebd0 },
  { id: 'chili',   emoji: '🌶️', color: 0xc0392b },
  { id: 'lettuce', emoji: '🥬', color: 0x27ae60 },
  { id: 'egg',     emoji: '🥚', color: 0xfffde7 },
];
const FORBIDDEN = { id: 'forbidden', emoji: '☠️', color: 0x8e44ad };

const POT_POSITIONS = [
  [200, 260], [420, 220], [640, 270], [860, 230],
  [310, 460], [530, 500], [750, 450], [970, 490],
];

const TIER_CONFIG = {
  1: { maxRecipes: 6,  recipeLen: 3 },
  2: { maxRecipes: 8,  recipeLen: 4 },
  3: { maxRecipes: 10, recipeLen: 5 },
};

export class CookGame {
  constructor(scene, tier = 1, skill = 1) {
    this.scene = scene;
    const cfg = TIER_CONFIG[tier] || TIER_CONFIG[1];
    this.score      = 0;
    this.maxScore   = cfg.maxRecipes;
    this._recipeLen = cfg.recipeLen;
    this._skill     = skill;
    this._els       = [];
    this._pots      = [];
    this._recipe    = [];
    this._step      = 0;
    this._recipeCircles  = [];
    this._highlightTimer = null;
    this._hideRecipeTimer = null;
    this._swapTimer      = null;

    // Skill-scaled mechanics
    this._floatDuration   = Math.max(650, 1300 - skill * 65);          // pots float faster at high skill
    this._highlightTimeout = skill >= 4 ? Math.max(1400, 4200 - skill * 420) : 0; // ring fades → act fast
    this._hasForbidden    = skill >= 5;   // ☠️ pots that reset recipe step
    this._hasHideRecipe   = skill >= 7;   // recipe hides after 2.5s reveal (memory mode)
    this._hasSwapPots     = skill >= 8;   // two pots periodically swap positions
  }

  start() {
    this._showInstructions();
    this._spawnPots();
    this._generateRecipe();
    this._drawRecipeBar();
    if (this._hasSwapPots) this._startSwapTimer();
  }

  _showInstructions() {
    let hint = 'Click the ingredients in recipe order!';
    if (this._hasForbidden)  hint += '  Avoid ☠️';
    if (this._hasHideRecipe) hint += '  🧠 Memory mode!';
    const t = this.scene.add.text(640, 106, hint, {
      fontSize: '14px', fontFamily: 'Arial', color: '#bdc3c7',
    }).setOrigin(0.5).setDepth(8);
    this._els.push(t);
  }

  _spawnPots() {
    const pool = [...INGREDIENTS, ...INGREDIENTS];
    Phaser.Utils.Array.Shuffle(pool);
    const types = pool.slice(0, 8);

    if (this._hasForbidden) {
      // Replace 2 non-consecutive slots with forbidden
      types[2] = FORBIDDEN;
      types[6] = FORBIDDEN;
    }

    types.forEach((ing, i) => {
      const [x, y] = POT_POSITIONS[i];
      const pot = this._makePot(x, y, ing);
      this._pots.push(pot);
      this._els.push(pot.container);
    });
  }

  _makePot(x, y, ing) {
    const bg   = this.scene.add.circle(0, 0, 40, ing.color, 0.25).setStrokeStyle(3, ing.color, 0.8);
    const ring = this.scene.add.circle(0, 0, 40).setStrokeStyle(3, 0xffffff, 0);
    const label = this.scene.add.text(0, 0, ing.emoji, { fontSize: '30px' }).setOrigin(0.5);

    const c = this.scene.add.container(x, y, [bg, ring, label]).setDepth(10);
    c.setSize(80, 80).setInteractive({ useHandCursor: true });

    c.on('pointerover', () => bg.setAlpha(0.55));
    c.on('pointerout',  () => bg.setAlpha(0.25));
    c.on('pointerdown', () => this._onPotClick(c, ing));

    this.scene.tweens.add({
      targets: c, y: y + 8, yoyo: true, repeat: -1,
      duration: this._floatDuration + Math.random() * 250, ease: 'Sine.InOut',
    });

    return { container: c, ing, bg, ring, origY: y };
  }

  _startSwapTimer() {
    const swapDelay = 4500 + Math.random() * 2000;
    this._swapTimer = this.scene.time.addEvent({
      delay: swapDelay,
      loop: true,
      callback: () => {
        const moveable = this._pots.filter(p => p.ing.id !== 'forbidden');
        if (moveable.length < 2) return;
        Phaser.Utils.Array.Shuffle(moveable);
        const [a, b] = moveable;
        const newAX = b.container.x;
        const newBX = a.container.x;
        this.scene.tweens.killTweensOf(a.container);
        this.scene.tweens.killTweensOf(b.container);
        this.scene.tweens.add({
          targets: a.container, x: newAX, y: a.origY, duration: 550, ease: 'Cubic.InOut',
          onComplete: () => {
            this.scene.tweens.add({ targets: a.container, y: a.origY + 8, yoyo: true, repeat: -1, duration: this._floatDuration, ease: 'Sine.InOut' });
          },
        });
        this.scene.tweens.add({
          targets: b.container, x: newBX, y: b.origY, duration: 550, ease: 'Cubic.InOut',
          onComplete: () => {
            this.scene.tweens.add({ targets: b.container, y: b.origY + 8, yoyo: true, repeat: -1, duration: this._floatDuration, ease: 'Sine.InOut' });
          },
        });
        // Warn flash
        this._feedback(640, 310, '⚠️ Pots moved!', '#f39c12');
      },
    });
  }

  _generateRecipe() {
    this._recipe = [];
    for (let i = 0; i < this._recipeLen; i++) {
      this._recipe.push(INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)]);
    }
    this._step = 0;
    this._updateRecipeBar();
    this._highlightTargets();

    // Memory mode: reveal recipe for 2.5s, then hide upcoming steps
    if (this._hasHideRecipe) {
      this._hideRecipeTimer?.remove();
      this._hideRecipeTimer = this.scene.time.delayedCall(2500, () => this._hideRecipeBar());
    }
  }

  _hideRecipeBar() {
    this._recipeCircles.forEach((rc, i) => {
      if (i > this._step) {
        rc.emojiT.setText('?');
        rc.circle.setFillStyle(0x2c3e50, 0.5).setStrokeStyle(2, 0x4a4a6a, 0.4);
      } else if (i === this._step) {
        // Keep current step visible but hide the emoji to require memory
        rc.emojiT.setText('?');
      }
    });
  }

  _drawRecipeBar() {
    const label = this.scene.add.text(420, 150, 'Recipe:', {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#ecf0f1',
    }).setOrigin(0, 0.5).setDepth(9);
    this._els.push(label);

    const startX = 640 - ((this._recipeLen - 1) * 40);
    this._recipeCircles = Array.from({ length: this._recipeLen }, (_, i) => {
      const x = startX + i * 80;
      const circle = this.scene.add.circle(x, 150, 28, 0x2c3e50, 1)
        .setStrokeStyle(2, 0x95a5a6, 0.6).setDepth(9);
      const emojiT = this.scene.add.text(x, 150, '?', { fontSize: '22px' })
        .setOrigin(0.5).setDepth(10);
      this._els.push(circle, emojiT);
      return { circle, emojiT };
    });
    this._updateRecipeBar();
  }

  _updateRecipeBar() {
    this._recipeCircles.forEach((rc, i) => {
      const ing = this._recipe[i];
      if (!ing) return;
      if (i < this._step) {
        rc.circle.setFillStyle(0x2ecc71, 0.9);
        rc.emojiT.setText('✓');
      } else if (i === this._step) {
        rc.circle.setFillStyle(ing.color, 1.0).setStrokeStyle(3, 0xffffff, 0.9);
        rc.emojiT.setText(ing.emoji);
        this.scene.tweens.add({ targets: rc.circle, scaleX: 1.2, scaleY: 1.2, yoyo: true, repeat: 2, duration: 200 });
      } else {
        rc.circle.setFillStyle(ing.color, 0.25).setStrokeStyle(2, 0x95a5a6, 0.4);
        rc.emojiT.setText(ing.emoji);
      }
    });
  }

  _highlightTargets() {
    const target = this._recipe[this._step];
    this._pots.forEach(pot => {
      this.scene.tweens.killTweensOf(pot.ring);
      if (target && pot.ing.id === target.id) {
        pot.ring.setStrokeStyle(4, 0xffffff, 1);
        this.scene.tweens.add({ targets: pot.ring, scaleX: 1.3, scaleY: 1.3, yoyo: true, repeat: -1, duration: 400 });
      } else {
        pot.ring.setStrokeStyle(3, 0xffffff, 0);
      }
    });

    // Remove highlight after timeout — player must click before glow fades
    if (this._highlightTimeout > 0) {
      this._highlightTimer?.remove();
      this._highlightTimer = this.scene.time.delayedCall(this._highlightTimeout, () => {
        this._pots.forEach(pot => {
          this.scene.tweens.killTweensOf(pot.ring);
          pot.ring.setStrokeStyle(3, 0xffffff, 0);
        });
      });
    }
  }

  _onPotClick(container, ing) {
    const expected = this._recipe[this._step];
    if (!expected) return;

    if (ing.id === 'forbidden') {
      this._step = 0;
      this._feedback(container.x, container.y, '☠️ Reset!', '#8e44ad');
      this._updateRecipeBar();
      this._highlightTargets();
      // Shake pots as penalty
      this._pots.forEach(p => {
        this.scene.tweens.add({ targets: p.container, x: p.container.x + 8, yoyo: true, repeat: 3, duration: 55 });
      });
      return;
    }

    if (ing.id === expected.id) {
      this._step++;
      this._feedback(container.x, container.y, '✓', '#2ecc71');
      this._updateRecipeBar();

      if (this._step >= this._recipeLen) {
        this.score++;
        this.scene._updateScoreText(this.score, this.maxScore);
        this._feedback(640, 340, `Recipe ${this.score}/${this.maxScore}!`, '#f1c40f');

        if (this.score >= this.maxScore) {
          this.scene.time.delayedCall(400, () => this.scene._triggerEarlyEnd());
        } else {
          this.scene.time.delayedCall(500, () => this._generateRecipe());
        }
      } else {
        this._highlightTargets();
      }
    } else {
      this._step = 0;
      this._feedback(container.x, container.y, '✗', '#e74c3c');
      this._updateRecipeBar();
      this._highlightTargets();
    }
  }

  _feedback(x, y, text, color) {
    const t = this.scene.add.text(x, y - 10, text, {
      fontSize: '26px', fontFamily: 'Arial Black', color,
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: t, y: y - 60, alpha: 0, duration: 550,
      onComplete: () => t.destroy(),
    });
  }

  cleanup() {
    this._highlightTimer?.remove();
    this._hideRecipeTimer?.remove();
    this._swapTimer?.remove();
    this._els.forEach(el => { if (el?.active) el.destroy(); });
    this._pots.forEach(p => {
      this.scene.tweens.killTweensOf(p.container);
      this.scene.tweens.killTweensOf(p.ring);
      if (p.container?.active) p.container.destroy();
    });
  }

  getPerformance() { return this.score / this.maxScore; }
}
