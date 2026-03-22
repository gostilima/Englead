const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith('.html')) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

const targetDir = path.join(__dirname, 'materiais');

walkSync(targetDir, function(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/background-color:\s*#000;/g, 'background-color: #042A35;');
    content = content.replace(/background:\s*#000/g, 'background: #042A35');
    content = content.replace(/#10b981/ig, '#FF8C68');
    content = content.replace(/16,\s*185,\s*129/g, '255, 140, 104');
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log("HTML Materials successfully updated to EngLeap colors.");
