require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Configurable CORS: allow all in dev; restrict in prod via env
const ALLOW_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json());

// Simple JSON-file persistence and audit log
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      goods: Array.isArray(parsed.goods) ? parsed.goods : [],
      shares: Array.isArray(parsed.shares) ? parsed.shares : [],
      capacities: parsed.capacities && typeof parsed.capacities === 'object' ? parsed.capacities : {},
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    };
  } catch {
    return {
      goods: [
        { id: 'SKU-AX12', name: 'Alloy Widget 12', stock: 120, location: 'A-14' },
        { id: 'SKU-BX03', name: 'Bolt Pack 03', stock: 64, location: 'B-9' },
        { id: 'SKU-CT90', name: 'Cable Tie 90', stock: 240, location: 'C-11' },
      ],
      shares: [
        { id: 'sh_abc1', name: 'Vendor Inventory 1', scope: 'SKUs A*, stock levels', url: '/share/sh_abc1', access: 'public' },
      ],
      capacities: {},
      audit: [],
    };
  }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function addAudit(data, entry) {
  data.audit.unshift({
    id: 'aud_' + Math.random().toString(36).slice(2, 10),
    ts: new Date().toISOString(),
    ...entry,
  });
  // keep last 500 audits
  if (data.audit.length > 500) data.audit = data.audit.slice(0, 500);
}

let { goods, shares, capacities, audit } = readData();

// Goods CRUD
app.get('/api/goods', (req, res) => {
  res.json(goods);
});

app.post('/api/goods', (req, res) => {
  const item = req.body;
  if (!item?.id || !item?.name) return res.status(400).json({ error: 'id and name are required' });
  const exists = goods.find(g => g.id === item.id);
  if (exists) return res.status(409).json({ error: 'Duplicate id' });
  const rec = { stock: 0, location: '', ...item };
  goods.push(rec);
  addAudit({ goods, shares, capacities, audit }, { type: 'goods', action: 'create', after: rec });
  writeData({ goods, shares, capacities, audit });
  res.status(201).json(item);
});

app.put('/api/goods/:id', (req, res) => {
  const { id } = req.params;
  const idx = goods.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const before = goods[idx];
  const next = { ...before, ...req.body };
  // handle id change (rename)
  if (req.body?.id && req.body.id !== id) {
    if (goods.some(g => g.id === req.body.id)) return res.status(409).json({ error: 'Duplicate id' });
  }
  goods[idx] = next;
  // If id changed, ensure uniqueness maintained
  if (req.body?.id && req.body.id !== id) {
    goods[idx].id = req.body.id;
  }
  addAudit({ goods, shares, capacities, audit }, { type: 'goods', action: 'update', before, after: goods[idx] });
  writeData({ goods, shares, capacities, audit });
  res.json(goods[idx]);
});

app.delete('/api/goods/:id', (req, res) => {
  const { id } = req.params;
  const before = goods.length;
  const found = goods.find(g => g.id === id);
  goods = goods.filter(g => g.id !== id);
  if (goods.length === before) return res.status(404).json({ error: 'Not found' });
  addAudit({ goods, shares, capacities, audit }, { type: 'goods', action: 'delete', before: found });
  writeData({ goods, shares, capacities, audit });
  res.status(204).send();
});

// Storage derived from goods' locations
app.get('/api/storage-bins', (req, res) => {
  const byLoc = {};
  for (const g of goods) {
    const loc = g.location?.trim();
    if (!loc) continue;
    if (!byLoc[loc]) byLoc[loc] = 0;
    byLoc[loc] += Number(g.stock) || 0;
  }
  const bins = Object.entries(byLoc).map(([loc, used]) => ({ id: String(loc), capacity: Number(capacities[loc]) || 100, used }));
  res.json(bins);
});

// Update capacity for a bin
app.put('/api/storage-bins/:id', (req, res) => {
  const { id } = req.params;
  const { capacity } = req.body || {};
  const cap = Number(capacity);
  if (!Number.isFinite(cap) || cap <= 0) return res.status(400).json({ error: 'capacity must be positive number' });
  capacities[id] = cap;
  addAudit({ goods, shares, capacities, audit }, { type: 'storage', action: 'capacity', after: { id, capacity: cap } });
  writeData({ goods, shares, capacities, audit });
  res.json({ id, capacity: cap });
});

// Shares basic endpoints
app.get('/api/shares', (req, res) => res.json(shares));
app.post('/api/shares', (req, res) => {
  const sh = req.body;
  if (!sh?.name) return res.status(400).json({ error: 'name required' });
  const id = 'sh_' + Math.random().toString(36).slice(2, 8);
  const url = `/share/${id}`;
  const rec = { id, url, access: 'public', ...sh };
  shares.push(rec);
  addAudit({ goods, shares, capacities, audit }, { type: 'share', action: 'create', after: rec });
  writeData({ goods, shares, capacities, audit });
  res.status(201).json(rec);
});

// Delete share
app.delete('/api/shares/:id', (req, res) => {
  const { id } = req.params;
  const before = shares.length;
  const found = shares.find(s => s.id === id);
  shares = shares.filter(s => s.id !== id);
  if (shares.length === before) return res.status(404).json({ error: 'Not found' });
  addAudit({ goods, shares, capacities, audit }, { type: 'share', action: 'delete', before: found });
  writeData({ goods, shares, capacities, audit });
  res.status(204).send();
});

// Audit endpoint
app.get('/api/audit', (req, res) => {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
  res.json(audit.slice(0, limit));
});

// --- Serve React production build when available ---
const frontendBuildPath = path.join(__dirname, 'frontend', 'build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  // SPA fallback for client routes
  app.get(['/', '/goods', '/storage', '/shares', '/share/*'], (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
