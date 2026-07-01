/* theme.js — light/dark toggle. Dark is DEFAULT; `.light` class enables light mode. */

import * as storage from './storage.js';
import * as state   from './state.js';

export function applyTheme(name) {
  /* Dark is default — only add class when light is requested */
  document.documentElement.classList.toggle('light', name === 'light');
  state.setTheme(name);
  storage.saveTheme(name);
  _updateIcon(name);
}

export function toggleTheme() {
  applyTheme(state.getTheme() === 'dark' ? 'light' : 'dark');
}

export function loadSavedTheme() {
  const saved = storage.loadTheme();
  if (saved === 'light' || saved === 'dark') { applyTheme(saved); return; }
  /* OS preference fallback — most users expect dark for LibreChat */
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

function _updateIcon(theme) {
  const btn = document.getElementById('btn-theme-toggle');
  if (!btn) return;
  const isDark = theme === 'dark';
  btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  btn.innerHTML = isDark ? _moonSvg() : _sunSvg();
}

function _moonSvg() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

function _sunSvg() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}
