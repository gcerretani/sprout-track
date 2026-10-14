# Growth references: dataset research (issue #292 follow-up)

Research for the "additional growth standards" part of
[Oak-and-Sprout/sprout-track#292](https://github.com/Oak-and-Sprout/sprout-track/issues/292).
Per-baby reference selection (steps 1–4 of the issue) is implemented separately.
This document only decides **which datasets could be added next, and under what conditions**.

> **Not legal advice.** Licensing notes record what the sources say. Treat every "unclear" verdict as "ask the rights holder before shipping".
>
> **Verification status.** This research was done from a sandbox that could not open most primary sites (who.int, cdc.gov, rcpch.ac.uk, intergrowth21, journals). The following sources were **opened directly**:
> - GitHub repositories: WHO `anthro` / `anthroplus`, RCPCH `rcpchgrowth-python`, `digital-growth-charts-documentation`, `growth-references`, LSHTM `gigs`, Tim Cole `sitar`, and the KCH eGrowth repository.
>
> Everything else comes from search-engine extracts of the cited URLs and is marked **[snippet]**. Re-read those pages before relying on them.

## 1. Admission criteria

A reference is a candidate only if all of these hold:

1. **LMS parameters (or equivalent) are published** in a machine-readable form. The app computes z-scores and percentiles with LMS (`src/utils/growthReferences.ts`).
2. **The licence allows**:
   - **(a)** redistributing the tables inside this repository and its Docker image, and
   - **(b)** use in the commercial SaaS. `LICENSE.md` makes the app non-commercial for third parties, but the copyright holders reserve commercial use.
3. **The coverage** of age, sex and measurement fits what the app records: weight, length/height and head circumference by date. BMI is derived.
4. **The age basis is supported.** Today that means chronological age only, because `Baby` has no gestational-age field.
5. **The reference has clinical relevance** for the families who would pick it.

## 2. What ships today

| Reference | Tables | Ages | Licence status |
|---|---|---|---|
| CDC 2000 | `Cdc*ForAge` (infant weight, length, HC; 2–20 y weight, stature) | 0–36 mo; 24–240 mo | US federal work, generally public domain ([cdc.gov/other/agencymaterials.html](https://www.cdc.gov/other/agencymaterials.html) **[snippet]**) |
| WHO 2006 | `Who*ForAge` (weight, length, HC) | 0–24 mo, monthly | **Unclear.** See §4.1. This also affects the data already shipped. |

The policy is `src/utils/growthStandard.ts`:
- WHO is used only up to 24 months, then CDC.
- A per-baby override inherits the family default.
- Interpolation never extrapolates (`interpolateGrowthReferenceRow`).

## 3. Summary matrix

Licence verdicts use: ✅ allowed · ❓ unclear or permission needed · ⛔ not allowed without a licence.

| Dataset | Population / ages | Measures | Format | Age basis | (a) redistribute | (b) SaaS | Effort |
|---|---|---|---|---|---|---|---|
| **WHO 2006, 0–5 y** (extend 24→60 mo) | international standard, 0–60 mo | weight, length/height, HC, BMI, weight-for-length/height, arm circumference and skinfolds (3–60 mo) | LMS, daily (`anthro`) or monthly (who.int) | chronological | ❓ | ❓ | **Low.** Same source and format as today; needs the 0.7 cm length→height handling. |
| **WHO 2007, 5–19 y** | reference, 61–228 mo | BMI and height to 19 y; weight to 10 y | LMS, monthly (`anthroplus`) | chronological | ❓ | ❓ | Medium: BMI needs paired weight and height. |
| **CDC Down syndrome** (Zemel 2015) | US Down Syndrome Growing Up Study, 0–20 y | weight, length/height, HC, weight-for-length; BMI in the paper only | **PDF percentiles only** (P5–P95); LMS possibly in the paywalled supplement | chronological | ❓ | ❓ | **Blocked:** no machine-readable LMS. |
| **SIEDP** (Cacciari 2006, Italy) | about 70,000 Italian children, 2–20 y | height, weight, BMI | LMS in the paper (paywalled Springer); printable PDFs | chronological | ❓ | ❓ | **Blocked:** needs permission plus manual transcription. |
| **INeS** (Bertino 2010 / Spada 2024, Italy) | size at birth, 23–42 weeks GA | birthweight (Spada 2024 LMS) | LMS in an open-access supplement | gestational | ✅ (CC BY 4.0, CC0 data **[snippet]**) | ✅ | Low data effort, but needs a GA field. Classification at birth only, not a growth chart. |
| **UK-WHO** (UK90 + WHO) | UK, 23 weeks GA to 20 y | weight, length/height, HC, BMI | LMS JSON (`rcpchgrowth`), `sitar::uk90` | gestational, then corrected | ⛔/❓ (MRC licence) | ⛔/❓ | Blocked: licence. |
| **INTERGROWTH-21st** | newborn 24–42 weeks GA; preterm postnatal 27–64 weeks PMA | weight, length, HC | GAMLSS/skew-t and mean/SD equations, **no LMS** | gestational / PMA | ❓ | ❓ | High: different model and age basis. |
| **Fenton 2013** (preterm) | meta-analysis, 22–50 weeks PMA | weight, length, HC | LMS **by licence only** | gestational / PMA | ⛔ | ⛔ (paid licence) | Blocked: licence. |

## 4. Notes per dataset

### 4.1 WHO Child Growth Standards 2006 (0–5 y) and Growth Reference 2007 (5–19 y)

**Data:**
- The authoritative machine-readable tables are in WHO's own GitHub repositories, which were opened directly:
  - [`WorldHealthOrganization/anthro/data-raw/growthstandards`](https://github.com/WorldHealthOrganization/anthro/tree/master/data-raw/growthstandards): `weianthro.txt`, `lenanthro.txt`, `hcanthro.txt`, `bmianthro.txt`, `wflanthro.txt`, `wfhanthro.txt`, `acanthro.txt`, `tsanthro.txt`, `ssanthro.txt`.
  - [`anthroplus`](https://github.com/WorldHealthOrganization/anthroplus/tree/main/data-raw/growthstandards): `bfawho2007.txt`, `hfawho2007.txt`, `wfawho2007.txt`.
- Columns are `sex age l m s [loh]`.
  - 0–5 y is daily (0–1826 days; arm circumference and skinfolds 91–1826).
  - 5–19 y is monthly (60–229 months).
  - Weight-for-length and weight-for-height are indexed by length or height in 0.1 cm steps.
- who.int also publishes monthly tables per indicator (xlsx/PDF), for example the [weight-for-age](https://www.who.int/tools/child-growth-standards/standards/weight-for-age) page **[snippet]**. These match the granularity of the CSVs already in `documentation/`.

**Length vs height:**
- WHO measured both positions at 18–30 months (mean difference 0.73 cm) and shifted the median by 0.7 cm after 2 years.
- `anthro` (`R/z-score.R`) adds 0.7 cm to a standing height measured under 24 months, and subtracts 0.7 cm from a recumbent length measured at 24 months or older.
- Sprout Track does not record measurement position, so extending WHO past 24 months needs the same treatment as the CDC length→stature break: either a `breakAfter` segment, or an explicit "assumed standing height after 24 months" note. This decision is needed before shipping.

**Licence:**
- WHO copyright policy ([who.int/about/policies/publishing/copyright](https://www.who.int/about/policies/publishing/copyright)) **[snippet]**: "The use of WHO materials that are not available under the CC BY-NC-SA 3.0 IGO licence is subject to permission being granted by WHO."
- WHO's open-access FAQ **[snippet]**: "WHO publications published prior to 2017 will not be reissued under the CC BY-NC-SA 3.0 IGO licence". The 2006 and 2007 standards predate this. Even under CC BY-NC-SA, the NonCommercial and ShareAlike terms would not cover the SaaS.
- The WHO Anthro and AnthroPlus desktop software EULA **[snippet]**: "may be freely distributed and copied in whole, but not in part nor for sale or for use in conjunction with any commercial or promotional purpose".
- The `anthro` and `anthroplus` R packages, opened directly, are `GPL-3` / `GPL (>= 3)` with WHO as copyright holder, and the data files sit in those GPL repositories with no separate data licence.
  - This is the strongest argument for permissive reuse.
  - WHO never says the GPL is meant to cover the reference data, and relying on it would carry copyleft obligations.

**Verdict:**
- (a) ❓ and (b) ❓.
- This applies equally to the **WHO 0–24 month tables already shipped**. Adding 24–60 months does not create a new category of risk, but the project as a whole should ask WHO for permission: [permissions form](https://www.who.int/about/policies/publishing/permissions) **[snippet]**, Department of Nutrition (`anthro` maintainer contact `nfsdata@who.int`).

### 4.2 CDC growth charts for children with Down syndrome (Zemel et al., *Pediatrics* 2015;136:e1204)

**Data:**
- Charts for 0–36 months: weight, length, HC, weight-for-length.
- Charts for 2–20 years: weight, height, HC.
- CDC refers to the paper for BMI: [CDC page](https://www.cdc.gov/birth-defects/hcp/down-syndrome-growth-charts/index.html) **[snippet]**.
- CDC publishes printable PDFs with P5–P95 only. No CSV of LMS values was found.
- The journal supplement may contain LMS tables, but this is unconfirmed (paywalled AAP).

**Licence:**
- CDC web content is public domain, but the [agency materials](https://www.cdc.gov/other/agencymaterials.html) page **[snippet]** excludes material "developed by government contractors or grantees". The study was grant-funded.

**Verdict:**
- (a) ❓ and (b) ❓.
- Practically **blocked**: there is no machine-readable LMS.
- Ask CDC NCBDDD, Dr. Babette Zemel and AAP permissions.

### 4.3 SIEDP Italian charts (Cacciari et al., *J Endocrinol Invest* 2006;29:581)

**Data:**
- About 70,000 Italian schoolchildren measured 1994–2004.
- Height, weight and BMI from 2 to 20 years, for all of Italy plus Centre-North and South.
- The abstract says the references are "presented both as centiles and as LMS curves" ([Springer](https://link.springer.com/article/10.1007/BF03344156) **[snippet]**).
- The LMS values are in the paywalled article. No CSV or XLS was found.
- Printable PDFs: [italia-maschi.pdf](https://www.endocrinologiaoggi.it/wp-content/uploads/2012/04/italia-maschi.pdf) **[snippet]**.

**Licence:** there is no SIEDP statement on reuse in software; the article is Springer copyright.

**Verdict:**
- (a) ❓ and (b) ❓.
- Ask SIEDP (segreteria / Consiglio Direttivo), the authors (S. Milani, A. Cicognani) and Springer.
- This is the most relevant national reference for Italian users. There is no SIEDP 0–2 year chart; WHO is normally used below 2 years.

### 4.4 INeS Italian neonatal charts (Bertino 2010; Spada et al., *Ital J Pediatr* 2024;50:89)

- Size-at-birth reference for 23–42 weeks of gestational age.
- Spada 2024 publishes birthweight LMS by gestational age in an open-access supplement (Table A1) under CC BY 4.0, with a CC0 data waiver ([article](https://link.springer.com/article/10.1186/s13052-024-01660-7) **[snippet]**).

**Verdict:** (a) ✅ and (b) ✅ with attribution, once the supplement is verified directly.

**Fit:** this classifies a baby at birth (SGA/AGA/LGA). It is not a growth curve, and it needs a gestational-age field. Low priority.

### 4.5 UK-WHO (UK90 + WHO 2006, RCPCH)

**Data:**
- LMS JSON in [`rcpchgrowth-python/rcpchgrowth/data_tables`](https://github.com/rcpch/rcpchgrowth-python) and in Tim Cole's `sitar::uk90`. Both were opened directly.

**Ownership is stated inconsistently:**
- RCPCH says "UK90 Growth References are Copyright ⓒ Royal College of Paediatrics and Child Health" ([licensing-copyright.md](https://github.com/rcpch/digital-growth-charts-documentation/blob/live/docs/legal/licensing-copyright.md)).
- [rcpch/growth-references](https://github.com/rcpch/growth-references) says the UK references are "available only under their applicable MRC licence".
- The KCH eGrowth repository says the data "cannot be released until evidence of this [licence] is provided."
- For the UK Trisomy 21 charts, DSMIG **[snippet]** requires its own sub-licence.

**Code:** `rcpchgrowth` is AGPL-3.0 with no data exception. The RCPCH API's free tier is "not intended for production use", and proxy resale is banned (medical device status).

**Verdict:** (a) ⛔/❓ and (b) ⛔/❓ until an MRC/RCPCH licence is obtained (`commercial@rcpch.ac.uk` **[snippet]**).

### 4.6 INTERGROWTH-21st

**Data:**
- Newborn size: 24–42 weeks GA, skew-t GAMLSS from 33 weeks, normal equations below.
- Preterm postnatal: 27–64 weeks postmenstrual age, mean/SD equations (Villar 2015).
- Fetal standards.
- **No LMS is published.** The `gigs` package (LSHTM, GPL ≥3, opened directly) notes that the newborn coefficients "are not included in the referenced publication" and were supplied by the authors.

**Licence:**
- No formal terms were found.
- **[snippet]** "Practitioners can download and use these charts freely". Modifications go via `intergrowth@wrh.ox.ac.uk`.

**Verdict:** (a) ❓ and (b) ❓.

**Fit:** it needs a non-LMS z-score engine and a gestational / postmenstrual age model. High effort.

### 4.7 Fenton 2013 preterm chart

- The article is CC BY, but the LMS data are "available from the author by license only" ([PediTools, JMIR 2020](https://www.jmir.org/2020/1/e16204/PDF) **[snippet]**).
- Commercial use needs a paid licence via Innovate Calgary ([UCalgary](https://ucalgary.ca/resource/preterm-growth-chart/calculators-apps) **[snippet]**).

**Verdict:** (a) ⛔ and (b) ⛔ without a licence.

## 5. Architecture implications

The issue asks for an extensible reference registry and no silent switches. From this research and from `rcpchgrowth`'s design (a dispatch on a reference string, with per-reference loaders and explicit age thresholds), the registry entry needs at least:

| Field | Why |
|---|---|
| `id: string` | Stored in `Baby.growthReference` and `Settings.growthChartStandard`. Already a free string since #292. |
| `label`, `source`, `licence`, `citation` | Shown in the UI and in the PDF footer. Attribution is required by every candidate licence. |
| `measurements` → `{ minAge, maxAge, segments[] }` | Per-measurement coverage. For example, WHO 2007 has no weight past 10 y and CDC infant HC stops at 36 mo. |
| `ageBasis: 'chronological' \| 'corrected' \| 'gestational'` | Every preterm reference needs a gestational-age field on `Baby` that does not exist yet. |
| `breakAfter` / transition metadata | CDC length→stature at 24 mo (already handled by `createGrowthReferenceSegments`). WHO length→height at 24 mo with 0.7 cm. |
| `fallback?: id` | Makes today's WHO→CDC switch an explicit, declared rule instead of the hard-coded `WHO_MAX_AGE_MONTHS`. |

Rules to keep:
- **Outside coverage, show no percentile** rather than switching silently. Where a fallback is declared, label it, as the note added in #292 does.
- **BMI** needs weight and length/height on the same date. The app records them separately, so a pairing rule is needed (for example, the same day, or within N days).
- The **two LMS implementations** (`GrowthChart.tsx` and `monthly-report-card.helpers.ts`) should be merged into one tested function before adding references, so that every reference rounds and clamps the same way.
- `app/api/utils/db-backup.ts` currently omits the WHO tables. Every registry table must also be added there.

## 6. Recommendation

1. **Registry refactor, with no new data.** It has no licensing dependency. It moves CDC and WHO behind registry entries, unifies the LMS function, and adds the WHO tables to backups.
2. **Ask WHO for permission** for the 0–5 and 5–19 tables, covering the WHO data already shipped. This is the main open question for the maintainers.
3. Once (2) is resolved, or if the maintainers accept the current WHO usage:
   - **WHO 0–5 (24→60 months)** is the cheapest data addition, using the same source and format.
   - **WHO 5–19** follows when BMI is supported.
4. **SIEDP:** ask SIEDP for permission and for the LMS tables. This is the most valuable national reference for Italian families.
5. **Deferred:** CDC Down syndrome (no LMS), UK-WHO (MRC licence), INTERGROWTH-21st and Fenton (licence plus preterm age model), and INeS (needs a GA field).

## 7. Open questions for maintainers

- Was permission obtained from WHO for the WHO 2006 tables already shipped? If not, should the project request it (covering 0–5 and 5–19), given the commercial SaaS?
- Is a GPL-3-derived data source (`anthro` / `anthroplus`) acceptable under the Sprout Track licence?
- Should references without a confirmed licence be excluded entirely, or offered only in self-hosted builds?
- When the selected reference ends (for example, WHO at 60 months): fall back to CDC with a label, or stop plotting percentiles?
- Is adding a gestational-age / corrected-age field to `Baby` in scope? It is a prerequisite for any preterm reference.
- Should SIEDP be pursued as the first national reference (Italian contributors available to contact SIEDP)?

## Sources opened directly

- https://github.com/WorldHealthOrganization/anthro (`DESCRIPTION`, `LICENSE.md`, `data-raw/growthstandards/*`, `R/z-score.R`)
- https://github.com/WorldHealthOrganization/anthroplus (`DESCRIPTION`, `data-raw/growthstandards/*`)
- https://github.com/rcpch/rcpchgrowth-python (README, LICENSE, `data_tables/`, `uk_who.py`, `measurement.py`, `global_functions.py`)
- https://github.com/rcpch/digital-growth-charts-documentation (`docs/legal/licensing-copyright.md`, `docs/products/python-library.md`, `docs/products/react-component.md`, `docs/clinician/growth-references.md`, `docs/integrator/getting-started.md`)
- https://github.com/rcpch/growth-references
- https://github.com/eatyourpeas/Kings-College-Hospital-eGrowth-Charts
- https://github.com/statist7/sitar (`DESCRIPTION`, `man/uk90.Rd`)
- https://github.com/lshtm-gigs/gigs (README, `DESCRIPTION`, `R/data.R`, `R/ig_png.R`, `R/ig_nbs.R`)

All other URLs above are **[snippet]**: seen through search results only, to be re-read before any licensing decision.
