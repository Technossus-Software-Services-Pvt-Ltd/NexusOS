/* ui.js — shared DOM rendering helpers; no business logic */

import { escapeHtml, formatTime, formatFileSize } from './utils.js';

/* ── Welcome / greeting state ──────────────────────────────────── */
export function renderWelcomeState(userName) {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const container = document.createElement('div');
  container.className = 'welcome-state';
  container.id = 'welcome-state';

  container.innerHTML = `
    <div class="greeting-row">
      <div class="greeting-icon">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="g-greeting" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stop-color="#4285f4"/>
              <stop offset="40%"  stop-color="#9b72cb"/>
              <stop offset="100%" stop-color="#ea4335"/>
            </linearGradient>
          </defs>
          <path d="M12 2C12 8.5 15.5 12 22 12C15.5 12 12 15.5 12 22C12 15.5 8.5 12 2 12C8.5 12 12 8.5 12 2Z" fill="url(#g-greeting)"/>
        </svg>
      </div>
      <h1 class="greeting-text">Good ${period}, ${escapeHtml(userName)}</h1>
    </div>
  `;

  return container;
}

/* ── Message bubbles ───────────────────────────────────────────── */
export function createMessageElement(message) {
  const isUser = message.role === 'user';
  const row = document.createElement('div');
  row.className = `message-row ${isUser ? 'user' : 'assistant'}`;
  row.dataset.msgId = message.id;

  const avatarEl = document.createElement('div');
  avatarEl.className = 'message-avatar';
  avatarEl.setAttribute('aria-hidden', 'true');
  avatarEl.textContent = isUser ? 'VR' : 'AI';

  const bodyEl = document.createElement('div');
  bodyEl.className = 'message-body';

  if (message.attachment) {
    const chipEl = document.createElement('div');
    chipEl.className = 'message-attachment';
    chipEl.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
      <span class="truncate">${escapeHtml(message.attachment.name)}</span>
      <span style="opacity:.55;flex-shrink:0">${formatFileSize(message.attachment.size)}</span>
    `;
    bodyEl.appendChild(chipEl);
  }

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'message-bubble';
  bubbleEl.innerHTML = _renderContent(message.text);

  const metaEl = document.createElement('div');
  metaEl.className = 'message-meta';

  const tsEl = document.createElement('span');
  tsEl.className = 'message-timestamp';
  tsEl.textContent = formatTime(message.timestamp);
  metaEl.appendChild(tsEl);

  if (!isUser && message.model) {
    const tagEl = document.createElement('span');
    tagEl.className = 'message-model-tag';
    tagEl.textContent = `via ${message.model}`;
    metaEl.appendChild(tagEl);
  }

  bodyEl.appendChild(bubbleEl);
  bodyEl.appendChild(metaEl);
  row.appendChild(avatarEl);
  row.appendChild(bodyEl);
  return row;
}

function _renderContent(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  const withCode = escaped.replace(/```[\s\S]*?```/g, match => {
    const inner = match.slice(3, -3).replace(/^[a-z]+\n/, '');
    return `<pre style="background:rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;overflow-x:auto;margin:6px 0;font-family:monospace;font-size:13px;white-space:pre-wrap;">${inner}</pre>`;
  });
  const withInline  = withCode.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);border-radius:3px;padding:1px 5px;font-family:monospace;font-size:.92em;">$1</code>');
  const withBold    = withInline.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const withBullets = withBold.replace(/^[•\-]\s+(.+)$/gm, '<span style="display:block;padding-left:1em;text-indent:-1em;">• $1</span>');
  return withBullets.replace(/\n/g, '<br>');
}

/* ── Typing indicator ──────────────────────────────────────────── */
export function createTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'typing-indicator';
  row.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'AI';

  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

  row.appendChild(avatar);
  row.appendChild(dots);
  return row;
}

export function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}

/* ── Skeleton list ─────────────────────────────────────────────── */
export function renderSkeletonList(count = 5) {
  const frag = document.createDocumentFragment();
  const lengths = ['short', 'long', 'medium', 'long', 'short'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = `skeleton skeleton-conv skeleton-${lengths[i % lengths.length]}`;
    frag.appendChild(el);
  }
  return frag;
}

/* ── File chip ─────────────────────────────────────────────────── */
export function createFileChip(file, onRemove) {
  const chip = document.createElement('div');
  chip.className = 'file-chip';
  chip.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
    <span class="file-chip-name">${escapeHtml(file.name)}</span>
    <span style="opacity:.55;flex-shrink:0;">${formatFileSize(file.size)}</span>
    <button class="file-chip-remove" aria-label="Remove ${escapeHtml(file.name)}">✕</button>
  `;
  chip.querySelector('.file-chip-remove').addEventListener('click', () => { chip.remove(); onRemove(); });
  return chip;
}

/* ── Scroll ────────────────────────────────────────────────────── */
export function scrollToBottom(container, smooth = true) {
  if (!container) return;
  container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
}

/* ── Send button state ─────────────────────────────────────────── */
export function setSendButtonGenerating(isGenerating) {
  const btn = document.getElementById('btn-send');
  if (!btn) return;
  if (isGenerating) {
    btn.classList.add('stop');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>`;
  } else {
    btn.classList.remove('stop');
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4l8 8H4z"/></svg>`;
  }
}
