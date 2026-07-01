/* utils.js — stateless helper functions */

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now  = new Date();
  const diffMs = now - date;
  const diffMin  = Math.floor(diffMs / 60000);
  const diffHr   = Math.floor(diffMs / 3600000);
  const diffDay  = Math.floor(diffMs / 86400000);

  if (diffMin < 1)   return 'just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr  < 24)  return `${diffHr}h ago`;
  if (diffDay < 2)   return 'yesterday';
  if (diffDay < 7)   return `${diffDay} days ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateTitle(text, max = 40) {
  if (!text) return 'New Chat';
  const cleaned = text.trim().replace(/\n+/g, ' ');
  return cleaned.length > max ? cleaned.slice(0, max).trimEnd() + '…' : cleaned;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatFileSize(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function groupChatsByDate(chats) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);

  const groups = { Today: [], Yesterday: [], 'Last 7 Days': [], Older: [] };

  chats.forEach(chat => {
    const d = new Date(chat.updatedAt);
    const chatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (chatDay >= today)               groups['Today'].push(chat);
    else if (chatDay >= yesterday)      groups['Yesterday'].push(chat);
    else if (chatDay >= sevenDaysAgo)   groups['Last 7 Days'].push(chat);
    else                                groups['Older'].push(chat);
  });

  return groups;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
