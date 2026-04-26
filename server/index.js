const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 10000,
  pingInterval: 5000,
});

const players = {};

const CITY_EVENTS = [
  { id: 'bonus_day',   text: 'City Bonus Day! Productivity boost for all workers!',      money: 25,  happiness: 5  },
  { id: 'city_fair',   text: 'City Fair is in town! Free fun for the whole family!',      money: 0,   happiness: 20, food: 15 },
  { id: 'storm',       text: 'Thunderstorm warning! Roads are slippery today.',           money: -10, energy: -10   },
  { id: 'festival',    text: 'Street Festival! Free food and great vibes citywide!',      money: 10,  food: 20, happiness: 10 },
  { id: 'tax_day',     text: 'City Tax Day — municipality collects from all residents.',  money: -20 },
  { id: 'supply_boom', text: 'Supply Chain Boom! Local businesses are thriving.',         money: 20  },
  { id: 'power_cut',   text: 'Power outage across the city. Energy levels dipping.',      energy: -15 },
  { id: 'community',   text: 'Community Day! Neighbours helping neighbours.',             money: 5,   happiness: 15 },
];

function broadcastCityEvent() {
  const evt = CITY_EVENTS[Math.floor(Math.random() * CITY_EVENTS.length)];
  io.emit('cityEvent', evt);
  console.log(`[EVENT] ${evt.text}`);
}

// Shared city event every 3 minutes
setInterval(broadcastCityEvent, 3 * 60 * 1000);

io.on('connection', (socket) => {
  console.log(`[+] Player connected: ${socket.id}`);

  socket.on('join', (data) => {
    players[socket.id] = {
      id:          socket.id,
      name:        data.name        || 'Worker',
      x:           data.x           || 780,
      y:           data.y           || 760,
      color:       data.color       || 0x3498db,
      totalEarned: data.totalEarned || 0,
      level:       data.level       || 1,
      prestige:    data.prestige    || 0,
      job:         null,
    };
    socket.emit('currentPlayers', Object.values(players));
    socket.broadcast.emit('playerJoined', players[socket.id]);
    io.emit('playerCount', Object.keys(players).length);
    io.emit('leaderboardUpdate');
    console.log(`  ${players[socket.id].name} joined (total: ${Object.keys(players).length})`);
  });

  socket.on('move', (data) => {
    const p = players[socket.id];
    if (!p) return;
    p.x = data.x;
    p.y = data.y;
    socket.broadcast.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
  });

  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', {
      id:   socket.id,
      name: players[socket.id]?.name || 'Unknown',
      text: String(data.text || '').slice(0, 120),
      ts:   Date.now(),
    });
  });

  socket.on('tradeGift', (data) => {
    const sender = players[socket.id];
    const target = players[data.targetId];
    if (!sender || !target) return;
    const amount = 15;
    io.to(data.targetId).emit('giftReceived', { fromId: socket.id, fromName: sender.name, amount });
    socket.emit('giftSent', { toId: data.targetId, toName: target.name, amount });
    console.log(`  [GIFT] ${sender.name} → ${target.name} $${amount}`);
  });

  socket.on('updateStats', (data) => {
    const p = players[socket.id];
    if (!p) return;
    p.totalEarned = Math.max(0, data.totalEarned || 0);
    if (data.level   !== undefined) p.level   = data.level;
    if (data.prestige !== undefined) p.prestige = data.prestige;
    io.emit('leaderboardUpdate');
  });

  socket.on('disconnect', () => {
    const name = players[socket.id]?.name || socket.id;
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
    io.emit('playerCount', Object.keys(players).length);
    console.log(`[-] ${name} disconnected (total: ${Object.keys(players).length})`);
  });
});

app.get('/health', (_req, res) => res.json({ ok: true, players: Object.keys(players).length }));

app.get('/leaderboard', (_req, res) => {
  const board = Object.values(players)
    .sort((a, b) => {
      const earnDiff = (b.totalEarned || 0) - (a.totalEarned || 0);
      if (earnDiff !== 0) return earnDiff;
      return (b.prestige || 0) - (a.prestige || 0);
    })
    .slice(0, 10)
    .map((p, i) => ({
      rank:        i + 1,
      name:        p.name,
      earned:      p.totalEarned || 0,
      level:       p.level       || 1,
      prestige:    p.prestige    || 0,
      socketId:    p.id,
    }));
  res.json(board);
});

// Test endpoint — trigger a city event immediately
app.post('/trigger-event', (_req, res) => {
  broadcastCityEvent();
  res.json({ ok: true });
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🏙  Life Loop server running on port ${PORT}\n`);
});
