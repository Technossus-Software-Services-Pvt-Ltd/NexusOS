/* modal.js — open/close/focus-trap for Settings modal, dropdowns, profile popover */

let _settingsOpen = false;
let _profileOpen  = false;
let _modelOpen    = false;

/* ── Settings modal ────────────────────────────────────────────── */
export function openSettings() {
  const overlay = document.getElementById('settings-modal');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  _settingsOpen = true;
  requestAnimationFrame(() => {
    overlay.querySelector('button, input, select, [tabindex="0"]')?.focus();
  });
}

export function closeSettings() {
  document.getElementById('settings-modal')?.classList.add('hidden');
  _settingsOpen = false;
}

export function isSettingsOpen() { return _settingsOpen; }

/* ── Profile popover ───────────────────────────────────────────── */
export function openProfile() {
  const pop = document.getElementById('profile-popover');
  if (!pop) return;
  _positionAboveAvatar(pop);
  pop.classList.remove('hidden');
  _profileOpen = true;
}

export function closeProfile() {
  document.getElementById('profile-popover')?.classList.add('hidden');
  _profileOpen = false;
}

export function toggleProfile() {
  _profileOpen ? closeProfile() : openProfile();
}

/* ── Model dropdown ────────────────────────────────────────────── */
export function openModelDropdown() {
  const dd      = document.getElementById('model-dropdown');
  const trigger = document.getElementById('btn-model-selector');
  if (!dd || !trigger) return;
  const rect = trigger.getBoundingClientRect();
  dd.style.top  = `${rect.bottom + 6}px`;
  dd.style.left = `${rect.left}px`;
  dd.classList.remove('hidden');
  _modelOpen = true;
  document.querySelector('.model-chevron')?.classList.add('open');
}

export function closeModelDropdown() {
  document.getElementById('model-dropdown')?.classList.add('hidden');
  _modelOpen = false;
  document.querySelector('.model-chevron')?.classList.remove('open');
}

export function toggleModelDropdown() {
  _modelOpen ? closeModelDropdown() : openModelDropdown();
}

/* ── Global close (outside-click + Escape) ─────────────────────── */
export function initGlobalClose() {
  document.addEventListener('click', e => {
    if (_settingsOpen) {
      const panel = document.querySelector('.modal-panel');
      if (panel && !panel.contains(e.target)) closeSettings();
    }
    if (_profileOpen) {
      const pop = document.getElementById('profile-popover');
      const btn = document.getElementById('avatar-btn');
      if (pop && !pop.contains(e.target) && !btn?.contains(e.target)) closeProfile();
    }
    if (_modelOpen) {
      const dd      = document.getElementById('model-dropdown');
      const trigger = document.getElementById('btn-model-selector');
      if (dd && !dd.contains(e.target) && !trigger?.contains(e.target)) closeModelDropdown();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (_settingsOpen) { closeSettings();       return; }
    if (_profileOpen)  { closeProfile();        return; }
    if (_modelOpen)    { closeModelDropdown();  return; }
  });
}

/* ── Settings tab switching ────────────────────────────────────── */
export function initSettingsTabs() {
  const tabs  = document.querySelectorAll('.settings-tab-btn');
  const panes = document.querySelectorAll('.settings-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t  => t.classList.remove('active'));
      panes.forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(`pane-${tab.dataset.tab}`)?.classList.remove('hidden');
    });
  });
}

/* ── Position profile popover above avatar ─────────────────────── */
function _positionAboveAvatar(popEl) {
  const btn = document.getElementById('avatar-btn');
  if (!btn) return;
  const rect  = btn.getBoundingClientRect();
  const popW  = 240;
  popEl.style.left   = `${Math.max(4, rect.left - 8)}px`;
  popEl.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  popEl.style.top    = 'auto';
  popEl.style.width  = `${popW}px`;
}
