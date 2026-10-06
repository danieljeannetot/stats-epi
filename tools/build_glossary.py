#!/usr/bin/env python3
"""Build the course glossary from glossary/*.yml.

Writes:
  glossary.qmd              the searchable glossary page (rendered by Quarto)
  assets/glossary-data.js   the data used by hover popups and the side panel

Run from the project root after editing any glossary file:
  python3 tools/build_glossary.py
Requires Python 3.8+ and PyYAML (pip install pyyaml).
"""
import glob, html, json, os, re, sys
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT_FIELDS = ["short", "full", "formal", "epi", "report", "confusion"]


def load_terms():
    terms = []
    for path in sorted(glob.glob(os.path.join(ROOT, "glossary", "terms-*.yml"))):
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or []
        for t in data:
            t["_file"] = os.path.basename(path)
            terms.append(t)
    return terms


def validate(terms):
    errors, ids, alias_owner = [], {}, {}
    for t in terms:
        for key in ("id", "term", "category", "short"):
            if not t.get(key):
                errors.append(f"{t.get('id', '?')} ({t['_file']}): missing '{key}'")
        if t["id"] in ids:
            errors.append(f"duplicate id '{t['id']}' in {t['_file']} and {ids[t['id']]}")
        ids[t["id"]] = t["_file"]
    for t in terms:
        for r in t.get("related", []) or []:
            if r not in ids:
                errors.append(f"{t['id']}: related term '{r}' does not exist")
        for field in TEXT_FIELDS:
            for ref in re.findall(r"\[\[([^\]|]+)", str(t.get(field, "") or "")):
                if ref not in ids:
                    errors.append(f"{t['id']}.{field}: cross-reference [[{ref}]] does not exist")
        for fld in ("aliases", "pre", "related", "lessons"):
            for v in t.get(fld, []) or []:
                ok = isinstance(v, int) if fld == "lessons" else isinstance(v, str)
                if not ok:
                    errors.append(f"{t['id']}.{fld}: value {v!r} should be quoted text (YAML reads words like on/yes/no as true/false)")
        for a in t.get("aliases", []) or []:
            key = a if is_abbrev(a) else a.lower()
            if key in alias_owner and alias_owner[key] != t["id"]:
                errors.append(f"alias '{a}' used by both '{alias_owner[key]}' and '{t['id']}'")
            alias_owner[key] = t["id"]
    return errors


def is_abbrev(a):
    """Abbreviations such as OR, RR or SD are matched case-sensitively."""
    letters = re.sub(r"[^A-Za-z]", "", a)
    return len(letters) >= 2 and sum(c.isupper() for c in letters) >= max(2, len(letters) - 1)


# ---------- text conversion ----------
MATH = re.compile(r"\$\$(.+?)\$\$|\$(.+?)\$", re.S)


def protect_math(s):
    parts = []
    def keep(m):
        parts.append(m.group(0))
        return f"\x00{len(parts) - 1}\x00"
    return MATH.sub(keep, s), parts


def label_for(name):
    """Default text for a [[term-id]] reference: drop a trailing (ABBR) and lowercase ordinary words."""
    base = re.sub(r"\s*\([^)]*\)\s*$", "", name).strip()
    if base and base[0].isupper() and (len(base) < 2 or base[1].islower()) and not re.match(r"^(Bayes|Poisson|Bernoulli|Berkson|Moran|Lindley|Savage|Fisher|Wald|Akaike|Markov|Hamiltonian|Metropolis|Dirichlet|Laplace|Fourier|Cook|Gaussian|BYM2)", base):
        base = base[0].lower() + base[1:]
    return base


def to_html(s, ids):
    """Markdown-lite to HTML for the popup data. Math becomes \\( \\) and \\[ \\] for MathJax."""
    if not s:
        return ""
    s, maths = protect_math(str(s).strip())
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    def ref(m):
        tid, label = m.group(1), m.group(2) or label_for(ids[m.group(1)])
        return f'<a href="#" class="gref" data-term="{tid}">{label}</a>'
    s = re.sub(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", ref, s)
    def unmath(m):
        raw = maths[int(m.group(1))]
        if raw.startswith("$$"):
            return "\\[" + html.escape(raw[2:-2], quote=False) + "\\]"
        return "\\(" + html.escape(raw[1:-1], quote=False) + "\\)"
    return re.sub(r"\x00(\d+)\x00", unmath, s)


def to_md(s, ids):
    """Text for glossary.qmd: math stays as $...$, cross-references become anchor links."""
    if not s:
        return ""
    s = str(s).strip()
    return re.sub(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]",
                  lambda m: f"[{m.group(2) or label_for(ids[m.group(1)])}](#g-{m.group(1)})", s)


def build(terms):
    names = {t["id"]: t["term"] for t in terms}
    terms_sorted = sorted(terms, key=lambda t: t["term"].lower())

    # ---- data for popups and the side panel ----
    out = []
    for t in terms_sorted:
        out.append({
            "id": t["id"], "term": t["term"], "category": t["category"],
            "aliases": t.get("aliases", []) or [], "pre": t.get("pre", []) or [],
            "auto": t.get("auto", True),
            "short": to_html(t.get("short"), names), "full": to_html(t.get("full"), names),
            "formal": to_html(t.get("formal"), names), "epi": to_html(t.get("epi"), names),
            "report": to_html(t.get("report"), names), "confusion": to_html(t.get("confusion"), names),
            "r": t.get("r", "") or "",
            "related": [{"id": r, "term": names[r]} for r in (t.get("related") or [])],
            "lessons": t.get("lessons", []) or [],
        })
    with open(os.path.join(ROOT, "assets", "glossary-data.js"), "w", encoding="utf-8") as f:
        f.write("/* Generated by tools/build_glossary.py from glossary/*.yml. Do not edit by hand. */\n")
        f.write("window.COURSE_GLOSSARY = ")
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    # ---- glossary.qmd ----
    letters = sorted({t["term"][0].upper() for t in terms_sorted})
    lines = [
        "---",
        'title: "Glossary and symbols"',
        'description: "Definitions of every statistical and epidemiological term used in the course."',
        "toc-depth: 2",
        "---",
        "",
        "<!-- Generated by tools/build_glossary.py from glossary/*.yml. Edit those files, not this one. -->",
        "",
        f"This glossary defines the {len(terms)} terms used across the course. In every lesson, hover over an "
        "underlined term to see a short definition, and click it to open the full entry in a side panel. "
        "Each entry gives a plain-language explanation, the formal statistical definition, the epidemiological "
        "meaning where it differs, and, where useful, the R code and the way results are reported.",
        "",
        "## Symbols and notation {#symbols}",
        "",
        "Every model is shown three ways side by side: **A, standard notation**, as in papers and textbooks; "
        "**B, a model list with R**, one line per assumption, as in software; and **C, epidemiological "
        "reporting**, as in a results section.",
        "",
        "| Symbol | Meaning |",
        "|:--|:--|",
        "| $Y_i$, $y_t$ | Outcome for child $i$, or count on day $t$ |",
        "| $\\alpha$ | Intercept or baseline (log or logit scale) |",
        "| $\\beta$, $\\beta_\\ell$ | Exposure effects; the effect at lag $\\ell$ |",
        "| $\\gamma$ | Adjustment (confounder) terms |",
        "| $u_j$ | Group effect for district or school $j$ |",
        "| $\\sigma$, $\\tau$ | Residual and between-group standard deviations |",
        "| $\\pi_i$, $\\mu_t$ | Probability of the outcome for child $i$; expected count on day $t$ |",
        "| $i, t, j, k, \\ell$ | Indices: child, day, district or school, age group, lag |",
        "| $D$, $N$, $PT$ | Cases, people at risk, person-time |",
        "| $R$, $O$, $I$ | Risk, odds, incidence rate |",
        "| $\\sim$ | \"is distributed as\", e.g. $Y_i \\sim \\mathrm{Bernoulli}(\\pi_i)$ |",
        "",
        "Reporting conventions: heat effects as % change per °C and RR relative to the minimum morbidity "
        "temperature; NO₂ effects as OR or RR per 10 µg/m³; burden as attributable cases, PAF and DALYs. "
        "Intervals are always named in full: 95% confidence interval or 95% credible interval.",
        "",
        "## Jump to a letter",
        "",
        " · ".join(f"[{L}](#letter-{L.lower()})" for L in letters),
        "",
    ]
    current = None
    for t in terms_sorted:
        L = t["term"][0].upper()
        if L != current:
            current = L
            lines += [f"## {L} {{#letter-{L.lower()}}}", ""]
        lines += [f"### {t['term']} {{#g-{t['id']} .gloss-entry}}", ""]
        lines += [f"[{t['category']}]{{.gcat}}", ""]
        lines += [f"**{to_md(t.get('short'), names)}**", ""]
        if t.get("full"):
            lines += [to_md(t["full"], names), ""]
        if t.get("formal"):
            lines += ["::: {.gfield}", "", "**Formal definition.** " + to_md(t["formal"], names), "", ":::", ""]
        if t.get("epi"):
            lines += ["::: {.gfield}", "", "**In epidemiology.** " + to_md(t["epi"], names), "", ":::", ""]
        if t.get("confusion"):
            lines += ["::: {.gfield}", "", "**Don't confuse.** " + to_md(t["confusion"], names), "", ":::", ""]
        if t.get("r"):
            lines += ["::: {.gfield}", "", "**In R:**", "", "```r", t["r"].strip(), "```", "", ":::", ""]
        if t.get("report"):
            lines += ["::: {.gfield}", "", "**How it's reported.** " + to_md(t["report"], names), "", ":::", ""]
        meta = []
        if t.get("related"):
            meta.append("Related: " + ", ".join(f"[{names[r]}](#g-{r})" for r in t["related"]))
        if t.get("lessons"):
            meta.append("Lessons: " + ", ".join(f"[{n}](lesson-{n:02d}.qmd)" if os.path.exists(os.path.join(ROOT, f"lesson-{n:02d}.qmd")) else str(n) for n in t["lessons"]))
        if meta:
            lines += ["[" + " · ".join(meta) + "]{.gmeta}", ""]
    with open(os.path.join(ROOT, "glossary.qmd"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return len(terms)


if __name__ == "__main__":
    terms = load_terms()
    errs = validate(terms)
    if errs:
        print("Glossary has problems:\n  " + "\n  ".join(errs))
        sys.exit(1)
    n = build(terms)
    print(f"Glossary built: {n} terms -> glossary.qmd, assets/glossary-data.js")
