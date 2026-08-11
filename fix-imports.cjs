const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./backend').concat(['./server.ts']);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Simple regex to match local imports like import { x } from './y' or '../y'
  const replaced = content.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, (match, p1, p2, p3) => {
    if (p2.endsWith('.js') || p2.endsWith('.ts') || p2.endsWith('.css') || p2.endsWith('.png')) {
      return match;
    }
    return `${p1}${p2}.js${p3}`;
  });
  
  if (content !== replaced) {
    fs.writeFileSync(file, replaced);
    console.log('Fixed', file);
  }
});
