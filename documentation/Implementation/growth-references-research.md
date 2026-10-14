# Growth references: dataset research (issue #292 follow-up)

Research for the "additional growth standards" part of
[Oak-and-Sprout/sprout-track#292](https://github.com/Oak-and-Sprout/sprout-track/issues/292).
Per-baby reference selection (steps 1–4 of the issue) is implemented separately.
It also covers the national and condition-specific references listed in
[#269](https://github.com/Oak-and-Sprout/sprout-track/issues/269).
This document only decides **which datasets could be added next, and under what conditions**.

> **Not legal advice.** Licensing notes record what the sources say. Treat every "unclear" verdict as "ask the rights holder before shipping".
>
> **Verification status.** This research was done from a sandbox that could not open most primary sites (who.int, cdc.gov, rcpch.ac.uk, intergrowth21, journals). The following sources were **opened directly**:
> - GitHub repositories: WHO `anthro` / `anthroplus`, RCPCH `rcpchgrowth-python`, `digital-growth-charts-documentation`, `growth-references`, LSHTM `gigs`, Tim Cole `sitar`, the KCH eGrowth repository, and the R packages `childsds`, `AGD` and `growthcharts/nlreferences`.
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

### 3.2 National references from #269

| Country / dataset | Ages | Measures | Machine-readable params | (a) | (b) | Notes |
|---|---|---|---|---|---|---|
| **France** AFPA–CRESS/Inserm–CGM 2018 (Heude 2019) | 1 mo–18 y | weight, height, HC, BMI | none found; GAMLSS **BCPE**, not LMS | ⛔ | ⛔ | "non libres de droit" **[snippet]**. Proprietary, licensed via CGM. |
| **Germany** KiGGS 2003–06 (RKI, Neuhauser 2013) | 0–17 y | height, weight, BMI, HC, more | `childsds::kiggs.ref` (GPL-3 package) | ❓ | ❓ | "© Robert Koch-Institut", no CC licence found **[snippet]**. |
| **Germany** Kromeyer-Hauschild 2001 | 0–18 y | BMI | `childsds::kro.ref` | ❓ | ❓ | Springer article. |
| **Norway** Bergen Growth Study (Júlíusson 2013) | 0–19 y | length/height, weight, BMI, HC | none found (charts only) | ❓ | ❓ | Paywalled T&F; data on request. |
| **Sweden** Wikland 2002; GrowUp 1990 (2020/21) | 0–18 y | height, weight, HC; weight, BMI | none found; height uses QEPS, not LMS | ❓ | ❓ | Wiley; licence of the 2020 LMS paper unverified. |
| **Netherlands** TNO 1997/2009, incl. Turkish- and Moroccan-origin | 0–21 y | height, weight, BMI, HC | `AGD` (GPL-2/3), `nlreferences` (AGPL-3), plain-text LMS | ❓ | ❓ | Charts "Voor persoonlijk gebruik" **[snippet]**. Ask TNO. |
| **South Korea** KNGC 2017 | WHO 0–35 mo; Korean 3–18 y | weight, height, BMI, HC | NHIS LMS CSV on data.go.kr **[snippet]** | ✅? | ✅? | NHIS dataset "제한 없음" (no restriction) **[snippet]**. The article itself is CC BY-NC. |
| **Japan** Kato 2014 (*Acta Paediatr*) | 0–~6 y | length/height, weight, HC, chest | LMS in article tables | ❓ | ⛔? | Possibly CC BY-NC (unverified). |
| **Japan** JSPE 2000 (Isojima 2016) | 0–17 y | height, weight | PDFs only | ⛔ | ⛔ | JSPE copyright; reproduction prohibited **[snippet]**. |
| **China** Zong & Li 2013 (*PLOS ONE*) | 0–18 y (HC 0–7 y) | weight, length/height, BMI, HC, weight-for-length/height | LMS in article tables; `childsds::zong13.ref` | ✅ | ✅ | PLOS ONE articles are CC BY **[snippet]**. Transcribe from the article, not from the GPL package. |
| **India** IAP 2015 (Khadilkar) | 5–18 y (WHO below 5) | height, weight, BMI | LMS "can be obtained from the author" **[snippet]** | ⛔ | ⛔ | IAP copyright; ask the authors. |

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

- **A machine-readable copy exists** in the R package [`childsds`](https://github.com/cran/childsds) (GPL-3, opened directly): dataset `italian.ref`, documented as "Parameters derived from Italian children", citing Cacciari 2006.
  - It covers height, weight and BMI for Italy, North and South, both sexes.
  - Ages run 2–18 y in half-year steps, then 19 and 20.
  - M is rounded to 0.1 and S to 3 decimals, which suggests the values were transcribed from the printed tables.
  - The GPL covers the package, not the rights to the published values. **Do not copy from it.** Use it only to cross-check a licensed transcription.
- There is no SIEDP head-circumference reference. The only Italian one found is Cortinovis, Bossi & Milani 1993, which runs to 3 years **[snippet]**.
- The SIEDP "Growth Calculator 3" (made by Weboriented with SIEDP, funded by Eli Lilly) uses these curves. Whether it exposes the LMS values was not checked **[snippet]**.

**What Italian clinicians use:**
- The 2018 SICuPP–SIEDP–SIP consensus (*Area Pediatrica* 19(1):33–37) recommends **WHO under 2 years and SIEDP from 2 years** **[snippet]**.
- Sprout Track already ships WHO 0–24 months, so SIEDP would complete the Italian pathway.

**Licence:** there is no SIEDP statement on reuse in software. The article was published by Kurtis in 2006; the journal now belongs to SIE/Springer **[snippet]**.

**Verdict:**
- (a) ❓ and (b) ❓.
- Ask SIEDP (segreteria / Consiglio Direttivo via siedp.it), the authors (Cacciari's group in Bologna; S. Milani in Milan) and Springer/SIE.
- This is the most relevant national reference for Italian users, and **the first permission request worth making**.

### 4.4 INeS Italian neonatal charts (Bertino 2010; Spada et al., *Ital J Pediatr* 2024;50:89)

- Size-at-birth reference for 23–42 weeks of gestational age.
- **Bertino 2010** (*JPGN* 51:353): weight, length and HC, by sex and by first-born vs later-born. About 45,000 singletons born 2005–07.
  - LMS values can be downloaded from [inescharts.com](https://www.inescharts.com/) **[snippet]**.
  - No licence was found, so (a) ❓ and (b) ❓.
- **Spada 2024**: birthweight only, not split by birth order. Centiles plus L and S by gestational age are in Table A1 of the supplement.
  - Licence: CC BY 4.0, plus "The Creative Commons Public Domain Dedication waiver … applies to the data made available in this article" ([article](https://link.springer.com/article/10.1186/s13052-024-01660-7) **[snippet]**).

**Verdict:** Spada 2024 is (a) ✅ and (b) ✅ with attribution, once the supplement and its licence line are verified on the live page.

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

### 4.8 Other Italian references (brief)

- **Down syndrome:** Cattoni et al., *J Endocrinol Invest* 2025, doi:10.1007/s40618-025-02777-0. Italian syndrome-specific height, weight and BMI from 526 patients **[snippet]**. Method and licence are unverified; assume permission is needed.
- **CedAP Lombardy birthweight charts:** *Ital J Pediatr* 2025, doi:10.1186/s13052-025-02163-9. Probably CC BY (a BMC journal), unverified. Size at birth only.
- **Preterm postnatal:** no Italian LMS reference was found. INTERGROWTH-21st (§4.6) is the usual choice.

### 4.9 European national references

- **France:** the 2018 curves (Heude et al., *Lancet Digit Health* 2019) are explicitly not free of rights. The AFPA pages say "Courbes AFPA- CRESS/Inserm -CompuGroup Medical 2018 non libres de droit" **[snippet]**, and CGM licenses them to software vendors. They also use BCPE, not LMS, so an LMS engine could not reproduce them. **Excluded.**
- **Germany:**
  - KiGGS: LMS values are in `childsds::kiggs.ref` (opened directly, GPL-3 package), sourced from the RKI report. The report is "© Robert Koch-Institut", with no CC licence found **[snippet]**. Ask RKI (Department of Epidemiology and Health Monitoring).
  - Kromeyer-Hauschild 2001 BMI: in `childsds::kro.ref`; Springer article.
- **Norway, Bergen:** LMS method, but no published table and a paywalled article. Ask P. B. Júlíusson (University of Bergen).
- **Sweden:** clinical charts are SD-based. The GrowUp 1990 LMS paper (*Acta Paediatr* 2021) has an unverified licence, and the height reference uses QEPS, not LMS.
- **Netherlands (TNO):** the only European set with plain-text LMS tables:
  - 1997 and 2009 Dutch references, Turkish- and Moroccan-origin references, Down syndrome and preterm.
  - Sources: [`AGD`](https://github.com/stefvanbuuren/AGD) (GPL-2 | GPL-3) and [`growthcharts/nlreferences`](https://github.com/growthcharts/nlreferences) (AGPL-3), both opened directly.
  - The code licences don't settle the rights to TNO's data: the charts say "Voor persoonlijk gebruik" **[snippet]**. Ask TNO Child Health (Stef van Buuren).

### 4.10 Asian national references

- **China, Zong & Li 2013** (*PLOS ONE* 8:e59569):
  - 0–18 y weight, length/height, BMI and HC (0–7 y), plus weight-for-length and weight-for-height, all LMS.
  - PLOS ONE publishes under CC BY **[snippet]**.
  - **Candidate with a permissive licence.** Transcribe from the article tables, not from `childsds::zong13.ref` (GPL-3).
- **South Korea, KNGC 2017:**
  - Uses WHO for 0–35 months and Korean data for 3–18 years.
  - The NHIS publishes an LMS CSV on [data.go.kr](https://www.data.go.kr/data/15133061/fileData.do) marked "이용허락범위: 제한 없음" (no restriction on use) **[snippet]**.
  - **Candidate with a permissive licence,** once that page and the CSV's age span are verified. The article itself is CC BY-NC, so don't take the numbers from it.
- **Japan:**
  - Kato 2014 (*Acta Paediatr*, LMS in the tables) may be CC BY-NC (unverified).
  - The JSPE 2000 charts are JSPE copyright, with reproduction prohibited **[snippet]**. Ask JSPE.
- **India, IAP 2015:** LMS values "can be obtained from the author" for research **[snippet]**. Ask Dr V. Khadilkar and the IAP Growth Chart Committee.

### 4.11 Condition-specific references (summary)

None of these has machine-readable LMS under a clearly permissive licence.

| Condition | Main reference | Machine-readable LMS? | Licence |
|---|---|---|---|
| Down syndrome | Zemel 2015 (US, §4.2); Styles 2002 (UK); TNO 2009 (NL); Cattoni 2025 (IT) | UK/US in `rcpchgrowth` JSON (AGPL-3); NL in `nlreferences` (AGPL-3) | ❓ |
| Turner | Lyon 1985 (UK); Rongen-Westerlaken 1997; Isojima 2009 (JP) | `rcpchgrowth` `turner.json` (height only, AGPL-3) | ❓ |
| Prader-Willi | Butler 2011/2015/2016 | No, PDF charts only | ❓ |
| Achondroplasia | Neumeyer 2021 (European LMS); CLARITY (Hoover-Fong 2021, mean/SD) | tables unclear | Neumeyer CC BY 4.0 **[snippet]** |
| Williams | Martin 2007 (UK, LMS) | No | ❓ (BMJ) |
| Noonan / RASopathies | Ranke 1988; Malaquias 2012; Isojima 2016 | No. A 2025 preprint reports errors in published LMS | ❓ |
| 22q11.2 deletion | Tarquinio 2012; Habel 2012 | No | ❓ (Wiley) |
| Beckwith-Wiedemann | Maas 2025 (GAMLSS) | Unclear; not pure LMS | ❓ |
| Cerebral palsy | Brooks 2011 (by GMFCS level) | No, percentile charts only | ❓ |
| Fragile X, Cri-du-chat | no established LMS reference found | No | n/a |

### 4.12 Additional CDC data (public domain)

These CDC 2000 files are public domain and use the same LMS format as the CSVs the app already ships. They were checked against public GitHub mirrors (`growthcleanr`, `SimKid`), because cdc.gov was unreachable.
- `bmiagerev.csv`: BMI-for-age, 24–240.5 months.
- `wtleninf.csv`: weight-for-recumbent-length, 45–103.5 cm.
- `wtstat.csv`: weight-for-stature, 77–121.5 cm.

The CDC 2022 extended BMI (above the 95th percentile) is derived from `bmiagerev.csv` with a published sigma formula. The CDC's own `CDCAnthro` package implements it under Apache-2.0.

CDC publishes no head-circumference reference beyond 36 months.

Using these files needs:
- BMI from paired weight and height measurements;
- for the weight-for-length/stature tables, a chart whose x-axis is length rather than age.

### 4.13 What other apps do

- **Baby Daybook** (Baltapis UAB, Lithuania) **[snippet]**:
  - Offers WHO, CDC and CDC Down syndrome charts, and corrects age for preterm babies.
  - Lists "chromosomal disorders" without naming them.
  - No source or licence citation was found for its chart data.
  - It does not declare itself a medical device: it is listed under "Medical" on the App Store, and its blog says it is not medical advice.
- **Child Growth Tracker** (Android) **[snippet]** adds Dutch, Belgian, Norwegian, Chinese, Japanese, Spanish and German charts, also without licence statements.

Market practice is to include such references without stating licences. This shows how the risk is perceived; it does not establish that the use is lawful.

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
- **Never copy data out of GPL/AGPL packages** (`childsds`, `AGD`, `nlreferences`, `rcpchgrowth`, `gigs`). Copyleft obligations would conflict with the Sprout Track licence, and the packages don't grant rights to the underlying data anyway. Transcribe from the primary publication under its own licence, and use the packages only to cross-check values.
- **Not every reference is LMS.** France uses BCPE, INTERGROWTH-21st uses skew-t, Sweden uses QEPS. The registry should declare each entry's method, so that a non-LMS engine can be added later without pretending these are LMS.

### Availability tiers (implemented in fork PR #20)

| Tier | Examples | Data in repo | Offered where |
|---|---|---|---|
| 1. Open | CDC (public domain), China (CC BY), Swiss 2025, INeS Spada | yes | SaaS and self-hosted |
| 2. Non-commercial, or risk the maintainers prefer to keep out of the SaaS | SIEDP, KiGGS, Flanders, TNO; Korea and Japan articles (NC) | yes | self-hosted only (`availability: 'selfhosted'`) |
| 3. Redistribution prohibited | UK90, Fenton, France 2018 | **no** | at most a future admin-imported custom reference |

Enforcement relies on `DEPLOYMENT_MODE`, which already gates other SaaS-only features:
- The registry entry declares `availability`.
- The APIs reject a tier-2 reference in SaaS mode.
- The UI hides it, defaulting to the restrictive mode while the mode is unknown.
- A stored tier-2 value resolves as "inherit".

Tier 2 protects commercial use (b), not redistribution (a). The data still ships in the public repo and image.

## 6. Recommendation

1. **Registry refactor, with no new data.** It has no licensing dependency. It moves CDC and WHO behind registry entries, unifies the LMS function, and adds the WHO tables to backups.
2. **Ask WHO for permission** for the 0–5 and 5–19 tables, covering the WHO data already shipped. This is the main open question for the maintainers.
3. Once (2) is resolved, or if the maintainers accept the current WHO usage:
   - **WHO 0–5 (24→60 months)** is the cheapest data addition, using the same source and format.
   - **WHO 5–19** follows when BMI is supported.
4. **SIEDP:** ask SIEDP for permission and for the LMS tables. This is the most valuable national reference for Italian families, and it matches the national consensus (WHO under 2 years, SIEDP from 2 years).
5. **References with a permissive licence on paper:**
   - China, Zong 2013 (CC BY).
   - South Korea, NHIS LMS CSV ("no restriction").
   - INeS / Spada 2024 birthweight (CC BY + CC0, needs a GA field).

   Each needs its licence line verified on the live page first. They are the only national references that could be added without asking anyone.
6. **Excluded or needs permission:** France (proprietary), Germany, Norway, Sweden, the Netherlands, Japan and India; every condition-specific reference.
7. **Deferred:** CDC Down syndrome (no LMS), UK-WHO (MRC licence), INTERGROWTH-21st and Fenton (licence plus preterm age model), and INeS (needs a GA field).

## 7. Open questions for maintainers

- Was permission obtained from WHO for the WHO 2006 tables already shipped? If not, should the project request it (covering 0–5 and 5–19), given the commercial SaaS?
- Is a GPL-3-derived data source (`anthro` / `anthroplus`) acceptable under the Sprout Track licence?
- Should references without a confirmed licence be excluded entirely, or offered only in self-hosted builds?
- When the selected reference ends (for example, WHO at 60 months): fall back to CDC with a label, or stop plotting percentiles?
- Is adding a gestational-age / corrected-age field to `Baby` in scope? It is a prerequisite for any preterm reference.
- Should SIEDP be pursued as the first national reference (Italian contributors available to contact SIEDP)?
- Are national references whose licence is permissive but which serve smaller user groups (China, South Korea) worth adding before the WHO and SIEDP questions are settled?
- Is it acceptable to ship a reference transcribed from a CC BY article, with attribution in the UI and PDF?
- Is a feature difference between the SaaS and self-hosted builds (tier-2 references only in self-hosted) acceptable as a product decision?
- Should computing percentiles raise medical-device questions for the SaaS (EU MDR 2017/745)? RCPCH registered its growth API as a medical device.

## Sources opened directly

- https://github.com/WorldHealthOrganization/anthro (`DESCRIPTION`, `LICENSE.md`, `data-raw/growthstandards/*`, `R/z-score.R`)
- https://github.com/WorldHealthOrganization/anthroplus (`DESCRIPTION`, `data-raw/growthstandards/*`)
- https://github.com/rcpch/rcpchgrowth-python (README, LICENSE, `data_tables/`, `uk_who.py`, `measurement.py`, `global_functions.py`)
- https://github.com/rcpch/digital-growth-charts-documentation (`docs/legal/licensing-copyright.md`, `docs/products/python-library.md`, `docs/products/react-component.md`, `docs/clinician/growth-references.md`, `docs/integrator/getting-started.md`)
- https://github.com/rcpch/growth-references
- https://github.com/eatyourpeas/Kings-College-Hospital-eGrowth-Charts
- https://github.com/statist7/sitar (`DESCRIPTION`, `man/uk90.Rd`)
- https://github.com/lshtm-gigs/gigs (README, `DESCRIPTION`, `R/data.R`, `R/ig_png.R`, `R/ig_nbs.R`)
- https://github.com/cran/childsds (`DESCRIPTION`: GPL-3; `data/italian.ref.rda`, `kiggs.ref.rda`, `kro.ref.rda`, `zong13.ref.rda`, `man/*.Rd`)
- https://github.com/stefvanbuuren/AGD (`DESCRIPTION`: GPL-2 | GPL-3; `nl4.*` data)
- https://github.com/growthcharts/nlreferences (`DESCRIPTION`: AGPL-3; LMS tables)

All other URLs above are **[snippet]**: seen through search results only, to be re-read before any licensing decision.
