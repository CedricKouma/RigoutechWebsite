"use strict";

const fs = require("fs");
const path = require("path");
const { load } = require("./render-projets");

const root = path.join(__dirname, "..");
const pages = ["index.html", "projets.html"];
let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

const projets = load();
const ids = new Set();

for (const projet of projets) {
  if (ids.has(projet.id)) {
    fail(`Identifiant en double : ${projet.id}`);
  }

  ids.add(projet.id);

  for (const key of [
    "statut",
    "categorie",
    "titre",
    "periode",
    "texte",
    "cadre",
  ]) {
    if (!projet[key] || !String(projet[key]).trim()) {
      fail(`${projet.id} : champ vide « ${key} »`);
    }
  }

  if (projet.cadre === "schema" && !projet.visuel) {
    fail(`${projet.id} : schéma sans visuel`);
  }

  const visuelPath = projet.visuel
    ? path.join(root, projet.visuel.replace(/^\//, ""))
    : "";

  if (projet.visuel && !fs.existsSync(visuelPath)) {
    fail(`${projet.id} : visuel introuvable ${projet.visuel}`);
  }

  if (projet.repli) {
    const repliPath = path.join(root, projet.repli.replace(/^\//, ""));

    if (!fs.existsSync(repliPath)) {
      fail(`${projet.id} : repli introuvable ${projet.repli}`);
    }
  }

  if (!["En cours", "Prototype", "Terminé"].includes(projet.statut)) {
    fail(`${projet.id} : statut non prévu « ${projet.statut} »`);
  }
}

if (projets.length !== 5) {
  fail(`La liste vérifiée compte 5 projets, pas ${projets.length}.`);
}

function norm(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

for (const name of pages) {
  const file = path.join(root, name);
  const html = fs.readFileSync(file, "utf8");
  const flat = norm(html);
  const count = (html.match(/class="project"/g) || []).length;
  const expected = name === "projets.html" ? projets.length : 0;

  if (count !== expected) {
    fail(`${name} : ${count} fiches, ${expected} attendues.`);
  }

  for (const projet of projets) {
    for (const key of ["statut", "titre", "periode", "texte"]) {
      if (!flat.includes(norm(projet[key]))) {
        fail(`${name} : « ${projet[key]} » absent (${projet.id})`);
      }
    }

    const liens =
      Array.isArray(projet.liens) && projet.liens.length
        ? projet.liens
        : projet.href
          ? [{ href: projet.href }]
          : [];

    for (const lien of liens) {
      if (!html.includes(`href="${lien.href}"`)) {
        fail(`${name} : lien absent pour ${projet.id} (${lien.href})`);
      }
    }
  }
}

const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith(".html")) {
      htmlFiles.push(full);
    }
  }
}

walk(root);

const banned = [
  "excelsoins",
  "pointe-claire",
  "agentforge.ca",
  "ai act",
  "petite équipe",
  "notre équipe",
  "rigouhealth.rigoutech.com",
  "grand client",
];

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, "utf8");

  if (source.includes("\uFFFD")) {
    fail(`${file} : caractère de remplacement (accent illisible).`);
  }

  const text = source.toLowerCase();

  for (const needle of banned) {
    if (text.includes(needle)) {
      fail(`${file} : mention interdite « ${needle} »`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Inventaire vérifié : ${projets.length} projets.`);
