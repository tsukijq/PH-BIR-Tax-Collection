# 🇵🇭 PH BIR Tax Collection Dashboard

A zero-backend, browser-native analytics dashboard for Philippine BIR (Bureau of Internal Revenue) tax collection data — powered by DuckDB-WASM.

## What It Does

- **Visualizes** 5 years (2020–2024) of tax collection across 18 regions and 102 cities/municipalities
- **Runs entirely in the browser** — no API server needed, queries execute client-side via DuckDB-WASM
- **Compares** GAA (General Appropriations Act) budget allocations vs actual BIR collections
- **Drills down** from region-level to area-level detail on click

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ETL Pipeline | Node.js + DuckDB |
| Frontend | React 19 + TypeScript + Vite |
| Visualization | Recharts |
| Styling | Tailwind CSS |
| In-Browser SQL | DuckDB-WASM |
| Data Format | Parquet (SNAPPY compression) |

## Dataset

- **Source:** [BIR Tax Collection Data](https://data.bettergov.ph/datasets/20) via BetterGov.PH
- **License:** CC0 1.0 Universal (Public Domain)
- **Records:** 6,096 rows (cleaned, long-format)
- **Schema:** `year`, `region`, `area`, `month`, `month_num`, `amount_millions`

## Quick Start

### 1. Install dependencies

```bash
npm install
cd dashboard && npm install
```

### 2. Run the ETL pipeline (generates cleaned_dataset.parquet)

```bash
npm run pipeline
```

### 3. Copy data to dashboard

```bash
copy cleaned_dataset.parquet dashboard\public\
```

### 4. Start the dashboard

```bash
cd dashboard
npx vite
```

Open **http://localhost:5173** in Chrome.

## Project Structure

```
├── .kiro/steering/          # AI steering files (conventions, patterns)
├── dashboard/               # React + Vite frontend
│   ├── src/
│   │   ├── lib/             # DuckDB-WASM init + SQL queries
│   │   ├── hooks/           # React hooks (useDuckDB)
│   │   └── components/      # Chart components (Recharts)
│   └── public/              # Parquet + CSV served to browser
├── *_bir_collection.csv     # Raw BIR source CSVs (2020–2024)
├── gaa_by_region.csv        # GAA budget reference data
├── step3_data_pipeline.js   # Server-side ETL pipeline
└── cleaned_dataset.parquet  # Pipeline output
```

## Features

- **Regional Bar Chart** — horizontal bar comparing all 18 regions, filterable by year
- **Monthly Trend** — line chart showing year-over-year patterns for any selected region
- **GAA vs BIR** — grouped bar chart comparing budget allocation to actual revenue
- **Drilldown** — click a region to see city/municipality breakdown
- **Filters** — multi-year toggle, region selector, total/average aggregation mode

## Data Pipeline

The ETL pipeline (`step3_data_pipeline.js`) follows a 3-layer architecture:

1. **Layer 1:** Data quality assessment (schema audit, null detection, duplicate check)
2. **Layer 2:** Cleaning (TRIM, REPLACE commas, TRY_CAST, UNPIVOT wide→long, dedup)
3. **Layer 3:** Validation assertions + Parquet export with SNAPPY compression

## License

- **Code:** MIT
- **Data:** CC0 1.0 Universal (Public Domain) — sourced from Bureau of Internal Revenue via [BetterGov.PH](https://data.bettergov.ph/datasets/20)
