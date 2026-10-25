'use strict';

// Messages côté serveur (console live + erreurs API), en français et en anglais.
const MESSAGES = {
  fr: {
    stopRequested: 'Arrêt demandé…',
    fetchFailed: 'Impossible de récupérer les quêtes (token invalide ?)',
    enrollBlocked: "Inscriptions bloquées par Discord jusqu'au {date}",
    dryEnroll: '[dry] inscription — {name}',
    enrollSkip: 'skip {name} (inscription {status})',
    dryClaim: '[dry] claim — {name}',
    claimNetwork: 'Claim échoué (réseau) : {name}',
    claimed: 'Récompense récupérée : {name}{reward}',
    claimCaptcha: 'Captcha demandé pour {name} : récupère-la à la main dans Discord (Découvrir → Quêtes)',
    claimRefused: 'Claim refusé ({status}) : {name} — {body}',
    videoStart: '▶ vidéo {name} — {value}/{target}s',
    videoDone: 'Vidéo terminée : {name}',
    noAppId: "{name} : pas d'application_id, skip",
    playStart: '▶ {type} {name} — {value}/{target}s',
    playDone: '{type} terminé : {name}',
    stalled: '{name} : aucune progression depuis {seconds}s, abandon',
    enrolling: '• {name} — inscription',
    questLine: '• {name}',
    nothingDoable: '{name} : aucune tâche faisable ({types})',
    dryFarm: '[dry] farm {types} — {name}',
    scanning: 'Scan des quêtes…',
    nothingToDo: 'Rien à faire.',
    questError: '{name} : {error}',
    cycleError: 'Erreur cycle : {error}',
    nextScan: 'Prochain scan dans {minutes} min',
    started: 'Manager démarré.',
    tokenEmpty: 'Token vide',
    tokenInvalid: 'Token invalide',
    discordUnreachable: 'Discord injoignable, réessaie',
    noToken: 'Aucun token enregistré',
  },
  en: {
    stopRequested: 'Stop requested…',
    fetchFailed: 'Could not fetch quests (invalid token?)',
    enrollBlocked: 'Enrollment blocked by Discord until {date}',
    dryEnroll: '[dry] enroll — {name}',
    enrollSkip: 'skip {name} (enroll {status})',
    dryClaim: '[dry] claim — {name}',
    claimNetwork: 'Claim failed (network): {name}',
    claimed: 'Reward claimed: {name}{reward}',
    claimCaptcha: 'Captcha required for {name}: claim it manually in Discord (Discover → Quests)',
    claimRefused: 'Claim refused ({status}): {name} — {body}',
    videoStart: '▶ video {name} — {value}/{target}s',
    videoDone: 'Video done: {name}',
    noAppId: '{name}: no application_id, skip',
    playStart: '▶ {type} {name} — {value}/{target}s',
    playDone: '{type} done: {name}',
    stalled: '{name}: no progress for {seconds}s, giving up',
    enrolling: '• {name} — enrolling',
    questLine: '• {name}',
    nothingDoable: '{name}: no doable task ({types})',
    dryFarm: '[dry] farm {types} — {name}',
    scanning: 'Scanning quests…',
    nothingToDo: 'Nothing to do.',
    questError: '{name}: {error}',
    cycleError: 'Cycle error: {error}',
    nextScan: 'Next scan in {minutes} min',
    started: 'Manager started.',
    tokenEmpty: 'Empty token',
    tokenInvalid: 'Invalid token',
    discordUnreachable: 'Discord unreachable, try again',
    noToken: 'No token saved',
  },
};

const LOCALES = { fr: 'fr-FR', en: 'en-US' };

function normalizeLang(lang) {
  return MESSAGES[lang] ? lang : 'fr';
}

function translate(lang, key, vars = {}) {
  const dict = MESSAGES[normalizeLang(lang)];
  const tpl = dict[key] ?? MESSAGES.fr[key] ?? key;
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''));
}

function formatDate(lang, value) {
  return new Date(value).toLocaleString(LOCALES[normalizeLang(lang)]);
}

module.exports = { translate, formatDate, normalizeLang };
