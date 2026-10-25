'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const { QuestManager, DiscordAPI } = require('./questManager');
const { translate, normalizeLang } = require('./i18n');

const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, 'config.json');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------------------------------------------- état global */

let manager = null;
let dryRun = false;
let intervalMs = 900000;
let lang = 'fr';
const logBuffer = [];
const clients = new Set();

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveConfig(patch) {
  const cfg = { ...loadConfig(), ...patch };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  return cfg;
}

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(payload);
}

function pushLog(entry) {
  logBuffer.push(entry);
  if (logBuffer.length > 400) logBuffer.shift();
  broadcast('log', entry);
}

/* ------------------------------------------------------------------- SSE */

app.get('/api/logs', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  for (const entry of logBuffer) {
    res.write(`event: log\ndata: ${JSON.stringify(entry)}\n\n`);
  }
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

/* ------------------------------------------------------------------- API */

app.post('/api/lang', (req, res) => {
  lang = normalizeLang(req.body.lang);
  if (manager) manager.lang = lang;
  res.json({ ok: true, lang });
});

app.get('/api/state', (req, res) => {
  const cfg = loadConfig();
  res.json({
    hasToken: Boolean(cfg.token),
    user: cfg.user || null,
    running: Boolean(manager && !manager.stopped),
    dryRun,
    intervalMs,
    stats: manager ? manager.stats : { found: 0, completed: 0, claimed: 0, credits: 0 },
  });
});

app.post('/api/token', async (req, res) => {
  const token = String(req.body.token || '').trim();
  if (!token) return res.status(400).json({ error: translate(lang, 'tokenEmpty') });

  const api = new DiscordAPI(token);
  const me = await api.get('/users/@me');
  if (!me) return res.status(502).json({ error: translate(lang, 'discordUnreachable') });
  if (me.__status__) {
    return res.status(401).json({ error: translate(lang, 'tokenInvalid') });
  }

  saveConfig({ token, user: me.username });
  res.json({ ok: true, user: `${me.username}` });
});

app.get('/api/quests', async (req, res) => {
  const cfg = loadConfig();
  if (!cfg.token) return res.json({ quests: [] });
  const tmp = new QuestManager(cfg.token, { lang });
  const quests = await tmp.fetchQuests();
  res.json({ quests });
});

app.post('/api/start', (req, res) => {
  const cfg = loadConfig();
  if (!cfg.token) return res.status(400).json({ error: translate(lang, 'noToken') });
  if (manager && !manager.stopped) return res.json({ ok: true, already: true });

  dryRun = Boolean(req.body.dryRun);
  intervalMs = Number(req.body.intervalMs) || 900000;
  if (req.body.lang) lang = normalizeLang(req.body.lang);

  manager = new QuestManager(cfg.token, { dryRun, lang });
  manager.on('log', pushLog);
  manager.on('quests', (q) => broadcast('quests', q));
  manager.on('stats', (s) => broadcast('stats', s));
  manager.on('progress', (p) => broadcast('progress', p));
  manager.on('stopped', () => broadcast('state', { running: false }));

  pushLog({ level: 'ok', msg: translate(lang, 'started'), at: Date.now() });
  broadcast('state', { running: true });
  manager.loop(intervalMs).catch((e) => pushLog({ level: 'error', msg: e.message, at: Date.now() }));

  res.json({ ok: true });
});

app.post('/api/stop', (req, res) => {
  if (manager) manager.stop();
  res.json({ ok: true });
});

app.post('/api/scan', async (req, res) => {
  const cfg = loadConfig();
  if (!cfg.token) return res.status(400).json({ error: translate(lang, 'noToken') });
  const tmp = new QuestManager(cfg.token, { lang });
  const quests = await tmp.fetchQuests();
  res.json({ quests });
});

// localhost uniquement : sinon n'importe qui sur le réseau peut piloter le bot
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  UI : http://localhost:${PORT}\n`);
});