# ♡ Discord Quest Farm

[🇫🇷 Français](README.md) · 🇬🇧 English

> [!WARNING]
> **For educational purposes only.**
> This repository shows how Discord's quest system works (API, heartbeats, progress tracking). Automating a user account ("selfbot") **violates [Discord's Terms of Service](https://discord.com/terms)** and can lead to a quest suspension or even an **account ban**. You alone are responsible for how you use it. Not affiliated with Discord Inc.

A small local dashboard (Node.js + Express) with a yandere ♡ look. It detects your account's Discord quests, tracks their progress live, and automatically completes video and "play on desktop" tasks.

---

## ✨ Features

- **Quest detection** for active quests (expired ones are ignored), with banner, logo, reward and end date.
- **Video quests** (`WATCH_VIDEO`): progress is sent at close to real-time speed.
- **Game quests** (`PLAY_ON_DESKTOP`, `PLAY_ACTIVITY`, `STREAM_ON_DESKTOP`): a heartbeat every 60 s until 15 min.
- **"Any one of" quests**: only one task is done when Discord only requires one.
- **Real progress**: the page re-reads the state from Discord every 60 s.
- **"To claim" panel** with a button that opens the quests page straight in Discord.
- **Live console**, stats (orbs earned…), filters, and a **dry-run** mode (simulation, nothing is sent).
- **Bilingual FR / EN** interface (button in the top-right corner).
- The server only listens on **your own PC** (`127.0.0.1`).

## ⚠️ Limitations

- **Rewards**: Discord requires a **captcha** for every reward. The bot completes quests, but you click "Claim" in Discord yourself. Bypassing the captcha is intentionally **not** included.
- **Not supported**: Xbox, PlayStation and "achievement in an activity" quests.
- The Discord app may show an **estimated** percentage (e.g. 99%) that differs from the real value. The server value, shown on the dashboard, is the one that counts.

## 🚀 Quick start

Requirements: [Node.js](https://nodejs.org) 18 or newer (LTS recommended).

```bash
git clone https://github.com/KDA-sparkle/Discord-Quest-Farm.git
cd Discord-Quest-Farm
npm install
npm start
```

Then open **http://localhost:3000**. On Windows you can also double-click `start.bat`.

**Token:** open Discord in your browser (not the desktop app), press `Ctrl + Shift + I` → **Console**, and paste:

```js
(JSON.parse(localStorage.getItem("token"))).replace(/"/g, "")
```

Paste the result into the dashboard's "Token" card (no `.env` file to create).

👉 Step-by-step guide, including how to get your token and troubleshooting: **[docs/TUTORIAL.md](docs/TUTORIAL.md)**

## 🗂️ Project layout

| File | Purpose |
|---|---|
| `server.js` | Express server: local API + event stream (SSE) for the live console |
| `questManager.js` | Quest logic: fetching, enrolling, heartbeats, claiming |
| `i18n.js` | Server messages in French and English |
| `public/index.html` | Web UI (plain HTML/CSS/JS, no dependencies) |
| `start.bat` | Windows launcher (installs dependencies on first run) |
| `config.json` | Created automatically and holds **your token**. Ignored by Git, never share it |

## 🔒 Security

- Your token grants **full access** to your account. Never give it to anyone or publish it.
- It is stored locally only, in `config.json`, which is excluded from the repo via `.gitignore`.
- If you think it leaked, change your Discord password: that instantly invalidates the token.

## 📜 Disclaimer

This project is provided "as is", **for educational and research purposes**, without any warranty. The authors are not responsible for any action taken against your account or any other damage. Discord is a trademark of Discord Inc.
