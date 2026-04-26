const SLIDES = [
  {
    title: '🏙 Welcome to Life Loop!',
    body: 'Survive city life — earn money, pay bills, and build your career. Walk around the city and interact with buildings by pressing <b>E</b>.',
    img: '🗺',
  },
  {
    title: '💼 Choose a Job',
    body: 'Walk to any colored building (Restaurant 🍳, Delivery 📦, Cleaning 🧹, Corner Shop 🛒). Press <b>E</b> to start a 30-second minigame. Better performance = more pay!',
    img: '🎮',
  },
  {
    title: '💰 Pay Your Bills',
    body: 'Every <b>4 jobs = 1 day</b>. At day end: Rent <b>$80</b>, Food <b>$15</b>, Transport <b>$5</b> are deducted. Miss rent AND food 2 days in a row → Game Over!',
    img: '📅',
  },
  {
    title: '📈 Level Up & Tier Up',
    body: 'Earn XP every job. Higher levels unlock <b>Tier 2</b> (Lv5, +60% pay) and <b>Tier 3</b> (Lv10, +150% pay). Train skills at 📚 to boost your earnings further!',
    img: '⭐',
  },
  {
    title: '🤝 You\'re Not Alone!',
    body: 'Press <b>T</b> to chat, <b>G</b> to gift $15 to nearby players. Check your 📋 Daily Goals for bonus rewards. Visit 🏠 Home to rest and upgrade your housing!',
    img: '🌟',
  },
];

export function showTutorial(onDone) {
  let current = 0;

  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:rgba(8,8,20,0.88)', 'backdrop-filter:blur(4px)',
    'font-family:Arial,sans-serif',
  ].join(';');

  const card = document.createElement('div');
  card.style.cssText = [
    'background:linear-gradient(160deg,#0f0e1f,#1a1a2e)',
    'border:2px solid rgba(52,152,219,0.5)',
    'border-radius:20px',
    'padding:40px 48px 32px',
    'max-width:520px', 'width:90%',
    'box-shadow:0 16px 60px rgba(0,0,0,0.8)',
    'position:relative',
    'text-align:center',
  ].join(';');

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function render() {
    const slide = SLIDES[current];
    card.innerHTML = `
      <div style="font-size:64px;margin-bottom:12px;">${slide.img}</div>
      <div style="font-size:13px;color:#5d6d7e;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">
        Step ${current + 1} of ${SLIDES.length}
      </div>
      <h2 style="color:#f1c40f;font-size:24px;margin:0 0 16px;font-family:'Arial Black',sans-serif;">
        ${slide.title}
      </h2>
      <p style="color:#bdc3c7;font-size:16px;line-height:1.7;margin:0 0 28px;">
        ${slide.body}
      </p>
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px;" id="tut-dots"></div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="tut-prev" style="
          background:rgba(52,152,219,0.15);border:1px solid rgba(52,152,219,0.4);
          border-radius:8px;color:#3498db;font-size:15px;padding:10px 24px;
          cursor:pointer;font-family:'Arial Black',sans-serif;
          ${current === 0 ? 'opacity:0.3;pointer-events:none;' : ''}
        ">◀ Prev</button>
        <button id="tut-next" style="
          background:linear-gradient(135deg,#27ae60,#2ecc71);border:none;
          border-radius:8px;color:#fff;font-size:15px;padding:10px 28px;
          cursor:pointer;font-family:'Arial Black',sans-serif;
          box-shadow:0 4px 16px rgba(46,204,113,0.4);
        ">${current === SLIDES.length - 1 ? 'Play! ▶' : 'Next ▶'}</button>
      </div>
      <div id="tut-skip" style="margin-top:16px;color:#4a5568;font-size:12px;cursor:pointer;text-decoration:underline;">
        Skip tutorial
      </div>
    `;

    // Dots
    const dots = card.querySelector('#tut-dots');
    SLIDES.forEach((_, i) => {
      const d = document.createElement('div');
      d.style.cssText = `width:8px;height:8px;border-radius:50%;background:${i === current ? '#f1c40f' : '#2c3e50'};transition:background 0.2s;`;
      dots.appendChild(d);
    });

    card.querySelector('#tut-prev').addEventListener('click', () => {
      if (current > 0) { current--; render(); }
    });

    card.querySelector('#tut-next').addEventListener('click', () => {
      if (current < SLIDES.length - 1) {
        current++;
        render();
      } else {
        finish();
      }
    });

    card.querySelector('#tut-skip').addEventListener('click', finish);

    // Hover effects
    const nextBtn = card.querySelector('#tut-next');
    nextBtn.addEventListener('mouseover', () => { nextBtn.style.filter = 'brightness(1.15)'; });
    nextBtn.addEventListener('mouseout',  () => { nextBtn.style.filter = ''; });
  }

  function finish() {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
      onDone();
    }, 300);
  }

  render();
}
