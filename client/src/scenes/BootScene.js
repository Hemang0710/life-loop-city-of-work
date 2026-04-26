import Phaser from 'phaser';
import { playerSystem } from '../systems/store.js';
import { showTutorial } from '../ui/TutorialOverlay.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Deep background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0f0e17);

    // Stars
    const starGfx = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H * 0.65);
      const r = Phaser.Math.FloatBetween(0.8, 2.5);
      const a = Phaser.Math.FloatBetween(0.3, 0.9);
      starGfx.fillStyle(0xffffff, a);
      starGfx.fillCircle(x, y, r);
    }

    // Skyline silhouette
    const sky = this.add.graphics();
    sky.fillStyle(0x16152a, 1);
    const buildings = [
      [0,220,120],[130,150,90],[240,200,100],[350,160,130],[495,190,90],
      [600,170,110],[720,230,100],[840,180,120],[975,200,80],[1070,190,130],
      [1215,160,90],[1320,210,110],[1450,180,100],[1570,200,90],[1680,170,120],
    ];
    buildings.forEach(([x, h, w]) => sky.fillRect(x, H * 0.35, w, h));

    // Glow
    const glow = this.add.rectangle(W / 2, H * 0.17, 500, 120, 0xf1c40f, 0.06);
    this.tweens.add({ targets: glow, alpha: { from: 0.04, to: 0.12 }, yoyo: true, repeat: -1, duration: 1800 });

    // Title
    this.add.text(W / 2, H * 0.17, 'Life Loop', {
      fontSize: '72px', fontFamily: '"Arial Black", sans-serif',
      color: '#f1c40f', stroke: '#e67e22', strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.3, 'City of Work', {
      fontSize: '34px', fontFamily: 'Arial, sans-serif', color: '#ecf0f1', alpha: 0.88,
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.385, 'Cursor Vibe Jam 2026', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#6c6b8a',
    }).setOrigin(0.5);

    this._showNameOverlay();
  }

  _showNameOverlay() {
    const defaultName = playerSystem.get('name') || '';

    this._overlay = document.createElement('div');
    this._overlay.style.cssText = [
      'position:fixed', 'inset:0', 'display:flex', 'align-items:center',
      'justify-content:center', 'flex-direction:column', 'z-index:9999',
      'pointer-events:none',
    ].join(';');

    this._overlay.innerHTML = `
      <div style="
        pointer-events:all;
        text-align:center;
        background:rgba(15,14,23,0.92);
        border:1px solid rgba(52,152,219,0.35);
        border-radius:16px;
        padding:36px 48px 28px;
        box-shadow:0 8px 40px rgba(0,0,0,0.7);
        margin-top:180px;
      ">
        <div style="color:#8a899a;font-family:Arial,sans-serif;font-size:13px;letter-spacing:2px;margin-bottom:10px;text-transform:uppercase;">Enter your name</div>
        <input id="ll-name" type="text" maxlength="20"
          value="${defaultName}"
          placeholder="Worker_4200"
          autocomplete="off" spellcheck="false"
          style="
            background:rgba(44,62,80,0.8);
            border:2px solid #3498db;
            border-radius:10px;
            color:#ecf0f1;
            font-size:22px;
            font-family:Arial,sans-serif;
            padding:10px 24px;
            width:280px;
            text-align:center;
            outline:none;
            display:block;
            margin:0 auto 18px;
            box-shadow:0 0 18px rgba(52,152,219,0.3);
          "
        />
        <button id="ll-start" style="
          background:linear-gradient(135deg,#27ae60,#2ecc71);
          border:none; border-radius:10px;
          color:#fff; font-size:20px;
          font-family:'Arial Black',sans-serif;
          padding:14px 52px; cursor:pointer;
          letter-spacing:2px;
          box-shadow:0 4px 18px rgba(39,174,96,0.5);
          width:280px;
        ">PLAY NOW ▶</button>
        <div style="color:#555468;font-size:13px;font-family:Arial,sans-serif;margin-top:16px;line-height:1.8;">
          WASD / Arrows · <b style="color:#7f8c8d">E</b> interact · <b style="color:#7f8c8d">T</b> chat · <b style="color:#7f8c8d">G</b> gift<br>
          <span style="color:#3d3c55">Touch controls shown on mobile</span>
        </div>
      </div>
    `;

    document.body.appendChild(this._overlay);

    const nameEl = document.getElementById('ll-name');
    const btnEl  = document.getElementById('ll-start');
    setTimeout(() => nameEl?.select(), 80);

    const start = () => {
      const raw = (nameEl?.value || '').trim();
      const name = raw.length ? raw : `Worker_${Math.floor(1000 + Math.random() * 9000)}`;
      this._startGame(name);
    };

    btnEl.addEventListener('click', start);
    nameEl.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });

    // Hover effect
    btnEl.addEventListener('mouseover', () => { btnEl.style.filter = 'brightness(1.15)'; });
    btnEl.addEventListener('mouseout',  () => { btnEl.style.filter = ''; });
  }

  _startGame(name) {
    if (this._overlay?.parentElement) {
      this._overlay.parentElement.removeChild(this._overlay);
    }
    playerSystem.set('name', name);

    const launch = () => {
      this.scene.start('CityScene');
      this.scene.launch('UIScene');
    };

    if (!playerSystem.get('tutorialSeen')) {
      playerSystem.set('tutorialSeen', true);
      showTutorial(launch);
    } else {
      launch();
    }
  }
}
