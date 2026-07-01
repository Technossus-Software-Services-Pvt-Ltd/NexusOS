/* state.js — single in-memory state; no DOM manipulation */

import { mockUser, availableModels, defaultSettings } from '../data/mockData.js';

const state = {
  chats:         [],
  activeChatId:  null,
  theme:         'light',
  selectedModel: availableModels[0].id,
  settings:      { ...defaultSettings },
  user:          { ...mockUser },
  isGenerating:  false,
};

/* ── Chats ─────────────────────────────────────────────────────── */
export function getChats()     { return [...state.chats]; }
export function setChats(arr)  { state.chats = arr; }

export function getChatById(id) {
  return state.chats.find(c => c.id === id) ?? null;
}

export function addChat(chat) {
  state.chats.unshift(chat);
}

export function updateChat(id, patch) {
  const idx = state.chats.findIndex(c => c.id === id);
  if (idx !== -1) {
    state.chats[idx] = { ...state.chats[idx], ...patch };
  }
}

export function removeChat(id) {
  state.chats = state.chats.filter(c => c.id !== id);
}

export function addMessageToChat(chatId, message) {
  const chat = state.chats.find(c => c.id === chatId);
  if (chat) {
    chat.messages = [...(chat.messages ?? []), message];
    chat.updatedAt = new Date().toISOString();
  }
}

/* ── Active chat ───────────────────────────────────────────────── */
export function getActiveChatId()  { return state.activeChatId; }
export function setActiveChatId(id){ state.activeChatId = id; }

export function getActiveChat() {
  return state.activeChatId ? getChatById(state.activeChatId) : null;
}

/* ── Theme ─────────────────────────────────────────────────────── */
export function getTheme()      { return state.theme; }
export function setTheme(name)  { state.theme = name; }

/* ── Model ─────────────────────────────────────────────────────── */
export function getSelectedModel()    { return state.selectedModel; }
export function setSelectedModel(id)  { state.selectedModel = id; }

/* ── Settings ──────────────────────────────────────────────────── */
export function getSettings()         { return { ...state.settings }; }
export function updateSettings(patch) { state.settings = { ...state.settings, ...patch }; }

/* ── User ──────────────────────────────────────────────────────── */
export function getUser() { return { ...state.user }; }

/* ── Generating flag ───────────────────────────────────────────── */
export function isGenerating()       { return state.isGenerating; }
export function setGenerating(bool)  { state.isGenerating = bool; }

/* ── Models list ───────────────────────────────────────────────── */
export function getModels() { return availableModels; }
