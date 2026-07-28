---
inclusion: always
---

# Testing Standards

## Pipeline Testing (Server-Side)

### Command
```bash
npm run pipeline
```

### Built-In Assertions (Layer 3 of `step3_data_pipeline.js`)
- Zero nulls on critical fields: `year`, `region`, `area`, `month`, `month_num`, `amount_millions`
- Row count within expected bounds (5,000–8,000 rows)
- Data type verification via DuckDB `typeof()` (INTEGER, DOUBLE)
- Domain sanity: no negative amounts for tax revenue
- Parquet read-back verification after export
- Pipeline exits with code 1 on any assertion failure

### When to Re-Run
- After modifying any `*_bir_collection.csv` source file
- After changing cleaning logic in Layer 2
- After adding new source years
- After pipeline success, always copy output: `copy cleaned_dataset.parquet dashboard\public\`

## Frontend Testing (Client-Side)

### Stack Context
- React 19 + TypeScript + Vite (dev server via `npm run dev` in `dashboard/`)
- Recharts for visualization (not Chart.js)
- DuckDB-WASM for in-browser SQL queries
- Tailwind CSS for styling
- No test framework currently installed

### Manual Smoke Tests
Run the dev server and open the app in a browser. Verify:

1. **Initialization**
   - Dashboard renders without hanging on a loading state
   - No errors in browser DevTools console
   - DuckDB-WASM initializes within 5 seconds

2. **Regional Bar Chart (`RegionBarChart.tsx`)**
   - All 18 regions render with labels
   - NCR shows highest collection (dominant revenue center)
   - Year filter updates chart data
   - Tooltips display `₱X,XXX M` format

3. **Monthly Trend Chart (`MonthlyTrendChart.tsx`)**
   - One line per year (2020–2024)
   - 12 months on x-axis (Jan–Dec)
   - Region dropdown re-renders the chart
   - No flat-zero lines unless region genuinely has no data

4. **GAA vs BIR Comparison (`GaaComparisonChart.tsx`)**
   - Grouped bars: GAA and BIR side by side
   - NCR dominates both metrics
   - Some regions may show 0 for GAA (expected: MIMAROPA absent from GAA data)
   - Year filter updates both datasets

5. **Drilldown Chart (`DrilldownChart.tsx`)**
   - Clicking a region drills into area-level data
   - Back navigation returns to region view

6. **Edge Cases**
   - BARMM region handles small amounts gracefully
   - 2020 year shows COVID-era dip in trends
   - Rapid filter switching causes no chart corruption or console errors

### Browser Compatibility
- Chrome 90+ (primary — full WASM threading support)
- Firefox 89+ (fallback to MVP bundle, functional for this dataset size)

## Common Failures & Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Dashboard hangs on loading | DuckDB-WASM init failed or parquet missing | Check DevTools Network/Console; verify parquet in `dashboard/public/` |
| Charts show all zeros | Parquet file not copied to `dashboard/public/` | Run `copy cleaned_dataset.parquet dashboard\public\` |
| "No function matches trim(DOUBLE)" | GAA CSV values already numeric | Don't wrap DOUBLE columns in TRIM/REPLACE |
| Tooltip shows `undefined` | BigInt/Number mismatch from DuckDB-WASM | Wrap query result values with `Number()` before rendering |
| TypeScript compile errors | Type mismatch on DuckDB result rows | Use `.toArray().map(row => row.toJSON())` and type-assert |

## Rules for Adding Tests

### New Query Functions (`src/lib/queries.ts`)
1. Add function with TypeScript types for params and return value
2. Test manually via browser DevTools console using dynamic import
3. Verify: no nulls in results, expected row count, correct types

### New Chart Components (`src/components/*.tsx`)
1. Create component accepting typed data props
2. Wire into `App.tsx` with appropriate filter state
3. Smoke test: renders on load, updates on filter change, no console errors

### If Adding a Test Framework
- Prefer Vitest (aligns with Vite toolchain)
- Use `vitest --run` for single execution (never watch mode in CI or automated runs)
- Place test files adjacent to source: `src/lib/queries.test.ts`, `src/hooks/useDuckDB.test.ts`
- Mock DuckDB-WASM for unit tests; use real parquet for integration tests
