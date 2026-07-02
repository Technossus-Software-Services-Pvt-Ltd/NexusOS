/* app.js — entry point; wires all modules on DOMContentLoaded */

import * as theme   from './theme.js';
import * as state   from './state.js';
import * as storage from './storage.js';
import * as sidebar from './sidebar.js';
import * as chat    from './chat.js';
import * as modal   from './modal.js';
import * as ui      from './ui.js';
import { starterChats, availableModels, defaultSettings } from '../data/mockData.js';

/* ── Apply theme before first paint ────────────────────────────── */
theme.loadSavedTheme();

document.addEventListener('DOMContentLoaded', () => {

  _bootstrapState();

  /* Show skeleton in chat panel briefly */
  const listEl = document.getElementById('chat-list');
  if (listEl) listEl.appendChild(ui.renderSkeletonList(4));

  setTimeout(() => {

    sidebar.init({
      onSelectChat: chat.selectChat,
      onDeleteChat: chat.deleteChat,
      onRenameChat: chat.renameChat,
    });
    sidebar.renderChatList();
    chat.init();

    /* Select most-recent chat or show welcome */
    const chats = state.getChats();
    if (chats.length > 0) {
      chat.selectChat(chats[0].id);
    } else {
      state.setActiveChatId(null);
      const inner = document.getElementById('messages-inner');
      if (inner) {
        inner.innerHTML = '';
        inner.appendChild(ui.renderWelcomeState(state.getUser().name));
      }
    }

    _initPanelToggle();
    _initAgentBuilder();
    _initNewChat();
    _initModelSelector();
    _initProfileMenu();
    _initSettingsModal();
    _initThemeToggle();
    _initExportData();
    _initFooterLink();

    modal.initGlobalClose();
    modal.initSettingsTabs();
    _populateUserProfile();
    _populateModelDropdown();
    _updateModelLabel();

  }, 280);
});

/* ── Bootstrap state ────────────────────────────────────────────── */
function _bootstrapState() {
  const savedChats = storage.loadChats();
  if (savedChats && savedChats.length > 0) {
    state.setChats(savedChats);
  } else {
    const seed = starterChats.map(c => ({
      ...c,
      messages: c.messages.map(m => ({ ...m })),
    }));
    state.setChats(seed);
    storage.saveChats(seed);
  }

  const savedModel = storage.loadModel();
  if (savedModel && availableModels.find(m => m.id === savedModel)) {
    state.setSelectedModel(savedModel);
  }

  const savedSettings = storage.loadSettings();
  if (savedSettings) state.updateSettings({ ...defaultSettings, ...savedSettings });

  if (state.getSettings().compactMode) document.body.classList.add('compact-mode');
}

/* ── Panel toggle (icon rail "Chats" button + collapse ^ button) ─ */
function _initPanelToggle() {
  const panel   = document.getElementById('chat-panel');
  const navMask = document.getElementById('nav-mask');
  const railBtn = document.getElementById('btn-toggle-panel');

  /* Collapse button inside the panel header */
  document.getElementById('btn-collapse-chats')?.addEventListener('click', () => {
    panel?.classList.toggle('collapsed');
    if (railBtn) railBtn.classList.toggle('active');
  });

  /* Rail "Chats" icon — toggle panel on desktop, overlay on mobile */
  railBtn?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      panel?.classList.toggle('mobile-open');
      navMask?.classList.toggle('active');
    } else {
      panel?.classList.toggle('collapsed');
      railBtn.classList.toggle('active');
    }
  });

  /* Nav mask closes mobile panel */
  navMask?.addEventListener('click', () => {
    panel?.classList.remove('mobile-open');
    navMask.classList.remove('active');
  });
}

/* ── Agent Builder panel ────────────────────────────────────────── */
function _initAgentBuilder() {
  const abPanel    = document.getElementById('agent-builder-panel');
  const chatPanel  = document.getElementById('chat-panel');
  const abRailBtn  = document.getElementById('btn-agent-builder');
  const chatRailBtn = document.getElementById('btn-toggle-panel');
  const navMask    = document.getElementById('nav-mask');

  /* Rail "Agent Builder" icon */
  abRailBtn?.addEventListener('click', () => {
    const isOpen = !abPanel?.classList.contains('panel-hidden');

    if (isOpen) {
      /* Close agent builder */
      abPanel?.classList.add('panel-hidden');
      abRailBtn.classList.remove('active');
      abRailBtn.setAttribute('aria-expanded', 'false');
    } else {
      /* Close chats panel, open agent builder */
      chatPanel?.classList.add('collapsed');
      chatPanel?.classList.remove('mobile-open');
      chatRailBtn?.classList.remove('active');
      chatRailBtn?.setAttribute('aria-expanded', 'false');

      if (window.innerWidth <= 768) {
        abPanel?.classList.remove('panel-hidden');
        abPanel?.classList.add('mobile-open');
        navMask?.classList.add('active');
      } else {
        chatPanel?.classList.add('collapsed');
        abPanel?.classList.remove('panel-hidden');
      }

      abRailBtn.classList.add('active');
      abRailBtn.setAttribute('aria-expanded', 'true');
    }
  });

  /* When chats icon is clicked while agent builder is open, close it */
  chatRailBtn?.addEventListener('click', () => {
    if (abPanel && !abPanel.classList.contains('panel-hidden')) {
      abPanel.classList.add('panel-hidden');
      abPanel.classList.remove('mobile-open');
      abRailBtn?.classList.remove('active');
      abRailBtn?.setAttribute('aria-expanded', 'false');
    }
  }, true); /* capture = true so this fires before _initPanelToggle's listener */

  /* Nav mask closes agent builder on mobile */
  navMask?.addEventListener('click', () => {
    if (abPanel && !abPanel.classList.contains('panel-hidden')) {
      abPanel.classList.add('panel-hidden');
      abPanel.classList.remove('mobile-open');
      abRailBtn?.classList.remove('active');
      abRailBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  /* Instructions / Variables tab switching */
  const tabInstructions = document.getElementById('ab-tab-instructions');
  const tabVariables    = document.getElementById('ab-tab-variables');
  const paneInstructions = document.getElementById('ab-pane-instructions');
  const paneVariables    = document.getElementById('ab-pane-variables');

  tabInstructions?.addEventListener('click', () => {
    tabInstructions.classList.add('active');
    tabInstructions.setAttribute('aria-selected', 'true');
    tabVariables?.classList.remove('active');
    tabVariables?.setAttribute('aria-selected', 'false');
    paneInstructions?.classList.remove('panel-hidden');
    paneVariables?.classList.add('panel-hidden');
  });

  tabVariables?.addEventListener('click', () => {
    tabVariables.classList.add('active');
    tabVariables.setAttribute('aria-selected', 'true');
    tabInstructions?.classList.remove('active');
    tabInstructions?.setAttribute('aria-selected', 'false');
    paneVariables?.classList.remove('panel-hidden');
    paneInstructions?.classList.add('panel-hidden');
  });

  /* Artifacts toggle enables/disables the shadcn sub-toggle */
  document.getElementById('ab-enable-artifacts')?.addEventListener('change', e => {
    const shadcnRow   = document.querySelector('.ab-toggle-row.ab-muted');
    const shadcnInput = document.getElementById('ab-shadcn');
    if (shadcnRow && shadcnInput) {
      shadcnRow.classList.toggle('ab-muted', !e.target.checked);
      shadcnInput.disabled = !e.target.checked;
    }
  });

  /* Skills toggle enables Add Skills button */
  document.getElementById('ab-skills')?.addEventListener('change', e => {
    const addSkillsBtn = document.querySelector('.ab-ghost-btn');
    if (addSkillsBtn) addSkillsBtn.disabled = !e.target.checked;
  });

  /* Create button (prototype no-op) */
  document.getElementById('ab-create-btn')?.addEventListener('click', () => {
    const name = document.getElementById('ab-instructions')?.value?.trim();
    alert(name
      ? `Agent created (prototype).\nInstructions: "${name.slice(0, 60)}${name.length > 60 ? '…' : ''}"`
      : 'Please add instructions for your agent first.');
  });
}

/* ── New chat buttons ───────────────────────────────────────────── */
function _initNewChat() {
  document.getElementById('btn-new-chat')?.addEventListener('click', () => chat.createNewChat());
  document.getElementById('btn-new-chat-topbar')?.addEventListener('click', () => chat.createNewChat());
}

/* ── Model selector ─────────────────────────────────────────────── */
function _initModelSelector() {
  document.getElementById('btn-model-selector')?.addEventListener('click', e => {
    e.stopPropagation();
    modal.toggleModelDropdown();
  });
}

function _populateModelDropdown() {
  const dd   = document.getElementById('model-dropdown');
  if (!dd) return;
  const list = dd.querySelector('.model-list');
  if (!list) return;

  const models  = state.getModels();
  const current = state.getSelectedModel();

  list.innerHTML = '';
  models.forEach(model => {
    const item = document.createElement('div');
    item.className = `dropdown-item${model.id === current ? ' active' : ''}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(model.id === current));
    item.innerHTML = `
      <div>
        <div class="dropdown-item-label">${model.label}</div>
        <div class="dropdown-item-sub">${model.description}</div>
      </div>`;

    item.addEventListener('click', () => {
      state.setSelectedModel(model.id);
      storage.saveModel(model.id);
      _updateModelLabel();
      list.querySelectorAll('.dropdown-item').forEach(el => {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
      });
      item.classList.add('active');
      item.setAttribute('aria-selected', 'true');
      modal.closeModelDropdown();
    });

    list.appendChild(item);
  });
}

function _updateModelLabel() {
  const modelId = state.getSelectedModel();
  const model   = availableModels.find(m => m.id === modelId);
  const label   = model?.label ?? 'gemini-2.5-flash';

  const el = document.getElementById('model-label-full');
  if (el) el.textContent = label;
}

/* ── Profile / avatar ───────────────────────────────────────────── */
function _initProfileMenu() {
  document.getElementById('avatar-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    modal.toggleProfile();
  });
  document.getElementById('profile-settings-btn')?.addEventListener('click', () => {
    modal.closeProfile();
    modal.openSettings();
  });
  document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
    modal.closeProfile();
    alert('Log out — no-op in this prototype (no backend).');
  });
}

function _populateUserProfile() {
  const user = state.getUser();
  ['profile-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = user.name;
  });
  ['profile-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = user.email;
  });
  /* Update rail avatar initials */
  const railAvatar = document.getElementById('avatar-btn');
  if (railAvatar) railAvatar.textContent = user.avatarInitials;
}

/* ── Settings modal ─────────────────────────────────────────────── */
function _initSettingsModal() {
  document.getElementById('btn-open-settings')?.addEventListener('click', () => modal.openSettings());
  document.getElementById('btn-close-settings')?.addEventListener('click', () => modal.closeSettings());

  const themeSelect = document.getElementById('settings-theme-select');
  if (themeSelect) {
    themeSelect.value = state.getTheme();
    themeSelect.addEventListener('change', () => {
      theme.applyTheme(themeSelect.value);
    });
  }

  const sendEnterToggle = document.getElementById('settings-send-enter');
  if (sendEnterToggle) {
    sendEnterToggle.checked = state.getSettings().sendOnEnter !== false;
    sendEnterToggle.addEventListener('change', () => {
      state.updateSettings({ sendOnEnter: sendEnterToggle.checked });
      storage.saveSettings(state.getSettings());
    });
  }

  const timestampsToggle = document.getElementById('settings-timestamps');
  if (timestampsToggle) {
    timestampsToggle.checked = state.getSettings().showTimestamps !== false;
    timestampsToggle.addEventListener('change', () => {
      state.updateSettings({ showTimestamps: timestampsToggle.checked });
      storage.saveSettings(state.getSettings());
    });
  }

  const compactToggle = document.getElementById('settings-compact');
  if (compactToggle) {
    compactToggle.checked = !!state.getSettings().compactMode;
    compactToggle.addEventListener('change', () => {
      state.updateSettings({ compactMode: compactToggle.checked });
      storage.saveSettings(state.getSettings());
      document.body.classList.toggle('compact-mode', compactToggle.checked);
    });
  }

  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    if (!confirm('Clear all conversations? This cannot be undone.')) return;
    state.setChats([]);
    state.setActiveChatId(null);
    storage.saveChats([]);
    sidebar.renderChatList();
    const inner = document.getElementById('messages-inner');
    if (inner) {
      inner.innerHTML = '';
      inner.appendChild(ui.renderWelcomeState(state.getUser().name));
    }
    modal.closeSettings();
  });
}

/* ── Export data ────────────────────────────────────────────────── */
function _initExportData() {
  document.getElementById('btn-export-data')?.addEventListener('click', () => {
    const data = { exportedAt: new Date().toISOString(), user: state.getUser(), chats: state.getChats() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `nexus-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ── Theme toggle ───────────────────────────────────────────────── */
function _initThemeToggle() {
  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    theme.toggleTheme();
    const sel = document.getElementById('settings-theme-select');
    if (sel) sel.value = state.getTheme();
  });
}

/* ── Footer link (no-op) ────────────────────────────────────────── */
function _initFooterLink() {
  document.getElementById('footer-link')?.addEventListener('click', e => {
    e.preventDefault();
    modal.openSettings();
    /* Jump to About tab */
    setTimeout(() => {
      document.querySelector('[data-tab="about"]')?.click();
    }, 50);
  });
}
