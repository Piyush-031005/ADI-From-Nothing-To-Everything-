const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/src/style.css">');
fs.writeFileSync('index.html', html);
console.log('Done');
