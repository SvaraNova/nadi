import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

const files = ["README.md", ...await markdownFiles("docs")];
const secretPattern = /(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|(?:api[_-]?key|password|secret)\s*[:=]\s*["']?[A-Za-z0-9_\-/+=]{12,})/i;
for (const file of files) {
  const content = await readFile(file, "utf8");
  if (secretPattern.test(content)) throw new Error(`Possible credential found in public content: ${file}`);
}
console.log(`Public-content check passed for ${files.length} files.`);
