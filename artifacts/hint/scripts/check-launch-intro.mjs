import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(scriptDir, "../src/components/app/app-launch-intro.css");
const css = readFileSync(cssPath, "utf8");

const lockedTimings = [
  {
    selector: ".hint-launch-intro",
    values: {
      "--hint-launch-total": "2140ms",
      "--hint-launch-content-delay": "900ms",
      "--hint-launch-mark-start": "1120ms",
      "--hint-launch-spark-start": "1400ms",
      "--hint-launch-word-start": "1600ms",
    },
  },
  {
    selector: ".hint-launch-intro[data-first-launch=\"true\"]",
    values: {
      "--hint-launch-total": "2820ms",
      "--hint-launch-content-delay": "1180ms",
      "--hint-launch-mark-start": "1480ms",
      "--hint-launch-spark-start": "1820ms",
      "--hint-launch-word-start": "2140ms",
    },
  },
  {
    selector: ".hint-launch-intro[data-preview=\"true\"]",
    values: {
      "--hint-launch-total": "4680ms",
      "--hint-launch-content-delay": "2180ms",
      "--hint-launch-mark-start": "2700ms",
      "--hint-launch-spark-start": "3200ms",
      "--hint-launch-word-start": "3580ms",
    },
  },
];

function readBlock(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, "m"));
  if (!match) {
    throw new Error(`Missing locked launch intro selector: ${selector}`);
  }
  return match[1];
}

function readCssVar(block, name) {
  const match = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : null;
}

const failures = [];

for (const { selector, values } of lockedTimings) {
  const block = readBlock(selector);
  for (const [name, expected] of Object.entries(values)) {
    const actual = readCssVar(block, name);
    if (actual !== expected) {
      failures.push(`${selector} ${name}: expected ${expected}, got ${actual ?? "missing"}`);
    }
  }
}

if (failures.length) {
  console.error("Launch intro timing lock failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("If this is intentional, update scripts/check-launch-intro.mjs with the approved timing.");
  process.exit(1);
}
