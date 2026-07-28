# Data Pipeline Standards

## 3-Layer Pipeline Pattern

All ETL scripts in this project follow a consistent 3-layer architecture:

### Layer 1: Data Quality Assessment & Diagnostics
- Ingest raw source files into DuckDB in-memory tables
- Report row counts, schema types, null/missingness audit
- Detect formatting issues (commas in numbers, whitespace, casing inconsistencies)
- Identify duplicates using ROW_NUMBER() window functions
- Never modify data in this layer — observation only

### Layer 2: Cleaning & Integrity Enforcement
- Apply all transformations in a single SQL CTE chain when possible
- Use TRIM() on all text fields
- Use REPLACE() to strip formatting characters (commas, extra spaces) from numeric strings
- Use TRY_CAST() (not CAST) for safe type conversion — avoids pipeline crashes on bad data
- Use COALESCE() with domain-appropriate defaults (0.0 for amounts, 'Unknown' for categories)
- Use ROW_NUMBER() OVER (PARTITION BY ...) for deduplication
- Use UNPIVOT for wide-to-long transformations
- Filter out empty/null identifier rows (WHERE TRIM(field) != '')

### Layer 3: Export & Post-Quality Validation
- Run assertion checks: zero nulls on all critical fields
- Validate row count is within expected boundaries
- Verify data types with typeof()
- Run domain-specific sanity checks (no negative amounts for revenue data)
- Export with COPY ... TO ... (FORMAT PARQUET, CODEC 'SNAPPY')
- Verify output by reading back the parquet file
- Halt pipeline (process.exit(1)) if any assertion fails

## Error Handling

- Wrap main() in try/catch/finally
- Always close DuckDB connection in finally block
- Log descriptive error messages with the failing SQL context
- Use process.exit(1) for assertion failures so CI pipelines detect issues

## Naming Conventions

- Pipeline scripts: `step{N}_{description}.js`
- Output files: `cleaned_dataset.parquet` (main), `{name}.parquet` (additional)
- Intermediate tables: `raw_combined`, `staging`, `cleaned_data`
- Use snake_case for all SQL column names
