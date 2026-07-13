// Cloudflare Worker for Valerie's daily tracker.
// Serves the tracker page at /valerie-tracker/ and stores its state in a
// Durable Object, so both Valerie and Tom see the same live board from
// anywhere. All other requests fall through to the static proposals site.

import PAGE from './public/index.html';

const BLOCK_IDS = [
  'linkedin', 'prep', 'calls1', 'lunch', 'followups',
  'flex', 'linkedin2', 'calls2', 'wrapup',
];

function todayStr() {
  // The board's "day" follows UK office time, wherever the edge runs.
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
}

function freshBoard(date) {
  const blocks = {};
  for (const id of BLOCK_IDS) blocks[id] = { done: false, fields: {} };
  return { date, blocks, eodQuote: '' };
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

export class TrackerDO {
  constructor(ctx) {
    this.ctx = ctx;
    this.data = null;
  }

  async load() {
    if (!this.data) {
      this.data = (await this.ctx.storage.get('data')) ||
        { board: freshBoard(todayStr()), history: [], rev: 1 };
    }
    return this.data;
  }

  async save() {
    await this.ctx.storage.put('data', this.data);
  }

  applyUpdate(body) {
    if (body.eodQuote !== undefined) {
      this.data.board.eodQuote = String(body.eodQuote).slice(0, 1000);
    } else {
      const { block, field, value } = body;
      if (!BLOCK_IDS.includes(block)) throw new Error('unknown block');
      if (typeof field !== 'string' || field.length > 40) throw new Error('bad field');
      if (field === 'done') {
        this.data.board.blocks[block].done = Boolean(value);
      } else {
        let v = value;
        if (typeof v === 'string') v = v.slice(0, 500);
        else if (typeof v === 'number') v = Math.max(0, Math.min(9999, v));
        else if (typeof v !== 'boolean' && v !== null) throw new Error('bad value');
        this.data.board.blocks[block].fields[field] = v;
      }
    }
    this.data.rev += 1;
  }

  resetBoard() {
    if (boardHasData(this.data.board)) {
      const row = summarise(this.data.board);
      this.data.history = this.data.history.filter((r) => r.date !== row.date);
      this.data.history.push(row);
      this.data.history.sort((a, b) => (a.date < b.date ? 1 : -1));
    }
    this.data.board = freshBoard(todayStr());
    this.data.rev += 1;
  }

  json(status = 200) {
    return new Response(JSON.stringify({ ...this.data, today: todayStr() }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  async fetch(req) {
    const url = new URL(req.url);
    const route = url.pathname.replace(/^.*\/api\//, '');
    await this.load();
    try {
      if (route === 'state' && req.method === 'GET') return this.json();
      if (route === 'update' && req.method === 'POST') {
        this.applyUpdate(await req.json());
        await this.save();
        return this.json();
      }
      if (route === 'reset' && req.method === 'POST') {
        this.resetBoard();
        await this.save();
        return this.json();
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e.message || e) }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Not found', { status: 404 });
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/valerie-tracker') {
      return Response.redirect(url.origin + '/valerie-tracker/', 301);
    }
    if (url.pathname === '/valerie-tracker/') {
      return new Response(PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    if (url.pathname.startsWith('/valerie-tracker/api/')) {
      const id = env.TRACKER.idFromName('main');
      return env.TRACKER.get(id).fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
