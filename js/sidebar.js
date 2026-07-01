/* sidebar.js — render chat list, search/filter, active-row highlighting */

import * as state from './state.js';
import { debounce, groupChatsByDate, truncateTitle, escapeHtml } from './utils.js';

let _filterQuery  = '';
let _onSelectChat = null;
let _onDeleteChat = null;
let _onRenameChat = null;

export function init({ onSelectChat, onDeleteChat, onRenameChat }) {
  _onSelectChat = onSelectChat;
  _onDeleteChat = onDeleteChat;
  _onRenameChat = onRenameChat;
}

/* ── Render chat list ──────────────────────────────────────────── */
export function renderChatList() {
  const container = document.getElementById('chat-list');
  if (!container) return;

  const allChats = state.getChats();
  const filtered = _filterQuery
    ? allChats.filter(c => c.title.toLowerCase().includes(_filterQuery.toLowerCase()))
    : allChats;

  container.innerHTML = '';

  if (filtered.length === 0) {
    const msg  = _filterQuery ? 'No chats match your search.' : 'No conversations yet.';
    const icon = _filterQuery ? '🔍' : '💬';
    container.innerHTML = `<div class="panel-empty-state"><div style="font-size:28px;margin-bottom:8px;">${icon}</div><span>${msg}</span></div>`;
    return;
  }

  const groups   = groupChatsByDate(filtered);
  const activeId = state.getActiveChatId();

  Object.entries(groups).forEach(([label, chats]) => {
    if (chats.length === 0) return;
    const groupLabel = document.createElement('div');
    groupLabel.className = 'sidebar-group-label';
    groupLabel.textContent = label;
    container.appendChild(groupLabel);
    chats.forEach(chat => {
      container.appendChild(_buildItem(chat, chat.id === activeId));
    });
  });
}

export function highlightActiveChat(id) {
  document.querySelectorAll('.conversation-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chatId === id);
  });
}

/* ── Build conversation item ───────────────────────────────────── */
function _buildItem(chat, isActive) {
  const item = document.createElement('div');
  item.className = `conversation-item${isActive ? ' active' : ''}`;
  item.dataset.chatId = chat.id;
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');

  /* Model icon — Gemini star shape */
  const icon = document.createElement('div');
  icon.className = 'conv-model-icon';
  icon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="conv-g-${chat.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#4285f4"/>
          <stop offset="100%" stop-color="#ea4335"/>
        </linearGradient>
      </defs>
      <path d="M12 2C12 8.5 15.5 12 22 12C15.5 12 12 15.5 12 22C12 15.5 8.5 12 2 12C8.5 12 12 8.5 12 2Z" fill="url(#conv-g-${chat.id})"/>
    </svg>`;

  const title = document.createElement('span');
  title.className = 'conv-title';
  title.textContent = truncateTitle(chat.title);

  const actions = document.createElement('div');
  actions.className = 'conv-actions';

  const renameBtn = _actionBtn('Rename', `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`);
  const deleteBtn = _actionBtn('Delete', `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`, true);

  actions.appendChild(renameBtn);
  actions.appendChild(deleteBtn);
  item.appendChild(icon);
  item.appendChild(title);
  item.appendChild(actions);

  item.addEventListener('click', e => {
    if (e.target.closest('.conv-action-btn')) return;
    _onSelectChat?.(chat.id);
  });
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _onSelectChat?.(chat.id); }
  });
  renameBtn.addEventListener('click', e => { e.stopPropagation(); _startRename(item, chat, title); });
  deleteBtn.addEventListener('click', e => { e.stopPropagation(); _onDeleteChat?.(chat.id); });

  return item;
}

function _actionBtn(label, svgHtml, isDanger = false) {
  const btn = document.createElement('button');
  btn.className = `conv-action-btn${isDanger ? ' danger' : ''}`;
  btn.setAttribute('aria-label', label);
  btn.innerHTML = svgHtml;
  return btn;
}

/* ── Inline rename ─────────────────────────────────────────────── */
function _startRename(item, chat, titleEl) {
  const input = document.createElement('input');
  input.className = 'conv-title-input';
  input.type  = 'text';
  input.value = chat.title;
  titleEl.replaceWith(input);
  input.select();

  const commit = () => {
    const newTitle = input.value.trim() || chat.title;
    _onRenameChat?.(chat.id, newTitle);
    input.replaceWith(titleEl);
    titleEl.textContent = truncateTitle(newTitle);
  };

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = chat.title; input.blur(); }
  });
}
