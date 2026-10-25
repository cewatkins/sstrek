/**
 * Nitro bundles @electric-sql/pglite into the server function and then looks
 * for pglite.data / wasm next to that chunk. Copy them so the PGLite fallback
 * can boot in `vite preview` and on a deploy that has no DATABASE_URL yet.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, ".vercel/output/functions/__server.func/_libs");
if (!existsSync(dest)) {
  console.log("[pglite] server bundle not present, skip");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
const src = join(root, "node_modules/@electric-sql/pglite/dist");
for (const name of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  copyFileSync(join(src, name), join(dest, name));
}
console.log("[pglite] copied data + wasm next to the server bundle");
