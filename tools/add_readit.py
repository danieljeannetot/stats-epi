"""Insert "B · How to read it" panels into notation panels (A notation, B how to read it, C model list, D report).
Usage: python3 tools/add_readit.py   (idempotent: triads that already have a D panel are skipped)
Each entry: (lesson number, index of the A panel within the lesson) -> list of (TeX of the term, explanation).
Write the term exactly as it appears in the equation, so it can be tagged and clicked there."""
import re, glob, os, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = {}
for f in sorted(glob.glob(os.path.join(ROOT, "tools", "readit_data_*.py"))):
    spec = importlib.util.spec_from_file_location("d", f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    DATA.update(m.D)
def block(items):
    lines = ["", ":::: {.d}", "", "::: {.lab}", "", "[B]{.k}How to read it", "", ":::", ""]
    lines += [f"- ${t}$: {e}" for t, e in items]
    return "\n".join(lines + ["", "::::", ""]) + "\n"
# the data files are the source of truth: remove every existing D panel first, then insert afresh
for f in glob.glob(os.path.join(ROOT, "*.qmd")):
    s = open(f, encoding="utf-8").read()
    s2 = re.sub(r":::: \{\.d\}\n.*?\n::::\n\n?", "", s, flags=re.S)
    if s2 != s: open(f, "w", encoding="utf-8").write(s2)
done = 0
for (lesson, idx), items in sorted(DATA.items(), key=lambda kv: (str(kv[0][0]), kv[0][1])):
    f = os.path.join(ROOT, f"lesson-{lesson:02d}.qmd" if isinstance(lesson, int) else f"{lesson}.qmd")
    s = open(f, encoding="utf-8").read()
    a_starts = [m.start() for m in re.finditer(r"^:::: \{\.a\}", s, flags=re.M)]
    if idx >= len(a_starts): print("no A panel", lesson, idx); continue
    a = a_starts[idx]
    end = s.find("\n:::::\n", a)                     # end of this triad
    seg = s[a:end]
    if ":::: {.d}" in seg: continue
    a_end = s.find("\n::::\n", a) + len("\n::::\n")        # the B panel goes right after the A panel
    s = s[:a_end] + "\n" + block(items).lstrip("\n") + s[a_end:]
    open(f, "w", encoding="utf-8").write(s); done += 1
print("D panels added:", done)
