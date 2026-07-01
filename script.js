const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

const mainView = $('#mainView');
const advancedView = $('#advancedView');
const agentPanel = $('#agentPanel');
const overlay = $('#mobileOverlay');
const toast = $('#toast');
const skillsPanel = $('#skillsPanel');
const chatWelcome = $('#chatWelcome');
const skillDetail = $('#skillDetail');
const promptsPanel = $('#promptsPanel');
const promptCreateView = $('#promptCreateView');
const promptDetailView = $('#promptDetailView');
const prompts = [];
let selectedPromptId = null;
const memoryPanel = $('#memoryPanel');
const chatsPanel = $('#chatsPanel');
const conversationView = $('#conversationView');
const chatState = loadChatState();
const settingsPanel = $('#settingsPanel');
let modelSettings = loadModelSettings();
const modelCatalog = {
  openai: { label: 'OpenAI', models: ['gpt-4.1', 'gpt-4o-mini'] },
  'my agents': { label: 'My Agents', models: [] },
  assistants: { label: 'Assistants', models: ['project-assistant'] },
  google: { label: 'Google', models: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
  anthropic: { label: 'Anthropic', models: ['claude-sonnet-4'] },
  'local slm': { label: 'Local SLM', models: ['qwen2.5:7b', 'llama3.2', 'llama3.1:8b', 'mistral:7b', 'gemma2:9b', 'phi3:mini', 'codellama:7b', 'deepseek-coder:6.7b'] }
};
const ollamaModels = new Set(['qwen2.5:7b', 'llama3.2', 'llama3.1:8b', 'mistral:7b', 'gemma2:9b', 'phi3:mini', 'codellama:7b', 'deepseek-coder:6.7b']);
let selectedModel = 'gemini-2.5-flash';
const agentState = loadAgentState();
let agentSkillCatalog = loadSkillCatalog();
let activeSkillId = null;
let editingSkillId = null;
let highlightedSkillId = null;
let agentDraftSkills = [];
let activeAgentSkillCategory = 'All';
const defaultAgentTools = [
  ['github','GitHub','Manage repositories, issues, pull requests, and code workflows.','Development','Popular'],['gitlab','GitLab','Connect repositories, merge requests, and CI/CD workflows.','Development','Mock'],['jira','Jira','Track issues, sprint tasks, and project tickets.','Development','Popular'],['linear','Linear','Manage product issues and engineering workflows.','Development','Mock'],
  ['slack','Slack','Send messages, summarize channels, and support team collaboration.','Communication','Popular'],['microsoft-teams','Microsoft Teams','Connect meetings, chats, and workspace conversations.','Communication','Mock'],['discord','Discord','Use community and team conversations inside agent workflows.','Communication','Mock'],
  ['google-drive','Google Drive','Search, organize, and summarize documents.','Productivity','Connected'],['google-calendar','Google Calendar','Read schedules and create calendar events.','Productivity','Mock'],['gmail','Gmail','Draft, search, and summarize emails.','Productivity','Mock'],['notion','Notion','Read and organize notes, docs, and project pages.','Productivity','Popular'],
  ['aws','AWS','Connect cloud services, infrastructure tasks, and deployment workflows.','Cloud','Mock'],['azure','Azure','Work with cloud resources, deployments, and monitoring.','Cloud','Coming Soon'],['google-cloud','Google Cloud','Manage cloud resources and AI workflows.','Cloud','Mock'],
  ['postgresql','PostgreSQL','Query relational data and inspect database records.','Data','Mock'],['mysql','MySQL','Connect and query structured database data.','Data','Mock'],['mongodb','MongoDB','Search and manage document-based collections.','Data','Mock'],
  ['openai-image-tools','OpenAI Image Tools','Generate and edit images using mock AI tools.','AI','Popular'],['calculator','Calculator','Perform mathematical calculations.','AI','Connected'],['web-search','Web Search','Search the web using mock search behavior.','AI','Mock'],['zapier','Zapier','Connect apps and automate workflows.','Automation','Popular']
].map(([id,name,description,category,status]) => ({ id,name,description,category,status }));
let agentToolCatalog = loadToolCatalog();
const configurableTools = new Set(['github','jira','slack','microsoft-teams','aws', ...agentToolCatalog.filter(tool => tool.custom).map(tool => tool.id)]);
let persistedToolSelection = loadSelectedTools();
let agentDraftTools = [...persistedToolSelection];
let activeToolCategory = 'All';
let configuringToolId = null;
let toolConfigurations = loadToolConfigurations();
const memories = [];
let editingMemoryId = null;

function setView(view) {
  const showAdvanced = view === 'advanced';
  mainView.classList.toggle('active', !showAdvanced);
  advancedView.classList.toggle('active', showAdvanced);
}

function setMobilePanel(open) {
  agentPanel.classList.toggle('mobile-open', open);
  skillsPanel.classList.toggle('mobile-open', open && skillsPanel.classList.contains('open'));
  promptsPanel.classList.toggle('mobile-open', open && promptsPanel.classList.contains('open'));
  memoryPanel.classList.toggle('mobile-open', open && memoryPanel.classList.contains('open'));
  chatsPanel.classList.toggle('mobile-open', open && chatsPanel.classList.contains('open'));
  settingsPanel.classList.toggle('mobile-open', open && settingsPanel.classList.contains('open'));
  overlay.classList.toggle('visible', open);
}

function closeSidePanel(panel, navButton) {
  panel.classList.add('is-hidden');
  panel.classList.remove('mobile-open', 'open');
  navButton?.classList.remove('active');
  overlay.classList.remove('visible');
  menuPopover?.classList.remove('open');
  createMenu?.setAttribute('aria-expanded', 'false');
  if (panel === agentPanel) closeAddSkillsModal();
  if (panel === agentPanel) {
    closeAgentToolsModal();
    closeToolConfiguration();
  }
}

function openWorkspace(workspace) {
  const showAgents = workspace === 'agents';
  const showSkills = workspace === 'skills';
  const showPrompts = workspace === 'prompts';
  const showMemory = workspace === 'memory';
  const showChats = workspace === 'chats';
  const showSettings = workspace === 'settings';
  if (showAgents) agentPanel.classList.remove('is-hidden');
  agentPanel.classList.toggle('hidden', showSkills || showPrompts || showMemory || showChats || showSettings);
  skillsPanel.classList.toggle('open', showSkills);
  promptsPanel.classList.toggle('open', showPrompts);
  memoryPanel.classList.toggle('open', showMemory);
  chatsPanel.classList.toggle('open', showChats);
  settingsPanel.classList.toggle('open', showSettings);
  $('#agentsNav').classList.toggle('active', !showSkills);
  $('#skillsNav').classList.toggle('active', showSkills);
  $('#promptsNav').classList.toggle('active', showPrompts);
  $('#memoryNav').classList.toggle('active', showMemory);
  $('#chatsNav').classList.toggle('active', showChats);
  $('#settingsNav').classList.toggle('active', showSettings);
  if (!showSkills && !showPrompts && !showMemory && !showChats && !showSettings) $('#agentsNav').classList.add('active');
  else $('#agentsNav').classList.remove('active');
  if (!showSkills) selectSkill(false);
  if (!showPrompts) {
    closePromptForm();
    closePromptDetail();
  }
  if (!showMemory && memoryModal.classList.contains('open')) closeMemoryModal();
  if (showChats && chatState.selected) renderConversation();
  if (!showChats && !showSettings && !showAgents) closeConversation(false);
  if ((showSettings || showAgents) && conversationView.classList.contains('open')) chatWelcome.classList.add('skill-hidden');
  if (window.matchMedia('(max-width: 700px)').matches) setMobilePanel(true);
}

function selectSkill(selected) {
  $('#developmentSkill')?.classList.toggle('selected', selected);
  if (!selected) {
    activeSkillId = null;
    $$('.skill-list-item').forEach(item => item.classList.remove('selected'));
    $('#createSkillView').classList.remove('open');
  }
  chatWelcome.classList.toggle('skill-hidden', selected);
  skillDetail.classList.toggle('open', selected);
  if (selected && window.matchMedia('(max-width: 700px)').matches) setMobilePanel(false);
}

function showToast(message, type = 'default') {
  toast.textContent = message;
  toast.classList.toggle('success', type === 'success');
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2300);
}

const modelDropdown = $('#modelDropdown');
const modelSelectorButton = $('#modelSelectorButton');
const modelSearchInput = $('#modelSearchInput');

function providerForModel(model) {
  return Object.entries(modelCatalog).find(([, provider]) => provider.models.includes(model))?.[0] || 'google';
}

function closeModelDropdown() {
  modelDropdown.classList.remove('open');
  modelSelectorButton.classList.remove('open');
  modelSelectorButton.setAttribute('aria-expanded', 'false');
}

function updateSelectedModelUI() {
  $('#selectedModelText').textContent = selectedModel;
  $('#messageInput').placeholder = `Message ${selectedModel}`;
  $('#conversationInput').placeholder = `Message ${selectedModel}`;
  const isLocal = providerForModel(selectedModel) === 'local slm';
  $('#selectedModelIcon').classList.toggle('local-model-icon', isLocal);
  $$('.provider-row[data-provider]').forEach(row => row.classList.toggle('selected-provider', row.dataset.provider === providerForModel(selectedModel)));
  $('#localProviderGroup').classList.toggle('selected-provider', isLocal);
  $$('.local-model-button').forEach(button => button.classList.toggle('selected', button.dataset.model === selectedModel));
}

function renderLocalModels() {
  const list = $('#localModelList');
  list.replaceChildren();
  modelCatalog['local slm'].models.forEach(model => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'local-model-button';
    button.dataset.model = model;
    const name = document.createElement('span');
    name.className = 'local-model-name';
    name.textContent = model;
    const trailing = document.createElement('span');
    trailing.className = 'local-model-meta';
    const badge = document.createElement('span');
    badge.className = `model-runtime-badge ${ollamaModels.has(model) ? 'ollama' : 'local'}`;
    badge.textContent = ollamaModels.has(model) ? 'OLLAMA' : 'LOCAL';
    trailing.append(badge);
    if (model === selectedModel) trailing.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>');
    button.append(name, trailing);
    button.addEventListener('click', () => switchModel(model));
    list.append(button);
  });
  updateSelectedModelUI();
}

function switchModel(model) {
  if (model === selectedModel) {
    closeModelDropdown();
    return;
  }
  closeModelDropdown();
  modelSelectorButton.classList.add('loading');
  $('#selectedModelText').textContent = 'Switching…';
  setTimeout(() => {
    selectedModel = model;
    modelSelectorButton.classList.remove('loading');
    renderLocalModels();
    showToast(`Model switched to ${selectedModel}`, 'success');
  }, 450);
}

function filterModelDropdown() {
  const query = modelSearchInput.value.trim().toLowerCase();
  let visible = 0;
  $$('.provider-row[data-provider]').forEach(row => {
    const provider = modelCatalog[row.dataset.provider];
    const match = !query || row.dataset.provider.includes(query) || provider.models.some(model => model.includes(query));
    row.hidden = !match;
    if (match) visible += 1;
  });
  const localGroup = $('#localProviderGroup');
  const localProviderMatch = !query || 'local slm'.includes(query);
  let localModelsVisible = 0;
  $$('.local-model-button').forEach(button => {
    const match = !query || button.dataset.model.includes(query);
    button.hidden = !match;
    if (match) localModelsVisible += 1;
  });
  localGroup.hidden = !(localProviderMatch || localModelsVisible);
  localGroup.classList.toggle('search-expanded', Boolean(query) && localModelsVisible > 0);
  if (!localGroup.hidden) visible += 1;
  $('#modelSearchEmpty').classList.toggle('visible', visible === 0);
}

modelSelectorButton.addEventListener('click', event => {
  event.stopPropagation();
  const open = modelDropdown.classList.toggle('open');
  modelSelectorButton.classList.toggle('open', open);
  modelSelectorButton.setAttribute('aria-expanded', String(open));
  if (open) {
    modelSearchInput.value = '';
    filterModelDropdown();
    modelSearchInput.focus();
  }
});
modelDropdown.addEventListener('click', event => event.stopPropagation());
modelSearchInput.addEventListener('input', filterModelDropdown);
$('#localSlmButton').addEventListener('click', () => {
  const group = $('#localProviderGroup');
  const expanded = group.classList.toggle('expanded');
  $('#localSlmButton').setAttribute('aria-expanded', String(expanded));
});
$$('.provider-row[data-provider] .provider-main').forEach(button => button.addEventListener('click', () => {
  const provider = button.closest('.provider-row').dataset.provider;
  showToast(`${modelCatalog[provider].label} provider opened in mock mode`);
}));
$$('.provider-actions button').forEach(button => button.addEventListener('click', event => {
  event.stopPropagation();
  showToast('Provider settings are frontend-only in this prototype');
}));
document.addEventListener('click', event => {
  if (!event.target.closest('.model-selector-wrap')) closeModelDropdown();
});
renderLocalModels();

$('#openAdvanced').addEventListener('click', () => setView('advanced'));
$('#backAdvanced').addEventListener('click', () => setView('main'));
$('#openPanel').addEventListener('click', () => setMobilePanel(true));
$('#closePanel').addEventListener('click', event => {
  event.stopPropagation();
  closeSidePanel(agentPanel, $('#agentsNav'));
});
overlay.addEventListener('click', () => setMobilePanel(false));
$('#agentsNav').addEventListener('click', () => openWorkspace('agents'));
$('#skillsNav').addEventListener('click', () => openWorkspace('skills'));
$('#promptsNav').addEventListener('click', () => openWorkspace('prompts'));
$('#memoryNav').addEventListener('click', () => openWorkspace('memory'));
$('#chatsNav').addEventListener('click', () => openWorkspace('chats'));
$('#settingsNav').addEventListener('click', () => openWorkspace('settings'));
$('.skills-button').addEventListener('click', () => openWorkspace('skills'));
$('#closeSkills').addEventListener('click', () => setMobilePanel(false));
$('#closePrompts').addEventListener('click', () => setMobilePanel(false));
$('#closeMemory').addEventListener('click', () => setMobilePanel(false));
$('#closeSettings').addEventListener('click', () => {
  if (window.matchMedia('(max-width: 700px)').matches) setMobilePanel(false);
  else openWorkspace(conversationView.classList.contains('open') ? 'chats' : 'agents');
});

$('#skillsGroupToggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  $('#skillsGroup').classList.toggle('collapsed', expanded);
});

function defaultSkillCatalog() {
  return [];
}

function loadSkillCatalog() {
  return defaultSkillCatalog();
}

function saveSkillCatalog() {
  // Runtime-only state: agentSkillCatalog already contains current changes.
}

function skillDate(value) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderStandaloneSkills() {
  const query = $('#skillSearchInput').value.trim().toLowerCase();
  const list = $('#createdSkillsList');
  list.replaceChildren();
  agentSkillCatalog.forEach(skill => {
    const match = !query || `${skill.title} ${skill.description}`.toLowerCase().includes(query);
    if (!match) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'skill-list-item';
    button.dataset.skillId = skill.id;
    button.classList.toggle('selected', skill.id === activeSkillId);
    button.innerHTML = '<span class="skill-file-icon"><svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7V3Z"/><path d="M14 3v5h5M10 12h5M10 16h5"/></svg></span>';
    const name = document.createElement('span');
    name.textContent = skill.title;
    button.append(name);
    button.addEventListener('click', () => openSkillDetail(skill.id));
    list.append(button);
  });
  const visibleCount = list.children.length;
  $('#standaloneSkillCount').textContent = agentSkillCatalog.length;
  $('#skillsEmpty').classList.toggle('visible', visibleCount === 0);
}

function openSkillDetail(id) {
  const skill = agentSkillCatalog.find(item => item.id === id);
  if (!skill) return;
  activeSkillId = id;
  $('#skillDetailTitle').textContent = skill.title;
  $('#skillDetailCategory').textContent = skill.category || 'Misc.';
  $('#skillDetailDate').textContent = skillDate(skill.createdAt);
  $('#skillDescriptionText').textContent = skill.description;
  $('#skillInstructionsText').textContent = skill.instructions;
  $('#skillEnabled').checked = skill.enabled !== false;
  $('#deleteSkillButton').hidden = Boolean(skill.builtIn);
  renderStandaloneSkills();
  chatWelcome.classList.add('skill-hidden');
  $('#createSkillView').classList.remove('open');
  skillDetail.classList.add('open');
  if (window.matchMedia('(max-width: 700px)').matches) setMobilePanel(false);
}

$('#skillSearchButton').addEventListener('click', () => {
  const search = $('#skillSearchWrap');
  search.classList.toggle('open');
  if (search.classList.contains('open')) $('#skillSearchInput').focus();
});
$('#skillSearchInput').addEventListener('input', renderStandaloneSkills);
renderStandaloneSkills();

const createSkillModal = $('#createSkillModal');
$('#createSkillButton').addEventListener('click', () => {
  openCreateSkillPage(null, 'skills');
});
$$('[data-close-modal]').forEach(button => button.addEventListener('click', () => {
  createSkillModal.classList.remove('open');
  createSkillModal.setAttribute('aria-hidden', 'true');
}));

$('#skillEnabled').addEventListener('change', event => {
  const skill = agentSkillCatalog.find(item => item.id === activeSkillId);
  if (skill) { skill.enabled = event.target.checked; saveSkillCatalog(); }
  showToast(event.target.checked ? 'Skill enabled' : 'Skill disabled');
});
$('#editSkillButton').addEventListener('click', event => {
  const selectedSkill = agentSkillCatalog.find(item => item.id === activeSkillId);
  if (selectedSkill && !selectedSkill.builtIn && !skillDetail.classList.contains('editing')) {
    openCreateSkillPage(selectedSkill.id);
    return;
  }
  const editing = skillDetail.classList.toggle('editing');
  $('#skillDescriptionText').contentEditable = String(editing);
  $('#skillInstructionsText').contentEditable = String(editing);
  event.currentTarget.lastChild.textContent = editing ? 'Done' : 'Edit';
  if (editing) $('#skillDescriptionText').focus();
  else {
    const skill = agentSkillCatalog.find(item => item.id === activeSkillId);
    if (skill) {
      skill.description = $('#skillDescriptionText').textContent.trim();
      skill.instructions = $('#skillInstructionsText').textContent.trim();
      saveSkillCatalog();
      renderStandaloneSkills();
      renderAssignedAgentSkills();
      renderAgentSkillResults();
    }
    showToast('Skill updated successfully', 'success');
  }
});
$('#deleteSkillButton').addEventListener('click', () => deleteSkill(activeSkillId));
$('#previewSkillButton').addEventListener('click', () => {
  skillDetail.classList.remove('source-mode');
  $('#previewSkillButton').classList.add('selected');
  $('#codeSkillButton').classList.remove('selected');
});
$('#codeSkillButton').addEventListener('click', () => {
  skillDetail.classList.add('source-mode');
  $('#codeSkillButton').classList.add('selected');
  $('#previewSkillButton').classList.remove('selected');
});

function openPromptForm() {
  selectSkill(false);
  chatWelcome.classList.add('skill-hidden');
  promptDetailView.classList.remove('open');
  promptCreateView.classList.add('open');
  $('#promptName').focus();
  if (window.matchMedia('(max-width: 700px)').matches) setMobilePanel(false);
}

function closePromptForm() {
  promptCreateView.classList.remove('open');
  if (!skillDetail.classList.contains('open') && !promptDetailView.classList.contains('open')) chatWelcome.classList.remove('skill-hidden');
}

function closePromptDetail() {
  promptDetailView.classList.remove('open');
  selectedPromptId = null;
  $$('.prompt-item').forEach(item => item.classList.remove('selected'));
  if (!skillDetail.classList.contains('open') && !promptCreateView.classList.contains('open')) chatWelcome.classList.remove('skill-hidden');
}

$('#createPromptButton').addEventListener('click', openPromptForm);
$('#cancelPromptButton').addEventListener('click', () => {
  const prompt = currentPrompt();
  if (prompt) renderPromptDetail(prompt);
  else closePromptForm();
});
$('#promptFilterButton').addEventListener('click', event => {
  const active = event.currentTarget.classList.toggle('active');
  event.currentTarget.setAttribute('aria-pressed', String(active));
  showToast(active ? 'Prompt filter enabled' : 'Prompt filter disabled');
});

function bindPromptCounter(input, output) {
  input.addEventListener('input', () => { output.textContent = `${input.value.length}/${input.maxLength}`; });
}
bindPromptCounter($('#promptDescription'), $('#promptDescriptionCount'));
bindPromptCounter($('#promptCommand'), $('#promptCommandCount'));

function togglePromptMenu(button, menu) {
  const open = menu.classList.toggle('open');
  button.setAttribute('aria-expanded', String(open));
}
$('#promptCategoryButton').addEventListener('click', () => togglePromptMenu($('#promptCategoryButton'), $('#promptCategoryMenu')));
$('#specialVariablesButton').addEventListener('click', () => togglePromptMenu($('#specialVariablesButton'), $('#specialVariablesMenu')));
$$('#promptCategoryMenu button').forEach(button => button.addEventListener('click', () => {
  $('#selectedCategory').textContent = button.textContent;
  $('#promptCategoryMenu').classList.remove('open');
  $('#promptCategoryButton').setAttribute('aria-expanded', 'false');
}));
$$('#specialVariablesMenu button').forEach(button => button.addEventListener('click', () => {
  const textarea = $('#promptText');
  const start = textarea.selectionStart;
  textarea.value = `${textarea.value.slice(0, start)}${button.textContent}${textarea.value.slice(textarea.selectionEnd)}`;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + button.textContent.length;
  $('#specialVariablesMenu').classList.remove('open');
}));

function filterPrompts() {
  const query = $('#promptSearchInput').value.trim().toLowerCase();
  const items = $$('.prompt-item');
  let visible = 0;
  items.forEach(item => {
    const match = item.dataset.name.includes(query);
    item.hidden = !match;
    if (match) visible += 1;
  });
  $('#promptNoResults').classList.toggle('visible', items.length > 0 && visible === 0);
}
$('#promptSearchInput').addEventListener('input', filterPrompts);

function currentPrompt() {
  return prompts.find(prompt => prompt.id === selectedPromptId);
}

function updateDetailCounters() {
  $('#promptDetailDescriptionCount').textContent = `${$('#promptDetailDescription').value.length}/120`;
  $('#promptDetailCommandCount').textContent = `${$('#promptDetailCommand').value.length}/56`;
}

function renderPromptDetail(prompt) {
  selectedPromptId = prompt.id;
  promptCreateView.classList.remove('open');
  chatWelcome.classList.add('skill-hidden');
  promptDetailView.classList.add('open');
  $('#promptDetailName').textContent = prompt.name;
  $('#detailCategory').textContent = prompt.category;
  $('#promptDetailText').value = prompt.text;
  $('#promptDetailText').readOnly = true;
  $('#promptTextEditButton').classList.remove('active');
  $('#promptDetailDescription').value = prompt.description;
  $('#promptDetailCommand').value = prompt.command;
  updateDetailCounters();
  $$('.prompt-item').forEach(item => item.classList.toggle('selected', item.dataset.id === prompt.id));
  if (window.matchMedia('(max-width: 700px)').matches) setMobilePanel(false);
}

function createPromptListItem(prompt) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'prompt-item';
  item.dataset.id = prompt.id;
  item.dataset.name = prompt.name.toLowerCase();
  const icon = document.createElement('span');
  icon.className = 'prompt-item-icon';
  icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7V3Z"/><path d="M14 3v5h5M10 12h5M10 16h4"/></svg>';
  const copy = document.createElement('span');
  copy.className = 'prompt-item-copy';
  const name = document.createElement('span');
  name.className = 'prompt-item-name';
  name.textContent = prompt.name;
  const preview = document.createElement('span');
  preview.className = 'prompt-item-description';
  preview.textContent = prompt.text;
  copy.append(name, preview);
  item.append(icon, copy);
  item.addEventListener('click', () => {
    renderPromptDetail(prompt);
    if ($('#sendPromptsOnSelect').checked) showToast(`“${prompt.name}” selected and sent in mock mode`);
  });
  $('#promptItems').append(item);
  prompt.element = item;
  prompt.previewElement = preview;
  return item;
}

$('#promptForm').addEventListener('submit', event => {
  event.preventDefault();
  const nameInput = $('#promptName');
  const textInput = $('#promptText');
  if (!nameInput.value.trim() || !textInput.value.trim()) {
    (!nameInput.value.trim() ? nameInput : textInput).focus();
    showToast('Add a prompt name and text');
    return;
  }
  const prompt = {
    id: `prompt-${Date.now()}`,
    name: nameInput.value.trim(),
    text: textInput.value.trim(),
    description: $('#promptDescription').value.trim(),
    command: $('#promptCommand').value.trim(),
    category: $('#selectedCategory').textContent === 'Category' ? 'General' : $('#selectedCategory').textContent
  };
  prompts.push(prompt);
  createPromptListItem(prompt);
  $('#promptsEmpty').classList.add('hidden');
  event.currentTarget.reset();
  $('#promptDescriptionCount').textContent = '0/120';
  $('#promptCommandCount').textContent = '0/56';
  filterPrompts();
  renderPromptDetail(prompt);
  showToast(`“${prompt.name}” created`);
});

$('#detailCategoryButton').addEventListener('click', () => togglePromptMenu($('#detailCategoryButton'), $('#detailCategoryMenu')));
$$('#detailCategoryMenu button').forEach(button => button.addEventListener('click', () => {
  const prompt = currentPrompt();
  if (!prompt) return;
  prompt.category = button.textContent;
  $('#detailCategory').textContent = prompt.category;
  $('#detailCategoryMenu').classList.remove('open');
  $('#detailCategoryButton').setAttribute('aria-expanded', 'false');
  showToast('Category updated');
}));

$('#promptTextEditButton').addEventListener('click', event => {
  const textarea = $('#promptDetailText');
  textarea.readOnly = !textarea.readOnly;
  event.currentTarget.classList.toggle('active', !textarea.readOnly);
  if (!textarea.readOnly) textarea.focus();
  else showToast('Prompt text saved locally');
});
$('#promptDetailText').addEventListener('input', event => {
  const prompt = currentPrompt();
  if (!prompt) return;
  prompt.text = event.target.value;
  prompt.previewElement.textContent = prompt.text || 'Empty prompt';
});
$('#promptDetailDescription').addEventListener('input', event => {
  const prompt = currentPrompt();
  if (prompt) prompt.description = event.target.value;
  updateDetailCounters();
});
$('#promptDetailCommand').addEventListener('input', event => {
  const prompt = currentPrompt();
  if (prompt) prompt.command = event.target.value;
  updateDetailCounters();
});
$('#detailVariablesButton').addEventListener('click', () => togglePromptMenu($('#detailVariablesButton'), $('#detailVariablesMenu')));
$$('#detailVariablesMenu button').forEach(button => button.addEventListener('click', () => {
  const textarea = $('#promptDetailText');
  if (textarea.readOnly) {
    textarea.readOnly = false;
    $('#promptTextEditButton').classList.add('active');
  }
  const start = textarea.selectionStart;
  textarea.value = `${textarea.value.slice(0, start)}${button.textContent}${textarea.value.slice(textarea.selectionEnd)}`;
  textarea.dispatchEvent(new Event('input'));
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + button.textContent.length;
  $('#detailVariablesMenu').classList.remove('open');
}));

function defaultChats() {
  return [];
}

function loadChatState() {
  const chats = defaultChats();
  return { chats, selected: null, typingChatId: null };
}

function saveChatState() {
  // Runtime-only state: chatState is intentionally discarded on refresh.
}

function currentChat() {
  return chatState.chats.find(chat => chat.id === chatState.selected);
}

function createHistoryItem(chat) {
  const item = document.createElement('div');
  item.className = 'chat-history-item';
  item.classList.toggle('selected', chat.id === chatState.selected);
  const select = document.createElement('button');
  select.className = 'chat-history-select';
  select.type = 'button';
  select.innerHTML = '<span class="chat-model-icon">G</span>';
  const title = document.createElement('span');
  title.className = 'chat-history-title';
  title.textContent = chat.title;
  select.append(title);
  select.addEventListener('click', () => selectChat(chat.id));
  const actions = document.createElement('span');
  actions.className = 'chat-item-actions';
  const archive = document.createElement('button');
  archive.type = 'button';
  archive.setAttribute('aria-label', `Archive ${chat.title}`);
  archive.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4V7ZM3 3h18v4H3V3ZM9 11h6"/></svg>';
  archive.addEventListener('click', () => showToast('Chat archived in mock mode'));
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'delete-chat';
  remove.setAttribute('aria-label', `Delete ${chat.title}`);
  remove.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>';
  remove.addEventListener('click', () => deleteChat(chat.id));
  actions.append(archive, remove);
  item.append(select, actions);
  return item;
}

function renderChatHistory() {
  const today = $('#todayChats');
  const previous = $('#previousChats');
  today.replaceChildren();
  previous.replaceChildren();
  chatState.chats.forEach(chat => (chat.group === 'today' ? today : previous).append(createHistoryItem(chat)));
  today.closest('.chat-history-group').hidden = !today.children.length;
  previous.closest('.chat-history-group').hidden = !previous.children.length;
}

function messageActions() {
  const actions = document.createElement('div');
  actions.className = 'assistant-actions';
  const icons = [
    ['Listen', '<path d="M5 10v4h3l4 4V6L8 10H5ZM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>'],
    ['Copy', '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>'],
    ['Edit', '<path d="M12 20h9M16.5 3.5a2 2 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"/>'],
    ['Share', '<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>'],
    ['Like', '<path d="M7 10v11H3V10h4ZM7 19h10l3-8a2 2 0 0 0-2-3h-5l1-5-2-1-5 8"/>'],
    ['Dislike', '<path d="M7 14V3H3v11h4ZM7 5h10l3 8a2 2 0 0 1-2 3h-5l1 5-2 1-5-8"/>'],
    ['Regenerate', '<path d="M20 6v5h-5M4 18v-5h5M18 10a7 7 0 0 0-12-3l-2 4M6 14a7 7 0 0 0 12 3l2-4"/>']
  ];
  icons.forEach(([label, paths]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = `<svg viewBox="0 0 24 24">${paths}</svg>`;
    button.addEventListener('click', () => showToast(`${label} is a local mock action`));
    actions.append(button);
  });
  return actions;
}

function renderMessage(message) {
  const row = document.createElement('div');
  row.className = `message-row ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`;
  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${message.sender === 'user' ? 'user' : 'gemini'}`;
  avatar.textContent = message.sender === 'user' ? 'VR' : '✦';
  const copy = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = message.sender === 'user' ? 'Vaishnavi Ranaware' : 'Gemini';
  copy.append(name);
  if (message.sender === 'assistant') {
    if (message.agentName || message.webSearch) {
      const badges = document.createElement('div');
      badges.className = 'agent-response-badges';
      if (message.agentName) {
        const agentBadge = document.createElement('span');
        agentBadge.textContent = `Agent: ${message.agentName}`;
        badges.append(agentBadge);
      }
      if (message.webSearch) {
        const searchBadge = document.createElement('span');
        searchBadge.textContent = 'Web Search enabled';
        badges.append(searchBadge);
      }
      copy.append(badges);
    }
    const thoughts = document.createElement('div');
    thoughts.className = 'thoughts-row';
    thoughts.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/></svg><span>Thoughts</span>';
    copy.append(thoughts);
  }
  const text = document.createElement('p');
  text.textContent = message.text;
  copy.append(text);
  if (message.sender === 'assistant') copy.append(messageActions());
  row.append(avatar, copy);
  return row;
}

function renderConversation() {
  const chat = currentChat();
  if (!chat) return closeConversation(true);
  $('#conversationTitle').textContent = chat.title;
  const messages = $('#conversationMessages');
  messages.replaceChildren(...chat.messages.map(renderMessage));
  if (chatState.typingChatId === chat.id) {
    const typing = document.createElement('div');
    typing.className = 'message-row assistant-message typing-row';
    typing.innerHTML = '<div class="message-avatar gemini">✦</div><div><strong>Gemini</strong><div class="typing-dots"><i></i><i></i><i></i></div></div>';
    messages.append(typing);
  }
  chatWelcome.classList.add('skill-hidden');
  conversationView.classList.add('open');
  renderChatHistory();
  requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
}

function selectChat(id) {
  chatState.selected = id;
  saveChatState();
  renderConversation();
  if (window.matchMedia('(max-width: 700px)').matches) setMobilePanel(false);
}

function closeConversation(clearSelection = false) {
  if (clearSelection) {
    chatState.selected = null;
    saveChatState();
  }
  conversationView.classList.remove('open');
  if (!skillDetail.classList.contains('open') && !promptCreateView.classList.contains('open') && !promptDetailView.classList.contains('open')) chatWelcome.classList.remove('skill-hidden');
  renderChatHistory();
}

function deleteChat(id) {
  chatState.chats = chatState.chats.filter(chat => chat.id !== id);
  if (chatState.selected === id) chatState.selected = null;
  saveChatState();
  renderChatHistory();
  if (!chatState.selected) closeConversation(false);
  showToast('Chat deleted');
}

function localResponse(text, agent = null) {
  const input = text.toLowerCase();
  let response;
  if (/\b(hello|hi|hey)\b/.test(input)) response = 'Hello! How can I help you today?';
  else if (/\b(ui|design|spacing|layout|interface)\b/.test(input)) response = 'I can help you refine the UI, improve spacing, and make the prototype feel closer to LibreChat.';
  else if (/\b(code|html|css|javascript|js)\b/.test(input)) response = 'Sure, I can help you structure the HTML, CSS, and JavaScript cleanly.';
  else response = 'I understand. This is a mock response generated locally for the prototype.';
  if (agent?.category === 'Developer') response = `Developer perspective: ${response} I’ll prioritize clean structure, maintainability, and safe implementation.`;
  if (agent?.instructions) response += ` This response follows the custom instructions configured for ${agent.name}.`;
  return response;
}

function createChatFromMessage(text) {
  const words = text.trim().split(/\s+/).slice(0, 5).join(' ');
  const chat = { id: `chat-${Date.now()}`, title: words || 'New Chat', group: 'today', updatedAt: Date.now(), messages: [] };
  chatState.chats.unshift(chat);
  chatState.selected = chat.id;
  return chat;
}

function sendChatMessage(text) {
  let chat = currentChat();
  if (!chat) chat = createChatFromMessage(text);
  chat.messages.push({ sender: 'user', text });
  chat.updatedAt = Date.now();
  chat.group = 'today';
  chatState.typingChatId = chat.id;
  saveChatState();
  openWorkspace('chats');
  renderConversation();
  const responseChatId = chat.id;
  const responseAgent = currentSelectedAgent();
  setTimeout(() => {
    const responseChat = chatState.chats.find(item => item.id === responseChatId);
    if (!responseChat) return;
    responseChat.messages.push({ sender: 'assistant', text: localResponse(text, responseAgent), agentName: responseAgent?.name || '', webSearch: Boolean(responseAgent?.webSearch) });
    responseChat.updatedAt = Date.now();
    if (chatState.typingChatId === responseChatId) chatState.typingChatId = null;
    saveChatState();
    renderChatHistory();
    if (chatState.selected === responseChatId && chatsPanel.classList.contains('open')) renderConversation();
  }, 850);
}

$('#collapseChats').addEventListener('click', event => {
  if (window.matchMedia('(max-width: 700px)').matches) {
    setMobilePanel(false);
    return;
  }
  const collapsed = chatsPanel.classList.toggle('collapsed');
  event.currentTarget.setAttribute('aria-expanded', String(!collapsed));
  event.currentTarget.setAttribute('aria-label', collapsed ? 'Expand chats' : 'Collapse chats');
});
$('#newChatButton').addEventListener('click', () => {
  openWorkspace('chats');
  closeConversation(true);
  showToast('New local chat ready');
});
$('#conversationComposer').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#conversationInput');
  const text = input.value.trim();
  if (!text) return input.focus();
  input.value = '';
  $('#conversationSend').disabled = true;
  sendChatMessage(text);
});
$('#conversationInput').addEventListener('input', event => { $('#conversationSend').disabled = !event.target.value.trim(); });
$('#conversationInput').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    $('#conversationComposer').requestSubmit();
  }
});
renderChatHistory();

function defaultModelSettings() {
  return {
    customName: '', instructions: '', contextTokens: '950000', outputTokens: '8192',
    temperature: '1.00', topP: '0.95', topK: '40', resendFiles: false,
    thinking: false, thinkingBudget: 'Auto', thinkingLevel: '0', grounding: false,
    fileTokenLimit: 'System'
  };
}

function loadModelSettings() {
  return defaultModelSettings();
}

function updateRangeAppearance(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const progress = ((Number(input.value) - min) / (max - min)) * 100;
  input.style.setProperty('--range-progress', `${progress}%`);
}

function updateSettingsBadges() {
  $('#temperatureValue').textContent = Number(modelSettings.temperature).toFixed(2);
  $('#topPValue').textContent = Number(modelSettings.topP).toFixed(2);
  $('#topKValue').textContent = String(modelSettings.topK);
  $('#thinkingLevelValue').textContent = ['Auto', 'Low', 'Medium', 'High'][Number(modelSettings.thinkingLevel)] || 'Auto';
  $$('.settings-range input[type="range"]').forEach(updateRangeAppearance);
}

function renderModelSettings() {
  $$('[data-setting]', settingsPanel).forEach(control => {
    const value = modelSettings[control.dataset.setting];
    if (control.type === 'checkbox') control.checked = Boolean(value);
    else control.value = value;
  });
  updateSettingsBadges();
}

$$('[data-setting]', settingsPanel).forEach(control => {
  control.addEventListener('input', event => {
    modelSettings[event.target.dataset.setting] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    updateSettingsBadges();
  });
  if (control.type === 'checkbox') control.addEventListener('change', event => {
    modelSettings[event.target.dataset.setting] = event.target.checked;
  });
});

$('#settingsForm').addEventListener('submit', event => {
  event.preventDefault();
  showToast('Preset saved for this session', 'success');
});

$('#resetSettings').addEventListener('click', () => {
  modelSettings = defaultModelSettings();
  renderModelSettings();
  showToast('Model parameters reset');
});

renderModelSettings();

const memoryModal = $('#memoryModal');
const memoryKey = $('#memoryKey');
const memoryValue = $('#memoryValue');
const memorySubmit = $('#memorySubmit');

function memoryTokens(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function tokenLabel(value) {
  const count = memoryTokens(value);
  return `${count} ${count === 1 ? 'token' : 'tokens'}`;
}

function formatMemoryDate(date, withTime = false) {
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!withTime) return day;
  return `${day}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function validateMemoryForm(showError = false) {
  const validKey = /^[a-z_]+$/.test(memoryKey.value.trim());
  const validValue = memoryValue.value.trim().length > 0;
  memorySubmit.disabled = !(validKey && validValue);
  const shouldShow = showError || memoryKey.value.length > 0;
  memoryKey.classList.toggle('invalid', shouldShow && !validKey);
  $('#memoryKeyHelp').classList.toggle('error', shouldShow && !validKey);
  return validKey && validValue;
}

function closeMemoryModal() {
  memoryModal.classList.remove('open');
  memoryModal.setAttribute('aria-hidden', 'true');
  editingMemoryId = null;
  $('#memoryForm').reset();
  memoryKey.classList.remove('invalid');
  $('#memoryKeyHelp').classList.remove('error');
  memorySubmit.disabled = true;
}

function openMemoryModal(memory = null) {
  editingMemoryId = memory?.id || null;
  $('#memoryModalTitle').textContent = memory ? 'Edit Memory' : 'Create Memory';
  memorySubmit.textContent = memory ? 'Save' : 'Create';
  memoryKey.value = memory?.key || '';
  memoryValue.value = memory?.value || '';
  $('#memoryModalMeta').classList.toggle('visible', Boolean(memory));
  if (memory) {
    $('#memoryModalTokens').textContent = tokenLabel(memory.value);
    $('#memoryModalDate').textContent = formatMemoryDate(memory.updatedAt, true);
  }
  memoryModal.classList.add('open');
  memoryModal.setAttribute('aria-hidden', 'false');
  validateMemoryForm();
  memoryKey.focus();
}

function filterMemories() {
  const query = $('#memorySearchInput').value.trim().toLowerCase();
  const cards = $$('.memory-card');
  let visible = 0;
  cards.forEach(card => {
    const match = card.dataset.search.includes(query);
    card.hidden = !match;
    if (match) visible += 1;
  });
  $('#memoryNoResults').classList.toggle('visible', cards.length > 0 && visible === 0);
}

function renderMemories() {
  const list = $('#memoryItems');
  list.replaceChildren();
  $('#memoryEmpty').classList.toggle('hidden', memories.length > 0);
  memories.forEach(memory => {
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.dataset.search = `${memory.key} ${memory.value}`.toLowerCase();
    const top = document.createElement('div');
    top.className = 'memory-card-top';
    const title = document.createElement('div');
    title.className = 'memory-card-title';
    const key = document.createElement('strong');
    key.textContent = memory.key;
    const tokens = document.createElement('span');
    tokens.textContent = tokenLabel(memory.value);
    title.append(key, tokens);
    const date = document.createElement('time');
    date.className = 'memory-card-date';
    date.textContent = formatMemoryDate(memory.updatedAt);
    top.append(title, date);
    const value = document.createElement('p');
    value.className = 'memory-card-value';
    value.textContent = memory.value;
    const actions = document.createElement('div');
    actions.className = 'memory-card-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.setAttribute('aria-label', `Edit ${memory.key}`);
    edit.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/></svg>';
    edit.addEventListener('click', () => openMemoryModal(memory));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-memory';
    remove.setAttribute('aria-label', `Delete ${memory.key}`);
    remove.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>';
    remove.addEventListener('click', () => {
      const index = memories.findIndex(item => item.id === memory.id);
      memories.splice(index, 1);
      renderMemories();
      showToast('Memory deleted');
    });
    actions.append(edit, remove);
    card.append(top, value, actions);
    list.append(card);
  });
  filterMemories();
}

$('#createMemoryButton').addEventListener('click', () => openMemoryModal());
$$('[data-close-memory]').forEach(button => button.addEventListener('click', closeMemoryModal));
memoryKey.addEventListener('input', () => validateMemoryForm());
memoryValue.addEventListener('input', () => {
  validateMemoryForm();
  if (editingMemoryId) $('#memoryModalTokens').textContent = tokenLabel(memoryValue.value);
});
$('#memorySearchInput').addEventListener('input', filterMemories);
$('#useMemory').addEventListener('change', event => showToast(event.target.checked ? 'Memory enabled' : 'Memory disabled'));
$('#memoryForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!validateMemoryForm(true)) return;
  if (editingMemoryId) {
    const memory = memories.find(item => item.id === editingMemoryId);
    memory.key = memoryKey.value.trim();
    memory.value = memoryValue.value.trim();
    memory.updatedAt = new Date();
    closeMemoryModal();
    renderMemories();
    showToast('Memory updated successfully', 'success');
    return;
  }
  memories.unshift({ id: `memory-${Date.now()}`, key: memoryKey.value.trim(), value: memoryValue.value.trim(), updatedAt: new Date() });
  closeMemoryModal();
  renderMemories();
  showToast('Memory created successfully', 'success');
});

const createMenu = $('#createMenu');
const menuPopover = $('#menuPopover');

function defaultAgents() {
  return [];
}

function loadAgentState() {
  return { agents: defaultAgents(), selected: null };
}

function saveAgentState() {
  // Runtime-only state: agentState already contains current changes.
}

function currentSelectedAgent() {
  return agentState.agents.find(agent => agent.id === agentState.selected) || null;
}

function initials(name) {
  return name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'A';
}

function renderAgentList() {
  const list = $('#savedAgentList');
  const query = $('#agentSearchInput').value.trim().toLowerCase();
  list.replaceChildren();
  const matches = agentState.agents.filter(agent => agent.name.toLowerCase().includes(query));
  matches.forEach(agent => {
    const row = document.createElement('div');
    row.className = 'saved-agent-row';
    row.classList.toggle('selected', agent.id === agentState.selected);
    const select = document.createElement('button');
    select.type = 'button';
    select.className = 'saved-agent-select';
    const avatar = document.createElement('span');
    avatar.className = 'agent-list-avatar';
    avatar.textContent = initials(agent.name);
    const name = document.createElement('span');
    name.className = 'saved-agent-name';
    name.textContent = agent.name;
    select.append(avatar, name);
    select.addEventListener('click', () => selectAgent(agent.id));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'saved-agent-delete';
    remove.setAttribute('aria-label', `Delete ${agent.name}`);
    remove.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>';
    remove.addEventListener('click', () => deleteAgent(agent.id));
    row.append(select, remove);
    list.append(row);
  });
  $('#agentSearchEmpty').classList.toggle('visible', matches.length === 0);
}

function setAgentControl(id, value) {
  const control = document.getElementById(id);
  if (control.type === 'checkbox') {
    control.checked = Boolean(value);
    control.dispatchEvent(new Event('change'));
  } else control.value = value ?? '';
}

function populateAgentForm(agent) {
  const values = agent || { name: '', description: '', category: 'General', instructions: '', model: 'gemini-3.1-pro-preview', runCode: false, webSearch: false, fileContext: false, artifacts: false, fileSearch: false, skills: false, assignedSkills: [], selectedTools: [...persistedToolSelection], supportName: '', supportEmail: '', subagents: false, handoffs: false, chain: false };
  agentDraftSkills = [...(values.assignedSkills || [])];
  agentDraftTools = [...(values.selectedTools || [])];
  setAgentControl('agentName', values.name);
  setAgentControl('description', values.description);
  setAgentControl('category', values.category);
  setAgentControl('instructions', values.instructions);
  setAgentControl('model', values.model);
  setAgentControl('agentRunCode', values.runCode);
  setAgentControl('agentWebSearch', values.webSearch);
  setAgentControl('agentFileContext', values.fileContext);
  setAgentControl('agentArtifacts', values.artifacts);
  setAgentControl('agentFileSearch', values.fileSearch);
  setAgentControl('agentSkills', values.skills);
  setAgentControl('agentSupportName', values.supportName);
  setAgentControl('agentSupportEmail', values.supportEmail);
  setAgentControl('agentSubagents', values.subagents);
  setAgentControl('agentHandoffs', values.handoffs);
  setAgentControl('agentChain', values.chain);
  $('#agentName').dispatchEvent(new Event('input'));
  $('#description').dispatchEvent(new Event('input'));
  $('#agentMenuLabel').textContent = agent ? agent.name : 'Create New Agent';
  $('#createAgent').textContent = agent ? 'Save Changes' : 'Create';
  $('.identity-block').classList.toggle('editing', Boolean(agent));
  renderAssignedAgentSkills();
  renderSelectedAgentTools();
}

function gatherAgentForm() {
  return {
    name: $('#agentName').value.trim() || 'Untitled Agent', description: $('#description').value.trim(), category: $('#category').value,
    instructions: $('#instructions').value.trim(), model: $('#model').value, runCode: $('#agentRunCode').checked,
    webSearch: $('#agentWebSearch').checked, fileContext: $('#agentFileContext').checked, artifacts: $('#agentArtifacts').checked,
    fileSearch: $('#agentFileSearch').checked, skills: $('#agentSkills').checked, assignedSkills: [...agentDraftSkills], selectedTools: [...agentDraftTools], supportName: $('#agentSupportName').value.trim(),
    supportEmail: $('#agentSupportEmail').value.trim(), subagents: $('#agentSubagents').checked, handoffs: $('#agentHandoffs').checked,
    chain: $('#agentChain').checked
  };
}

function selectAgent(id) {
  agentState.selected = id;
  const agent = currentSelectedAgent();
  populateAgentForm(agent);
  saveAgentState();
  renderAgentList();
  menuPopover.classList.remove('open');
  createMenu.setAttribute('aria-expanded', 'false');
  setView('main');
  showToast('Agent selected');
}

function newAgent() {
  agentState.selected = null;
  populateAgentForm(null);
  saveAgentState();
  renderAgentList();
  menuPopover.classList.remove('open');
  createMenu.setAttribute('aria-expanded', 'false');
  setView('main');
}

function deleteAgent(id) {
  const wasSelected = agentState.selected === id;
  agentState.agents = agentState.agents.filter(agent => agent.id !== id);
  if (wasSelected) agentState.selected = null;
  saveAgentState();
  if (wasSelected) populateAgentForm(null);
  renderAgentList();
  showToast('Agent deleted');
}

createMenu.addEventListener('click', event => {
  event.stopPropagation();
  const open = menuPopover.classList.toggle('open');
  createMenu.setAttribute('aria-expanded', String(open));
  if (open) {
    $('#agentSearchInput').value = '';
    renderAgentList();
    $('#agentSearchInput').focus();
  }
});
$('#newAgentOption').addEventListener('click', newAgent);
$('#agentSearchInput').addEventListener('input', renderAgentList);
document.addEventListener('click', event => {
  if (!menuPopover.contains(event.target) && !createMenu.contains(event.target)) {
    menuPopover.classList.remove('open');
    createMenu.setAttribute('aria-expanded', 'false');
  }
});
populateAgentForm(currentSelectedAgent());
renderAgentList();

const addSkillsModal = $('#addSkillsModal');

function renderAssignedAgentSkills() {
  const container = $('#agentAssignedSkills');
  container.replaceChildren();
  agentDraftSkills.forEach(skillId => {
    const skill = agentSkillCatalog.find(item => item.id === skillId);
    if (!skill) return;
    const chip = document.createElement('span');
    chip.className = 'agent-assigned-skill';
    chip.textContent = skill.title;
    container.append(chip);
  });
}

function closeAddSkillsModal() {
  addSkillsModal.classList.remove('open');
  addSkillsModal.setAttribute('aria-hidden', 'true');
}

function renderAgentSkillResults() {
  const query = $('#agentSkillSearch').value.trim().toLowerCase();
  const matches = agentSkillCatalog.filter(skill => skill.categories.includes(activeAgentSkillCategory) && (!query || `${skill.title} ${skill.description}`.toLowerCase().includes(query)));
  const results = $('#agentSkillResults');
  results.replaceChildren();
  matches.forEach(skill => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'agent-skill-card';
    card.classList.toggle('selected', agentDraftSkills.includes(skill.id));
    card.classList.toggle('newly-created', skill.id === highlightedSkillId);
    const title = document.createElement('h3');
    title.textContent = skill.title;
    const description = document.createElement('p');
    description.textContent = skill.description.length > 145 ? `${skill.description.slice(0, 145)}...` : skill.description;
    const check = document.createElement('span');
    check.className = 'agent-skill-check';
    check.textContent = '✓';
    card.append(title, description, check);
    card.addEventListener('click', () => attachSkillToAgent(skill.id, card));
    results.append(card);
  });
  const empty = $('#agentSkillEmpty');
  empty.classList.toggle('visible', matches.length === 0);
  empty.classList.toggle('search-empty', matches.length === 0 && Boolean(query));
  results.hidden = matches.length === 0;
}

function openAddSkillsModal() {
  activeAgentSkillCategory = 'All';
  $$('#skillCategoryList button').forEach(button => button.classList.toggle('active', button.dataset.category === 'All'));
  $('#agentSkillSearch').value = '';
  renderAgentSkillResults();
  addSkillsModal.classList.add('open');
  addSkillsModal.setAttribute('aria-hidden', 'false');
  $('#agentSkillSearch').focus();
}

function attachSkillToAgent(skillId, card) {
  if (agentDraftSkills.includes(skillId)) {
    closeAddSkillsModal();
    return;
  }
  card.classList.add('selected');
  card.disabled = true;
  setTimeout(() => {
    agentDraftSkills.push(skillId);
    highlightedSkillId = null;
    $('#agentSkills').checked = true;
    renderAssignedAgentSkills();
    const selectedAgent = currentSelectedAgent();
    if (selectedAgent) {
      selectedAgent.assignedSkills = [...agentDraftSkills];
      selectedAgent.skills = true;
      saveAgentState();
    }
    closeAddSkillsModal();
    showToast('Skill added to agent', 'success');
  }, 280);
}

$('#addAgentSkillsButton').addEventListener('click', openAddSkillsModal);
$$('[data-close-agent-skills]').forEach(element => element.addEventListener('click', closeAddSkillsModal));
$('#agentCreateSkillButton').addEventListener('click', () => openCreateSkillPage());
$('#agentSkillSearch').addEventListener('input', renderAgentSkillResults);
$$('#skillCategoryList button').forEach(button => button.addEventListener('click', event => {
  activeAgentSkillCategory = event.currentTarget.dataset.category;
  $$('#skillCategoryList button').forEach(category => category.classList.toggle('active', category === event.currentTarget));
  renderAgentSkillResults();
}));

const agentToolsModal = $('#agentToolsModal');
const toolConfigModal = $('#toolConfigModal');

function loadToolCatalog() {
  try {
    const saved = JSON.parse(localStorage.getItem('librechat_mock_tools'));
    if (Array.isArray(saved)) {
      const customTools = saved.filter(tool => tool.custom && !defaultAgentTools.some(item => item.id === tool.id));
      return [...defaultAgentTools, ...customTools];
    }
  } catch (error) { /* use predefined catalog */ }
  return [...defaultAgentTools];
}

function saveToolCatalog() {
  try { localStorage.setItem('librechat_mock_tools', JSON.stringify(agentToolCatalog)); } catch (error) { /* runtime catalog remains available */ }
}

function loadSelectedTools() {
  try {
    const saved = JSON.parse(localStorage.getItem('librechat_selected_tools'));
    return Array.isArray(saved) ? saved.filter(id => agentToolCatalog.some(tool => tool.id === id)) : [];
  } catch (error) { return []; }
}

function saveSelectedTools() {
  persistedToolSelection = [...agentDraftTools];
  try { localStorage.setItem('librechat_selected_tools', JSON.stringify(persistedToolSelection)); } catch (error) { /* runtime selection remains available */ }
}

function loadToolConfigurations() {
  try { return JSON.parse(localStorage.getItem('librechat_tool_configurations')) || {}; } catch (error) { return {}; }
}

function saveToolConfigurations() {
  try { localStorage.setItem('librechat_tool_configurations', JSON.stringify(toolConfigurations)); } catch (error) { /* runtime configuration remains available */ }
}

function toolInitials(name) {
  return name.split(/\s+/).map(word => word[0]).join('').slice(0, 3).toUpperCase();
}

function renderSelectedAgentTools() {
  const container = $('#agentSelectedTools');
  container.replaceChildren();
  agentDraftTools.forEach(toolId => {
    const tool = agentToolCatalog.find(item => item.id === toolId);
    if (!tool) return;
    const chip = document.createElement('span');
    chip.className = 'agent-tool-chip';
    chip.append(document.createTextNode(tool.name));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${tool.name}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => toggleAgentTool(tool.id, false));
    chip.append(remove);
    container.append(chip);
  });
}

function persistCurrentAgentTools() {
  saveSelectedTools();
  const agent = currentSelectedAgent();
  if (agent) {
    agent.selectedTools = [...agentDraftTools];
    saveAgentState();
  }
}

function toggleAgentTool(toolId, showMessage = true) {
  const tool = agentToolCatalog.find(item => item.id === toolId);
  const selected = agentDraftTools.includes(toolId);
  agentDraftTools = selected ? agentDraftTools.filter(id => id !== toolId) : [...agentDraftTools, toolId];
  renderSelectedAgentTools();
  persistCurrentAgentTools();
  renderAgentTools();
  if (showMessage) showToast(selected ? 'Tool removed from agent' : 'Tool added to agent', selected ? 'default' : 'success');
}

function renderAgentTools() {
  const query = $('#agentToolSearch').value.trim().toLowerCase();
  const matches = agentToolCatalog.filter(tool => (activeToolCategory === 'All' || tool.category === activeToolCategory) && (!query || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query)));
  const grid = $('#agentToolsGrid');
  grid.replaceChildren();
  matches.forEach(tool => {
    const selected = agentDraftTools.includes(tool.id);
    const card = document.createElement('article');
    card.className = 'agent-tool-card';
    card.classList.toggle('selected', selected);
    const top = document.createElement('div');
    top.className = 'agent-tool-card-top';
    const logo = document.createElement('span');
    logo.className = 'agent-tool-logo';
    logo.textContent = toolInitials(tool.name);
    const heading = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = tool.name;
    const category = document.createElement('span');
    category.className = 'agent-tool-category';
    category.textContent = tool.category;
    heading.append(name, category);
    top.append(logo, heading);
    const displayStatus = toolConfigurations[tool.id] ? 'Connected' : tool.status;
    const status = document.createElement('span');
    status.className = `tool-status ${displayStatus.toLowerCase().replace(/\s+/g, '-')}`;
    status.textContent = displayStatus;
    const description = document.createElement('p');
    description.textContent = tool.description;
    const actions = document.createElement('div');
    actions.className = 'agent-tool-card-actions';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'tool-add-button';
    add.textContent = selected ? 'Added' : 'Add';
    add.addEventListener('click', () => toggleAgentTool(tool.id));
    actions.append(add);
    if (selected && configurableTools.has(tool.id)) {
      const configure = document.createElement('button');
      configure.type = 'button';
      configure.className = 'tool-configure';
      configure.textContent = 'Configure';
      configure.addEventListener('click', () => openToolConfiguration(tool.id));
      actions.prepend(configure);
    }
    card.append(top, status, description, actions);
    grid.append(card);
  });
  $('#agentToolsEmpty').classList.toggle('visible', matches.length === 0);
  grid.hidden = matches.length === 0;
  $('#selectedToolsCount').textContent = `Selected tools: ${agentDraftTools.length}`;
}

function openAgentToolsModal() {
  activeToolCategory = 'All';
  $('#agentToolSearch').value = '';
  $$('#agentToolCategories button').forEach(button => button.classList.toggle('active', button.dataset.toolCategory === 'All'));
  $('#agentToolsGrid').replaceChildren();
  $('#agentToolsLoading').classList.add('visible');
  $('#agentToolsEmpty').classList.remove('visible');
  agentToolsModal.classList.add('open');
  agentToolsModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    if (!agentToolsModal.classList.contains('open')) return;
    $('#agentToolsLoading').classList.remove('visible');
    renderAgentTools();
    $('#agentToolSearch').focus();
  }, 400);
}

function closeAgentToolsModal() {
  agentToolsModal.classList.remove('open');
  agentToolsModal.setAttribute('aria-hidden', 'true');
}

function openToolConfiguration(toolId) {
  const tool = agentToolCatalog.find(item => item.id === toolId);
  configuringToolId = toolId;
  $('#toolConfigTitle').textContent = `${tool.name} Configuration`;
  $('#toolConfigWorkspace').value = toolConfigurations[toolId]?.workspace || '';
  toolConfigModal.classList.add('open');
  toolConfigModal.setAttribute('aria-hidden', 'false');
  $('#toolConfigWorkspace').focus();
}

function closeToolConfiguration() {
  toolConfigModal.classList.remove('open');
  toolConfigModal.setAttribute('aria-hidden', 'true');
  configuringToolId = null;
}

$('#addAgentToolsButton').addEventListener('click', openAgentToolsModal);
$$('[data-close-tools]').forEach(element => element.addEventListener('click', closeAgentToolsModal));
$('#agentToolsDone').addEventListener('click', closeAgentToolsModal);
$('#agentToolSearch').addEventListener('input', renderAgentTools);
$('#createTemporaryTool').addEventListener('click', () => {
  const typedName = $('#agentToolSearch').value.trim();
  const name = typedName || `Custom Tool ${agentToolCatalog.length + 1}`;
  const id = `tool-${Date.now()}`;
  const category = activeToolCategory === 'All' ? 'Productivity' : activeToolCategory;
  agentToolCatalog.push({ id, name, description: 'A custom tool saved locally for this prototype.', category, status: 'Mock', custom: true });
  configurableTools.add(id);
  agentDraftTools.push(id);
  $('#agentToolSearch').value = '';
  persistCurrentAgentTools();
  saveToolCatalog();
  renderSelectedAgentTools();
  renderAgentTools();
  showToast('Tool added to agent', 'success');
});
$$('#agentToolCategories button').forEach(button => button.addEventListener('click', event => {
  activeToolCategory = event.currentTarget.dataset.toolCategory;
  $$('#agentToolCategories button').forEach(item => item.classList.toggle('active', item === event.currentTarget));
  renderAgentTools();
}));
$$('[data-close-tool-config]').forEach(element => element.addEventListener('click', closeToolConfiguration));
$('#toolConfigForm').addEventListener('submit', event => {
  event.preventDefault();
  const tool = agentToolCatalog.find(item => item.id === configuringToolId);
  toolConfigurations[configuringToolId] = { workspace: $('#toolConfigWorkspace').value.trim(), status: 'connected', updatedAt: Date.now() };
  saveToolConfigurations();
  closeToolConfiguration();
  showToast(`${tool.name} configuration saved`, 'success');
});

const skillInstructionTemplate = `# Overview

Describe what this skill does and how it should be applied.

## When to use

- List concrete signals that should trigger this skill
- Add examples that make the trigger unambiguous

## How to apply

Walk through the steps the agent should take.`;
let skillCreationOrigin = 'agent';
let skillCreationHadConversation = false;

function validateCreateSkill(showErrors = false) {
  const fields = [
    [$('#newSkillName'), $('#newSkillNameError')],
    [$('#newSkillDescription'), $('#newSkillDescriptionError')],
    [$('#newSkillInstructions'), $('#newSkillInstructionsError')]
  ];
  let valid = true;
  fields.forEach(([input, error]) => {
    const fieldValid = Boolean(input.value.trim());
    valid = valid && fieldValid;
    if (showErrors) error.closest('.create-skill-field').classList.toggle('invalid', !fieldValid);
    else if (fieldValid) error.closest('.create-skill-field').classList.remove('invalid');
  });
  $('#submitCreateSkill').disabled = !valid;
  return valid;
}

function openCreateSkillPage(skillId = null, origin = null) {
  const skill = skillId ? agentSkillCatalog.find(item => item.id === skillId) : null;
  editingSkillId = skill?.id || null;
  skillCreationOrigin = origin || (skillId ? 'skills' : 'agent');
  skillCreationHadConversation = conversationView.classList.contains('open');
  closeAddSkillsModal();
  conversationView.classList.remove('open');
  chatWelcome.classList.add('skill-hidden');
  skillDetail.classList.remove('open');
  promptCreateView.classList.remove('open');
  promptDetailView.classList.remove('open');
  $('#createSkillView').classList.add('open');
  $('#createSkillPageTitle').textContent = skill ? 'Edit Skill' : 'Create Skill';
  $('#newSkillName').value = skill?.title || '';
  $('#newSkillDescription').value = skill?.description || '';
  $('#newSkillInstructions').value = skill?.instructions || skillInstructionTemplate;
  $('#newSkillCategoryLabel').textContent = skill?.category || 'Category';
  $('#submitCreateSkill').textContent = skill ? 'Save changes' : 'Create skill';
  $$('.create-skill-field').forEach(field => field.classList.remove('invalid'));
  validateCreateSkill();
  $('#newSkillName').focus();
}

function leaveCreateSkillPage(returnToModal = false) {
  $('#createSkillView').classList.remove('open');
  if (skillCreationOrigin === 'skills' && editingSkillId) openSkillDetail(editingSkillId);
  else {
    if (skillCreationHadConversation && chatState.selected) renderConversation();
    else chatWelcome.classList.remove('skill-hidden');
    if (returnToModal) openAddSkillsModal();
  }
  editingSkillId = null;
}

function deleteSkill(id) {
  const skill = agentSkillCatalog.find(item => item.id === id);
  if (!skill || skill.builtIn) return;
  agentSkillCatalog = agentSkillCatalog.filter(item => item.id !== id);
  agentDraftSkills = agentDraftSkills.filter(skillId => skillId !== id);
  agentState.agents.forEach(agent => { agent.assignedSkills = (agent.assignedSkills || []).filter(skillId => skillId !== id); });
  saveSkillCatalog();
  saveAgentState();
  renderAssignedAgentSkills();
  renderStandaloneSkills();
  activeSkillId = null;
  skillDetail.classList.remove('open');
  chatWelcome.classList.remove('skill-hidden');
  showToast('Skill deleted');
}

$('#newSkillCategoryButton').addEventListener('click', () => {
  const menu = $('#newSkillCategoryMenu');
  const open = menu.classList.toggle('open');
  $('#newSkillCategoryButton').setAttribute('aria-expanded', String(open));
});
$$('#newSkillCategoryMenu button').forEach(button => button.addEventListener('click', () => {
  $('#newSkillCategoryLabel').textContent = button.textContent;
  $('#newSkillCategoryMenu').classList.remove('open');
  $('#newSkillCategoryButton').setAttribute('aria-expanded', 'false');
}));
[$('#newSkillName'), $('#newSkillDescription'), $('#newSkillInstructions')].forEach(input => {
  input.addEventListener('input', () => validateCreateSkill(false));
  input.addEventListener('blur', () => validateCreateSkill(true));
});
$('#cancelCreateSkill').addEventListener('click', () => leaveCreateSkillPage(skillCreationOrigin === 'agent'));
$('#createSkillForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!validateCreateSkill(true)) return;
  const button = $('#submitCreateSkill');
  button.disabled = true;
  button.textContent = editingSkillId ? 'Saving...' : 'Creating...';
  setTimeout(() => {
    const title = $('#newSkillName').value.trim();
    const category = $('#newSkillCategoryLabel').textContent === 'Category' ? 'Misc.' : $('#newSkillCategoryLabel').textContent;
    const values = { title, category, description: $('#newSkillDescription').value, instructions: $('#newSkillInstructions').value, categories: ['All', 'My Skills', category], enabled: true };
    let savedSkill;
    if (editingSkillId) {
      savedSkill = agentSkillCatalog.find(item => item.id === editingSkillId);
      Object.assign(savedSkill, values, { updatedAt: new Date().toISOString() });
    } else {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'skill';
      savedSkill = { id: `${slug}-${Date.now()}`, ...values, createdAt: new Date().toISOString(), builtIn: false };
      agentSkillCatalog.push(savedSkill);
      highlightedSkillId = savedSkill.id;
    }
    saveSkillCatalog();
    renderStandaloneSkills();
    renderAgentSkillResults();
    renderAssignedAgentSkills();
    const wasEditing = Boolean(editingSkillId);
    const savedId = savedSkill.id;
    button.disabled = false;
    showToast(wasEditing ? 'Skill updated successfully' : 'Skill created successfully', 'success');
    if (skillCreationOrigin === 'agent') {
      editingSkillId = null;
      leaveCreateSkillPage(true);
    } else {
      editingSkillId = savedId;
      leaveCreateSkillPage(false);
    }
  }, 500);
});

function updateCounter(input, output) {
  const refresh = () => { output.textContent = `${input.value.length} / ${input.maxLength}`; };
  input.addEventListener('input', refresh);
  refresh();
}
updateCounter($('#agentName'), $('#nameCount'));
updateCounter($('#description'), $('#descriptionCount'));

$$('.switch input[data-upload]').forEach(toggle => {
  toggle.addEventListener('change', () => {
    const upload = document.getElementById(toggle.dataset.upload);
    upload.disabled = !toggle.checked;
  });
});

$$('.upload-button, .outline-button').filter(button => !['addAgentToolsButton', 'addAgentSkillsButton'].includes(button.id)).forEach(button => button.addEventListener('click', () => {
  showToast(`${button.textContent.trim()} is ready for mock configuration`);
}));

$('#createAgent').addEventListener('click', event => {
  const button = event.currentTarget;
  const editing = Boolean(currentSelectedAgent());
  const values = gatherAgentForm();
  button.classList.add('loading');
  button.disabled = true;
  button.textContent = 'Saving…';
  setTimeout(() => {
    if (editing) {
      const index = agentState.agents.findIndex(agent => agent.id === agentState.selected);
      agentState.agents[index] = { ...agentState.agents[index], ...values, updatedAt: Date.now() };
    } else {
      const agent = { id: `agent-${Date.now()}`, ...values, createdAt: Date.now() };
      agentState.agents.unshift(agent);
      agentState.selected = agent.id;
    }
    saveAgentState();
    const savedAgent = currentSelectedAgent();
    populateAgentForm(savedAgent);
    renderAgentList();
    button.classList.remove('loading');
    button.disabled = false;
    button.textContent = 'Save Changes';
    showToast(editing ? 'Agent updated successfully' : 'Agent created successfully', 'success');
  }, 550);
});

$('#composer').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#messageInput');
  if (!input.value.trim()) return input.focus();
  const text = input.value.trim();
  input.value = '';
  sendChatMessage(text);
});

$('#messageInput').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    $('#composer').requestSubmit();
  }
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeModelDropdown();
    closeAddSkillsModal();
    closeToolConfiguration();
    closeAgentToolsModal();
    menuPopover.classList.remove('open');
    createMenu.setAttribute('aria-expanded', 'false');
    createSkillModal.classList.remove('open');
    closeMemoryModal();
    setMobilePanel(false);
  }
});
