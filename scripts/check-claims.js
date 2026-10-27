"use strict";

const fs = require("fs");
const path = require("path");

const roots = [process.cwd()];
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "audit"
    ) {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith(".html")) {
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
];

let failed = false;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8").toLowerCase();

  for (const needle of needles) {
    if (text.includes(needle)) {
      console.error(`${file}: formulation interdite « ${needle} »`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Formulations vérifiées dans ${files.length} fichiers HTML.`);
