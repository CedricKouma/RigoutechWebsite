"use strict";

const fs = require("fs");
const path = require("path");

const roots = [process.cwd()];
const files = [];
const skipNames = new Set([
  "node_modules",
  ".git",
  "audit",
  "dist",
  "package.json",
  "package-lock.json",
]);
const extensions = new Set([".html", ".json", ".svg", ".xml", ".txt"]);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
    } else if (extensions.has(path.extname(entry.name))) {
      if (entry.name.endsWith(".txt") && entry.name !== "robots.txt") {
        continue;
      }

      files.push(full);
    }
  }
}

walk(roots[0]);

const needles = [
  "financé",
  "financee",
  "financée",
  "financement",
  "financed",
  "subvention",
  "rembours",
  "agré",
  "agree",
  "accredit",
  "subsid",
  "lorem",
  "ipsum",
  "témoignage",
  "testimonial",
  "notre équipe",
  "petite équipe",
  "années d'expérience",
  "années d’expérience",
  "years of experience",
  "partenaire microsoft",
  "microsoft partner",
  "partenariat",
  "partnership",
  "chum",
  "hôpital",
  "hopital",
  "hospital",
  "bootstrapmade",
  "ingénieur",
  "ingenieur",
  "ingénierie",
  "engineer",
  "déplacée",
  "deplacee",
  "plus en ligne",
  "grand client",
  "rigouhealth.rigoutech.com",
  "dépense admissible si inscrite",
  "2021 — aujourd",
  "2021 - aujourd",
  "toujours active",
  "still active",
  "continuent",
  "on construit, on automatise",
  "we train teams",
  "dirigé par",
  "tenu par",
  "fondé par",
  "led by",
  "founded by",
  "cipp",
  "mad-xr",
  "sacré-cœur",
  "sacré-coeur",
  "sacre-coeur",
  "pilote",
  "audit.md",
  "design-critique",
];

const bounded = [/\bcae\b/i, /\bhmr\b/i];

const phone =
  /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\b\d{3}\b)[\s.-]\d{3}[\s.-]\d{4}\b/;

let failed = false;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const lower = text.toLowerCase();

  for (const needle of needles) {
    if (lower.includes(needle)) {
      console.error(`${file}: formulation interdite « ${needle} »`);
      failed = true;
    }
  }

  for (const pattern of bounded) {
    if (pattern.test(text)) {
      console.error(`${file}: formulation interdite « ${pattern} »`);
      failed = true;
    }
  }

  if (phone.test(text)) {
    console.error(`${file}: numéro de téléphone`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `Formulations vérifiées dans ${files.length} fichiers HTML, JSON, SVG, sitemap et robots.txt.`,
);
