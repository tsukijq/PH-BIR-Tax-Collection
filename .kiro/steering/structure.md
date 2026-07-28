# Project Structure

## Directory Layout

```
kiro-ph-data-dashboard/
├── .kiro/
│   └── steering/              # Kiro steering files (conventions & context)
│       ├── project-context.md
│       ├── product.md
│       ├── tech.md
│       ├── structure.md       # (this file)
│       ├── data-pipeline-standards.md
│       ├── duckdb-patterns.md
│       └── workshop-steps.md
│
├── dashboard/                 # Frontend (served as static files)
│   ├── index.html             # Entry point — layout, CDN scripts, canvases
│   ├── db-loader.js           # DuckDB-WASM init + file registration (data layer)
│   ├── queries.js             # All SQL query functions (query logic)
│   ├── charts.js              # Chart.js rendering (UI logic)
│   ├── app.js                 # Orchestrator — wires queries → charts + filters
│   ├── cleaned_dataset.parquet  # Production data (copied from root after pipeline)
│   └── gaa_by_region.csv      # GAA reference data for comparison charts
│
├── *_bir_collection.csv       # Raw BIR source files (2020–2024)
├── gaa_by_region.csv          # GAA budget data (wide-format, reference)
├── cleaned_dataset.parquet    # Pipeline output (source of truth)
├── step3_data_pipeline.js     # Server-side ETL pipeline (Node.js + DuckDB)
├── package.json               # Dependencies and npm scripts
└── node_modules/              # Installed packages
```

## Separation of Concerns

### Server-Side (Root)
- `step3_data_pipeline.js` — ETL pipeline, runs via `node` / `npm run pipeline`
- Raw CSVs and Parquet output live at root level
- Uses CommonJS (`require`) for Node.js DuckDB compatibility

### Client-Side (dashboard/)
- Pure ES modules (`import/export`) — no bundler needed
- 4-file architecture enforcing separation:
  - `db-loader.js` — knows about DuckDB-WASM, file registration, connection management
  - `queries.js` — knows SQL, returns structured data; no DOM/chart knowledge
  - `charts.js` — knows Chart.js API, renders visuals; no SQL knowledge
  - `app.js` — orchestrates everything, handles DOM events/filters
- Data files copied into `dashboard/` so static server can serve them

### Steering (.kiro/steering/)
- Always-included context for Kiro agent interactions
- Defines coding patterns, naming conventions, and project roadmap
- Updated as workshop progresses (e.g., marking steps complete)

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Pipeline scripts | `step{N}_{description}.js` | `step3_data_pipeline.js` |
| Raw data | `{year}_{source}_{type}.csv` | `2024_bir_collection.csv` |
| Cleaned output | `cleaned_dataset.parquet` | — |
| Frontend modules | `{concern}.js` (lowercase) | `db-loader.js`, `queries.js` |
| Steering files | `{topic}.md` (lowercase) | `product.md`, `tech.md` |

## Data File Flow

```
Raw CSVs (root) 
    → step3_data_pipeline.js (Node.js + DuckDB)
    → cleaned_dataset.parquet (root)
    → copy to dashboard/cleaned_dataset.parquet
    → served to browser via static server
    → loaded into DuckDB-WASM via fetch + registerFileBuffer
```

After running the pipeline, always copy the Parquet to `dashboard/`:
```bash
npm run pipeline
cp cleaned_dataset.parquet dashboard/
```
