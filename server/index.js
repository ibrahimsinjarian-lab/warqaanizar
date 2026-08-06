'use strict';

require('dotenv').config();

const express = require('express');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');
const cors    = require('cors');

const app      = express();
const PORT     = process.env.PORT     || 3000;
const SECRET   = process.env.JWT_SECRET      || 'warqaa-dev-secret-change-in-production';
const PASSWORD = process.env.ADMIN_PASSWORD  || 'admin';
const DATA_DIR = path.join(__dirname, 'data');
const ROOT_DIR = path.join(__dirname, '..');

/* ─── Middleware ───────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '50mb' }));

/* ─── Static: portfolio site ──────────────────────── */
app.use(express.static(ROOT_DIR));

/* ─── Static: admin panel ─────────────────────────── */
app.use('/admin', express.static(path.join(ROOT_DIR, 'admin')));

/* ─── Data helpers ─────────────────────────────────── */
function read(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
  } catch (_) {
    return null;
  }
}

function write(filename, data) {
  fs.writeFileSync(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

/* ─── Auth middleware ──────────────────────────────── */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), SECRET);
    next();
  } catch (_) {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
}

/* ─── Auth routes ──────────────────────────────────── */
app.post('/api/auth/login', (req, res) => {
  if (!req.body || req.body.password !== PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = jwt.sign({ admin: true }, SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.get('/api/auth/verify', requireAuth, (_req, res) => {
  res.json({ ok: true });
});

/* ─── Essays ───────────────────────────────────────── */
app.get('/api/essays', (_req, res) => {
  res.json(read('essays.json') || []);
});

app.put('/api/essays', requireAuth, (req, res) => {
  write('essays.json', req.body);
  res.json({ ok: true });
});

/* ─── Designs ──────────────────────────────────────── */
app.get('/api/designs', (_req, res) => {
  res.json(read('designs.json') || []);
});

app.put('/api/designs', requireAuth, (req, res) => {
  write('designs.json', req.body);
  res.json({ ok: true });
});

/* ─── Decorations ──────────────────────────────────── */
app.get('/api/decorations', (_req, res) => {
  res.json(read('decorations.json') || []);
});

app.put('/api/decorations', requireAuth, (req, res) => {
  write('decorations.json', req.body);
  res.json({ ok: true });
});

/* ─── Settings ─────────────────────────────────────── */
app.get('/api/settings', (_req, res) => {
  res.json(read('settings.json') || {});
});

app.put('/api/settings', requireAuth, (req, res) => {
  write('settings.json', req.body);
  res.json({ ok: true });
});

/* ─── Start ────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log('\n  Warqaa Admin Server');
  console.log(`  Portfolio:  http://localhost:${PORT}`);
  console.log(`  Admin:      http://localhost:${PORT}/admin/login.html\n`);
});
