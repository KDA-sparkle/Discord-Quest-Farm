# 📖 Tutoriel : Discord Quest Farm

🇫🇷 Français · [🇬🇧 English](TUTORIAL.md) · [← Retour au README](../README.md)

> [!WARNING]
> **À but éducatif uniquement.** Utiliser ce projet sur ton compte est contraire aux Conditions d'utilisation de Discord et peut mener à une suspension ou à un ban. Lis le [README](../README.md) avant de continuer.

---

## 1. Installer Node.js

1. Va sur **https://nodejs.org** et télécharge la version **LTS**.
2. Installe-la en laissant les options par défaut.
3. Vérifie dans un terminal (PowerShell ou Invite de commandes) :
   ```bash
   node -v
   ```
   Un numéro de version (par exemple `v22.x.x`) doit s'afficher.

## 2. Récupérer le projet

**Option A, avec Git :**
```bash
git clone https://github.com/KDA-sparkle/Discord-Quest-Farm.git
cd Discord-Quest-Farm
```

**Option B, sans Git :** sur la page GitHub, clique sur **Code → Download ZIP**, puis décompresse le dossier.

## 3. Lancer le tableau de bord

- **Windows :** double-clique sur **`start.bat`**. Au premier lancement, il installe les dépendances, puis ouvre le navigateur tout seul.
- **Ou, sur n'importe quel système :**
  ```bash
  npm install
  npm start
  ```
  Puis ouvre **http://localhost:3000**.

Laisse la fenêtre du terminal ouverte : la fermer arrête le serveur.

## 4. Récupérer ton token Discord

> [!CAUTION]
> Ton token, c'est **la clé de ton compte**. Quiconque l'a peut tout faire à ta place. Ne le colle **nulle part ailleurs** que dans ce tableau de bord, sur ton propre PC.

### Méthode 1 : la console (la plus rapide)

1. Ouvre Discord **dans le navigateur** (**https://discord.com/app**), pas dans l'appli de bureau, et connecte-toi.
2. Appuie sur **Ctrl + Maj + I** (ou **F12**), puis va dans l'onglet **Console**.
3. Colle cette commande, puis appuie sur Entrée :
   ```js
   (JSON.parse(localStorage.getItem("token"))).replace(/"/g, "")
   ```
4. Copie le texte affiché (sans les guillemets) : c'est ton token.
5. Colle-le dans la carte **« Token »** du tableau de bord, puis clique sur **Valider**. Il est enregistré automatiquement : **pas besoin de fichier `.env`**.

> Si la console affiche un avertissement « Self-XSS » et refuse de coller, tape d'abord `allow pasting` puis Entrée, et recommence. Ne colle **jamais** dans cette console du code qu'on t'a envoyé.

### Méthode 2 : l'onglet Réseau (si la méthode 1 renvoie une erreur)

Selon la version de Discord, `localStorage` peut être désactivé dans la console et la commande renvoie une erreur. Dans ce cas :

1. Toujours sur **https://discord.com/app**, ouvre les outils de développement et va dans l'onglet **Réseau** (Network).
2. Dans le champ de filtre, tape `api`, puis clique sur un salon ou un serveur pour générer des requêtes.
3. Clique sur une requête (par exemple `messages` ou `science`), puis cherche **En-têtes de requête** → **`authorization`**.
4. Copie la valeur et colle-la dans le tableau de bord.

## 5. Utiliser le tableau de bord

1. **Colle ton token** dans la carte « Token », puis clique sur **Valider**. Ton pseudo s'affiche en haut.
2. Clique sur **Scan** : tes quêtes actives apparaissent, avec leur progression réelle.
3. *(Conseillé la première fois)* active **dry-run**, puis clique sur **Démarrer**. La console montre ce que le bot *ferait*, sans rien envoyer à Discord.
4. Désactive dry-run, clique sur **Arrêter**, puis à nouveau sur **Démarrer** pour lancer pour de vrai.
5. Le bot traite les quêtes dans cet ordre :
   - les récompenses en attente ;
   - les **vidéos** (quelques minutes chacune) ;
   - les **jeux** (environ 15 minutes chacun, l'un après l'autre).
6. Puis il refait un scan selon l'intervalle choisi (5, 15 ou 30 min).

**L'interface en bref :**
- **Pastille en haut à droite** : « Je te surveille » quand le bot tourne, « Endormie » quand il est arrêté.
- **Bouton FR / EN** : change la langue de l'interface et de la console.
- **Onglets** Tout / À faire / À récupérer / Récupérées pour filtrer les quêtes.
- **Journal intime** : la console live. L'icône calendrier affiche les logs techniques.

## 6. Récupérer les récompenses

Discord demande un **captcha** pour chaque récompense, donc le bot ne peut pas les récupérer à ta place.

1. Quand une quête est terminée, elle apparaît dans le bloc doré **« À récupérer »**.
2. Clique sur **♥ Ouvrir dans Discord**, ou sur **Version web**.
3. Clique sur **Claim** sur la quête, puis résous le captcha.
4. Reviens sur le tableau de bord et clique sur **⟳** pour mettre à jour.

## 7. Arrêter

- Clique sur **Arrêter** dans le tableau de bord pour mettre le bot en pause.
- Ferme la fenêtre du terminal (ou fais `Ctrl + C`) pour tout couper.

---

## 🛠️ Dépannage

| Problème | Solution |
|---|---|
| **0 quête trouvée** | Le bot lit automatiquement le numéro de version actuel de Discord. Si ça échoue, il utilise une valeur de secours qui peut être trop vieille : relance le serveur. Vérifie aussi que des quêtes sont visibles dans Discord (Découvrir → Quêtes). |
| **Discord affiche 99 % mais le site 20 %** | L'appli Discord *estime* la progression d'après le temps écoulé. Le site affiche la vraie valeur du serveur, qui est celle qui compte. Laisse le bot continuer. |
| **« Captcha demandé… » dans la console** | C'est normal : récupère la récompense à la main (étape 6). |
| **« aucune progression depuis 190s »** | Discord n'a pas compté les heartbeats. Le bot passe à la suite et réessaiera au prochain scan. |
| **« serveur hors ligne »** dans le tableau de bord | La fenêtre du terminal a été fermée ou a planté : relance `start.bat` ou `npm start`. |
| **`EADDRINUSE` / port déjà utilisé** | Un autre serveur tourne déjà. Ferme-le, ou lance sur un autre port : `set PORT=3001 && npm start` (Windows) ou `PORT=3001 npm start` (macOS / Linux). |
| **« Token invalide »** | Le token a changé (déconnexion, changement de mot de passe…). Récupère-le à nouveau (étape 4). |
| **« Inscriptions bloquées par Discord… »** | Discord a limité ton accès aux quêtes. **Arrête le bot** et attends la date indiquée. |

## 💡 Conseils pour limiter les risques

- Laisse l'appli Discord ouverte pendant que le bot tourne.
- N'utilise pas d'autre outil de quêtes en même temps (plugins, scripts…).
- Préfère un intervalle de 15 ou 30 minutes.
- Si des erreurs 403 ou des blocages apparaissent, arrête tout.
