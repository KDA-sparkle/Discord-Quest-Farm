# 📖 Tutorial: Discord Quest Farm

[🇫🇷 Français](TUTORIEL.md) · 🇬🇧 English · [← Back to README](../README.en.md)

> [!WARNING]
> **For educational purposes only.** Using this project on your account violates Discord's Terms of Service and can lead to a suspension or a ban. Read the [README](../README.en.md) before going further.

---

## 1. Install Node.js

1. Go to **https://nodejs.org** and download the **LTS** version.
2. Install it with the default options.
3. Check it in a terminal (PowerShell, Command Prompt, or Terminal):
   ```bash
   node -v
   ```
   You should see a version number such as `v22.x.x`.

## 2. Get the project

**Option A, with Git:**
```bash
git clone https://github.com/KDA-sparkle/Discord-Quest-Farm.git
cd Discord-Quest-Farm
```

**Option B, without Git:** on the GitHub page, click **Code → Download ZIP**, then extract the folder.

## 3. Start the dashboard

- **Windows:** double-click **`start.bat`**. On first run it installs the dependencies, then opens your browser.
- **Or, on any system:**
  ```bash
  npm install
  npm start
  ```
  Then open **http://localhost:3000**.

Keep the terminal window open: closing it stops the server.

## 4. Get your Discord token

> [!CAUTION]
> Your token is **the key to your account**. Anyone who has it can do anything as you. Never paste it **anywhere other** than this dashboard, on your own PC.

### Method 1: the console (fastest)

1. Open Discord **in your browser** (**https://discord.com/app**), not the desktop app, and log in.
2. Press **Ctrl + Shift + I** (or **F12**), then go to the **Console** tab.
3. Paste this command and press Enter:
   ```js
   (JSON.parse(localStorage.getItem("token"))).replace(/"/g, "")
   ```
4. Copy the text it prints (without the quotes): that is your token.
5. Paste it in the dashboard's **"Token"** card and click **Save**. It is saved automatically: **no `.env` file needed**.

> If the console shows a "Self-XSS" warning and blocks pasting, type `allow pasting`, press Enter, and try again. **Never** paste code someone sent you into that console.

### Method 2: the Network tab (if method 1 throws an error)

Depending on the Discord version, `localStorage` may be disabled in the console and the command throws an error. In that case:

1. Still on **https://discord.com/app**, open the developer tools and go to the **Network** tab.
2. Type `api` in the filter box, then click a channel or a server to trigger some requests.
3. Click a request (for example `messages` or `science`), then look under **Request Headers** → **`authorization`**.
4. Copy that value and paste it into the dashboard.

## 5. Use the dashboard

1. **Paste your token** in the "Token" card and click **Save**. Your username shows up at the top.
2. Click **Scan**: your active quests appear with their real progress.
3. *(Recommended the first time)* turn on **dry-run**, then click **Start**. The console shows what the bot *would* do, without sending anything to Discord.
4. Turn dry-run off, click **Stop**, then **Start** again to run it for real.
5. The bot handles quests in this order:
   - pending rewards;
   - **videos** (a few minutes each);
   - **games** (about 15 minutes each, one after another).
6. It then rescans at the interval you picked (5, 15 or 30 min).

**The UI at a glance:**
- **Top-right pill**: "I'm watching you" while the bot runs, "Asleep" when it is stopped.
- **FR / EN button**: switches the language of the UI and of the console.
- **Tabs** All / To do / To claim / Claimed to filter quests.
- **Secret diary**: the live console. The calendar icon shows debug logs.

## 6. Claim the rewards

Discord asks for a **captcha** on every reward, so the bot cannot claim them for you.

1. When a quest is done, it shows up in the gold **"To claim"** panel.
2. Click **♥ Open in Discord**, or **Web version**.
3. Click **Claim** on the quest, then solve the captcha.
4. Back on the dashboard, click **⟳** to refresh.

## 7. Stop

- Click **Stop** on the dashboard to pause the bot.
- Close the terminal window (or press `Ctrl + C`) to shut everything down.

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| **0 quests found** | The bot reads Discord's current build number automatically. If that fails, it uses a fallback value that may be too old: restart the server. Also check that quests are visible in Discord (Discover → Quests). |
| **Discord shows 99% but the dashboard shows 20%** | The Discord app *estimates* progress from elapsed time. The dashboard shows the real server value, which is the one that counts. Let the bot keep going. |
| **"Captcha required…" in the console** | That's expected: claim the reward manually (step 6). |
| **"no progress for 190s"** | Discord didn't count the heartbeats. The bot moves on and will retry at the next scan. |
| **"server offline"** on the dashboard | The terminal window was closed or crashed: run `start.bat` or `npm start` again. |
| **`EADDRINUSE` / port already in use** | Another server is already running. Close it, or use another port: `set PORT=3001 && npm start` (Windows) or `PORT=3001 npm start` (macOS / Linux). |
| **"Invalid token"** | The token changed (logout, password change…). Get it again (step 4). |
| **"Enrollment blocked by Discord…"** | Discord limited your quest access. **Stop the bot** and wait until the date shown. |

## 💡 Tips to lower the risk

- Keep the Discord app open while the bot runs.
- Don't use another quest tool at the same time (plugins, scripts…).
- Prefer a 15 or 30 minute interval.
- If 403 errors or blocks show up, stop everything.
