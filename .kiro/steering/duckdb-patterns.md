# DuckDB SQL Patterns

## General Rules

- Always use DuckDB's in-memory mode (`:memory:`) for ETL processing — no temp files on disk
- Use forward slashes in file paths even on Windows (DuckDB requirement)
- Prefer `read_csv()` over `read_csv_auto()` for explicit control
- Always set `null_padding = true` and `ignore_errors = true` when reading messy CSVs
- Column names from CSVs are auto-trimmed by DuckDB — reference without leading/trailing spaces

## Type Casting

- Always use `TRY_CAST(x AS TYPE)` instead of `CAST(x AS TYPE)` — returns NULL on failure instead of crashing
- For monetary string fields: `TRY_CAST(REPLACE(REPLACE(TRIM(value), ',', ''), ' ', '') AS DOUBLE)`
- For integer fields with possible string NULLs: `COALESCE(TRY_CAST(... AS INTEGER), 0)`

## String Cleaning

- `TRIM()` every text field from CSV input
- DuckDB lacks `INITCAP()` — use `CONCAT(UPPER(LEFT(x, 1)), LOWER(SUBSTR(x, 2)))` for single words
- For multi-word or domain-specific values, prefer explicit CASE mapping for standardization
- Use `REPLACE()` chaining for stripping formatting: commas, extra spaces, currency symbols

## Reshaping (Wide → Long)

```sql
SELECT * FROM table_name
UNPIVOT (
  value_column FOR label_column IN (col1, col2, col3, ...)
)
```

- UNPIVOT output column names come out lowercase — use CONCAT(UPPER(LEFT(...))) for Title Case
- Add a numeric mapping column (month_num, etc.) via CASE for proper sorting

## Deduplication

```sql
ROW_NUMBER() OVER (
  PARTITION BY key1, key2, key3
  ORDER BY preference_column DESC NULLS LAST
) AS row_rank
```

- Always filter `WHERE row_rank = 1` in the outer query
- Use `NULLS LAST` to prefer non-null values in ranking

## Parquet Export

```sql
COPY table_name TO 'path/to/output.parquet'
(FORMAT PARQUET, CODEC 'SNAPPY');
```

- SNAPPY codec: fast decompression, ideal for DuckDB-WASM browser reads
- Verify after export: `SELECT COUNT(*) FROM read_parquet('path/to/output.parquet')`
- Inspect schema: `SELECT name, type FROM parquet_schema('path/to/output.parquet') WHERE name != 'duckdb_schema'`

## Node.js Integration

- Use callback-based API with Promise wrappers for async/await:
  - `conn.all(sql, callback)` → for queries returning rows
  - `conn.run(sql, callback)` → for DDL/DML statements
- DuckDB Node.js driver returns BigInt for COUNT(*) — always wrap with `Number()` for comparisons
- Always close connection and database in `finally` block

## Performance Tips

- CTEs (WITH ... AS) are preferred over temp tables for single-pass transforms
- DuckDB automatically parallelizes queries — no manual tuning needed
- For large datasets, prefer `CREATE TABLE ... AS SELECT` over INSERT loops
- Use `CREATE OR REPLACE TEMP TABLE` for intermediary staging to avoid name conflicts
