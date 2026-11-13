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
  { path: "000", label: "Pradědeček", generation: 3 },
  { path: "001", label: "Prababička", generation: 3 },
  { path: "010", label: "Pradědeček", generation: 3 },
  { path: "011", label: "Prababička", generation: 3 },
  { path: "100", label: "Pradědeček", generation: 3 },
  { path: "101", label: "Prababička", generation: 3 },
  { path: "110", label: "Pradědeček", generation: 3 },
  { path: "111", label: "Prababička", generation: 3 }
];

const formContainer = document.querySelector("#people-form");
const form = document.querySelector("#family-form");
const emptyState = document.querySelector("#empty-state");
const treeContainer = document.querySelector("#tree-container");
const treeCanvas = document.querySelector("#tree-canvas");
const downloadButton = document.querySelector("#download-button");
const treeStatus = document.querySelector("#tree-status");

let currentLayout = "vertical";
let currentSvg = "";

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
    const name = form.elements[`name-${key}`].value.trim();
    const profession = form.elements[`profession-${key}`].value.trim();

    data[key] = {
      path: person.path,
      label: person.label,
      name: name || "Neznámý člen",
      profession
    };
  }
  return data;
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, char => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
  })[char]);
}

function nodePosition(path, layout) {
  const depth = path.length;
  const index = depth === 0 ? 0 : parseInt(path, 2);
  const leaves = 2 ** MAX_GENERATION;
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

function renderTree(data, layout) {
  const positions = {};
  for (const person of people) {
    positions[person.path] = nodePosition(person.path, layout);
  }

  const width = layout === "vertical"
    ? 2 ** MAX_GENERATION * SLOT_WIDTH
    : (MAX_GENERATION + 1) * LEVEL_GAP + NODE_WIDTH;
  const height = layout === "vertical"
    ? (MAX_GENERATION + 1) * LEVEL_GAP
    : 2 ** MAX_GENERATION * SLOT_WIDTH;

  const lines = [];
  for (const person of people) {
    if (person.path.length === MAX_GENERATION) continue;

    const child = positions[person.path];
    for (const suffix of ["0", "1"]) {
      const ancestorPath = person.path + suffix;
      const ancestor = positions[ancestorPath];

      if (layout === "vertical") {
        lines.push(`<path d="M ${child.x + NODE_WIDTH / 2} ${child.y} L ${ancestor.x + NODE_WIDTH / 2} ${ancestor.y + NODE_HEIGHT}" />`);
      } else {
        lines.push(`<path d="M ${child.x + NODE_WIDTH} ${child.y + NODE_HEIGHT / 2} L ${ancestor.x} ${ancestor.y + NODE_HEIGHT / 2}" />`);
      }
    }
  }

  const nodes = people.map(person => {
    const pos = positions[person.path];
    const item = data[person.path || "self"];
    const name = escapeXml(item.name);
    const profession = escapeXml(item.profession || "Profese neuvedena");
    const title = escapeXml(person.label);

    return `
      <g transform="translate(${pos.x}, ${pos.y})">
        <rect width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="9"
          fill="${person.generation === 0 ? "#34251d" : "#20242b"}"
          stroke="${person.generation === 0 ? "#e58a50" : "#454b56"}"
          stroke-width="${person.generation === 0 ? 1.8 : 1}" />
        <text x="12" y="17" fill="#e58a50" font-size="8" font-weight="700" letter-spacing=".8">${title.toUpperCase()}</text>
        <text x="12" y="37" fill="#f2f1ed" font-size="12" font-weight="700">${name.length > 22 ? name.slice(0, 21) + "…" : name}</text>
        <text x="12" y="53" fill="#a3a9b3" font-size="9">${profession.length > 27 ? profession.slice(0, 26) + "…" : profession}</text>
      </g>`;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Vygenerovaný rodokmen">
      <rect width="100%" height="100%" fill="#121417"/>
      <g fill="none" stroke="#626b78" stroke-width="1.5" stroke-linecap="round">${lines.join("")}</g>
      ${nodes}
    </svg>`;

  return svg;
}

function showTree() {
  const data = readFamilyData();
  currentSvg = renderTree(data, currentLayout);
  treeCanvas.innerHTML = currentSvg;
  emptyState.classList.add("hidden");
  treeContainer.classList.remove("hidden");
  downloadButton.disabled = false;

  const filled = Object.values(data).filter(person => person.name !== "Neznámý člen").length;
  treeStatus.textContent = `Rodokmen vytvořen · vyplněno ${filled} z 15 osob`;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  showTree();
});

form.addEventListener("reset", () => {
  currentSvg = "";
  treeCanvas.innerHTML = "";
  treeContainer.classList.add("hidden");
  emptyState.classList.remove("hidden");
  downloadButton.disabled = true;
  treeStatus.textContent = "Zatím nebyl vytvořen žádný rodokmen.";
});

document.querySelectorAll(".view-button").forEach(button => {
  button.addEventListener("click", () => {
    currentLayout = button.dataset.layout;
    document.querySelectorAll(".view-button").forEach(item => {
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
