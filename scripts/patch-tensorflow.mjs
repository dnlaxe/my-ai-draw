import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const converterRoot = path.join(
  root,
  "node_modules/@tensorflow/tfjs-converter/dist",
);

if (!fs.existsSync(converterRoot)) {
  process.exit(0);
}

const queue = [converterRoot];

while (queue.length > 0) {
  const current = queue.pop();
  if (!current) continue;

  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      queue.push(fullPath);
      continue;
    }

    if (!entry.name.endsWith(".js") || entry.name.endsWith(".min.js")) {
      continue;
    }

    const source = fs.readFileSync(fullPath, "utf8");
    if (!source.includes("import(")) continue;

    const patched = source
      .replace(/\basync import\(/g, "async importHashTable(")
      .replace(/\.import\(/g, ".importHashTable(");

    if (patched !== source) {
      fs.writeFileSync(fullPath, patched);
    }
  }
}

console.log("Patched TensorFlow converter sources for Vite dev compatibility.");
