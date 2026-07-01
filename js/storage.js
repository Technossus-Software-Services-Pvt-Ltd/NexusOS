/* storage.js — the only module allowed to touch localStorage directly */

const KEYS = {
  chats:    'lc_proto_chats',
  theme:    'lc_proto_theme',
  model:    'lc_proto_model',
  settings: 'lc_proto_settings',
};

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

export function loadChats()      { return safeGet(KEYS.chats); }
export function saveChats(chats) { safeSet(KEYS.chats, chats); }

export function loadTheme()       { return safeGet(KEYS.theme); }
export function saveTheme(theme)  { safeSet(KEYS.theme, theme); }

export function loadModel()       { return safeGet(KEYS.model); }
export function saveModel(model)  { safeSet(KEYS.model, model); }

export function loadSettings()            { return safeGet(KEYS.settings); }
export function saveSettings(settings)    { safeSet(KEYS.settings, settings); }

export function clearAll() {
  Object.values(KEYS).forEach(safeRemove);
}
