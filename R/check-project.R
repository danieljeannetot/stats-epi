# Runs before every render (see pre-render in _quarto.yml).
# Stops the render if stray .html files sit next to the .qmd files: Quarto would copy them into
# _site/ and they could replace the freshly rendered pages.
allowed <- c("course-plan.html")
stray <- setdiff(list.files(".", pattern = "\\.html$"), allowed)
if (length(stray) > 0) {
  stop(
    "Stray HTML files found in the project folder: ", paste(stray, collapse = ", "), "\n",
    "These are probably from an older version of the course. Delete them, delete the _site/ and ",
    ".quarto/ folders, and render again.",
    call. = FALSE
  )
}
message("Project check passed: no stray HTML files.")
