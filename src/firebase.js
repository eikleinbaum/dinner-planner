import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ============================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (free tier is fine)
// 3. In project settings, add a Web app
// 4. Copy your config values below
// 5. In the Firebase console, go to Realtime Database
// 6. Click "Create Database", choose "Start in test mode"
// 7. That's it — both you and your wife open the same URL
// ============================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
