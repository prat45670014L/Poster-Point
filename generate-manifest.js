// Scans images/PINTEREST IMAGES and regenerates images-manifest.js
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'images', 'PINTEREST IMAGES');
const outFile = path.join(__dirname, 'images-manifest.js');

function safeQuote(s){
  return '"' + s.replace(/"/g, '\\"') + '"';
}

const categories = fs.readdirSync(base, { withFileTypes:true }).filter(d=>d.isDirectory()).map(d=>d.name);
const manifest = {};
categories.forEach(cat=>{
  const dir = path.join(base, cat);
  const files = fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isFile());
  manifest[cat] = files;
});

let out = '// Auto-generated manifest by generate-manifest.js\nwindow.imageCatalog = {\n';
Object.keys(manifest).forEach(cat=>{
  out += `  ${safeQuote(cat)}: [\n`;
  manifest[cat].forEach(fname=>{
    out += `    ${safeQuote(fname)},\n`;
  });
  out += '  ],\n';
});
out += '};\n';

fs.writeFileSync(outFile, out, 'utf8');
console.log('Wrote', outFile);
