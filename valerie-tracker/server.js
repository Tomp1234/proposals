// Valerie's daily tracker — zero-dependency Node server.
// Run with: node server.js   (data persists in data.json next to this file)

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number(process.env.PORT || process.argv[2]) || 80;
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const BLOCK_IDS = [
  'linkedin', 'prep', 'calls1', 'lunch', 'followups',
  'flex', 'linkedin2', 'calls2', 'wrapup',
];

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function freshBoard(date) {
  const blocks = {};
  for (const id of BLOCK_IDS) blocks[id] = { done: false, fields: {} };
  return { date, blocks, eodQuote: '' };
}

function loadData() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (raw && raw.board && raw.board.blocks) {
      raw.history = Array.isArray(raw.history) ? raw.history : [];
      raw.rev = Number(raw.rev) || 1;
      return raw;
    }
  } catch (e) { /* first run or unreadable file */ }
  return { board: freshBoard(todayStr()), history: [], rev: 1 };
}

let data = loadData();

function saveData() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

function hasValue(v) {
  return v !== null && v !== undefined && v !== '' && v !== false;
}

function boardHasData(board) {
  if (hasValue(board.eodQuote)) return true;
  return Object.values(board.blocks).some(
    (b) => b.done || Object.values(b.fields).some(hasValue)
  );
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function summarise(board) {
  const c1 = (board.blocks.calls1 || {}).fields || {};
  const c2 = (board.blocks.calls2 || {}).fields || {};
  return {
    date: board.date,
    dials: num(c1.dials) + num(c2.dials),
    conversations: num(c1.conversations) + num(c2.conversations),
    meetings: num(c1.meetings) + num(c2.meetings),
    blocksDone: Object.values(board.blocks).filter((b) => b.done).length,
    blocksTotal: BLOCK_IDS.length,
  };
}

// Archive the current board (if it has anything in it) and start a fresh one
// dated today. Safe to call twice: a fresh empty board archives nothing.
function resetBoard() {
  if (boardHasData(data.board)) {
    const row = summarise(data.board);
    data.history = data.history.filter((r) => r.date !== row.date);
    data.history.push(row);
    data.history.sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  data.board = freshBoard(todayStr());
  data.rev += 1;
  saveData();
}

function applyUpdate(body) {
  if (body.eodQuote !== undefined) {
    data.board.eodQuote = String(body.eodQuote).slice(0, 1000);
  } else {
    const { block, field, value } = body;
    if (!BLOCK_IDS.includes(block)) throw new Error('unknown block');
    if (typeof field !== 'string' || field.length > 40) throw new Error('bad field');
    if (field === 'done') {
      data.board.blocks[block].done = Boolean(value);
    } else {
      let v = value;
      if (typeof v === 'string') v = v.slice(0, 500);
      else if (typeof v === 'number') v = Math.max(0, Math.min(9999, v));
      else if (typeof v !== 'boolean' && v !== null) throw new Error('bad value');
      data.board.blocks[block].fields[field] = v;
    }
  }
  data.rev += 1;
  saveData();
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => {
      buf += c;
      if (buf.length > 100000) reject(new Error('too large'));
    });
    req.on('end', () => {
      try { resolve(buf ? JSON.parse(buf) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  try {
    if (url.pathname === '/api/state' && req.method === 'GET') {
      return sendJSON(res, 200, { ...data, today: todayStr() });
    }
    if (url.pathname === '/api/update' && req.method === 'POST') {
      applyUpdate(await readBody(req));
      return sendJSON(res, 200, { ...data, today: todayStr() });
    }
    if (url.pathname === '/api/reset' && req.method === 'POST') {
      resetBoard();
      return sendJSON(res, 200, { ...data, today: todayStr() });
    }
  } catch (e) {
    return sendJSON(res, 400, { error: String(e.message || e) });
  }

  // Static files
  let file = url.pathname === '/' ? '/index.html' : url.pathname;
  file = path.normalize(file).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(PUBLIC_DIR, file);
  if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(PORT, () => {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const list of Object.values(nets)) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  const portSuffix = PORT === 80 ? '' : ':' + PORT;
  let name = '';
  try { name = require('child_process').execSync('scutil --get LocalHostName 2>/dev/null').toString().trim().toLowerCase(); } catch (e) {}
  console.log(`Valerie's tracker is running.`);
  console.log(`  On this machine:  http://localhost${portSuffix}`);
  if (name) console.log(`  On the office LAN: http://${name}.local${portSuffix}   <- bookmark this`);
  for (const ip of ips) console.log(`  Also reachable at: http://${ip}${portSuffix}`);
  console.log(`  Data file: ${DATA_FILE}`);
});
