const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'srs-app', 'src', 'App.jsx'),
  path.join(__dirname, 'srs-app', 'src', 'Login.jsx')
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace emerald and blue with brand-accent
  content = content.replace(/emerald-500/g, 'brand-accent');
  content = content.replace(/emerald-400/g, 'brand-accent');
  content = content.replace(/blue-500/g, 'brand-accent');
  content = content.replace(/blue-400/g, 'brand-accent');

  // Replace raw RGB values in shadows or gradients
  // rgb(16, 185, 129) -> rgb(255, 140, 104)
  content = content.replace(/16,\s*185,\s*129/g, '255,140,104');
  content = content.replace(/16,185,129/g, '255,140,104');
  // rgba(59,130,246) -> rgba(255,140,104)
  content = content.replace(/59,\s*130,\s*246/g, '255,140,104');
  content = content.replace(/59,130,246/g, '255,140,104');

  // Replace generic dark backgrounds
  content = content.replace(/bg-black/g, 'bg-brand-dark');
  content = content.replace(/bg-neutral-900\/50/g, 'bg-brand-base/90');
  content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-brand-base/40');

  // Replace raw Hex representations if any
  content = content.replace(/#10b981/ig, '#FF8C68'); // emerald-500

  fs.writeFileSync(file, content, 'utf8');
});

console.log("Colors successfully replaced.");
