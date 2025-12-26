const fs = require('fs');
try {
    const pkg = require('vite/package.json');
    fs.writeFileSync('version.txt', 'Vite version: ' + pkg.version);
} catch (e) {
    fs.writeFileSync('version.txt', 'Error: ' + e.message);
}
