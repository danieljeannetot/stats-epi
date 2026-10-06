# course-data.R
# Loads the two course datasets and the district table with the right variable types.
# Use from the course folder (or an RStudio project in it):
#   library(tidyverse); source("course-data.R")
#
# The data were simulated, so the true values are known. See Lesson 0.

library(tidyverse)

districts <- read_csv("data/districts.csv", show_col_types = FALSE)

visits <- read_csv("data/example-A-heat-visits.csv", show_col_types = FALSE) |>
  mutate(
    district  = factor(district, levels = districts$district),
    age_group = factor(age_group, levels = c("0-14", "15-64", "65+"), ordered = TRUE),
    dow       = factor(dow, levels = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")),
    holiday   = holiday == 1
  )

cohort <- read_csv("data/example-B-no2-asthma.csv", show_col_types = FALSE,
                   na = "NA") |>
  mutate(
    district     = factor(district, levels = districts$district),
    school       = factor(school),
    sex          = factor(sex, levels = c("girl", "boy")),
    parent_smoke = parent_smoke == 1,
    validation   = validation == 1,
    wheeze_q     = wheeze_q == 1
    # asthma is kept as 0/1, which suits glm(family = binomial)
  )

# quick checks: these should print 65,772 and 5,000 rows
message("visits: ", nrow(visits), " rows; cohort: ", nrow(cohort), " children")
