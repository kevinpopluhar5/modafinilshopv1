from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import unquote
import json, re, sys
root=Path(__file__).resolve().parents[1]
files=sorted(p for p in root.rglob('*.html') if 'release-public' not in p.parts)
issues=[]
checks=[]
for f in files:
    soup=BeautifulSoup(f.read_text(encoding='utf-8'),'html.parser')
    name=str(f.relative_to(root))
    checks.append(name)
    title=soup.title.get_text(' ',strip=True) if soup.title else ''
    if not title: issues.append(f'{name}: chyba title')
    if len(soup.select('h1'))!=1: issues.append(f'{name}: ma {len(soup.select("h1"))} H1')
    if not soup.select('meta[name="description"]'): issues.append(f'{name}: chyba meta description')
    for link in soup.select('a[href],link[href],script[src],img[src]'):
        value=link.get('href') or link.get('src') or ''
        if not value or value.startswith(('#','http:','https:','mailto:','tel:','data:','javascript:')): continue
        cleaned=unquote(value.split('#')[0].split('?')[0])
        if not cleaned or cleaned.startswith('/'): continue
        dest=(f.parent/cleaned).resolve()
        if not dest.is_file(): issues.append(f'{name}: neplatny odkaz {value}')
    for im in soup.select('img'):
        if not im.has_attr('alt'): issues.append(f'{name}: img bez alt')
        if not im.has_attr('width') or not im.has_attr('height'): issues.append(f'{name}: img bez rozmeru {im.get("src", "")}')
report={'pages':len(checks),'checked':checks,'issues':sorted(set(issues))}
print(json.dumps(report,ensure_ascii=False,indent=2))
if issues: sys.exit(1)
