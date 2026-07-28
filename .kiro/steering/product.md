# Product — PH BIR Tax Collection Dashboard

## Vision

A zero-backend, browser-native analytics dashboard that makes Philippine BIR tax collection data accessible and explorable by citizens, researchers, and government analysts — powered entirely by DuckDB-WASM.

## Target Users

- **Citizens & journalists** — transparency into how much tax each region collects
- **Policy researchers** — compare GAA budget allocations vs actual collections
- **Workshop participants** — learn modern data engineering patterns hands-on

## Core Features

1. **Regional Tax Overview** — horizontal bar chart showing total collection per region, filterable by year
2. **Monthly Trend Analysis** — line chart comparing year-over-year monthly patterns for any region
3. **GAA vs BIR Comparison** — grouped bar chart showing budget allocation vs actual revenue
4. **Client-Side Only** — all queries execute in the browser via DuckDB-WASM, no API server

## Data Scope

- 5 years of data: 2020–2024
- 18 Philippine regions, 102 areas (cities/municipalities)
- Monthly granularity (12 months × 5 years × ~100 areas = 6,096 records)
- Monetary values in millions of Philippine Pesos (₱M)

## Non-Goals (for this workshop)

- User authentication or accounts
- Data entry or editing
- Real-time data updates (static Parquet file)
- Mobile-native app (responsive web only)

## Success Criteria

- Dashboard loads in under 5 seconds on broadband
- All three chart views render correctly with filter interactions
- Zero null values in displayed data (enforced by upstream pipeline)
- Accessible: ARIA labels on all interactive elements, sufficient color contrast
