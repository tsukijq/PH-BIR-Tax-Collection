---
inclusion: always
---

# Workshop Roadmap — PH LGU Fiscal Dashboard

## Previous Topic (BIR Tax Collection — Preserved as History)

### Steps 1–4 (Completed — BIR Dataset)
- Step 1: Project setup, dependency install
- Step 2: Data exploration (BIR wide-format CSVs)
- Step 3: ETL pipeline (3-layer: assess → clean → export Parquet)
- Step 4: React + DuckDB-WASM dashboard with Recharts

> BIR pipeline and dashboard files remain in the repo as reference.
> New work below replaces the active dataset and dashboard content.

---

## New Topic: BLGF Local Government Unit Fiscal Data

### Phase 1: Ingest & Verify Schemas (CURRENT)
- [ ] Fetch all four resource types from data.bettergov.ph/datasets/9
- [ ] Inspect schema for: Annual Regular Income
- [ ] Inspect schema for: Statements of Receipts & Expenditures (SRE)
- [ ] Inspect schema for: LGU Indebtedness Reports (2016–2022)
- [ ] Inspect schema for: Disaster Risk Reduction Funds (DRRM)
- [ ] Flag schema/coverage mismatches across sources
- [ ] Document LGU name normalization issues

### Phase 2: Join Layer & Unified Pipeline
- [ ] Design the relational join model (LGU + year as composite key)
- [ ] Build ETL pipeline following 3-layer pattern (data-pipeline-standards.md)
- [ ] Handle uneven time coverage (Indebtedness → NULL for 2023–2024)
- [ ] Export to cleaned_lgu_fiscal.parquet
- [ ] Run assertion checks (zero critical nulls, row count bounds, type verification)

### Phase 3: Dashboard Rebuild
- [ ] Update DuckDB-WASM loader for new Parquet schema
- [ ] Build query layer for cross-cutting fiscal questions:
  - Which LGUs spend beyond income?
  - Which carry debt AND underfund disaster prep?
  - Regional fiscal health comparison
- [ ] Build Recharts visualizations (bar, line, scatter)
- [ ] Wire filters: year, region, LGU type, fiscal metric
- [ ] Drill-down: region → province → city/municipality

## Dataset Coverage Matrix

| Resource | Years Available | Format | Key Fields |
|----------|---------------|--------|-----------|
| Annual Regular Income | 2019–2024 (expected) | XLSX/CSV | LGU, region, income categories |
| Receipts & Expenditures | 2019–2024 (expected) | XLSX/CSV | LGU, receipts, expenditures |
| Indebtedness | 2016–2022 | XLSX | LGU, outstanding loans, creditor |
| DRRM Funds | 2019–2024 (expected) | XLSX/CSV | LGU, allocation, utilization |

> Note: Indebtedness only covers through 2022. Joined model will have NULLs for debt fields in 2023–2024.
