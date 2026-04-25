const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

function findTsxFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTsxFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Replace text-white (with optional opacity modifier) with text-foreground
  // Use negative lookbehind/lookahead to avoid replacing partial matches inside other class names
  content = content.replace(/(?<![a-zA-Z0-9-])text-white(?![a-zA-Z0-9-])/g, 'text-foreground');

  // Replace bg-black (with optional opacity modifier) with bg-noctvm-black
  content = content.replace(/(?<![a-zA-Z0-9-])bg-black(?![a-zA-Z0-9-])/g, 'bg-noctvm-black');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${path.relative(__dirname, filePath)}`);
    return true;
  }
  return false;
}

const files = findTsxFiles(SRC_DIR);
let updatedCount = 0;

for (const file of files) {
  if (processFile(file)) {
    updatedCount++;
  }
}

console.log(`\nDone. Updated ${updatedCount} files.`);
