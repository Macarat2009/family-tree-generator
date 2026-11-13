const MAX_GENERATION = 3; // 0 = já, 1 = rodiče, 2 = prarodiče, 3 = praprarodiče
const NODE_WIDTH = 178;
const NODE_HEIGHT = 66;
const SLOT_WIDTH = 210;
const LEVEL_GAP = 145;

const people = [
  { path: "", label: "Já", generation: 0 },
  { path: "0", label: "Otec", generation: 1 },
  { path: "1", label: "Matka", generation: 1 },
  { path: "00", label: "Dědeček (otcova strana)", generation: 2 },
  { path: "01", label: "Babička (otcova strana)", generation: 2 },
  { path: "10", label: "Dědeček (matčina strana)", generation: 2 },
  { path: "11", label: "Babička (matčina strana)", generation: 2 },
  { path: "000", label: "Pradědeček (otcův dědeček)", generation: 3 },
  { path: "001", label: "Prababička (otcův dědeček)", generation: 3 },
  { path: "010", label: "Pradědeček (otcova babička)", generation: 3 },
  { path: "011", label: "Prababička (otcova babička)", generation: 3 },
  { path: "100", label: "Pradědeček (matčin dědeček)", generation: 3 },
  { path: "101", label: "Prababička (matčin dědeček)", generation: 3 },
  { path: "110", label: "Pradědeček (matčina babička)", generation: 3 },
  { path: "111", label: "Prababička (matčina babička)", generation: 3 }
];

const formContainer = document.querySelector("#people-form");
const form = document.querySelector("#family-form");
const emptyState = document.querySelector("#empty-state");
const treeContainer = document.querySelector("#tree-container");
const treeCanvas = document.querySelector("#tree-canvas");
const downloadButton = document.querySelector("#download-button");
const treeStatus = document.querySelector("#tree-status");

let currentLayout = "vertical";
let currentTheme = "dark";
let currentSvg = "";

const themes = {
  dark: {
    background: "#121417",
    card: "#20242b",
    selfCard: "#34251d",
    border: "#454b56",
    selfBorder: "#e58a50",
    title: "#e58a50",
    text: "#f2f1ed",
    muted: "#a3a9b3",
    line: "#626b78"
  },
  light: {
    background: "#f4f2ed",
    card: "#ffffff",
    selfCard: "#fff0e4",
    border: "#d4d0c8",
    selfBorder: "#c66b32",
    title: "#a94f1e",
    text: "#292722",
    muted: "#77736b",
    line: "#aaa49a"
  }
};

function createForm() {
  formContainer.innerHTML = people.map((person, index) => `
    <article class="person-card ${person.generation === 0 ? "self" : ""}">
      <div class="person-title">
        <span class="person-number">${String(index + 1).padStart(2, "0")}</span>
        <span>${person.label}</span>
      </div>
      <div class="field-row">
        <input
          type="text"
          name="name-${person.path || "self"}"
          placeholder="Jméno a příjmení"
          aria-label="${person.label} – jméno a příjmení"
          ${person.generation === 0 ? "required" : ""}
        >
        <input
          type="text"
          name="profession-${person.path || "self"}"
          placeholder="Profese"
          aria-label="${person.label} – profese"
        >
      </div>
    </article>
  `).join("");
}

function readFamilyData() {
  const data = {};
  for (const person of people) {
    const key = person.path || "self";
    data[key] = {
      path: person.path,
      label: person.label,
      name: form.elements[`name-${key}`].value.trim(),
      profession: form.elements[`profession-${key}`].value.trim()
    };
  }
  return data;
}

// Předek se zobrazí pouze tehdy, pokud jsou vyplnění všichni členové
// mezi ním a výchozí osobou. Tím nevznikají odpojené větve rodokmenu.
function getVisiblePeople(data) {
  return people.filter(person => {
    const key = person.path || "self";
    if (!data[key].name) return false;

    for (let length = 0; length < person.path.length; length++) {
      const parentPath = person.path.slice(0, length);
      const parentKey = parentPath || "self";
      if (!data[parentKey]?.name) return false;
    }
    return true;
  });
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, char => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
  })[char]);
}

function nodePosition(path, layout) {
  const depth = path.length;
  const index = depth === 0 ? 0 : parseInt(path, 2);
  const span = 2 ** (MAX_GENERATION - depth);
  const center = (index * span + span / 2) * SLOT_WIDTH;

  if (layout === "vertical") {
    return {
      x: center - NODE_WIDTH / 2,
      y: (MAX_GENERATION - depth) * LEVEL_GAP
    };
  }

  return {
    x: (MAX_GENERATION - depth) * LEVEL_GAP,
    y: center - NODE_HEIGHT / 2
  };
}

function renderTree(data, layout, themeName) {
  const theme = themes[themeName];
  const visiblePeople = getVisiblePeople(data);
  const positions = {};

  for (const person of visiblePeople) {
    positions[person.path] = nodePosition(person.path, layout);
  }

  const width = layout === "vertical"
    ? 2 ** MAX_GENERATION * SLOT_WIDTH
    : (MAX_GENERATION + 1) * LEVEL_GAP + NODE_WIDTH;
  const height = layout === "vertical"
    ? (MAX_GENERATION + 1) * LEVEL_GAP
    : 2 ** MAX_GENERATION * SLOT_WIDTH;

  const lines = [];
  for (const person of visiblePeople) {
    if (!person.path) continue;

    const parentPath = person.path.slice(0, -1);
    if (!positions[parentPath]) continue;

    const parent = positions[parentPath];
    const ancestor = positions[person.path];

    if (layout === "vertical") {
      lines.push(`<path d="M ${parent.x + NODE_WIDTH / 2} ${parent.y} L ${ancestor.x + NODE_WIDTH / 2} ${ancestor.y + NODE_HEIGHT}" />`);
    } else {
      lines.push(`<path d="M ${parent.x + NODE_WIDTH} ${parent.y + NODE_HEIGHT / 2} L ${ancestor.x} ${ancestor.y + NODE_HEIGHT / 2}" />`);
    }
  }

  const nodes = visiblePeople.map(person => {
    const pos = positions[person.path];
    const item = data[person.path || "self"];
    const name = escapeXml(item.name);
    const profession = escapeXml(item.profession || "Profese neuvedena");
    const title = escapeXml(person.label);
    const isSelf = person.generation === 0;

    return `
      <g transform="translate(${pos.x}, ${pos.y})">
        <rect width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="9"
          fill="${isSelf ? theme.selfCard : theme.card}"
          stroke="${isSelf ? theme.selfBorder : theme.border}"
          stroke-width="${isSelf ? 1.8 : 1}" />
        <text x="12" y="17" fill="${theme.title}" font-size="8" font-weight="700" letter-spacing=".4">${title}</text>
        <text x="12" y="37" fill="${theme.text}" font-size="12" font-weight="700">${name.length > 22 ? name.slice(0, 21) + "…" : name}</text>
        <text x="12" y="53" fill="${theme.muted}" font-size="9">${profession.length > 27 ? profession.slice(0, 26) + "…" : profession}</text>
      </g>`;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Vygenerovaný rodokmen">
      <rect width="100%" height="100%" fill="${theme.background}"/>
      <g fill="none" stroke="${theme.line}" stroke-width="1.5" stroke-linecap="round">${lines.join("")}</g>
      ${nodes}
    </svg>`;
}

function showTree() {
  const data = readFamilyData();

  if (!data.self.name) {
    form.elements["name-self"].focus();
    treeStatus.textContent = "Nejdřív vyplň své jméno.";
    return;
  }

  const visiblePeople = getVisiblePeople(data);
  currentSvg = renderTree(data, currentLayout, currentTheme);
  treeCanvas.innerHTML = currentSvg;
  treeContainer.classList.toggle("theme-light", currentTheme === "light");
  treeContainer.classList.toggle("theme-dark", currentTheme === "dark");
  emptyState.classList.add("hidden");
  treeContainer.classList.remove("hidden");
  downloadButton.disabled = false;

  const omitted = 15 - visiblePeople.length;
  treeStatus.textContent = `Rodokmen vytvořen · zobrazeno ${visiblePeople.length} z 15 osob${omitted ? ` · vynecháno ${omitted} nevyplněných nebo nenavazujících osob` : ""}`;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  showTree();
});

form.addEventListener("reset", () => {
  currentSvg = "";
  treeCanvas.innerHTML = "";
  treeContainer.classList.add("hidden");
  treeContainer.classList.remove("theme-light", "theme-dark");
  emptyState.classList.remove("hidden");
  downloadButton.disabled = true;
  treeStatus.textContent = "Zatím nebyl vytvořen žádný rodokmen.";
});

document.querySelectorAll(".view-button[data-layout]").forEach(button => {
  button.addEventListener("click", () => {
    currentLayout = button.dataset.layout;
    document.querySelectorAll(".view-button[data-layout]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    if (currentSvg) showTree();
  });
});

document.querySelectorAll(".view-button[data-theme]").forEach(button => {
  button.addEventListener("click", () => {
    currentTheme = button.dataset.theme;
    document.querySelectorAll(".view-button[data-theme]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    if (currentSvg) showTree();
  });
});

downloadButton.addEventListener("click", () => {
  if (!currentSvg) return;

  const blob = new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "muj-rodokmen.svg";
  link.click();
  URL.revokeObjectURL(url);
});

createForm();
