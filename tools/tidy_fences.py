#!/usr/bin/env python3
"""Ensure every ::: fence in the .qmd files has a blank line before and after it.
Pandoc (and so Quarto) only recognizes a fenced div when it is separated from text by blank lines."""
import glob, re, sys
FENCE = re.compile(r"^:{3,}(\s*\{.*\})?\s*$")
def tidy(text):
    out, in_code = [], False
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("```"):
            in_code = not in_code
        is_fence = (not in_code) and bool(FENCE.match(line))
        if is_fence and out and out[-1].strip() != "":
            out.append("")
        out.append(line)
        nxt = lines[i + 1] if i + 1 < len(lines) else ""
        if is_fence and nxt.strip() != "":
            out.append("")
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out))
if __name__ == "__main__":
    files = sys.argv[1:] or sorted(glob.glob("*.qmd"))
    for f in files:
        s = open(f, encoding="utf-8").read(); t = tidy(s)
        if t != s:
            open(f, "w", encoding="utf-8").write(t); print("tidied", f)
