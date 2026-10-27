"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const pages = [
  "index.html",
  "projets.html",
  "services.html",
  "formation.html",
  "a-propos.html",
  "contact.html",
  "confidentialite.html",
  "en.html",
  "404.html",
  "produits.html",
  "rd.html",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  "favicon.ico",
  ".nojekyll",
];
const dirs = ["assets", "facturx"];
const forbidden = [
  "CNAME",
  "package.json",
  "package-lock.json",
  "AUDIT.md",
  "DESIGN-CRITIQUE.md",
  "data",
  "scripts",
  ".github",
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const name of pages) {
  fs.cpSync(path.join(root, name), path.join(dist, name));
}

for (const name of dirs) {
  fs.cpSync(path.join(root, name), path.join(dist, name), { recursive: true });
}

const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");

if (/audit\.md|design-critique|\/audit\//i.test(robots)) {
  throw new Error("robots.txt ne doit nommer aucune note interne.");
}

for (const name of forbidden) {
  if (fs.existsSync(path.join(dist, name))) {
    throw new Error(`dist/ ne doit pas contenir ${name}.`);
  }
}

console.log("Dossier dist/ construit (pages publiques et assets).");
