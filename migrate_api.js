const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.js')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/api');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/import getDb from '@\/lib\/db';/g, "import { query } from '@/lib/db';");
  content = content.replace(/const db = getDb\(\);\n/g, "");
  content = content.replace(/const db = getDb\(\);/g, "");
  
  // 1. db.prepare('...').all()
  content = content.replace(/db\.prepare\((['`][\s\S]*?['`])\)\.all\(\)/g, "(await query($1)).rows");
  // 2. db.prepare('...').all(args)
  content = content.replace(/db\.prepare\((['`][\s\S]*?['`])\)\.all\(([\s\S]+?)\)/g, "(await query($1, [$2])).rows");
  
  // 3. db.prepare('...').get()
  content = content.replace(/db\.prepare\((['`][\s\S]*?['`])\)\.get\(\)/g, "(await query($1)).rows[0]");
  // 4. db.prepare('...').get(args)
  content = content.replace(/db\.prepare\((['`][\s\S]*?['`])\)\.get\(([\s\S]+?)\)/g, "(await query($1, [$2])).rows[0]");
  
  // 5. db.prepare('...').run(args)
  content = content.replace(/db\.prepare\((['`][\s\S]*?['`])\)\.run\(([\s\S]*?)\)/g, "await query($1, [$2])");
  
  // 6. const stmt = db.prepare('...'); stmt.run(args);
  content = content.replace(/const stmt = db\.prepare\((['`][\s\S]*?['`])\);\s*stmt\.run\(([\s\S]*?)\);/g, "await query($1, [$2]);");
  
  // Handle empty array for run() if args was empty
  content = content.replace(/await query\((['`][\s\S]*?['`]), \[\]\)/g, "await query($1)");

  // Transaction for stocktakes etc.
  content = content.replace(/const insertStmt = db\.prepare\((['`][\s\S]*?['`])\);\s*const transaction = db\.transaction\(\(\s*\)\s*=>\s*\{\s*for\s*\(\s*const\s+(.+?)\s+of\s+(.+?)\s*\)\s*\{\s*insertStmt\.run\(([\s\S]*?)\);\s*\}\s*\}\);\s*transaction\(\);/g, 
    "for (const $2 of $3) { await query($1, [$4]); }");

  fs.writeFileSync(file, content, 'utf8');
});
console.log('Migration complete.');
