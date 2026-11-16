"""Insert a "Concepts at a glance" table at the bottom of each lesson (after Key takeaways).
Usage: python3 tools/add_concepts.py   (regenerates every table from tools/concepts_data_*.py)
Each entry: page -> list of (concept, what it is, how it differs from related concepts)."""
import re, glob, os, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = {}
for f in sorted(glob.glob(os.path.join(ROOT, "tools", "concepts_data_*.py"))):
    spec = importlib.util.spec_from_file_location("c", f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); DATA.update(m.C)
HEAD = "## Concepts at a glance {#concepts}"
def block(rows):
    out = [HEAD, "", "Ideas from this lesson that are easily confused, side by side.", "", "| Concept | What it is | How it differs |", "|---|---|---|"]
    out += [f"| **{c}** | {w} | {d} |" for c, w, d in rows]
    return "\n".join(out) + "\n\n"
n = 0
for page, rows in DATA.items():
    f = os.path.join(ROOT, (f"lesson-{page:02d}" if isinstance(page, int) else page) + ".qmd")
    s = open(f, encoding="utf-8").read()
    s = re.sub(r"## Concepts at a glance \{#concepts\}\n.*?(?=\n```\{=html\}\n<div class=\"done\"|\Z)", "", s, flags=re.S)   # remove the old table
    s = s.replace("\n\n\n```{=html}\n<div class=\"done\"", "\n\n```{=html}\n<div class=\"done\"")
    k = s.rfind("```{=html}\n<div class=\"done\"")
    if k < 0: s = s.rstrip("\n") + "\n\n" + block(rows)          # no separate end block (Lesson 0): append at the end
    else: s = s[:k] + block(rows) + s[k:]
    open(f, "w", encoding="utf-8").write(s); n += 1
print("concept tables written:", n)
