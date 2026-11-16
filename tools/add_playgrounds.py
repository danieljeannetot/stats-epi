"""Place a "Try it" playground button under each model that has a playground.
Usage: python3 tools/add_playgrounds.py   (idempotent; reads the playground IDs from assets/playground-specs-*.js)
An ID like "L08.1" means: Lesson 8, the second notation panel (counting from 0); "Ldesign.0" means design.qmd."""
import re, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ids = []
for f in sorted(glob.glob(os.path.join(ROOT, "assets", "playground-specs-*.js"))):
    ids += re.findall(r'id:"(L[0-9a-z]+\.\d+)"', open(f, encoding="utf-8").read())
BLOCK = re.compile(r'\n```\{=html\}\n<div class="pg-mount" data-pg="[^"]+"></div>\n```\n')
pages = {}
for pid in ids:
    m = re.match(r"L([0-9]+|[a-z]+)\.(\d+)", pid); page, idx = m.group(1), int(m.group(2))
    pages.setdefault(page, []).append((idx, pid))
for f in glob.glob(os.path.join(ROOT, "*.qmd")):                    # remove all existing buttons first
    s = open(f, encoding="utf-8").read(); s2 = BLOCK.sub("\n", s)
    if s2 != s: open(f, "w", encoding="utf-8").write(s2)
n = 0
for page, items in pages.items():
    f = os.path.join(ROOT, (f"lesson-{int(page):02d}" if page.isdigit() else page) + ".qmd")
    s = open(f, encoding="utf-8").read()
    for idx, pid in sorted(items, reverse=True):                    # from the bottom up, so positions stay valid
        a = [m.start() for m in re.finditer(r"^:::: \{\.a\}", s, flags=re.M)][idx]
        end = s.find("\n:::::\n", a) + len("\n:::::\n")
        s = s[:end] + f'\n```{{=html}}\n<div class="pg-mount" data-pg="{pid}"></div>\n```\n' + s[end:]; n += 1
    open(f, "w", encoding="utf-8").write(s)
print("playground buttons placed:", n)
