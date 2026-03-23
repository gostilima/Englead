const fs = require('fs');
const path = require('path');

const MATERIAIS_DIR = path.join(__dirname, 'srs-app', 'public', 'materiais');
const OUTPUT_FILE = path.join(__dirname, 'srs-app', 'src', 'database.json');

try {
  const folders = fs.readdirSync(MATERIAIS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const folderPath = path.join(MATERIAIS_DIR, dirent.name);
      const files = fs.readdirSync(folderPath).filter(file => fs.statSync(path.join(folderPath, file)).isFile());
      return {
        id: dirent.name,
        name: dirent.name,
        files: files.map(f => ({
          name: f,
          path: `materiais/${dirent.name}/${f}`,
          type: path.extname(f).slice(1)
        }))
      };
    });

  // Sort folders naturally
  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(folders, null, 2));
  console.log('Database generated with ' + folders.length + ' folders.');
} catch (err) {
  console.error('Error generating database:', err);
}
