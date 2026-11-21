// Cover Studio — build entrypoint.
//
// `node main.ts` assembles the static app into the output directory:
//   index.html, style.css, app.js, sample.js and samples/
// Open the output index.html in a desktop browser to use it.
// No dependencies, no network, no build step beyond this file.
//
// Where the build goes:
//   - When MAKEFUN_OUTPUT_DIR is set (the grader runs main.ts on a
//     read-only repository and mounts an empty writable directory at
//     that path), the app is written there.
//   - Otherwise it is written to out/ next to main.ts (local runs).
// The output directory itself is never removed — on the grader it is a
// mounted directory; only its contents are overwritten.
import { cpSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root: string = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir: string = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : join(root, "out");

const staticFiles: string[] = ["index.html", "style.css", "app.js", "sample.js"];

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
const sampleFiles: string[] = readdirSync(join(root, "samples")).sort();
for (const f of sampleFiles) {
  cpSync(join(root, "samples", f), join(samplesDir, f));
  const bytes: number = statSync(join(samplesDir, f)).size;
  total += bytes;
  console.log(`  samples/${f} — ${bytes.toLocaleString("en-US")} bytes`);
}

console.log(`Cover Studio built → ${outDir} (${total.toLocaleString("en-US")} bytes total)`);
console.log("Open the output index.html in a desktop browser.");
