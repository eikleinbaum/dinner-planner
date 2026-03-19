# What's for Dinner

A weekly dinner planner with meal variations, grocery lists, and real-time sync between devices.

## Features

- **Weekly planner** — assign dinners to each night, or mark days as leftovers/eating out/takeout
- **Meal variations** — e.g. Tacos → Beef Tacos, Chicken Tacos, Fish Tacos
- **Inline add** — create new dinners from the planner or the dinners tab
- **Grocery list** — auto-generated from the week's selections, with tap-to-check-off
- **Week templates** — save and reload entire week plans
- **Real-time sync** — share with your partner via Firebase (optional)
- **Works offline** — falls back to localStorage when Firebase isn't configured

## Getting started

```bash
git clone https://github.com/YOUR_USERNAME/dinner-planner.git
cd dinner-planner
npm install
npm run dev
```

Then open http://localhost:5173

## Setting up Firebase sync (optional)

Without Firebase, the app works fine — it just saves to localStorage on your device. To share between devices:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project**, give it a name, click through (disable Analytics if you want)
3. In the project dashboard, click the **</>** (Web) icon to add a web app
4. Copy the `firebaseConfig` object
5. Paste your values into `src/firebase.js`
6. In the Firebase Console sidebar, go to **Build → Realtime Database**
7. Click **Create Database**, choose your region, select **Start in test mode**
8. Done — restart your dev server

**Sharing with your partner:**
- Click "Share with household" in the app
- Copy the link and send it to them
- They open it in their browser — both of you now see the same data in real time

**Security note:** Test mode rules expire after 30 days. For long-term use, update your database rules to:
```json
{
  "rules": {
    "households": {
      "$householdId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```
This is still open-write, but the household ID is a 12-character random string — effectively unguessable. For tighter security, you can add Firebase Authentication later.

## Deploy to GitHub Pages

1. Update `base` in `vite.config.js` to match your repo name
2. Run:

```bash
npm run deploy
```

3. In your GitHub repo settings, set Pages source to the `gh-pages` branch

Your app will be live at `https://YOUR_USERNAME.github.io/dinner-planner/`

## Iterating with Claude Code

From the project directory:

```bash
claude
```

Describe what you want changed — Claude Code edits `src/App.jsx` directly and you see changes instantly via Vite hot reload.

## Project structure

```
src/
  main.jsx        — React entry point
  App.jsx         — All UI and logic
  firebase.js     — Firebase config (fill in your values)
  useSync.js      — Sync hook (Firebase + localStorage fallback)
```
