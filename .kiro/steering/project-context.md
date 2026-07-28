# Project Context — PH Data Dashboard

## Overview

This is an interactive KIRO workshop project focused on Data Engineering and Data Quality Assurance using Philippine open government data (BIR Tax Collection Data from data.bettergov.ph).

## Architecture

- **Server-side processing:** Node.js + DuckDB (native) for ETL/cleaning pipelines
- **Client-side visualization:** DuckDB-WASM + Chart.js for browser-based dashboards
- **Data format:** Raw CSVs → cleaned Parquet (SNAPPY compression)

## Dataset

- **Source:** https://data.bettergov.ph/datasets/20
- **License:** CC0 1.0 Universal (Public Domain)
- **Content:** BIR tax collection data by region and area (city/municipality), monthly, 2020–2024
- **Schema (cleaned):** year, region, area, month, month_num, amount_millions

## Key Files

| File | Purpose |
|------|---------|
| `step3_data_pipeline.js` | Main ETL pipeline (Layer 1–3: assess, clean, export) |
| `cleaned_dataset.parquet` | Production-ready output for DuckDB-WASM |
| `*_bir_collection.csv` | Raw source CSVs (wide-format, one per year) |
| `gaa_by_region.csv` | GAA budget allocation reference data |

## Conventions

- All pipeline scripts use CommonJS (`require`) for Node.js compatibility with duckdb package
- SQL queries use DuckDB dialect (UNPIVOT, TRY_CAST, read_csv, COPY TO PARQUET)
- File paths normalized with forward slashes for DuckDB compatibility on Windows
- Monetary amounts are in millions of Philippine Pesos (₱M)
