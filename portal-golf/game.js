'use strict';

/* ============================================================
 * Pineapple Portal Golf
 * Two players flick balls across a grid. Balls slide until they
 * hit a wall or a ball. Holes teleport balls to their sibling
 * hole (unless the sibling is plugged by a ball, in which case
 * the ball rolls straight over the hole). First player to sink
 * 3 balls into the target (pineapple) hole wins.
 * ============================================================ */

// ---------- constants ----------
const COLS = 15;
const ROWS = 10;
const STEP_MS = 55;           // one grid cell per step while sliding
const BALLS_PER_PLAYER = 5;
const WIN_SCORE = 3;
const WALL_COUNT = 11;
const PORTAL_PAIRS = 3;

const PLAYER_COLORS = ['#ff5c8a', '#2bd6ec'];
const PLAYER_DARK = ['#8f2445', '#0f6b78'];
const PLAYER_NAMES = ['Pink', 'Cyan'];
const PORTAL_COLORS = ['#b07cff', '#5be36b', '#ffb84d'];
const PORTAL_GLYPHS = ['\u25C6', '\u25CF', '\u25B2']; // diamond, circle, triangle

// ---------- state ----------
const state = {
  screen: 'menu',            // 'menu' | 'game' | 'win'
  mode: 'turn',              // 'turn' | 'chaos'
  showPortals: true,
  turn: 0,
  throwActive: false,        // (turn mode) a throw is resolving
  scores: [0, 0],
  winner: null,
  board: null,
  balls: [],
  effects: [],
  pointers: new Map(),       // pointerId -> { ball, startX, startY, curX, curY }
};

// ---------- helpers ----------
const key = (x, y) => x + ',' + y;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1)); // inclusive

function isWall(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  return state.board.walls.has(key(x, y));
}
function portalAt(x, y) { return state.board.portalMap.get(key(x, y)) || null; }
function isTarget(x, y) { return state.board.target.x === x && state.board.target.y === y; }
function ballAt(x, y) {
  return state.balls.find(b => b.alive && b.x === x && b.y === y) || null;
}
function ballIsMoving(b) { return !!(b.dir || b.pendingTeleport); }
function anyBallMoving() { return state.balls.some(b => b.alive && ballIsMoving(b)); }

// ---------- board generation ----------
function generateBoard() {
  for (let attempt = 0; attempt < 200; attempt++) {
    const board = tryGenerateBoard();
    if (board) return board;
  }
  return tryGenerateBoard(true); // give up on validation, still playable-ish
}

function tryGenerateBoard(force) {
  const walls = new Set();
  const portals = [];
  const portalMap = new Map();
  const occupied = new Set();

  // reserve the two home columns so players always have a clean launch pad
  const spawnRows = [1, 3, 5, 7, 9].slice(0, BALLS_PER_PLAYER);
  for (const r of spawnRows) {
    occupied.add(key(1, r));
    occupied.add(key(COLS - 2, r));
  }

  // target hole near the middle of the board
  const target = { x: randInt(Math.floor(COLS / 2) - 2, Math.floor(COLS / 2) + 2), y: randInt(2, ROWS - 3) };
  occupied.add(key(target.x, target.y));

  // portal pairs, kept away from home columns
  for (let p = 0; p < PORTAL_PAIRS; p++) {
    const pair = [];
    for (let i = 0; i < 2; i++) {
      let cell = null;
      for (let tries = 0; tries < 80 && !cell; tries++) {
        const x = randInt(3, COLS - 4), y = randInt(0, ROWS - 1);
        if (occupied.has(key(x, y))) continue;
        // keep holes from crowding each other / the target
        let tooClose = false;
        for (const other of portals.concat(pair, [target])) {
          if (Math.abs(other.x - x) + Math.abs(other.y - y) < 2) { tooClose = true; break; }
        }
        if (i === 1 && Math.abs(pair[0].x - x) + Math.abs(pair[0].y - y) < 4) continue; // siblings far apart
        if (!tooClose) cell = { x, y, pair: p };
      }
      if (!cell) return null;
      pair.push(cell);
      occupied.add(key(cell.x, cell.y));
    }
    pair[0].sibling = pair[1];
    pair[1].sibling = pair[0];
    portals.push(pair[0], pair[1]);
  }

  // scattered walls in the middle zone
  let placed = 0;
  for (let tries = 0; tries < 300 && placed < WALL_COUNT; tries++) {
    const x = randInt(3, COLS - 4), y = randInt(0, ROWS - 1);
    const k = key(x, y);
    if (occupied.has(k) || walls.has(k)) continue;
    walls.add(k);
    placed++;
  }

  for (const p of portals) portalMap.set(key(p.x, p.y), p);
  const board = { walls, portals, portalMap, target };

  if (!force) {
    // holes and target must be reachable from at least 2 sides
    const openSides = (x, y) =>
      [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false;
        return !walls.has(key(nx, ny)) && !portalMap.has(key(nx, ny)) && !(target.x === nx && target.y === ny);
      }).length;
    if (openSides(target.x, target.y) < 2) return null;
    for (const p of portals) if (openSides(p.x, p.y) < 2) return null;
  }
  return board;
}

function spawnBalls() {
  const balls = [];
  const spawnRows = [1, 3, 5, 7, 9].slice(0, BALLS_PER_PLAYER);
  let id = 0;
  for (let player = 0; player < 2; player++) {
    const x = player === 0 ? 1 : COLS - 2;
    for (const y of spawnRows) {
      balls.push({
        id: id++, player, x, y,
        prevX: x, prevY: y,
        dir: null,
        pendingTeleport: null,
        alive: true,
      });
    }
  }
  return balls;
}

function newMatch() {
  state.board = generateBoard();
  state.balls = spawnBalls();
  state.effects = [];
  state.scores = [0, 0];
  state.winner = null;
  state.turn = Math.random() < 0.5 ? 0 : 1;
  state.throwActive = false;
  state.pointers.clear();
  updateHud();
}

// ---------- simulation ----------
function doStep() {
  for (const b of state.balls) {
    if (!b.alive) continue;

    if (b.pendingTeleport) {
      // ball is sitting in a hole; pop out at the sibling
      const s = b.pendingTeleport;
      b.pendingTeleport = null;
      b.dir = null;
      if (!ballAt(s.x, s.y)) {
        addEffect('portal', b.x, b.y);
        b.x = s.x; b.y = s.y;
        b.prevX = s.x; b.prevY = s.y; // snap, no interpolation across the board
        addEffect('portal', s.x, s.y);
      }
      // else: sibling got plugged this instant — ball rests on the entry hole
      continue;
    }

    if (!b.dir) continue;
    const nx = b.x + b.dir.dx;
    const ny = b.y + b.dir.dy;

    if (isWall(nx, ny) || ballAt(nx, ny)) {
      b.dir = null;
      b.prevX = b.x; b.prevY = b.y;
      continue;
    }

    if (isTarget(nx, ny)) {
      // captured! ball sinks into the pineapple hole
      addEffect('capture', nx, ny, { fromX: b.x, fromY: b.y, color: PLAYER_COLORS[b.player] });
      b.alive = false;
      b.dir = null;
      state.scores[b.player]++;
      updateHud();
      checkWin(b.player);
      continue;
    }

    const portal = portalAt(nx, ny);
    if (portal) {
      const s = portal.sibling;
      if (!ballAt(s.x, s.y)) {
        // fall in, teleport on the next step
        b.prevX = b.x; b.prevY = b.y;
        b.x = nx; b.y = ny;
        b.pendingTeleport = s;
        continue;
      }
      // sibling plugged: roll straight over the hole
    }

    b.prevX = b.x; b.prevY = b.y;
    b.x = nx; b.y = ny;
  }

  // turn handover once everything has settled
  if (state.mode === 'turn' && state.throwActive && !anyBallMoving() && state.winner === null) {
    state.throwActive = false;
    state.turn = 1 - state.turn;
    updateHud();
  }
}

function checkWin(player) {
  if (state.winner !== null || state.scores[player] < WIN_SCORE) return;
  state.winner = player;
  state.pointers.clear();
  updateHud();
  setTimeout(() => {
    if (state.winner === null) return;
    document.getElementById('winTitle').textContent = PLAYER_NAMES[state.winner] + ' wins!';
    document.getElementById('winTitle').style.background = 'none';
    document.getElementById('winTitle').style.webkitTextFillColor = PLAYER_COLORS[state.winner];
    document.getElementById('winOverlay').classList.remove('hidden');
    state.screen = 'win';
  }, 750);
}

function throwBall(ball, dir) {
  const nx = ball.x + dir.dx, ny = ball.y + dir.dy;
  if (isWall(nx, ny) || ballAt(nx, ny)) {
    addEffect('reject', ball.x, ball.y);
    return false;
  }
  ball.dir = dir;
  if (state.mode === 'turn') {
    state.throwActive = true;
    updateHud();
  }
  return true;
}

// ---------- effects ----------
function addEffect(type, x, y, extra) {
  const dur = type === 'capture' ? 550 : type === 'portal' ? 420 : 300;
  state.effects.push(Object.assign({ type, x, y, start: performance.now(), dur }, extra || {}));
}

// ---------- input ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let cellPx = 40, originX = 0, originY = 0, dpr = 1;

function eventToBoard(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - originX / dpr) / (cellPx / dpr),
    y: (e.clientY - rect.top - originY / dpr) / (cellPx / dpr),
  };
}

function grabbableBall(bx, by) {
  let best = null, bestD = 0.95; // in cells
  for (const b of state.balls) {
    if (!b.alive || ballIsMoving(b)) continue;
    if (state.mode === 'turn' && (b.player !== state.turn || state.throwActive)) continue;
    if ([...state.pointers.values()].some(p => p.ball === b)) continue;
    const d = Math.hypot(b.x + 0.5 - bx, b.y + 0.5 - by);
    if (d < bestD) { best = b; bestD = d; }
  }
  return best;
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (state.screen !== 'game' || state.winner !== null) return;
  const p = eventToBoard(e);
  const ball = grabbableBall(p.x, p.y);
  if (!ball) return;
  canvas.setPointerCapture(e.pointerId);
  state.pointers.set(e.pointerId, {
    ball,
    startX: e.clientX, startY: e.clientY,
    curX: e.clientX, curY: e.clientY,
  });
});

canvas.addEventListener('pointermove', e => {
  const g = state.pointers.get(e.pointerId);
  if (!g) return;
  e.preventDefault();
  g.curX = e.clientX; g.curY = e.clientY;
});

function releasePointer(e, doThrow) {
  const g = state.pointers.get(e.pointerId);
  if (!g) return;
  state.pointers.delete(e.pointerId);
  if (!doThrow || state.winner !== null) return;
  const dir = swipeDir(g);
  if (dir) throwBall(g.ball, dir);
}
canvas.addEventListener('pointerup', e => { e.preventDefault(); releasePointer(e, true); });
canvas.addEventListener('pointercancel', e => releasePointer(e, false));

const SWIPE_MIN_PX = 18;
function swipeDir(g) {
  const dx = g.curX - g.startX, dy = g.curY - g.startY;
  if (Math.hypot(dx, dy) < SWIPE_MIN_PX) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return { dx: Math.sign(dx), dy: 0 };
  return { dx: 0, dy: Math.sign(dy) };
}

// block iOS gestures (pinch zoom / double-tap zoom) inside the game
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

// ---------- HUD / screens ----------
function updateHud() {
  for (let p = 0; p < 2; p++) {
    const el = document.getElementById('pips' + (p + 1));
    el.innerHTML = '';
    for (let i = 0; i < WIN_SCORE; i++) {
      const pip = document.createElement('i');
      if (i < state.scores[p]) pip.className = 'on';
      el.appendChild(pip);
    }
  }
  const pill = document.getElementById('turnPill');
  if (state.winner !== null) {
    pill.textContent = PLAYER_NAMES[state.winner] + ' wins!';
    pill.className = state.winner === 0 ? 'p1' : 'p2';
  } else if (state.mode === 'chaos') {
    pill.textContent = 'CHAOS \u2014 GO GO GO!';
    pill.className = 'chaos';
  } else {
    pill.textContent = state.throwActive
      ? 'Rolling\u2026'
      : PLAYER_NAMES[state.turn] + "'s turn";
    pill.className = state.turn === 0 ? 'p1' : 'p2';
  }
}

const segState = { segMode: 'turn', segPortals: 'shown' };
for (const segId of ['segMode', 'segPortals']) {
  const seg = document.getElementById(segId);
  seg.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    segState[segId] = btn.dataset.value;
    for (const b of seg.querySelectorAll('button')) b.classList.toggle('active', b === btn);
    document.getElementById('modeHint').textContent =
      segState.segMode === 'turn' ? 'Take turns, one flick each.' : 'No turns \u2014 flick your balls as fast as you can!';
    document.getElementById('portalHint').textContent =
      segState.segPortals === 'shown' ? 'Sibling holes are colour\u2011matched and linked.' : 'All holes look identical. Learn the hard way.';
  });
}

document.getElementById('btnStart').addEventListener('click', () => {
  state.mode = segState.segMode;
  state.showPortals = segState.segPortals === 'shown';
  newMatch();
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('winOverlay').classList.add('hidden');
  state.screen = 'game';
});

document.getElementById('btnRematch').addEventListener('click', () => {
  newMatch();
  document.getElementById('winOverlay').classList.add('hidden');
  state.screen = 'game';
});

function backToMenu() {
  document.getElementById('winOverlay').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  state.screen = 'menu';
}
document.getElementById('btnWinMenu').addEventListener('click', backToMenu);
document.getElementById('btnMenu').addEventListener('click', backToMenu);
document.getElementById('btnNewBoard').addEventListener('click', () => {
  if (state.screen === 'game') newMatch();
});

// ---------- rendering ----------
function resize() {
  const stage = document.getElementById('stage');
  const availW = stage.clientWidth - 8;
  const availH = stage.clientHeight - 8;
  dpr = window.devicePixelRatio || 1;
  const cssCell = Math.floor(Math.min(availW / COLS, availH / ROWS));
  const cssW = cssCell * COLS, cssH = cssCell * ROWS;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  cellPx = cssCell * dpr;
  originX = 0;
  originY = 0;
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));

const cx = (x) => originX + (x + 0.5) * cellPx;
const cy = (y) => originY + (y + 0.5) * cellPx;

function drawBoard() {
  const w = canvas.width, h = canvas.height;
  // felt
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#17233f');
  g.addColorStop(1, '#111a30');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // home column tints
  ctx.fillStyle = PLAYER_COLORS[0] + '14';
  ctx.fillRect(originX + 1 * cellPx, originY, cellPx, ROWS * cellPx);
  ctx.fillStyle = PLAYER_COLORS[1] + '14';
  ctx.fillRect(originX + (COLS - 2) * cellPx, originY, cellPx, ROWS * cellPx);

  // grid
  ctx.strokeStyle = '#ffffff0e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < COLS; x++) { ctx.moveTo(originX + x * cellPx, originY); ctx.lineTo(originX + x * cellPx, originY + ROWS * cellPx); }
  for (let y = 1; y < ROWS; y++) { ctx.moveTo(originX, originY + y * cellPx); ctx.lineTo(originX + COLS * cellPx, originY + y * cellPx); }
  ctx.stroke();

  // walls
  for (const k of state.board.walls) {
    const [x, y] = k.split(',').map(Number);
    const px = originX + x * cellPx, py = originY + y * cellPx;
    const pad = cellPx * 0.06, r = cellPx * 0.18;
    ctx.fillStyle = '#3a4a76';
    roundRect(px + pad, py + pad, cellPx - pad * 2, cellPx - pad * 2, r);
    ctx.fill();
    ctx.fillStyle = '#4d5f92';
    roundRect(px + pad, py + pad, cellPx - pad * 2, cellPx * 0.42, r);
    ctx.fill();
  }

  // sibling links (revealed mode)
  if (state.showPortals) {
    ctx.save();
    ctx.setLineDash([cellPx * 0.12, cellPx * 0.16]);
    ctx.lineWidth = Math.max(1.5, cellPx * 0.035);
    const drawn = new Set();
    for (const p of state.board.portals) {
      if (drawn.has(p.pair)) continue;
      drawn.add(p.pair);
      ctx.strokeStyle = PORTAL_COLORS[p.pair] + '3c';
      ctx.beginPath();
      ctx.moveTo(cx(p.x), cy(p.y));
      ctx.lineTo(cx(p.sibling.x), cy(p.sibling.y));
      ctx.stroke();
    }
    ctx.restore();
  }

  // portal holes
  for (const p of state.board.portals) {
    const x = cx(p.x), y = cy(p.y), r = cellPx * 0.34;
    const hole = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    hole.addColorStop(0, '#000000');
    hole.addColorStop(1, '#0a0f1e');
    ctx.fillStyle = hole;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    ctx.lineWidth = Math.max(2, cellPx * 0.06);
    ctx.strokeStyle = state.showPortals ? PORTAL_COLORS[p.pair] : '#5a6ca0';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

    if (state.showPortals) {
      ctx.fillStyle = PORTAL_COLORS[p.pair];
      ctx.font = `${Math.round(cellPx * 0.26)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(PORTAL_GLYPHS[p.pair], x, y + cellPx * 0.01);
    } else {
      // identical mystery swirl on every hole
      ctx.strokeStyle = '#7d8cb066';
      ctx.lineWidth = Math.max(1.5, cellPx * 0.035);
      ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0.4, Math.PI * 1.6); ctx.stroke();
    }
  }

  // target hole (the pineapple!)
  {
    const t = state.board.target;
    const x = cx(t.x), y = cy(t.y), r = cellPx * 0.4;
    const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.7);
    glow.addColorStop(0, '#ffd54d33');
    glow.addColorStop(1, '#ffd54d00');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, r * 1.7, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#05070f';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = Math.max(2.5, cellPx * 0.07);
    ctx.strokeStyle = '#ffd54d';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

    ctx.font = `${Math.round(cellPx * 0.5)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u{1F34D}', x, y + cellPx * 0.02);
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBalls(stepT, now) {
  for (const b of state.balls) {
    if (!b.alive) continue;
    const bx = ballIsMoving(b) && !b.pendingTeleport ? lerp(b.prevX, b.x, stepT) : b.x;
    const by = ballIsMoving(b) && !b.pendingTeleport ? lerp(b.prevY, b.y, stepT) : b.y;
    const x = cx(bx), y = cy(by);
    const onPortal = !!portalAt(b.x, b.y) && !ballIsMoving(b);
    const r = cellPx * (onPortal ? 0.24 : 0.3);

    const grabbed = [...state.pointers.values()].some(p => p.ball === b);
    if (grabbed) {
      const pulse = 1 + Math.sin(now / 140) * 0.12;
      ctx.strokeStyle = PLAYER_COLORS[b.player] + 'aa';
      ctx.lineWidth = Math.max(2, cellPx * 0.05);
      ctx.beginPath(); ctx.arc(x, y, r * 1.45 * pulse, 0, Math.PI * 2); ctx.stroke();
    }

    // shadow
    ctx.fillStyle = '#00000055';
    ctx.beginPath(); ctx.ellipse(x + r * 0.12, y + r * 0.25, r, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    // body
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r * 1.1);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, PLAYER_COLORS[b.player]);
    g.addColorStop(1, PLAYER_DARK[b.player]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawAim() {
  for (const g of state.pointers.values()) {
    const dir = swipeDir(g);
    if (!dir) continue;
    const b = g.ball;
    const x = cx(b.x), y = cy(b.y);
    const dragLen = Math.hypot(g.curX - g.startX, g.curY - g.startY) * dpr;
    const len = clamp(dragLen * 1.2, cellPx * 0.6, cellPx * 2.4);
    const ex = x + dir.dx * len, ey = y + dir.dy * len;

    ctx.save();
    ctx.strokeStyle = PLAYER_COLORS[b.player];
    ctx.fillStyle = PLAYER_COLORS[b.player];
    ctx.lineWidth = Math.max(3, cellPx * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    // arrow head
    const ah = cellPx * 0.28;
    const px = -dir.dy, py = dir.dx; // perpendicular
    ctx.beginPath();
    ctx.moveTo(ex + dir.dx * ah, ey + dir.dy * ah);
    ctx.lineTo(ex + px * ah * 0.6, ey + py * ah * 0.6);
    ctx.lineTo(ex - px * ah * 0.6, ey - py * ah * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawEffects(now) {
  state.effects = state.effects.filter(fx => now - fx.start < fx.dur);
  for (const fx of state.effects) {
    const t = (now - fx.start) / fx.dur;
    if (fx.type === 'portal') {
      const x = cx(fx.x), y = cy(fx.y);
      ctx.strokeStyle = `rgba(255,255,255,${(1 - t) * 0.8})`;
      ctx.lineWidth = Math.max(2, cellPx * 0.05);
      ctx.beginPath(); ctx.arc(x, y, cellPx * (0.2 + t * 0.55), 0, Math.PI * 2); ctx.stroke();
    } else if (fx.type === 'capture') {
      // ball shrinking into the target hole
      const bx = lerp(fx.fromX, fx.x, Math.min(1, t * 2));
      const by = lerp(fx.fromY, fx.y, Math.min(1, t * 2));
      const x = cx(bx), y = cy(by);
      const r = cellPx * 0.3 * (1 - t);
      if (r > 0.5) {
        ctx.fillStyle = fx.color;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      // celebratory ring
      ctx.strokeStyle = `rgba(255,213,77,${(1 - t) * 0.9})`;
      ctx.lineWidth = Math.max(2, cellPx * 0.06);
      ctx.beginPath(); ctx.arc(cx(fx.x), cy(fx.y), cellPx * (0.35 + t * 0.9), 0, Math.PI * 2); ctx.stroke();
    } else if (fx.type === 'reject') {
      const x = cx(fx.x), y = cy(fx.y);
      ctx.strokeStyle = `rgba(255,90,90,${(1 - t) * 0.9})`;
      ctx.lineWidth = Math.max(2, cellPx * 0.06);
      ctx.beginPath(); ctx.arc(x, y, cellPx * (0.32 + t * 0.3), 0, Math.PI * 2); ctx.stroke();
    }
  }
}

// ---------- main loop ----------
let lastFrame = performance.now();
let stepAcc = 0;

function frame(now) {
  const dt = Math.min(100, now - lastFrame);
  lastFrame = now;

  if (state.screen !== 'menu' || state.board) {
    stepAcc += dt;
    while (stepAcc >= STEP_MS) {
      doStep();
      stepAcc -= STEP_MS;
    }
    const stepT = stepAcc / STEP_MS;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawEffects(now);
    drawBalls(stepT, now);
    drawAim();
  }
  requestAnimationFrame(frame);
}

// ---------- boot ----------
resize();
newMatch(); // background board behind the menu
requestAnimationFrame(frame);
