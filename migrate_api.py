import os, re

d = 'src/app/api'
for root, _, files in os.walk(d):
    for f in files:
        if f.endswith('.js'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as file:
                content = file.read()
            
            content = content.replace("import getDb from '@/lib/db';", "import { query } from '@/lib/db';")
            content = content.replace("const db = getDb();\n", "")
            content = content.replace("const db = getDb();", "")
            
            # Match db.prepare(SQL) where SQL might be multiple lines or contain inner parentheses.
            # Using a simpler string-based approach or carefully crafted regex.
            
            # 1. db.prepare('...').all()
            content = re.sub(r"db\.prepare\((['`].*?['`])\)\.all\(\)", r"(await query(\1)).rows", content, flags=re.DOTALL)
            # 2. db.prepare('...').all(args)
            content = re.sub(r"db\.prepare\((['`].*?['`])\)\.all\((.+?)\)", r"(await query(\1, [\2])).rows", content, flags=re.DOTALL)
            
            # 3. db.prepare('...').get()
            content = re.sub(r"db\.prepare\((['`].*?['`])\)\.get\(\)", r"(await query(\1)).rows[0]", content, flags=re.DOTALL)
            # 4. db.prepare('...').get(args)
            content = re.sub(r"db\.prepare\((['`].*?['`])\)\.get\((.+?)\)", r"(await query(\1, [\2])).rows[0]", content, flags=re.DOTALL)
            
            # 5. db.prepare('...').run(args)
            content = re.sub(r"db\.prepare\((['`].*?['`])\)\.run\((.*?)\)", r"await query(\1, [\2])", content, flags=re.DOTALL)
            
            # 6. const stmt = db.prepare('...'); stmt.run(args);
            content = re.sub(r"const stmt = db\.prepare\((['`].*?['`])\);[\s\n]*stmt\.run\((.*?)\);", r"await query(\1, [\2]);", content, flags=re.DOTALL)
            
            # Handle empty array for run() if args was empty
            content = content.replace("await query(SQL, [])", "await query(SQL)")

            # transaction handling
            content = re.sub(r"const insertStmt = db\.prepare\((['`].*?['`])\);[\s\n]*const transaction = db\.transaction\(\(.*?\)\s*=>\s*\{[\s\n]*for\s*\(const (.+?)\s+of\s+(.+?)\)\s*\{[\s\n]*insertStmt\.run\((.*?)\);[\s\n]*\}[\s\n]*\}\);[\s\n]*transaction\(\);", 
                             r"for (const \2 of \3) { await query(\1, [\4]); }", content, flags=re.DOTALL)

            with open(p, 'w', encoding='utf-8') as file:
                file.write(content)
