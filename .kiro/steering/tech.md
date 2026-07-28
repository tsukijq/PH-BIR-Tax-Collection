# Tech Stack & Dependencies

## Runtime Environments

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Server-side ETL | Node.js + DuckDB (native) | duckdb ^1.4.4 | Data cleaning pipeline, Parquet export |
| Client-side Analytics | DuckDB-WASM | ^1.29.0 (CDN) | In-browser SQL queries on Parquet |
| Visualization | Chart.js | ^4.4.0 (CDN) | Bar charts, line charts, responsive rendering |
| Static Server | serve (dev) | ^14.x | Local development file serving |

## CDN Dependencies (Frontend — no bundler)

- **DuckDB-WASM ESM:** `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm`
- **Chart.js UMD:** `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`

## Design Decisions

### No Bundler
- Vanilla JS with ES modules (`type="module"`) — no webpack, vite, or rollup
- CDN imports for DuckDB-WASM and Chart.js
- Keeps workshop friction minimal (no build step required)

### DuckDB-WASM Initialization Pattern
- Use `duckdb.getJsDelivrBundles()` for automatic bundle selection
- Create worker via `URL.createObjectURL(new Blob([...]))` pattern
- Register Parquet files via `db.registerFileBuffer()` after fetch
- Create SQL VIEWs over registered files for clean query syntax

### Data Flow
```
cleaned_dataset.parquet (33KB, SNAPPY)
        ↓ fetch() in browser
DuckDB-WASM registerFileBuffer()
        ↓ CREATE VIEW bir_data
SQL queries via conn.query()
        ↓ result.toArray().map(row => row.toJSON())
Chart.js render functions
```

### Error Handling (Frontend)
- try/catch around initDatabase() with user-visible status messages
- Graceful degradation: show error state if WASM fails to load
- Console logging for debugging, status element for user feedback

## npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run pipeline` | `node step3_data_pipeline.js` | Run ETL pipeline |
| `npm run dashboard` | `serve dashboard -l 3000 --cors` | Serve frontend locally |
| `npm start` | `serve dashboard -l 3000 --cors` | Alias for dashboard |

## Browser Compatibility

- Chrome 90+ (SharedArrayBuffer for WASM threads)
- Firefox 89+ (COOP/COEP headers or fallback to MVP bundle)
- Safari 15+ (WebAssembly support)
- Edge 90+ (Chromium-based)

Note: The `serve` dev server does NOT set COOP/COEP headers by default. DuckDB-WASM will fall back to the single-threaded MVP bundle, which is fine for our dataset size (6,096 rows).
