import { readFile } from "node:fs/promises";
import { glob } from "node:fs";

const files = ["README.md", ...await new Promise((resolve, reject) => glob("docs/**/*.md", (error, matches) => error ? reject(error) : resolve(matches)))];
const secretPattern = /(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|(?:api[_-]?key|password|secret)\s*[:=]\s*["']?[A-Za-z0-9_\-/+=]{12,})/i;
for (const file of files) {
  const content = await readFile(file, "utf8");
  if (secretPattern.test(content)) throw new Error(`Possible credential found in public content: ${file}`);
}
console.log(`Public-content check passed for ${files.length} files.`);
