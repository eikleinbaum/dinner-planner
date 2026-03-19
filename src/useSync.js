import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "./firebase";

// Generate a random household ID
function makeId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// Check if Firebase is configured (not placeholder values)
function isFirebaseConfigured() {
  try {
    return db && db.app && !db.app.options.apiKey.startsWith("YOUR_");
  } catch {
    return false;
  }
}

export function useSync(defaultMeals) {
  const [meals, setMeals] = useState(null);
  const [plan, setPlan] = useState({});
  const [templates, setTemplates] = useState([]);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);
  const [householdId, setHouseholdId] = useState(null);
  const skipNextWrite = useRef(false);

  // Resolve household ID: URL param > localStorage > generate new
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get("h");

    if (id) {
      localStorage.setItem("dp-household", id);
    } else {
      id = localStorage.getItem("dp-household");
    }

    if (!id) {
      id = makeId();
      localStorage.setItem("dp-household", id);
    }

    setHouseholdId(id);

    // Clean URL if it has the param (keep it bookmarkable but tidy)
    if (params.get("h")) {
      const url = new URL(window.location);
      url.searchParams.delete("h");
      window.history.replaceState({}, "", url);
    }
  }, []);

  // Subscribe to Firebase or load from localStorage
  useEffect(() => {
    if (!householdId) return;

    if (isFirebaseConfigured()) {
      const dbRef = ref(db, "households/" + householdId);
      const unsub = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Existing household — respect saved state (even if empty)
          skipNextWrite.current = true;
          const toArr = (v) => Array.isArray(v) ? v : Object.values(v || {});
          const rawMeals = toArr(data.meals);
          setMeals(rawMeals.map(m => ({
            ...m,
            variations: toArr(m.variations).map(v => ({ ...v, ingredients: toArr(v.ingredients) }))
          })));
          setPlan(data.plan || {});
          setTemplates(data.templates || []);
        } else {
          // First time or all data cleared — seed with defaults
          setMeals(defaultMeals);
          setPlan({});
          setTemplates([]);
        }
        setSynced(true);
        setReady(true);
      }, (err) => {
        console.error("Firebase read error:", err);
        // Fall back to localStorage
        loadLocal();
        setReady(true);
      });
      return () => unsub();
    } else {
      loadLocal();
      setReady(true);
    }
  }, [householdId]);

  function loadLocal() {
    try {
      const raw = localStorage.getItem("dinner-planner");
      if (raw) {
        const data = JSON.parse(raw);
        setMeals("meals" in data ? (data.meals || []) : defaultMeals);
        setPlan(data.plan || {});
        setTemplates(data.templates || []);
      } else {
        setMeals(defaultMeals);
      }
    } catch {
      setMeals(defaultMeals);
    }
  }

  // Write changes to Firebase + localStorage
  const save = useCallback((m, p, t) => {
    // Always save locally as backup
    try {
      localStorage.setItem("dinner-planner", JSON.stringify({ meals: m, plan: p, templates: t }));
    } catch {}

    if (isFirebaseConfigured() && householdId) {
      if (skipNextWrite.current) {
        skipNextWrite.current = false;
        return;
      }
      const dbRef = ref(db, "households/" + householdId);
      set(dbRef, { meals: m.length ? m : [], plan: p, templates: t, _ts: Date.now() }).catch(err => {
        console.error("Firebase write error:", err);
      });
    }
  }, [householdId]);

  // Auto-save when state changes
  useEffect(() => {
    if (ready && meals) {
      save(meals, plan, templates);
    }
  }, [meals, plan, templates, ready, save]);

  // Generate share URL
  const shareUrl = householdId
    ? `${window.location.origin}${window.location.pathname}?h=${householdId}`
    : null;

  return {
    meals, setMeals,
    plan, setPlan,
    templates, setTemplates,
    ready,
    synced,
    householdId,
    shareUrl,
  };
}
