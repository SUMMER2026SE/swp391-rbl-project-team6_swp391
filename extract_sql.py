import sys
path = r'd:\swp1\swp391-rbl-project-team6_swp391\midori-be\src\main\resources\db\migration\V36__seed_kanji_entries.sql'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the INSERT statement
import re
match = re.search(r'INSERT INTO kanji_entries.*?ON CONFLICT.*?;', content, re.DOTALL)
if match:
    sql = match.group()
    # Remove line comments
    lines = sql.split('\n')
    clean_lines = []
    for line in lines:
        # Remove trailing comments
        idx = line.find('  --')
        if idx >= 0:
            line = line[:idx]
        if line.strip() and not line.strip().startswith('--'):
            clean_lines.append(line)
    
    clean_sql = '\n'.join(clean_lines)
    
    # Write to output file
    with open(r'd:\swp1\swp391-rbl-project-team6_swp391\kanji_seed.sql', 'w', encoding='utf-8') as f:
        f.write(clean_sql)
    print(f'Written: {len(clean_sql)} chars, {len(clean_lines)} lines')
else:
    print('No INSERT found')
