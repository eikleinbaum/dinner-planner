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
 apiKey: "AIzaSyClEjVKoBzWEgv4Ec9BD2zpACBlqbDxJ8A",
  authDomain: "dinner-planner-f9bc5.firebaseapp.com",
  projectId: "dinner-planner-f9bc5",
  storageBucket: "dinner-planner-f9bc5.firebasestorage.app",
  messagingSenderId: "371208133123",
  appId: "1:371208133123:web:89711b5b2082bee25d8c36",
  measurementId: "G-65PJCDKSY9"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
