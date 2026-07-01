/* Legacy compatibility helpers. All values are runtime-only. */

const runtimeStore = new Map();

function get(key) {
  return runtimeStore.has(key) ? structuredClone(runtimeStore.get(key)) : null;
}

function set(key, value) {
  runtimeStore.set(key, structuredClone(value));
}

export function loadChats() { return get('chats'); }
export function saveChats(chats) { set('chats', chats); }
export function loadTheme() { return get('theme'); }
export function saveTheme(theme) { set('theme', theme); }
export function loadModel() { return get('model'); }
export function saveModel(model) { set('model', model); }
export function loadSettings() { return get('settings'); }
export function saveSettings(settings) { set('settings', settings); }
export function clearAll() { runtimeStore.clear(); }
