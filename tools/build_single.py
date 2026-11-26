#!/usr/bin/env python3
"""Baut eine einzelne, offline nutzbare Datei dist/Klangwerk.html aus index.html, css/ und js/.
Aufruf (im Repo-Ordner):  python3 tools/build_single.py"""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css' / 'klangwerk.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/klangwerk.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    src = (root / m.group(1)).read_text(encoding='utf-8')
    return '<script>\n' + src.replace('</script', '<\\/script') + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
out = root / 'dist' / 'Klangwerk.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print('geschrieben:', out, f'({len(html)//1024} KB)')
