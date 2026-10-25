'use strict';

const EventEmitter = require('events');
const { translate, formatDate } = require('./i18n');

const API_BASE = 'https://discord.com/api/v9';
const CLIENT_VERSION = '1.0.9175';
// Discord filtre /quests/@me selon le build : un build trop vieux renvoie 0 quête.
// On récupère le build actuel depuis le client web, avec ce fallback si ça échoue.
const FALLBACK_BUILD_NUMBER = 649389;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) discord/1.0.9175 Chrome/128.0.6613.186 ' +
  'Electron/32.2.7 Safari/537.36';

const ENROLL_LOCATION = 11; // QUEST_HOME
const VIDEO_BEAT_MIN = 7000;
const VIDEO_BEAT_MAX = 9500;
const DESKTOP_BEAT = 60000;
const WATCHDOG_MS = 3 * DESKTOP_BEAT + 10000; // le 1er heartbeat ne compte souvent pas
const TASK_TIMEOUT = 30 * 60 * 1000;

const VIDEO_TASKS = new Set(['WATCH_VIDEO', 'WATCH_VIDEO_ON_MOBILE']);
const DESKTOP_TASKS = new Set([
  'PLAY_ON_DESKTOP',
  'PLAY_ACTIVITY',
  'STREAM_ON_DESKTOP',
]);
const SUPPORTED_TASKS = new Set([...VIDEO_TASKS, ...DESKTOP_TASKS]);

/* ------------------------------------------------------------------ utils */

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let buildPromise = null;

function fetchBuildNumber() {
  if (!buildPromise) {
    buildPromise = (async () => {
      const signal = AbortSignal.timeout(15000);
      const html = await (await fetch('https://discord.com/app', { headers: { 'User-Agent': USER_AGENT }, signal })).text();
      const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]).reverse();
      for (const src of scripts) {
        const js = await (await fetch('https://discord.com' + src, { signal })).text();
        const m = js.match(/build_?[nN]umber["']?\s*[:=]\s*["']?(\d{6,})/);
        if (m) return Number(m[1]);
      }
      return FALLBACK_BUILD_NUMBER;
    })().catch(() => FALLBACK_BUILD_NUMBER);
  }
  return buildPromise;
}

function superProperties(buildNumber) {
  const props = {
    os: 'Windows',
    browser: 'Discord Client',
    release_channel: 'stable',
    client_version: CLIENT_VERSION,
    os_version: '10.0.22631',
    os_arch: 'x64',
    app_arch: 'x64',
    system_locale: 'en-US',
    has_client_mods: false,
    client_launch_id: crypto.randomUUID(),
    browser_user_agent: USER_AGENT,
    browser_version: '32.2.7',
    os_sdk_version: '22631',
    client_build_number: buildNumber,
    native_build_number: 55000,
    client_event_source: null,
    launch_signature: crypto.randomUUID(),
  };
  return Buffer.from(JSON.stringify(props)).toString('base64');
}

function questTasks(quest) {
  const cfg = quest.config || {};
  const tc =
    pick(cfg, 'task_config_v2', 'taskConfigV2', 'task_config', 'taskConfig') || {};
  return pick(tc, 'tasks') || {};
}

// "or" (le cas courant) : une seule tâche suffit à valider la quête.
function questJoinOp(quest) {
  const cfg = quest.config || {};
  const tc = pick(cfg, 'task_config_v2', 'taskConfigV2', 'task_config', 'taskConfig') || {};
  return pick(tc, 'join_operator', 'joinOperator') || 'and';
}

function questReward(quest) {
  const rc = pick(quest.config || {}, 'rewards_config', 'rewardsConfig') || {};
  const r = (pick(rc, 'rewards') || [])[0];
  if (!r) return null;
  return pick(pick(r, 'messages') || {}, 'name') || null;
}

function questAsset(quest, ...keys) {
  const assets = pick(quest.config || {}, 'assets') || {};
  for (const k of keys) {
    const v = assets[k];
    if (v && v !== 'PLACEHOLDER') return /^https?:/.test(v) ? v : `https://cdn.discordapp.com/${v}`;
  }
  return null;
}

function questName(quest) {
  const cfg = quest.config || {};
  const msgs = pick(cfg, 'messages') || {};
  return pick(msgs, 'quest_name', 'questName') || quest.id;
}

function questExpiry(quest) {
  return pick(quest.config || {}, 'expires_at', 'expiresAt');
}

function taskAppId(task, quest) {
  // Depuis juillet 2026 : task.applications[0].id
  const apps = pick(task, 'applications');
  if (Array.isArray(apps) && apps.length) {
    const id = pick(apps[0], 'id');
    if (id) return id;
  }
  const app = pick(quest.config || {}, 'application') || {};
  return pick(app, 'id');
}

// Les quêtes ont un champ user_status ; heartbeat / video-progress renvoient
// directement le user_status (quest_id + progress à la racine).
function userStatus(obj) {
  const s = pick(obj, 'user_status', 'userStatus');
  if (s) return s;
  if (obj && obj.quest_id && obj.progress) return obj;
  return {};
}

function progressOf(quest, taskType) {
  const prog = pick(userStatus(quest), 'progress') || {};
  const entry = pick(prog, taskType) || {};
  return Number(pick(entry, 'value') || 0);
}

const isCompleted = (q) => Boolean(pick(userStatus(q), 'completed_at', 'completedAt'));
const isEnrolled = (q) => Boolean(pick(userStatus(q), 'enrolled_at', 'enrolledAt'));
const isClaimed = (q) => Boolean(pick(userStatus(q), 'claimed_at', 'claimedAt'));

/* ----------------------------------------------------------------- client */

class DiscordAPI {
  constructor(token) {
    this.token = token;
    this.superProps = null;
  }

  headers() {
    return {
      Authorization: this.token,
      'User-Agent': USER_AGENT,
      'X-Super-Properties': this.superProps,
      'X-Discord-Locale': 'en-US',
      Origin: 'https://discord.com',
      Referer: 'https://discord.com/channels/@me',
      'Content-Type': 'application/json',
      Accept: '*/*',
    };
  }

  async request(method, path, payload) {
    const url = API_BASE + path;
    if (!this.superProps) this.superProps = superProperties(await fetchBuildNumber());
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers: this.headers(),
          body: payload === undefined ? undefined : JSON.stringify(payload),
        });

        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          const wait = (Number(data.retry_after) || 1) * 1000 + 300;
          await sleep(wait);
          continue;
        }
        if ([500, 502, 503, 504].includes(res.status)) {
          await sleep(1500 * (attempt + 1));
          continue;
        }

        const text = await res.text();
        if (res.status >= 400) return { __status__: res.status, __body__: text };
        return text ? JSON.parse(text) : {};
      } catch (err) {
        await sleep(1500 * (attempt + 1));
      }
    }
    return null;
  }

  get(path) {
    return this.request('GET', path);
  }

  post(path, payload) {
    return this.request('POST', path, payload || {});
  }
}

/* ---------------------------------------------------------------- manager */

class QuestManager extends EventEmitter {
  constructor(token, { dryRun = false, lang = 'fr' } = {}) {
    super();
    this.lang = lang;
    this.api = new DiscordAPI(token);
    this.dryRun = dryRun;
    this.stopped = false;
    this.skipped = new Set();
    this.stats = { found: 0, completed: 0, claimed: 0, credits: 0 };
  }

  log(level, key, vars) {
    this.emit('log', { level, msg: translate(this.lang, key, vars), at: Date.now() });
  }

  stop() {
    this.stopped = true;
    this.log('warn', 'stopRequested');
  }

  async sleep(ms) {
    const step = 250;
    let elapsed = 0;
    while (elapsed < ms && !this.stopped) {
      await sleep(Math.min(step, ms - elapsed));
      elapsed += step;
    }
  }

  /* ------------------------------------------------------------ fetching */

  async fetchQuests() {
    let data = await this.api.get('/quests/@me');
    if (data && !data.quests) {
      data = await this.api.get('/quests/@me?with_quest_config=true');
    }
    if (!data || !Array.isArray(data.quests)) {
      this.log('error', 'fetchFailed');
      return [];
    }

    const blocked = pick(data, 'quest_enrollment_blocked_until', 'questEnrollmentBlockedUntil');
    if (blocked) {
      this.log('warn', 'enrollBlocked', { date: formatDate(this.lang, blocked) });
    }

    const now = Date.now();
    const live = data.quests.filter((q) => {
      const exp = questExpiry(q);
      return !exp || new Date(exp).getTime() > now;
    });

    const quests = live.map((q) => ({
      id: q.id,
      name: questName(q),
      expires: questExpiry(q),
      tasks: Object.entries(questTasks(q)).map(([type, task]) => ({
        type,
        target: Number(pick(task, 'target') || 0),
        progress: progressOf(q, type),
        supported: SUPPORTED_TASKS.has(type),
        appId: taskAppId(task, q),
      })),
      subtitle: pick(pick(q.config || {}, 'messages') || {}, 'game_title', 'gameTitle'),
      kind: Object.keys(questTasks(q)).some((t) => VIDEO_TASKS.has(t)) ? 'video' : 'play',
      hero: questAsset(q, 'hero', 'quest_bar_hero'),
      tile: questAsset(q, 'game_tile_dark', 'game_tile', 'game_tile_light'),
      traffic: {
        traffic_metadata_raw: pick(q, 'traffic_metadata_raw'),
        traffic_metadata_sealed: pick(q, 'traffic_metadata_sealed'),
      },
      joinOp: questJoinOp(q),
      reward: questReward(q),
      orbs: Number(pick(userStatus(q), 'orb_quantity_claimed') || 0),
      completed: isCompleted(q),
      claimed: isClaimed(q),
      enrolled: isEnrolled(q),
    }));

    this.stats.found = quests.length;
    this.stats.completed = quests.filter((q) => q.completed).length;
    this.stats.claimed = quests.filter((q) => q.claimed).length;
    this.stats.credits = quests.reduce((sum, q) => sum + q.orbs, 0);
    this.emit('quests', quests);
    this.emit('stats', this.stats);
    return quests;
  }

  /* ------------------------------------------------------------- actions */

  async enroll(quest) {
    const body = { location: ENROLL_LOCATION, is_targeted: false, ...quest.traffic };
    if (this.dryRun) {
      this.log('info', 'dryEnroll', { name: quest.name });
      return true;
    }
    const res = await this.api.post(`/quests/${quest.id}/enroll`, body);
    const ok = res && res.__status__ === undefined;
    if (!ok && res && [403, 404].includes(res.__status__)) {
      this.skipped.add(quest.id);
      this.log('warn', 'enrollSkip', { name: quest.name, status: res.__status__ });
    }
    return ok;
  }

  async claim(quest) {
    if (this.dryRun) {
      this.log('info', 'dryClaim', { name: quest.name });
      return;
    }
    const res = await this.api.post(`/quests/${quest.id}/claim-reward`, {
      platform: 0,
      location: ENROLL_LOCATION,
      is_targeted: false,
      metadata_raw: null,
      metadata_sealed: null,
      ...quest.traffic,
    });
    if (!res) {
      this.log('error', 'claimNetwork', { name: quest.name });
      return;
    }
    if (res.__status__ === undefined) {
      const orbs = Number(pick(res, 'orb_quantity_claimed') || pick(userStatus(res), 'orb_quantity_claimed') || 0);
      this.log('ok', 'claimed', { name: quest.name, reward: quest.reward ? ' — ' + quest.reward : '' });
      this.stats.claimed += 1;
      this.stats.credits += orbs;
      this.emit('stats', this.stats);
      return;
    }
    if (String(res.__body__).includes('captcha')) {
      this.log('warn', 'claimCaptcha', { name: quest.name });
    } else {
      this.log('error', 'claimRefused', { name: quest.name, status: res.__status__, body: String(res.__body__).slice(0, 150) });
    }
    this.skipped.add(quest.id);
  }

  /* --------------------------------------------------------------- farms */

  async farmVideo(quest, taskType, target, progress) {
    let timestamp = progress;
    this.log('info', 'videoStart', { name: quest.name, value: Math.round(timestamp), target });

    const started = Date.now();
    while (timestamp < target && !this.stopped) {
      const delay = VIDEO_BEAT_MIN + Math.random() * (VIDEO_BEAT_MAX - VIDEO_BEAT_MIN);
      await this.sleep(delay);
      if (this.stopped) break;

      timestamp = Math.min(timestamp + delay / 1000, target);
      const res = await this.api.post(`/quests/${quest.id}/video-progress`, {
        timestamp: Number(timestamp.toFixed(3)),
      });

      this.emit('progress', { id: quest.id, type: taskType, value: timestamp, target });

      if (res && res.__status__ === undefined && isCompleted(res)) {
        this.log('ok', 'videoDone', { name: quest.name });
        return true;
      }
      if (Date.now() - started > TASK_TIMEOUT) return false;
    }
    return timestamp >= target;
  }

  async farmDesktop(quest, taskType, task) {
    const appId = task.appId;
    if (!appId) {
      this.log('debug', 'noAppId', { name: quest.name });
      return false;
    }

    const target = Number(pick(task, 'target') || 900);
    let last = task.progress;
    let lastChange = Date.now();
    this.log('info', 'playStart', { type: taskType, name: quest.name, value: Math.round(last), target });

    while (!this.stopped) {
      await this.sleep(DESKTOP_BEAT);
      if (this.stopped) break;

      // terminal envoyé trop tôt coupe la session et la progression stagne à ~99 %
      const res = await this.api.post(`/quests/${quest.id}/heartbeat`, {
        application_id: appId,
        terminal: false,
      });

      if (res && res.__status__ === undefined) {
        const fresh = progressOf(res, taskType);
        if (fresh > last) {
          last = fresh;
          lastChange = Date.now();
          this.emit('progress', { id: quest.id, type: taskType, value: Math.min(last, target), target });
        }
        if (isCompleted(res) || last >= target) {
          await this.api.post(`/quests/${quest.id}/heartbeat`, { application_id: appId, terminal: true });
          this.emit('progress', { id: quest.id, type: taskType, value: target, target });
          this.log('ok', 'playDone', { type: taskType, name: quest.name });
          return true;
        }
      }

      if (Date.now() - lastChange > WATCHDOG_MS) {
        this.log('warn', 'stalled', { name: quest.name, seconds: WATCHDOG_MS / 1000 });
        return false;
      }
      if (last >= target) return true;
    }
    return false;
  }

  /* --------------------------------------------------------------- cycle */

  async process(quest) {
    if (this.skipped.has(quest.id)) return;

    if (quest.completed) {
      if (!quest.claimed) await this.claim(quest);
      return;
    }

    if (!quest.enrolled) {
      this.log('info', 'enrolling', { name: quest.name });
      const ok = await this.enroll(quest);
      if (!ok) return;
    } else {
      this.log('info', 'questLine', { name: quest.name });
    }

    const todo = quest.tasks.filter((t) => t.supported && t.target && t.progress < t.target);
    if (!todo.length) {
      this.log('debug', 'nothingDoable', { name: quest.name, types: quest.tasks.map((t) => t.type).join(', ') });
      this.skipped.add(quest.id);
      return;
    }

    if (this.dryRun) {
      this.log('info', 'dryFarm', { name: quest.name, types: todo.map((t) => t.type).join(' / ') });
      return;
    }

    // "or" : une seule tâche suffit, on prend la plus avancée (vidéo desktop en priorité)
    const rank = (t) => t.progress / t.target + (t.type === 'WATCH_VIDEO' || t.type === 'PLAY_ON_DESKTOP' ? 0.001 : 0);
    const tasks = quest.joinOp === 'or' ? [todo.sort((a, b) => rank(b) - rank(a))[0]] : todo;

    const results = await Promise.allSettled(tasks.map((t) =>
      VIDEO_TASKS.has(t.type)
        ? this.farmVideo(quest, t.type, t.target, t.progress)
        : this.farmDesktop(quest, t.type, t)));

    const done = results.map((r) => r.status === 'fulfilled' && r.value === true);
    const finished = quest.joinOp === 'or' ? done.some(Boolean) : done.every(Boolean);
    if (finished && !this.stopped) {
      await this.sleep(3000 + Math.random() * 4000);
      await this.claim(quest);
    }
  }

  async runOnce() {
    this.log('info', 'scanning');
    const quests = await this.fetchQuests();
    // claims d'abord, puis vidéos (rapides), puis jeux (15 min chacun)
    const order = (q) => (q.completed ? 0 : q.kind === 'video' ? 1 : 2);
    const pending = quests.filter((q) => !q.claimed).sort((a, b) => order(a) - order(b));

    if (!pending.length) {
      this.log('info', 'nothingToDo');
      return;
    }

    for (const q of pending) {
      if (this.stopped) break;
      try {
        await this.process(q);
      } catch (err) {
        this.log('error', 'questError', { name: q.name, error: err.message });
      }
    }

    // rafraîchit l'UI avec l'état réel (terminées, claims en attente…)
    if (!this.stopped) await this.fetchQuests();
  }

  async loop(intervalMs = 900000) {
    while (!this.stopped) {
      try {
        await this.runOnce();
      } catch (err) {
        this.log('error', 'cycleError', { error: err.message });
      }
      if (this.stopped) break;
      this.log('info', 'nextScan', { minutes: Math.round(intervalMs / 60000) });
      await this.sleep(intervalMs);
    }
    this.emit('stopped');
  }
}

module.exports = { QuestManager, DiscordAPI, USER_AGENT };