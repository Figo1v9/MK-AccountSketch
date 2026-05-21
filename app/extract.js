import fs from 'fs';

const content = fs.readFileSync('src/core/modules.ts', 'utf-8');

// Match any string literal containing Arabic characters
const arabicStringRegex = /'([^'\\]*(?:\\.[^'\\]*)*[\u0600-\u06FF]+[^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*[\u0600-\u06FF]+[^`\\]*(?:\\.[^`\\]*)*)`/g;

const matches = new Set();
let match;
while ((match = arabicStringRegex.exec(content)) !== null) {
    const str = match[1] || match[2];
    matches.add(str);
}

fs.writeFileSync('arabic_strings.json', JSON.stringify(Array.from(matches), null, 2));
console.log(`Extracted ${matches.size} unique Arabic strings.`);
