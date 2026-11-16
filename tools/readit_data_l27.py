# D panels, Lesson 27
D = {
(27,0): [
 (r"Z_i", "the random assignment: 1 if family $i$ was offered a purifier."),
 (r"D_i", "the treatment actually received: 1 if the family used a purifier, whatever its assignment."),
 (r"\text{ITT}", "intention-to-treat: the difference in outcomes by assignment. Protected by randomization; diluted by non-adherence."),
 (r"\text{first stage}", "how much more often the offered arm used a purifier: the share of compliers (minus always- and never-takers' influence)."),
 (r"\text{LATE}", "the local average treatment effect: the effect among compliers, families who use a purifier only if offered one."),
],
(27,1): [
 (r"\rho", "the exposure coefficient in the long regression, which includes the variable $w$."),
 (r"\rho^s", "the exposure coefficient in the short regression, which leaves $w$ out."),
 (r"\gamma", "the effect of the omitted variable $w$ on the outcome."),
 (r"w_i", "the variable left out of the short regression, such as SES."),
 (r"\delta_{wx}", "the association of $w$ with the exposure: the slope from regressing $w$ on $x$. Bias needs both $\\gamma$ and $\\delta_{wx}$ to be non-zero."),
],
(27,2): [
 (r"z_i", "the instrument: district traffic density."),
 (r"\pi_1", "the first-stage coefficient: how strongly the instrument moves the exposure. A weak first stage makes IV unstable."),
 (r"\hat x_i", "the exposure predicted from the instrument and covariates: the part of exposure driven by traffic only."),
 (r"\lambda", "the IV estimate of the exposure's effect."),
 (r"\rho_{zy}", "the reduced form: the instrument's association with the outcome. Divided by the first stage, it gives $\\lambda$."),
 (r"c_i", "covariates included in both stages."),
],
(27,3): [
 (r"\rho", "the jump at the threshold: the effect of the warning, on the log scale."),
 (r"D_t", "1 if a warning was issued on day $t$, which happens exactly when temperature reaches the threshold."),
 (r"(T_t - c)", "the running variable centered at the threshold: distance in °C from 23°C."),
 (r"\beta_2", "lets the slope differ above the threshold, so the jump isn't confused with a change of slope."),
 (r"h", "the bandwidth: only days within $h$ °C of the threshold are used. Narrower means less bias, more noise."),
],
(27,4): [
 (r"\alpha_j", "district fixed effects: absorb everything constant about each district."),
 (r"\tau_m", "month fixed effects: absorb everything affecting all districts in a month, such as season, epidemics and citywide trends."),
 (r"\hat\delta_{2\times 2}", "the simple difference-in-differences: the zone's before–after change minus the other districts' change."),
 (r"\delta", "the policy effect: the extra change in the zone's districts after the zone started."),
 (r"\text{LEZ}_j \times \text{post}_m", "1 for zone districts in months after July 2022, 0 otherwise."),
],
}
