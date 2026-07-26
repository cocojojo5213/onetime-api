const { invoke } = window.__TAURI__.core;
const { openUrl } = window.__TAURI__.opener;

let config = { agents: [], profiles: [] };
let editingId = null;
let agentsSnapshot = null;

const $ = (id) => document.getElementById(id);
const listEl = $("profile-list");
const emptyState = $("empty-state");
const noResults = $("no-results");
const profileDialog = $("profile-dialog");
const profileForm = $("profile-form");
const agentsDialog = $("agents-dialog");
const agentsList = $("agents-list");
const searchInput = $("profile-search");
const updateDialog = $("update-dialog");

const RELEASES_API = "https://api.github.com/repos/cocojojo5213/onetime-api/releases/latest";
const RELEASES_PAGE = "https://github.com/cocojojo5213/onetime-api/releases/latest";
const UPDATE_CACHE_KEY = "onetime-api-update-check";
const UPDATE_CACHE_TTL = 6 * 60 * 60 * 1000;

const updateState = {
  current: "",
  latest: "",
  releaseUrl: RELEASES_PAGE,
  checking: false,
  error: "",
  checkedAt: 0,
};

function icon(name, className = "icon") {
  return `<svg class="${className}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toast(message, isError = false) {
  const toastEl = $("toast");
  toastEl.className = isError ? "toast error" : "toast";
  toastEl.querySelector("use").setAttribute("href", isError ? "#icon-circle-alert" : "#icon-circle-check");
  toastEl.querySelector("span").textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => {
    toastEl.hidden = true;
  }, 2800);
}

function normalizeVersion(version) {
  return String(version ?? "")
    .trim()
    .replace(/^v/i, "")
    .split("+")[0];
}

function compareVersions(left, right) {
  const parts = (version) => normalizeVersion(version)
    .split("-")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const leftParts = parts(left);
  const rightParts = parts(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function updateAvailable() {
  return Boolean(
    updateState.current
      && updateState.latest
      && compareVersions(updateState.latest, updateState.current) > 0,
  );
}

function renderUpdateState() {
  const available = updateAvailable();
  const versionButton = $("version-button");
  const versionSummary = $("version-summary");
  const latestVersion = $("latest-version");
  const updateMessage = $("update-message");
  const checkButton = $("update-check");

  $("version-label").textContent = updateState.current ? `v${updateState.current}` : "版本未知";
  $("current-version").textContent = updateState.current ? `v${updateState.current}` : "读取失败";
  latestVersion.textContent = updateState.latest ? `v${updateState.latest}` : "尚未检查";
  latestVersion.classList.toggle("available", available);
  $("update-indicator").hidden = !available;
  versionButton.classList.toggle("update-available", available);
  versionButton.classList.toggle("checking", updateState.checking);
  checkButton.classList.toggle("checking", updateState.checking);
  checkButton.disabled = updateState.checking;

  updateMessage.classList.toggle("error", Boolean(updateState.error));
  if (updateState.checking) {
    versionSummary.textContent = "正在检查更新";
    updateMessage.textContent = "正在检查 GitHub Releases。";
  } else if (updateState.error) {
    versionSummary.textContent = "点击重试";
    updateMessage.textContent = updateState.error;
  } else if (available) {
    versionSummary.textContent = `发现 v${updateState.latest}`;
    updateMessage.textContent = `新版本 v${updateState.latest} 已发布，可以前往下载。`;
  } else if (updateState.latest) {
    versionSummary.textContent = "已是最新版本";
    updateMessage.textContent = "当前版本已经是 GitHub 上的最新正式版本。";
  } else {
    versionSummary.textContent = "点击检查更新";
    updateMessage.textContent = "尚未检查 GitHub Releases。";
  }

  $("update-download").querySelector("span").textContent = available
    ? `下载 v${updateState.latest}`
    : "查看发布页";
}

function readUpdateCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(UPDATE_CACHE_KEY) || "null");
    if (!cached?.latest || !cached?.checkedAt) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeUpdateCache() {
  try {
    localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify({
      latest: updateState.latest,
      releaseUrl: updateState.releaseUrl,
      checkedAt: updateState.checkedAt,
    }));
  } catch {
    // Update caching is optional.
  }
}

async function checkForUpdates({ force = false, notify = false } = {}) {
  if (updateState.checking) return;

  const cached = readUpdateCache();
  if (!force && cached && Date.now() - cached.checkedAt < UPDATE_CACHE_TTL) {
    updateState.latest = normalizeVersion(cached.latest);
    updateState.releaseUrl = cached.releaseUrl || RELEASES_PAGE;
    updateState.checkedAt = cached.checkedAt;
    updateState.error = "";
    renderUpdateState();
    return;
  }

  updateState.checking = true;
  updateState.error = "";
  renderUpdateState();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(RELEASES_API, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`GitHub API 返回 ${response.status}`);

    const release = await response.json();
    const latest = normalizeVersion(release.tag_name);
    if (!latest) throw new Error("最新 Release 没有有效版本号");

    updateState.latest = latest;
    updateState.releaseUrl = release.html_url || RELEASES_PAGE;
    updateState.checkedAt = Date.now();
    updateState.error = "";
    writeUpdateCache();

    if (notify) {
      toast(updateAvailable() ? `发现新版本 v${latest}` : "当前已经是最新版本");
    }
  } catch (error) {
    updateState.error = error?.name === "AbortError"
      ? "检查更新超时，请稍后重试。"
      : `暂时无法检查更新：${error}`;
    if (notify) toast(updateState.error, true);
  } finally {
    clearTimeout(timeout);
    updateState.checking = false;
    renderUpdateState();
  }
}

async function initUpdater() {
  try {
    updateState.current = normalizeVersion(await invoke("app_version"));
  } catch (error) {
    updateState.error = `无法读取当前版本：${error}`;
  }
  renderUpdateState();
  await checkForUpdates();
}

async function loadConfig() {
  config = await invoke("load_config");
  render();
}

async function saveConfig() {
  await invoke("save_config", { config });
}

function agentName(id) {
  const agent = config.agents.find((item) => item.id === id);
  return agent ? agent.name : "未知 Agent";
}

function agentTone(id) {
  const known = ["claude", "codex", "grokbuild", "pi"];
  return known.includes(id) ? `tone-${id}` : "";
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function searchableText(profile) {
  return [profile.name, profile.base_url, profile.workdir, agentName(profile.agent_id)]
    .join(" ")
    .toLocaleLowerCase();
}

function displayUrl(value) {
  try {
    const url = new URL(value);
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.host}${path}`;
  } catch {
    return value;
  }
}

function render() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const profiles = query
    ? config.profiles.filter((profile) => searchableText(profile).includes(query))
    : config.profiles;

  listEl.innerHTML = "";
  $("nav-count").textContent = String(config.profiles.length);
  $("profile-count").textContent = `${config.profiles.length} 个配置`;
  $("clear-search").hidden = query.length === 0;

  emptyState.hidden = config.profiles.length !== 0;
  noResults.hidden = config.profiles.length === 0 || profiles.length !== 0;
  listEl.hidden = config.profiles.length === 0 || profiles.length === 0;

  for (const profile of profiles) {
    const card = document.createElement("article");
    card.className = "profile-card";
    card.setAttribute("role", "listitem");

    const workdir = profile.workdir
      ? `<span title="${esc(profile.workdir)}">${icon("folder")}<span class="meta-text">${esc(profile.workdir)}</span></span>`
      : "";

    card.innerHTML = `
      <div class="agent-mark ${agentTone(profile.agent_id)}" aria-hidden="true">
        ${icon("terminal")}
      </div>
      <div class="profile-copy">
        <div class="profile-title-row">
          <h3 title="${esc(profile.name)}">${esc(profile.name)}</h3>
          <span class="agent-name">${esc(agentName(profile.agent_id))}</span>
        </div>
        <div class="profile-meta">
          <span title="${esc(profile.base_url)}">${icon("globe")}<span class="meta-text">${esc(displayUrl(profile.base_url))}</span></span>
          ${workdir}
        </div>
      </div>
      <div class="profile-actions">
        <button type="button" class="row-icon-button edit" aria-label="编辑 ${esc(profile.name)}" title="编辑">
          ${icon("pencil")}
        </button>
        <button type="button" class="row-icon-button danger delete" aria-label="删除 ${esc(profile.name)}" title="删除">
          ${icon("trash")}
        </button>
        <button type="button" class="launch-button">
          ${icon("play")}
          <span class="button-text">启动</span>
        </button>
      </div>`;

    const launchButton = card.querySelector(".launch-button");
    launchButton.addEventListener("click", async () => {
      launchButton.disabled = true;
      launchButton.innerHTML = '<span class="loading-ring" aria-hidden="true"></span><span class="button-text">启动中</span>';
      try {
        await invoke("launch", { profileId: profile.id });
        toast(`已启动 ${agentName(profile.agent_id)}`);
      } catch (error) {
        toast(String(error), true);
      } finally {
        launchButton.disabled = false;
        launchButton.innerHTML = `${icon("play")}<span class="button-text">启动</span>`;
      }
    });

    card.querySelector(".edit").addEventListener("click", () => openProfileDialog(profile));
    card.querySelector(".delete").addEventListener("click", async () => {
      if (!confirm(`删除配置「${profile.name}」？`)) return;
      const previousProfiles = config.profiles;
      config.profiles = config.profiles.filter((item) => item.id !== profile.id);
      try {
        await saveConfig();
        render();
        toast("配置已删除");
      } catch (error) {
        config.profiles = previousProfiles;
        toast(String(error), true);
      }
    });

    listEl.appendChild(card);
  }
}

function setKeyVisibility(visible) {
  const keyInput = profileForm.elements.api_key;
  const button = $("toggle-key");
  keyInput.type = visible ? "text" : "password";
  button.setAttribute("aria-pressed", String(visible));
  button.setAttribute("aria-label", visible ? "隐藏 API Key" : "显示 API Key");
  button.title = visible ? "隐藏 API Key" : "显示 API Key";
  button.innerHTML = icon(visible ? "eye-off" : "eye");
}

function openProfileDialog(profile = null) {
  if (config.agents.length === 0) {
    toast("请先添加一个 Agent 模板", true);
    openAgentsDialog();
    return;
  }

  editingId = profile ? profile.id : null;
  $("profile-dialog-title").textContent = profile ? "编辑配置" : "新增配置";

  const select = $("agent-select");
  select.innerHTML = config.agents
    .map((agent) => `<option value="${esc(agent.id)}">${esc(agent.name)}</option>`)
    .join("");

  profileForm.elements.name.value = profile?.name ?? "";
  profileForm.elements.base_url.value = profile?.base_url ?? "";
  profileForm.elements.api_key.value = profile?.api_key ?? "";
  profileForm.elements.agent_id.value = profile?.agent_id ?? config.agents[0]?.id ?? "";
  profileForm.elements.workdir.value = profile?.workdir ?? "";
  setKeyVisibility(false);
  profileDialog.showModal();
  requestAnimationFrame(() => profileForm.elements.name.focus());
}

function closeProfileDialog() {
  profileDialog.close();
  editingId = null;
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!profileForm.reportValidity()) return;

  const wasEditing = editingId !== null;
  const profile = {
    id: editingId ?? uid(),
    name: profileForm.elements.name.value.trim(),
    base_url: profileForm.elements.base_url.value.trim().replace(/\/+$/, ""),
    api_key: profileForm.elements.api_key.value.trim(),
    agent_id: profileForm.elements.agent_id.value,
    workdir: profileForm.elements.workdir.value.trim(),
  };

  const previousProfiles = config.profiles;
  config.profiles = editingId
    ? config.profiles.map((item) => (item.id === editingId ? profile : item))
    : [...config.profiles, profile];

  try {
    await saveConfig();
    closeProfileDialog();
    render();
    toast(wasEditing ? "配置已更新" : "配置已添加");
  } catch (error) {
    config.profiles = previousProfiles;
    toast(String(error), true);
  }
});

function renderAgents() {
  agentsList.innerHTML = "";

  config.agents.forEach((agent, index) => {
    const row = document.createElement("div");
    row.className = "agent-row";
    row.innerHTML = `
      <div class="agent-fields">
        <input class="agent-template-name" aria-label="模板名称" placeholder="模板名称" value="${esc(agent.name)}" />
        <input class="agent-template-command" aria-label="启动命令" placeholder="启动命令，例如 codex" value="${esc(agent.command)}" spellcheck="false" />
        <textarea class="agent-template-env" aria-label="环境变量" rows="3" placeholder="OPENAI_BASE_URL={base_url}\nOPENAI_API_KEY={api_key}" spellcheck="false">${esc(
          Object.entries(agent.env).map(([key, value]) => `${key}=${value}`).join("\n"),
        )}</textarea>
      </div>
      <button type="button" class="row-icon-button danger agent-delete" aria-label="删除 ${esc(agent.name || "模板")}" title="删除模板">
        ${icon("trash")}
      </button>`;

    row.querySelector(".agent-delete").addEventListener("click", () => {
      if (config.profiles.some((profile) => profile.agent_id === agent.id)) {
        toast("这个模板仍被 API 配置使用，暂时不能删除", true);
        return;
      }
      config.agents.splice(index, 1);
      renderAgents();
    });

    agentsList.appendChild(row);
  });
}

function openAgentsDialog() {
  agentsSnapshot = clone(config.agents);
  renderAgents();
  agentsDialog.showModal();
}

function closeAgentsDialog(discard = true) {
  if (discard && agentsSnapshot) {
    config.agents = agentsSnapshot;
  }
  agentsSnapshot = null;
  agentsDialog.close();
  render();
}

function readAgentRows() {
  const rows = [...agentsList.querySelectorAll(".agent-row")];
  return rows.map((row, index) => {
    const existing = config.agents[index];
    const env = {};
    for (const line of row.querySelector(".agent-template-env").value.split("\n")) {
      const separator = line.indexOf("=");
      if (separator > 0) {
        env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
      }
    }
    return {
      id: existing?.id ?? uid(),
      name: row.querySelector(".agent-template-name").value.trim(),
      command: row.querySelector(".agent-template-command").value.trim(),
      env,
    };
  });
}

$("btn-add").addEventListener("click", () => openProfileDialog());
$("empty-add").addEventListener("click", () => openProfileDialog());
$("profile-cancel").addEventListener("click", closeProfileDialog);
$("profile-close").addEventListener("click", closeProfileDialog);
$("toggle-key").addEventListener("click", () => {
  setKeyVisibility(profileForm.elements.api_key.type === "password");
});

$("btn-agents").addEventListener("click", openAgentsDialog);
$("agent-new").addEventListener("click", () => {
  config.agents.push({ id: uid(), name: "", command: "", env: {} });
  renderAgents();
  const lastRow = agentsList.lastElementChild;
  lastRow?.querySelector(".agent-template-name")?.focus();
});
$("agents-close").addEventListener("click", () => closeAgentsDialog(true));
$("agents-close-icon").addEventListener("click", () => closeAgentsDialog(true));
$("agents-save").addEventListener("click", async () => {
  const nextAgents = readAgentRows();
  if (nextAgents.some((agent) => !agent.name || !agent.command)) {
    toast("模板名称和启动命令不能为空", true);
    return;
  }

  const previousAgents = agentsSnapshot ?? clone(config.agents);
  config.agents = nextAgents;
  try {
    await saveConfig();
    closeAgentsDialog(false);
    toast("Agent 模板已保存");
  } catch (error) {
    config.agents = previousAgents;
    toast(String(error), true);
  }
});

searchInput.addEventListener("input", render);
$("clear-search").addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  render();
});

function closeOnBackdrop(dialog, close) {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    if (!inside) close();
  });
}

function openUpdateDialog() {
  renderUpdateState();
  updateDialog.showModal();
  if (!updateState.latest && !updateState.checking) {
    checkForUpdates({ force: true });
  }
}

function closeUpdateDialog() {
  updateDialog.close();
}

$("version-button").addEventListener("click", openUpdateDialog);
$("update-close").addEventListener("click", closeUpdateDialog);
$("update-close-icon").addEventListener("click", closeUpdateDialog);
$("update-check").addEventListener("click", () => checkForUpdates({ force: true, notify: true }));
$("update-download").addEventListener("click", async () => {
  try {
    await openUrl(updateState.releaseUrl || RELEASES_PAGE);
  } catch (error) {
    toast(`无法打开发布页：${error}`, true);
  }
});

closeOnBackdrop(profileDialog, closeProfileDialog);
closeOnBackdrop(agentsDialog, () => closeAgentsDialog(true));
closeOnBackdrop(updateDialog, closeUpdateDialog);
profileDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeProfileDialog();
});
agentsDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeAgentsDialog(true);
});
updateDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeUpdateDialog();
});

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  const button = $("theme-toggle");
  const switchingTo = nextTheme === "dark" ? "明亮" : "深色";
  button.setAttribute("aria-label", `切换${switchingTo}主题`);
  button.title = `切换${switchingTo}主题`;
  button.innerHTML = icon(nextTheme === "dark" ? "sun" : "moon");
}

let storedTheme = "light";
try {
  storedTheme = localStorage.getItem("onetime-api-theme") || "light";
} catch {
  storedTheme = "light";
}
applyTheme(storedTheme);

$("theme-toggle").addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    localStorage.setItem("onetime-api-theme", nextTheme);
  } catch {
    // Theme persistence is optional.
  }
});

loadConfig().catch((error) => toast(String(error), true));
initUpdater().catch((error) => {
  updateState.error = `无法初始化更新检查：${error}`;
  renderUpdateState();
});
