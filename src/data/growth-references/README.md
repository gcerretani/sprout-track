# Growth reference data (static)

LMS tables for the national growth references offered next to CDC and WHO
(which live in the database). The registry with labels, citations and
availability is `src/utils/growthReferenceRegistry.ts`. The loader is
`app/api/utils/growth-reference-data.ts`.

## File format

```json
{
  "id": "IT-SIEDP",
  "provenance": { "extractedFrom": "childsds 0.9.11 (italian.ref)", "repository": "…", "commit": "…", "items": { … } },
  "columns": ["ageMonths", "L", "M", "S"],
  "lms": { "length": { "1": [[24, 0.964, 88.8, 0.05], …], "2": […] }, "weight": { … } }
}
```

- Sex `"1"` is male and `"2"` is female.
- Units are kg for weight and cm for length/height and head circumference.
- `length` holds recumbent length and/or standing height. A repeated age marks the switch between the two (China, 36 months).
- Percentile columns are derived from L/M/S at load time (`lmsTableToRows`).

## Sources, licences and availability

The values are the published LMS parameters of the cited studies. Numerical
results are generally not protected by copyright, but rights holders' positions
vary. A reference marked **self-hosted** is never offered or served when
`DEPLOYMENT_MODE=saas`. It can be promoted to `all` in the registry once its
rights holder confirms commercial use is fine.

| Id | Reference | Ages | Measures | Rights status | Availability |
|---|---|---|---|---|---|
| `IT-SIEDP` (`-N`, `-S`) | Cacciari E et al., *J Endocrinol Invest* 2006;29:581–93 (SIEDP), Italy / Centre-North / South. Under 2 years: WHO 2006, per the SICuPP–SIEDP–SIP consensus. | 2–20 y (WHO 0–2 y) | weight, height (head circumference: WHO 0–2 y only) | Not stated by SIEDP | self-hosted |
| `DE-KIGGS` | Robert Koch-Institut, KiGGS 2003–2006 reference percentiles, 2nd ed. 2013 | 4 mo–18 y | weight, height, head circumference | © RKI, no open licence | self-hosted |
| `BE-FLANDERS` | Roelants M et al., *Ann Hum Biol* 2009;36:680–94 | 0–21 y | weight, height, head circumference | Journal article, no open licence | self-hosted |
| `NL-1997` | Fredriks AM et al., *Pediatr Res* 2000;47:316–23 (4th Dutch Growth Study, TNO) | 0–21 y | weight, height, head circumference | TNO, no open licence | self-hosted |
| `NL-1997-TR` | Fredriks AM et al., *Eur J Pediatr* 2003;162:788–93 (Turkish origin) | 0–20 y (head circumference 0–2 y) | weight, height, head circumference | TNO, no open licence | self-hosted |
| `NL-1997-MA` | Fredriks AM et al., *Acta Paediatr* 2004;93:817–24 (Moroccan origin) | 0–20 y (head circumference 0–2 y) | weight, height, head circumference | TNO, no open licence | self-hosted |
| `CN-2005` | Zong XN, Li H, *PLoS ONE* 2013;8:e59569 | 0–18 y (head circumference 0–6 y) | weight, length/height, head circumference | CC BY (PLOS ONE) | all |

## Provenance and regeneration

The values were extracted from the data files of the
[`childsds`](https://github.com/cran/childsds) R package 0.9.11 (Mandy Vogel).
That package is GPL-3, but only the numeric parameters were taken; no code,
documentation or file from the package is included. To regenerate the files:

```bash
git clone --depth 1 https://github.com/cran/childsds /tmp/childsds
python -m venv /tmp/venv && /tmp/venv/bin/pip install rdata
/tmp/venv/bin/python scripts/growth-references/extract-childsds.py /tmp/childsds src/data/growth-references
```

`tests/growthReferenceStaticData.test.ts` checks every file for:
- both sexes and increasing ages;
- finite, positive L/M/S;
- ordered percentiles;
- plausible medians at 24 months.

The LMS formula itself is checked against WHO and CDC published percentiles in `tests/growthReferences.test.ts`.

**Not included** (see `documentation/Implementation/growth-references-research.md`):
- UK90/UK-WHO: MRC licence.
- Fenton and Olsen preterm charts: licensed, and they need gestational age.
- France 2018: proprietary.
- References starting at school age.
