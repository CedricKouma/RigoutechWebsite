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

  for (const key of ["statut", "categorie", "titre", "periode", "texte"]) {
    if (!projet[key] || !String(projet[key]).trim()) {
      fail(`${projet.id} : champ vide « ${key} »`);
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

  if (count !== projets.length) {
    fail(
      `${name} : ${count} fiches, ${projets.length} dans le fichier de données.`,
    );
  }

  for (const projet of projets) {
    for (const key of ["statut", "titre", "periode", "texte"]) {
      if (!flat.includes(norm(projet[key]))) {
        fail(`${name} : « ${projet[key]} » absent (${projet.id})`);
      }
    }

    if (projet.href && !html.includes(`href="${projet.href}"`)) {
      fail(`${name} : lien absent pour ${projet.id}`);
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
];

for (const file of htmlFiles) {
  const text = fs.readFileSync(file, "utf8").toLowerCase();

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
