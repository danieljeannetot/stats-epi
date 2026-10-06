# Statistics for epidemiology: from probability to Bayesian hierarchical models

An interactive course website for MSc students in epidemiology and public health, built with
[Quarto](https://quarto.org) and published with GitHub Pages. All data are simulated.

## What's in the repository

```
_quarto.yml                 site configuration: navigation, themes, execution
index.qmd                   home page
lesson-00.qmd, lesson-01.qmd ...  one file per lesson
glossary.qmd                glossary page (generated, do not edit by hand)
glossary/terms-*.yml        the glossary source: edit these
references.bib              the course bibliography
tools/tidy_fences.py        adds blank lines around ::: blocks
tools/build_glossary.py     turns the glossary source into glossary.qmd and assets/glossary-data.js
assets/
  course.css                course components, light and dark colors
  theme-light.scss, theme-dark.scss   Quarto themes (Source Sans 3 font)
  course.js                 data generators, chart helpers, quizzes, progress, lesson list
  glossary-ui.js            term links, hover popups, side panel, glossary button
  glossary-data.js          generated glossary data
  lesson-NN.js              the interactive parts of each lesson
  include-after.html        loads the scripts on every page
R/course-data.R             loads the CSV data with the right types
R/check-project.R           pre-render check for stray HTML files
stats-epi-course.Rproj      RStudio project: Build → Render Website
data/                       the simulated datasets (CSV)
course-plan.html            the course plan
.github/workflows/publish.yml   renders and publishes the site on every push
```

## Working on the site locally

1. Install [Quarto](https://quarto.org/docs/get-started/) (1.4 or later) and R (4.2 or later).
2. Install the R packages used when rendering:
   ```r
   install.packages(c("tidyverse", "knitr", "rmarkdown"))
   ```
3. Build the whole site, in one of three ways:
   - in a terminal in the project folder: `quarto render` (with no file name, so every page is built);
   - in the R console: `quarto::quarto_render()` (needs `install.packages("quarto")`);
   - in RStudio: open `stats-epi-course.Rproj`, then **Build → Render Website**.

   Note that RStudio's **Render** button, `quarto render index.qmd` and `quarto preview` build
   only the page you have open. Then run `quarto preview` to browse the site.

Before every render, `R/check-project.R` checks that no stray `.html` files from an older version
of the course sit next to the `.qmd` files. If it finds any, the render stops and tells you which
ones to delete.

The R code in each lesson runs when the site is rendered, so a broken snippet stops the render
with an error message pointing to the chunk. **The R code has been carefully written but not yet
executed**, so expect to fix a few small issues on the first render.

## Editing the glossary

The glossary lives in `glossary/terms-*.yml`. Each term has a short definition (used in hover
popups), a full explanation, a formal statistical definition, and optional epidemiological
meaning, R code, reporting example, confusions to avoid, related terms and lessons.
After editing, rebuild:

```bash
pip install pyyaml        # once
python3 tools/build_glossary.py
```

The script checks for missing fields, duplicate aliases and broken cross-references before writing
anything. Terms are linked automatically at their first mention in each numbered section. To link
an ambiguous word by hand, write `[mean]{.gterm data-term="mean"}` in a lesson. To stop a passage
from being linked, wrap it in `::: {.no-gloss}`.

## Adding a lesson

1. Create `lesson-NN.qmd` (copy the structure of `lesson-01.qmd`) and `assets/lesson-NN.js`.
2. Add it to the sidebar in `_quarto.yml`.
3. Add its number to `COURSE_AVAILABLE` in `assets/course.js`, so the home page and glossary link to it.
4. Rebuild the glossary so its "Lessons" links update.
5. Give every `<table>` inside a raw HTML block the attribute `data-quarto-disable-processing="true"`.
   Interactive tables are empty until JavaScript fills them, and without the attribute Quarto
   prints "Unable to parse table from raw html block".
6. Run `python3 tools/tidy_fences.py`. Pandoc, and so Quarto, only recognizes a `:::` block when it
   has a blank line before and after it; the script adds any that are missing.

## References

All references are in `references.bib`. Cite them in a lesson with `@key` (narrative) or
`[@key]` (parenthetical); Quarto builds each lesson's reference list at the end of the page.
Each numbered section ends with a short **Further reading** box citing three to five sources.

## Publishing on GitHub Pages

1. Create a repository on GitHub (for example `stats-epi-course`) and push this folder to its `main` branch.
2. On your computer, run once: `quarto publish gh-pages`. This creates the `gh-pages` branch.
3. On GitHub, go to **Settings → Pages** and set the source to **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.
4. From then on, every push to `main` triggers `.github/workflows/publish.yml`, which renders the site and publishes it.
5. Optionally set `site-url` and `repo-url` in `_quarto.yml`.

### Expensive computations

`execute: freeze: auto` stores the results of each lesson's R code in `_freeze/`. Commit that
folder. Lessons are then only re-run when their code changes. For the Bayesian lessons, which fit
Stan models, render them on your own computer and commit `_freeze/`, so GitHub doesn't have to
compile Stan models.

## Notes

- Hover popups and the side panel render formulas with MathJax and fonts from public CDNs, so
  viewing the site needs an internet connection.
- Progress ("mark as complete") is stored in each reader's browser only.
- License: see `LICENSE.md` (suggested: CC BY 4.0 for text, MIT for code, CC0 for data).
