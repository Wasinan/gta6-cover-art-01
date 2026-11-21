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

for (const f of staticFiles) {
  cpSync(join(root, f), join(outDir, f));
}
cpSync(join(root, "samples"), join(outDir, "samples"), { recursive: true });

const sampleNames: string[] = readdirSync(join(outDir, "samples"));
let totalBytes = 0;
for (const f of staticFiles) totalBytes += statSync(join(outDir, f)).size;
for (const f of sampleNames) totalBytes += statSync(join(outDir, "samples", f)).size;

console.log(`Cover Studio built -> ${outDir}`);
console.log(`Files: ${staticFiles.join(", ")} + samples/ (${sampleNames.length} images), ${totalBytes} bytes total`);
console.log("Open out/index.html in a browser to use it.");
