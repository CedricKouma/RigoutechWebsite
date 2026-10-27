"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataPath = path.join(root, "data", "projets.json");
const targets = [
  path.join(root, "index.html"),
  path.join(root, "projets.html"),
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderProject(projet, heading) {
  const link = projet.href
    ? `<p><a href="${esc(projet.href)}">${esc(projet.lien)}</a></p>`
    : "";

  return `        <article class="project" id="${esc(projet.id)}">
          <p class="project-meta">
            <span class="statut">${esc(projet.statut)}</span>
            <span>${esc(projet.categorie)}</span>
            <span>${esc(projet.periode)}</span>
          </p>
          <div class="project-body">
            <${heading}>${esc(projet.titre)}</${heading}>
            <p>${esc(projet.texte)}</p>
            ${link}
          </div>
        </article>`;
}

function renderList(projets, heading) {
  return projets.map((projet) => renderProject(projet, heading)).join("\n");
}

function apply(html, projets) {
  return html.replace(
    /<div class="project-list" data-heading="(h[23])">[\s\S]*?<\/div>/g,
    function (_match, heading) {
      return `<div class="project-list" data-heading="${heading}">\n${renderList(projets, heading)}\n        </div>`;
    },
  );
}

function load() {
  const parsed = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  if (!Array.isArray(parsed.projets) || parsed.projets.length === 0) {
    throw new Error("data/projets.json ne contient aucun projet.");
  }

  return parsed.projets;
}

function main() {
  const projets = load();
  let changed = 0;

  for (const file of targets) {
    const before = fs.readFileSync(file, "utf8");
    const after = apply(before, projets);

    if (!after.includes('class="project"')) {
      throw new Error(`Aucun conteneur .project-list dans ${file}`);
    }

    if (after !== before) {
      fs.writeFileSync(file, after);
      changed += 1;
    }
  }

  console.log(
    changed === 0
      ? "Projets déjà à jour."
      : `Projets écrits dans ${changed} page(s).`,
  );
}

if (require.main === module) {
  main();
}

module.exports = { apply, load, renderList };
