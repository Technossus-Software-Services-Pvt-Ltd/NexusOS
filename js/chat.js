/* chat.js — new chat, send message, mock reply, delete/rename chat */

import * as state   from './state.js';
import * as storage from './storage.js';
import * as ui      from './ui.js';
import * as sidebar from './sidebar.js';
import { uid, truncateTitle, randomInt } from './utils.js';
import {
  mockReplies,
  greetingReplies,
  thankYouReplies,
  availableModels,
} from '../data/mockData.js';

let _pendingAbort = false;
let _messagesEl   = null;
let _composerEl   = null;

export function init() {
  _messagesEl = document.getElementById('messages-inner');
  _composerEl = document.getElementById('composer-textarea');
  _initComposer();
  _initFileUpload();
}

/* ── Select chat ───────────────────────────────────────────────── */
export function selectChat(id) {
  state.setActiveChatId(id);
  sidebar.highlightActiveChat(id);
  _renderMessages();
  _updateTopbarModel();
  /* Close mobile overlay */
  document.querySelector('.chat-panel')?.classList.remove('mobile-open');
  document.getElementById('nav-mask')?.classList.remove('active');
}

/* ── New chat ──────────────────────────────────────────────────── */
export function createNewChat() {
  const chat = {
    id:         uid(),
    title:      'New Chat',
    model:      state.getSelectedModel(),
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
    messages:   [],
    _ephemeral: true,
  };

  state.addChat(chat);
  state.setActiveChatId(chat.id);
  sidebar.renderChatList();
  sidebar.highlightActiveChat(chat.id);
  _renderMessages();
  _updateTopbarModel();
  _composerEl?.focus();

  document.querySelector('.chat-panel')?.classList.remove('mobile-open');
  document.getElementById('nav-mask')?.classList.remove('active');
}

/* ── Send message ──────────────────────────────────────────────── */
export function sendMessage(text, attachment = null) {
  if (!text.trim() && !attachment) return;

  if (state.isGenerating()) {
    _pendingAbort = true;
    return;
  }

  const activeChatId = state.getActiveChatId();
  if (!activeChatId) return;

  const chat = state.getChatById(activeChatId);
  if (chat?._ephemeral) delete chat._ephemeral;

  const userMsg = {
    id:         uid(),
    role:       'user',
    text:       text.trim(),
    timestamp:  new Date().toISOString(),
    ...(attachment && { attachment }),
  };

  state.addMessageToChat(activeChatId, userMsg);

  const updatedChat = state.getChatById(activeChatId);
  if (updatedChat && updatedChat.messages.length === 1) {
    const newTitle = truncateTitle(text.trim(), 45);
    state.updateChat(activeChatId, { title: newTitle });
    _updateTopbarModel();
    sidebar.renderChatList();
    sidebar.highlightActiveChat(activeChatId);
  }

  /* Remove welcome state */
  document.getElementById('welcome-state')?.remove();

  if (_messagesEl) {
    _messagesEl.appendChild(ui.createMessageElement(userMsg));
    ui.scrollToBottom(document.getElementById('messages-area'));
  }

  storage.saveChats(state.getChats());

  state.setGenerating(true);
  ui.setSendButtonGenerating(true);
  if (_composerEl) _composerEl.disabled = true;

  const typingEl = ui.createTypingIndicator();
  _messagesEl?.appendChild(typingEl);
  ui.scrollToBottom(document.getElementById('messages-area'));

  const delay = randomInt(700, 1600);
  const modelId  = state.getSelectedModel();
  const modelObj = availableModels.find(m => m.id === modelId);

  setTimeout(() => {
    ui.removeTypingIndicator();

    if (_pendingAbort) {
      _pendingAbort = false;
      state.setGenerating(false);
      ui.setSendButtonGenerating(false);
      if (_composerEl) _composerEl.disabled = false;
      return;
    }

    const assistantMsg = {
      id:        uid(),
      role:      'assistant',
      text:      _generateReply(text.trim()),
      timestamp: new Date().toISOString(),
      model:     modelObj?.label ?? 'AI',
    };

    state.addMessageToChat(activeChatId, assistantMsg);
    storage.saveChats(state.getChats());

    if (_messagesEl) {
      _messagesEl.appendChild(ui.createMessageElement(assistantMsg));
      ui.scrollToBottom(document.getElementById('messages-area'));
    }

    state.setGenerating(false);
    ui.setSendButtonGenerating(false);
    if (_composerEl) { _composerEl.disabled = false; _composerEl.focus(); }
    sidebar.renderChatList();
  }, delay);
}

/* ── Delete chat ───────────────────────────────────────────────── */
export function deleteChat(id) {
  const allChats = state.getChats();
  const idx      = allChats.findIndex(c => c.id === id);
  state.removeChat(id);

  const remaining = state.getChats();
  if (state.getActiveChatId() === id) {
    const next = remaining[Math.max(0, idx - 1)];
    if (next) {
      selectChat(next.id);
    } else {
      state.setActiveChatId(null);
      _renderMessages();
      _updateTopbarModel();
    }
  }

  sidebar.renderChatList();
  sidebar.highlightActiveChat(state.getActiveChatId());
  storage.saveChats(state.getChats());
}

/* ── Rename chat ───────────────────────────────────────────────── */
export function renameChat(id, newTitle) {
  state.updateChat(id, { title: newTitle });
  storage.saveChats(state.getChats());
  if (state.getActiveChatId() === id) _updateTopbarModel();
  sidebar.renderChatList();
  sidebar.highlightActiveChat(id);
}

/* ── Internal: render messages or welcome state ────────────────── */
function _renderMessages() {
  if (!_messagesEl) return;
  _messagesEl.innerHTML = '';

  const chat = state.getActiveChat();

  if (!chat || chat.messages.length === 0) {
    const userName = state.getUser().name;
    _messagesEl.appendChild(ui.renderWelcomeState(userName));
    return;
  }

  chat.messages.forEach(msg => {
    _messagesEl.appendChild(ui.createMessageElement(msg));
  });
  ui.scrollToBottom(document.getElementById('messages-area'), false);
}

function _updateTopbarModel() {
  const modelId  = state.getSelectedModel();
  const model    = availableModels.find(m => m.id === modelId);
  const labelEl  = document.getElementById('model-label-full');
  if (labelEl) {
    /* Use a short "gemini-style" slug */
    labelEl.textContent = model?.label ?? 'gemini-2.5-flash';
  }
}

/* ── Composer ──────────────────────────────────────────────────── */
function _initComposer() {
  const textarea = document.getElementById('composer-textarea');
  const sendBtn  = document.getElementById('btn-send');
  if (!textarea || !sendBtn) return;

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    sendBtn.disabled = !textarea.value.trim() && !_hasAttachment();
  });

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && state.getSettings().sendOnEnter !== false) {
      e.preventDefault();
      _doSend();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (state.isGenerating()) {
      _pendingAbort = true;
      state.setGenerating(false);
      ui.setSendButtonGenerating(false);
      ui.removeTypingIndicator();
      if (textarea) { textarea.disabled = false; textarea.focus(); }
    } else {
      _doSend();
    }
  });

  sendBtn.disabled = true;
}

function _doSend() {
  const textarea = document.getElementById('composer-textarea');
  const sendBtn  = document.getElementById('btn-send');
  if (!textarea) return;

  const text       = textarea.value;
  const attachment = _consumeAttachment();

  textarea.value      = '';
  textarea.style.height = 'auto';
  if (sendBtn) sendBtn.disabled = true;

  if (!state.getActiveChatId()) {
    createNewChat();
    setTimeout(() => sendMessage(text, attachment), 10);
    return;
  }

  sendMessage(text, attachment);
}

/* ── File upload ───────────────────────────────────────────────── */
let _pendingAttachment = null;

function _initFileUpload() {
  const attachBtn = document.getElementById('btn-attach');
  const fileInput = document.getElementById('file-input');
  const chipArea  = document.getElementById('composer-attachments');
  if (!attachBtn || !fileInput) return;

  attachBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    _pendingAttachment = { name: file.name, size: file.size, type: file.type };
    const chip = ui.createFileChip(_pendingAttachment, () => {
      _pendingAttachment = null;
      fileInput.value   = '';
    });
    chipArea.innerHTML = '';
    chipArea.appendChild(chip);
    const sendBtn = document.getElementById('btn-send');
    if (sendBtn) sendBtn.disabled = false;
    fileInput.value = '';
  });
}

function _hasAttachment()     { return _pendingAttachment !== null; }
function _consumeAttachment() {
  const att = _pendingAttachment;
  _pendingAttachment = null;
  document.getElementById('composer-attachments').innerHTML = '';
  return att;
}

/* ── Mock reply generation ─────────────────────────────────────── */
function _generateReply(userText) {
  if (/^(hi|hello|hey|greetings|howdy|good (morning|afternoon|evening))/i.test(userText)) {
    return greetingReplies[randomInt(0, greetingReplies.length - 1)];
  }
  if (/(thank(s| you)|appreciate|grateful)/i.test(userText)) {
    return thankYouReplies[randomInt(0, thankYouReplies.length - 1)];
  }
  return mockReplies[randomInt(0, mockReplies.length - 1)];
}
