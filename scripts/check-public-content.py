"""Check candidate Git history for known private paths without printing content."""
from pathlib import PurePosixPath
import re
import subprocess

commits = subprocess.check_output(['git', 'rev-list', 'HEAD'], text=True).splitlines()
blocked = set()
for commit in commits:
    paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', '-z', commit]).decode().split('\0')
    for path in filter(None, paths):
        item = PurePosixPath(path)
        name = item.name
        if (path.startswith(('docs/internal/', 'private-data/'))
                or path == 'docs/internal'
                or re.fullmatch(r'\d{2}-[A-Z-]+\.md', name)
                or name == '.env'
                or (name.startswith('.env.') and name not in {'.env.example', '.env.sample'})
                or item.suffix in {'.pem', '.key'}):
            blocked.add(path)
if blocked:
    raise SystemExit('Private paths found in candidate history: ' + ', '.join(sorted(blocked)))
print('Public content boundary passed.')
