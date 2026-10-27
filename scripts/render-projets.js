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

function schema(projet) {
  const file = path.join(root, projet.visuel.replace(/^\//, ""));
  const raw = fs.readFileSync(file, "utf8").trim();
  const openEnd = raw.indexOf(">");
  const titleId = `${projet.id}-visuel`;
  const open = raw
    .slice(0, openEnd)
    .replace(/\srole="img"/, "")
    .replace("<svg", `<svg role="img" aria-labelledby="${titleId}"`);
  const body = raw.slice(openEnd + 1).replace(/<title>[\s\S]*?<\/title>/, "");

  return `${open}>
            <title id="${titleId}">${esc(projet.visuelAlt)}</title>
            ${body}`;
}

function visual(projet) {
  if (projet.cadre === "schema") {
    return `<figure class="visual visual-schema">
          ${schema(projet)}
        </figure>`;
  }

  const size = `width="${esc(projet.largeur)}" height="${esc(projet.hauteur)}"`;
  const img = projet.repli
    ? `<picture>
            <source srcset="${esc(projet.visuel)}" type="image/webp" />
            <img src="${esc(projet.repli)}" alt="${esc(projet.visuelAlt)}" ${size} />
          </picture>`
    : `<img src="${esc(projet.visuel)}" alt="${esc(projet.visuelAlt)}" ${size} />`;
  const bar = projet.barre
    ? `<p class="visual-bar"><span>${esc(projet.barre)}</span></p>`
    : "";

  return `<figure class="visual visual-${esc(projet.cadre)}">
          ${bar}
          ${img}
        </figure>`;
}

function renderProject(projet, heading) {
  const link = projet.href
    ? `<p><a href="${esc(projet.href)}">${esc(projet.lien)}</a></p>`
    : "";

  return `        <article class="project span-${esc(projet.span)}" id="${esc(projet.id)}">
          ${visual(projet)}
          <div class="project-copy">
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
          </div>
        </article>`;
}

function renderList(projets, heading) {
  return projets.map((projet) => renderProject(projet, heading)).join("\n");
}

function apply(html, projets) {
  return html.replace(
    /(<div\s+class="([^"]*project-list[^"]*)"\s+data-heading="(h[23])"\s+data-order="(vedette|liste)"\s*>)\s*<!-- projets -->[\s\S]*?<!-- \/projets -->/g,
    function (_match, open, _className, heading, order) {
      const list =
        order === "vedette"
          ? projets.slice().sort((a, b) => a.vedette - b.vedette)
          : projets;

      return `${open}\n        <!-- projets -->\n${renderList(list, heading)}\n        <!-- /projets -->`;
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

    if (!after.includes('class="project ')) {
      throw new Error(`Aucun projet rendu dans ${file}`);
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
