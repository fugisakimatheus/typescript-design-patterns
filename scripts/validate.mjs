import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const skillFile = join(rootDir, 'skills/typescript-design-patterns/SKILL.md');
const refDir = join(rootDir, 'skills/typescript-design-patterns/references');

console.log('🔍 Validating typescript-design-patterns skill...');

if (!existsSync(skillFile)) {
  console.error(`❌ SKILL.md not found at ${skillFile}`);
  process.exit(1);
}

const skillContent = readFileSync(skillFile, 'utf8');
if (!skillContent.startsWith('---')) {
  console.error('❌ SKILL.md must start with YAML frontmatter delimiter (---)');
  process.exit(1);
}

if (!skillContent.includes('name: typescript-design-patterns')) {
  console.error("❌ SKILL.md missing 'name: typescript-design-patterns'");
  process.exit(1);
}

if (!skillContent.includes('description:')) {
  console.error("❌ SKILL.md missing 'description'");
  process.exit(1);
}

const refFiles = readdirSync(refDir).filter((f) => f.endsWith('.md'));
if (refFiles.length !== 24) {
  console.error(`❌ Expected 24 reference files, found ${refFiles.length}`);
  process.exit(1);
}

console.log(`✅ Frontmatter and file structure valid!`);
console.log(`✅ 24 design pattern reference files found.`);
