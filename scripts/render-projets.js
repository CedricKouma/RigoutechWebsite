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

function readUtf8(file) {
  const bytes = fs.readFileSync(file);
  let text;

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new Error(`${file} n'est pas encodé en UTF-8.`, { cause: error });
  }

  if (text.includes("\uFFFD")) {
    throw new Error(`${file} contient un caractère de remplacement.`);
  }

  return text.trim();
}

function schema(projet) {
  const file = path.join(root, projet.visuel.replace(/^\//, ""));
  const raw = readUtf8(file);
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

  if (projet.cadre !== "code") {
    return "";
  }

  return `<pre class="code"><code>validate_facturx_invoice
{
  "pdfBase64": "…",
  "xml": "…"
}</code></pre>
        <p class="note">Contrat d’entrée publié dans agentforge-facturx-mcp 0.1.0. La réponse vient de l’API. Elle n’est pas recopiée ici.</p>`;
}

function statutClass(statut) {
  if (statut === "En cours") {
    return "statut-encours";
  }

  if (statut === "Terminé") {
    return "statut-termine";
  }

  return "statut-prototype";
}

function linkList(projet) {
  const items =
    Array.isArray(projet.liens) && projet.liens.length
      ? projet.liens
      : projet.href
        ? [{ href: projet.href, lien: projet.lien }]
        : [];

  if (!items.length) {
    return "";
  }

  const lines = items
    .map(
      (item) =>
        `            <li><a href="${esc(item.href)}">${esc(item.lien)}</a></li>`,
    )
    .join("\n");

  return `<ul class="lien-liste">
${lines}
          </ul>`;
}

function preuve(projet) {
  if (!projet.preuve) {
    return "";
  }

  return `<div class="preuve"><p>${esc(projet.preuve)}</p></div>`;
}

function renderProject(projet, heading) {
  return `        <article class="project" id="${esc(projet.id)}" data-filtre="${esc(projet.filtre)}">
          <p class="project-meta">
            <span class="atelier">${esc(projet.atelier)}</span>
            <span class="statut ${statutClass(projet.statut)}">${esc(projet.statut)}</span>
            <span>${esc(projet.categorie)}</span>
            <span>${esc(projet.periode)}</span>
          </p>
          <${heading}>${esc(projet.titre)}</${heading}>
          <p>${esc(projet.texte)}</p>
          ${visual(projet)}
          ${preuve(projet)}
          ${linkList(projet)}
        </article>`;
}

function renderFrise(projet) {
  const body =
    projet.id === "agentforge"
      ? `<p><a href="#vitrine-agentforge">Voir l’extrait et les paquets</a></p>`
      : `<p>${esc(projet.texte)}</p>
          ${preuve(projet)}`;

  return `          <li class="frise-item" id="frise-${esc(projet.id)}">
            <p class="project-meta">
              <span class="atelier">${esc(projet.atelier)}</span>
              <span class="statut ${statutClass(projet.statut)}">${esc(projet.statut)}</span>
              <span class="frise-periode">${esc(projet.periode)}</span>
            </p>
            <h3>${esc(projet.titre)}</h3>
            ${body}
          </li>`;
}

function renderVitrine(projet) {
  return `        <article class="vitrine marque" id="vitrine-agentforge">
          <p class="project-meta">
            <span class="atelier">${esc(projet.atelier)}</span>
            <span class="statut ${statutClass(projet.statut)}">${esc(projet.statut)}</span>
            <span>${esc(projet.periode)}</span>
          </p>
          <h3>${esc(projet.titre)}</h3>
          <p>${esc(projet.texte)}</p>
          ${visual(projet)}
          ${linkList(projet)}
        </article>`;
}

function apply(html, projets) {
  let next = html.replace(
    /<!-- projets -->[\s\S]*?<!-- \/projets -->/,
    function () {
      const cards = projets
        .map((projet) => renderProject(projet, "h2"))
        .join("\n");

      return `<!-- projets -->\n${cards}\n        <!-- /projets -->`;
    },
  );

  const agentforge = projets.find((projet) => projet.id === "agentforge");
  const frise = projets
    .filter((projet) => projet.id !== "agentforge")
    .sort((a, b) => a.ordre - b.ordre)
    .map((projet) => renderFrise(projet))
    .join("\n");

  next = next.replace(
    /<!-- vitrine -->[\s\S]*?<!-- \/vitrine -->/,
    `<!-- vitrine -->\n${renderVitrine(agentforge)}\n        <!-- /vitrine -->`,
  );

  next = next.replace(
    /<!-- frise -->[\s\S]*?<!-- \/frise -->/,
    `<!-- frise -->\n${frise}\n          <!-- /frise -->`,
  );

  return next;
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

    if (file.endsWith("projets.html") && !after.includes('class="project"')) {
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

module.exports = { apply, load };
