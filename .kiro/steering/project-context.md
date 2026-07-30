# Project Context — PH LGU Fiscal Dashboard

## Overview

This is an interactive KIRO workshop project focused on Data Engineering and Data Quality Assurance using Philippine open government data (BLGF Local Government Unit Fiscal Data from data.bettergov.ph).

## Architecture

- **Server-side processing:** Node.js + DuckDB (native) for ETL/cleaning pipelines
- **Client-side visualization:** DuckDB-WASM + Recharts for browser-based dashboards
- **Data format:** Raw XLSX/CSV → cleaned Parquet (SNAPPY compression)

## Dataset

- **Source:** https://data.bettergov.ph/datasets/9
- **Publisher:** Bureau of Local Government Finance (BLGF), Department of Finance
- **License:** Public Domain
- **Content:** Four fiscal resource types joined on LGU + year:
  1. **Annual Regular Income** — LGU locally-sourced and external revenue
  2. **Statements of Receipts & Expenditures (SRE)** — income vs spending
  3. **LGU Indebtedness Reports** — loans from financial institutions (2016–2022 only)
  4. **Disaster Risk Reduction Funds (DRRM)** — disaster preparedness allocation/spending
- **Timeframe:** 2019–2024 (Indebtedness truncates at 2022)
- **Granularity:** Province / City / Municipality level

## Schema (Target — Joined Model)

| Field | Type | Source |
|-------|------|--------|
| lgu_name | VARCHAR | All four |
| lgu_type | VARCHAR | province / city / municipality |
| region | VARCHAR | All four |
| year | INTEGER | All four (2019–2024, debt only to 2022) |
| regular_income | DOUBLE | Annual Regular Income |
| total_receipts | DOUBLE | SRE |
| total_expenditures | DOUBLE | SRE |
| outstanding_debt | DOUBLE | Indebtedness (NULL for 2023–2024) |
| drrm_allocation | DOUBLE | DRRM Funds |
| drrm_utilization | DOUBLE | DRRM Funds |

## Key Design Decisions

- LEFT JOINs from the widest-coverage dataset (Income or SRE) to preserve all LGU-year rows
- Indebtedness data will have NULLs for 2023–2024 — flagged explicitly, not silently dropped
- LGU name normalization is critical — different sources may spell/abbreviate differently

## Conventions

- All pipeline scripts use CommonJS (`require`) for Node.js compatibility with duckdb package
- SQL queries use DuckDB dialect (TRY_CAST, COALESCE, read_csv/read_xlsx_auto)
- File paths normalized with forward slashes for DuckDB compatibility on Windows
- Monetary amounts in PHP (not millions unless labeled)
