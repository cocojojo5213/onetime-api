const { invoke } = window.__TAURI__.core;

let config = { agents: [], profiles: [] };

const $ = (id) => document.getElementById(id);
const listEl = $("profile-list");
const emptyHint = $("empty-hint");
const profileDialog = $("profile-dialog");
const profileForm = $("profile-form");
const agentsDialog = $("agents-dialog");
const agentsList = $("agents-list");

let editingId = null; // null = creating

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function toast(msg, isError = false) {
  const t = $("toast");
  t.textContent = msg;
  t.className = isError ? "error" : "";
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), 2600);
}

async function loadConfig() {
  config = await invoke("load_config");
  render();
}

async function saveConfig() {
  await invoke("save_config", { config });
}

function agentName(id) {
  const a = config.agents.find((a) => a.id === id);
  return a ? a.name : id;
}

function render() {
  listEl.innerHTML = "";
  emptyHint.hidden = config.profiles.length > 0;
  for (const p of config.profiles) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-info">
        <div class="card-title">${esc(p.name)}</div>
        <div class="card-sub">${esc(agentName(p.agent_id))} · ${esc(truncate(p.base_url, 40))}</div>
      </div>
      <div class="card-actions">
        <button class="launch">▶ 启动</button>
        <button class="ghost small edit">编辑</button>
        <button class="ghost small danger del">删除</button>
      </div>`;
    card.querySelector(".launch").onclick = async () => {
      try {
        await invoke("launch", { profileId: p.id });
        toast(`已启动 ${agentName(p.agent_id)}`);
      } catch (e) {
        toast(String(e), true);
      }
    };
    card.querySelector(".edit").onclick = () => openProfileDialog(p);
    card.querySelector(".del").onclick = async () => {
      if (!confirm(`删除配置「${p.name}」？`)) return;
      config.profiles = config.profiles.filter((x) => x.id !== p.id);
      await saveConfig();
      render();
    };
    listEl.appendChild(card);
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ---------- profile dialog ----------
function openProfileDialog(profile) {
  editingId = profile ? profile.id : null;
  $("profile-dialog-title").textContent = profile ? "编辑配置" : "新增配置";
  const sel = $("agent-select");
  sel.innerHTML = config.agents
    .map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`)
    .join("");
  profileForm.name.value = profile?.name ?? "";
  profileForm.base_url.value = profile?.base_url ?? "";
  profileForm.api_key.value = profile?.api_key ?? "";
  profileForm.api_key.type = "password";
  sel.value = profile?.agent_id ?? config.agents[0]?.id ?? "";
  profileForm.workdir.value = profile?.workdir ?? "";
  profileDialog.showModal();
}

profileForm.onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    id: editingId ?? uid(),
    name: profileForm.name.value.trim(),
    base_url: profileForm.base_url.value.trim().replace(/\/+$/, ""),
    api_key: profileForm.api_key.value.trim(),
    agent_id: profileForm.agent_id.value,
    workdir: profileForm.workdir.value.trim(),
  };
  if (editingId) {
    config.profiles = config.profiles.map((p) => (p.id === editingId ? data : p));
  } else {
    config.profiles.push(data);
  }
  await saveConfig();
  profileDialog.close();
  render();
};

$("btn-add").onclick = () => openProfileDialog(null);
$("profile-cancel").onclick = () => profileDialog.close();
$("toggle-key").onclick = () => {
  const k = profileForm.api_key;
  k.type = k.type === "password" ? "text" : "password";
};

// ---------- agents dialog ----------
function renderAgents() {
  agentsList.innerHTML = "";
  config.agents.forEach((a, i) => {
    const row = document.createElement("div");
    row.className = "agent-row";
    row.innerHTML = `
      <div class="agent-fields">
        <input class="a-name" placeholder="名称" value="${esc(a.name)}" />
        <input class="a-cmd" placeholder="启动命令" value="${esc(a.command)}" />
        <textarea class="a-env" rows="3" placeholder="ANTHROPIC_BASE_URL={base_url}\nANTHROPIC_AUTH_TOKEN={api_key}">${esc(
          Object.entries(a.env).map(([k, v]) => `${k}=${v}`).join("\n")
        )}</textarea>
      </div>
      <button class="ghost small danger a-del">删除</button>`;
    row.querySelector(".a-del").onclick = () => {
      config.agents.splice(i, 1);
      renderAgents();
    };
    agentsList.appendChild(row);
  });
}

$("btn-agents").onclick = () => {
  renderAgents();
  agentsDialog.showModal();
};
$("agent-new").onclick = () => {
  config.agents.push({ id: uid(), name: "", command: "", env: {} });
  renderAgents();
};
$("agents-close").onclick = () => {
  loadConfig(); // discard unsaved edits
  agentsDialog.close();
};
$("agents-save").onclick = async () => {
  const rows = agentsList.querySelectorAll(".agent-row");
  rows.forEach((row, i) => {
    const a = config.agents[i];
    a.name = row.querySelector(".a-name").value.trim();
    a.command = row.querySelector(".a-cmd").value.trim();
    a.env = {};
    for (const line of row.querySelector(".a-env").value.split("\n")) {
      const idx = line.indexOf("=");
      if (idx > 0) a.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  });
  config.agents = config.agents.filter((a) => a.name && a.command);
  await saveConfig();
  agentsDialog.close();
  render();
  toast("模板已保存");
};

loadConfig().catch((e) => toast(String(e), true));
