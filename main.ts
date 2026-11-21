// Cover Studio — build entrypoint.
//
// `node main.ts` assembles the static app into out/:
//   index.html, style.css, app.js, sample.js and samples/
// Open out/index.html in a desktop browser to use it.
// No dependencies, no network, no build step beyond this file.
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root: string = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir: string = join(root, "out");

const staticFiles: string[] = ["index.html", "style.css", "app.js", "sample.js"];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let total: number = 0;
for (const f of staticFiles) {
  cpSync(join(root, f), join(outDir, f));
  const bytes: number = statSync(join(outDir, f)).size;
  total += bytes;
  console.log(`  ${f} — ${bytes.toLocaleString("en-US")} bytes`);
}

const samplesDir: string = join(outDir, "samples");
mkdirSync(samplesDir, { recursive: true });
for (const f of readdirSync(join(root, "samples"))) {
  cpSync(join(root, "samples", f), join(samplesDir, f));
  const bytes: number = statSync(join(samplesDir, f)).size;
  total += bytes;
  console.log(`  samples/${f} — ${bytes.toLocaleString("en-US")} bytes`);
}

console.log(`Cover Studio built → ${outDir} (${total.toLocaleString("en-US")} bytes total)`);
console.log("Open out/index.html in a desktop browser.");
