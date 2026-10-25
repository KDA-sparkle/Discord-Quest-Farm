# ♡ Discord Quest Farm

🇫🇷 Français · [🇬🇧 English](README.en.md)

> [!WARNING]
> **Projet à but éducatif uniquement.**
> Ce dépôt montre comment fonctionne le système de quêtes de Discord (API, heartbeats, progression). Automatiser un compte utilisateur (« selfbot ») est **contraire aux [Conditions d'utilisation de Discord](https://discord.com/terms)** et peut entraîner une suspension des quêtes, voire un **bannissement du compte**. Tu es seul·e responsable de l'usage que tu en fais. Aucun lien avec Discord Inc.

Petit tableau de bord local (Node.js + Express) au style yandere ♡ qui détecte les quêtes Discord de ton compte, suit leur progression en direct et termine automatiquement les tâches vidéo et « jouer sur PC ».

---

## ✨ Fonctionnalités

- **Détection des quêtes** actives (les quêtes expirées sont ignorées), avec bannière, logo, récompense et date de fin.
- **Quêtes vidéo** (`WATCH_VIDEO`) : progression envoyée à un rythme proche du temps réel.
- **Quêtes de jeu** (`PLAY_ON_DESKTOP`, `PLAY_ACTIVITY`, `STREAM_ON_DESKTOP`) : heartbeat toutes les 60 s jusqu'à 15 min.
- **Gestion des quêtes « au choix »** : une seule tâche est faite quand Discord n'en demande qu'une.
- **Progression réelle** : la page relit l'état chez Discord toutes les 60 s.
- **Bloc « À récupérer »** avec un bouton qui ouvre directement la page des quêtes dans Discord.
- **Console live**, statistiques (orbs gagnés…), filtres, mode **dry-run** (simulation sans rien envoyer).
- Interface **bilingue FR / EN** (bouton en haut à droite).
- Serveur accessible **uniquement depuis ton PC** (`127.0.0.1`).

## ⚠️ Limites

- **Récompenses** : Discord exige un **captcha** pour chaque récompense. Le bot termine les quêtes, mais c'est toi qui cliques sur « Récupérer » dans Discord. Le contournement du captcha n'est volontairement **pas** prévu.
- **Non supporté** : quêtes Xbox, PlayStation et « succès dans une activité ».
- L'appli Discord peut afficher un pourcentage **estimé** (ex. 99 %) différent de la vraie valeur : c'est la valeur du serveur, affichée sur le site, qui compte.

## 🚀 Démarrage rapide

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent (version LTS conseillée).

```bash
git clone https://github.com/KDA-sparkle/Discord-Quest-Farm.git
cd Discord-Quest-Farm
npm install
npm start
```

Puis ouvre **http://localhost:3000**. Sous Windows, tu peux aussi double-cliquer sur `start.bat`.

👉 Guide pas à pas, avec la récupération du token et le dépannage : **[docs/TUTORIEL.md](docs/TUTORIEL.md)**

## 🗂️ Structure

| Fichier | Rôle |
|---|---|
| `server.js` | Serveur Express : API locale + flux d'événements (SSE) pour la console live |
| `questManager.js` | Logique des quêtes : récupération, inscription, heartbeats, claim |
| `i18n.js` | Messages du serveur en français et en anglais |
| `public/index.html` | Interface web (HTML/CSS/JS sans dépendance) |
| `start.bat` | Lanceur Windows (installe les dépendances au premier lancement) |
| `config.json` | Créé automatiquement : contient **ton token**. Ignoré par Git, ne le partage jamais |

## 🔒 Sécurité

- Ton token donne un **accès complet** à ton compte. Ne le donne à personne et ne le publie jamais.
- Il est stocké uniquement en local dans `config.json`, qui est exclu du dépôt via `.gitignore`.
- Si tu penses qu'il a fuité, change ton mot de passe Discord : ça invalide immédiatement le token.

## 📜 Avertissement

Ce projet est fourni « tel quel », **à des fins éducatives et de recherche**, sans aucune garantie. Les auteurs ne sont pas responsables d'une éventuelle sanction sur ton compte ni de tout autre dommage. Discord est une marque de Discord Inc.
