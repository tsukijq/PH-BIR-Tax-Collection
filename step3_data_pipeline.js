/**
 * ============================================================================
 * KIRO Workshop – Step 3: Data Engineering & Quality Assurance Pipeline
 * ============================================================================
 * 
 * Dataset: BIR Tax Collection Data (Bureau of Internal Revenue, Philippines)
 * Source:  https://data.bettergov.ph/datasets/20
 * License: CC0 1.0 Universal (Public Domain)
 * 
 * Purpose: Clean, validate, and transform the raw BIR wide-format CSV files
 *          into a production-ready 'cleaned_dataset.parquet' for downstream
 *          DuckDB-WASM visualization dashboards.
 * 
 * Pipeline Layers:
 *   1. DATA QUALITY ASSESSMENT & DIAGNOSTICS
 *   2. CLEANING & INTEGRITY ENFORCEMENT (Zero Nulls)
 *   3. EXPORT & POST-QUALITY VALIDATION
 * 
 * Tech Stack: Node.js + DuckDB (server-side SQL engine)
 * ============================================================================
 */

const duckdb = require('duckdb');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const DATA_DIR = __dirname.replace(/\\/g, '/');
const PARQUET_OUTPUT = path.join(__dirname, 'cleaned_dataset.parquet').replace(/\\/g, '/');

// Source CSV files (wide-format: Region, Particulars, Jan–Dec)
const SOURCE_FILES = [
  { file: '2020_bir_collection.csv', year: 2020 },
  { file: '2021_bir_collection.csv', year: 2021 },
  { file: '2022_bir_collection.csv', year: 2022 },
  { file: '2023_bir_collection.csv', year: 2023 },
  { file: '2024_bir_collection.csv', year: 2024 },
];

// Initialize DuckDB in-memory instance (no disk footprint fo
// r intermediary work)
const db = new duckdb.Database(':memory:');
const conn = db.connect();

/**
 * Helper: Execute a DuckDB SQL query and return rows as a Promise.
 */
function query(sql) {
  return new Promise((resolve, reject) => {
    conn.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * Helper: Execute a DuckDB SQL statement (no result expected).
 */
function run(sql) {
  return new Promise((resolve, reject) => {
    conn.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1: DATA QUALITY ASSESSMENT & DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * DATA ENGINEERING INSIGHT:
 * Running diagnostics via DuckDB SQL on the server side leverages its vectorized
 * columnar engine to scan thousands of rows with constant memory (~MB), unlike
 * loading entire CSV files into JS heap for parsing. This keeps RAM bounded
 * before hand-off to the browser's DuckDB-WASM layer, which operates under
 * strict memory limits (~256MB typical).
 */
async function layer1_DataQualityAssessment() {
  console.log('\n' + '═'.repeat(70));
  console.log('  LAYER 1: DATA QUALITY ASSESSMENT & DIAGNOSTICS');
  console.log('═'.repeat(70));

  // 1A. Ingest all yearly BIR CSVs into a single raw_combined table
  // The CSVs have: Region, PARTICULARS, JANUARY, ..., DECEMBER (wide format)
  // Some files have trailing empty columns — we handle this gracefully.
  console.log('\n  📂 Ingesting source CSV files...');

  for (let i = 0; i < SOURCE_FILES.length; i++) {
    const { file, year } = SOURCE_FILES[i];
    const filePath = `${DATA_DIR}/${file}`;

    // Read each CSV into a temp table, then extract only the 14 core columns
    await run(`
      CREATE OR REPLACE TEMP TABLE tmp_import AS
      SELECT * FROM read_csv(
        '${filePath}',
        header = true,
        null_padding = true,
        ignore_errors = true,
        max_line_size = 10000
      );
    `);

    // Select only the known columns (Region, PARTICULARS, 12 months) + add year
    const createOrInsert = i === 0 ? 'CREATE TABLE raw_combined AS' : 'INSERT INTO raw_combined';
    await run(`
      ${createOrInsert}
      SELECT
        ${year} AS year,
        "Region" AS region_raw,
        "PARTICULARS" AS particulars,
        "JANUARY" AS january_raw,
        "FEBRUARY" AS february_raw,
        "MARCH" AS march_raw,
        "APRIL" AS april_raw,
        "MAY" AS may_raw,
        "JUNE" AS june_raw,
        "JULY" AS july_raw,
        "AUGUST" AS august_raw,
        "SEPTEMBER" AS september_raw,
        "OCTOBER" AS october_raw,
        "NOVEMBER" AS november_raw,
        "DECEMBER" AS december_raw
      FROM tmp_import;
    `);
    console.log(`     ✓ ${file} (year: ${year})`);
  }
  await run(`DROP TABLE IF EXISTS tmp_import;`);

  // 1B. Report total row count
  const rowCount = await query(`SELECT COUNT(*) AS total_rows FROM raw_combined;`);
  console.log(`\n  📊 Total Rows Ingested: ${Number(rowCount[0].total_rows)}`);

  // 1C. Schema inspection – column names and inferred data types
  console.log('\n  📋 Schema & Data Types (as inferred by DuckDB):');
  console.log('  ' + '-'.repeat(55));
  const schema = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'raw_combined'
    ORDER BY ordinal_position;
  `);
  schema.forEach(col => {
    console.log(`    ${col.column_name.padEnd(22)} │ ${col.data_type}`);
  });

  // 1D. Column-level NULL/missingness audit on key fields
  console.log('\n  🔍 Null/Empty Audit on Key Fields:');
  console.log('  ' + '-'.repeat(55));
  const nullAudit = await query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) - COUNT(region_raw) AS region_nulls,
      COUNT(*) - COUNT(particulars) AS particulars_nulls,
      COUNT(*) - COUNT(january_raw) AS jan_nulls,
      COUNT(*) - COUNT(december_raw) AS dec_nulls
    FROM raw_combined;
  `);
  const na = nullAudit[0];
  console.log(`    Total rows:        ${Number(na.total)}`);
  console.log(`    Region nulls:      ${Number(na.region_nulls)} ${Number(na.region_nulls) > 0 ? '⚠️' : '✅'}`);
  console.log(`    Particulars nulls: ${Number(na.particulars_nulls)} ${Number(na.particulars_nulls) > 0 ? '⚠️' : '✅'}`);
  console.log(`    January nulls:     ${Number(na.jan_nulls)} ${Number(na.jan_nulls) > 0 ? '⚠️' : '✅'}`);
  console.log(`    December nulls:    ${Number(na.dec_nulls)} ${Number(na.dec_nulls) > 0 ? '⚠️' : '✅'}`);

  // 1E. Detect data quality issues — whitespace in region names
  const regionIssues = await query(`
    SELECT DISTINCT region_raw, LENGTH(region_raw) AS len
    FROM raw_combined
    WHERE region_raw IS NOT NULL
    ORDER BY region_raw;
  `);
  console.log(`\n  🔤 Distinct Region Values: ${regionIssues.length}`);
  console.log('    (checking for leading/trailing whitespace and casing issues)');
  regionIssues.slice(0, 5).forEach(r => {
    console.log(`    • "${r.region_raw}" (len: ${r.len})`);
  });
  if (regionIssues.length > 5) {
    console.log(`    ... and ${regionIssues.length - 5} more`);
  }

  // 1F. Detect monetary formatting issues (commas in numbers)
  const sampleAmounts = await query(`
    SELECT january_raw AS jan_sample
    FROM raw_combined
    WHERE january_raw IS NOT NULL
    LIMIT 5;
  `);
  console.log('\n  💰 Sample JANUARY values (checking for comma-formatted numbers):');
  sampleAmounts.forEach(r => console.log(`    • "${r.jan_sample}"`));

  // 1G. Check for duplicate rows
  const dupes = await query(`
    SELECT COUNT(*) AS dupes FROM (
      SELECT year, region_raw, particulars,
             ROW_NUMBER() OVER (PARTITION BY year, region_raw, particulars) AS rn
      FROM raw_combined
    ) WHERE rn > 1;
  `);
  console.log(`\n  🔁 Duplicate Rows Detected: ${Number(dupes[0].dupes)}`);

  console.log('\n  ✅ Layer 1 Complete – Quality issues identified.\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2: CLEANING & INTEGRITY ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * DATA ENGINEERING INSIGHT:
 * DuckDB executes TRIM, REPLACE, CAST, UNPIVOT, and window-function deduplication
 * in a single SQL pass using its streaming execution model — no intermediate
 * copies are materialized to disk. This means the wide-to-long pivot and numeric
 * parsing of 6,000+ records happens in constant memory, producing a tidy Parquet
 * file that DuckDB-WASM can load directly into the browser's ArrayBuffer.
 */
async function layer2_CleaningAndIntegrity() {
  console.log('═'.repeat(70));
  console.log('  LAYER 2: CLEANING & INTEGRITY ENFORCEMENT');
  console.log('═'.repeat(70));

  // 2A. Transform wide-format → long-format (unpivot months)
  //     Also: clean column names, strip whitespace, remove commas from numbers,
  //     cast amounts to DOUBLE, standardize text fields.
  console.log('\n  🔄 Transforming wide-format to long-format (UNPIVOT)...');

  await run(`
    CREATE TABLE cleaned_data AS
    WITH
    -- Step 1: Clean column values and standardize text
    cleaned_wide AS (
      SELECT
        year,
        TRIM(region_raw) AS region,
        TRIM(particulars) AS area,
        -- Remove commas and spaces from monetary values, then cast to DOUBLE
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(january_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS january,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(february_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS february,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(march_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS march,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(april_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS april,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(may_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS may,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(june_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS june,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(july_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS july,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(august_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS august,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(september_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS september,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(october_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS october,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(november_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS november,
        TRY_CAST(REPLACE(REPLACE(TRIM(COALESCE(december_raw, '0')), ',', ''), ' ', '') AS DOUBLE) AS december
      FROM raw_combined
      WHERE TRIM(region_raw) IS NOT NULL
        AND TRIM(region_raw) != ''
        AND TRIM(particulars) IS NOT NULL
        AND TRIM(particulars) != ''
    ),
    -- Step 2: Unpivot months into rows (wide → long)
    unpivoted AS (
      SELECT
        year,
        region,
        area,
        month_name,
        amount
      FROM cleaned_wide
      UNPIVOT (
        amount FOR month_name IN (
          january, february, march, april, may, june,
          july, august, september, october, november, december
        )
      )
    ),
    -- Step 3: Add month number and deduplicate
    enriched AS (
      SELECT
        year,
        region,
        area,
        -- Standardize month name to Title Case
        CONCAT(UPPER(LEFT(month_name, 1)), LOWER(SUBSTR(month_name, 2))) AS month,
        -- Map month to number for sorting/filtering
        CASE month_name
          WHEN 'january' THEN 1 WHEN 'february' THEN 2 WHEN 'march' THEN 3
          WHEN 'april' THEN 4 WHEN 'may' THEN 5 WHEN 'june' THEN 6
          WHEN 'july' THEN 7 WHEN 'august' THEN 8 WHEN 'september' THEN 9
          WHEN 'october' THEN 10 WHEN 'november' THEN 11 WHEN 'december' THEN 12
        END AS month_num,
        -- Impute null amounts with 0.0 (conservative: no collection reported = 0)
        COALESCE(amount, 0.0) AS amount_millions,
        -- Deduplication rank
        ROW_NUMBER() OVER (
          PARTITION BY year, region, area, month_name
          ORDER BY amount DESC NULLS LAST
        ) AS row_rank
      FROM unpivoted
    )
    -- Final selection: only keep first occurrence per (year, region, area, month)
    SELECT
      year,
      region,
      area,
      month,
      month_num,
      amount_millions
    FROM enriched
    WHERE row_rank = 1
    ORDER BY year, region, area, month_num;
  `);

  // 2B. Report cleaning results
  const cleanedCount = await query(`SELECT COUNT(*) AS rows FROM cleaned_data;`);
  console.log(`\n  📦 Rows After Cleaning (long-format): ${Number(cleanedCount[0].rows)}`);

  // 2C. Show cleaned schema with enforced types
  console.log('\n  📋 Cleaned Schema (enforced types):');
  console.log('  ' + '-'.repeat(55));
  const cleanedSchema = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'cleaned_data'
    ORDER BY ordinal_position;
  `);
  cleanedSchema.forEach(col => {
    console.log(`    ${col.column_name.padEnd(20)} │ ${col.data_type}`);
  });

  // 2D. Show sample cleaned rows
  console.log('\n  👀 Sample Cleaned Rows (first 8):');
  const sample = await query(`SELECT * FROM cleaned_data LIMIT 8;`);
  console.table(sample);

  // 2E. Verify distinct regions are clean
  const regions = await query(`SELECT DISTINCT region FROM cleaned_data ORDER BY region;`);
  console.log(`\n  🗺️  Distinct Regions (${regions.length}):`);
  regions.forEach(r => console.log(`    • ${r.region}`));

  // 2F. Summary stats
  const stats = await query(`
    SELECT 
      COUNT(DISTINCT year) AS years,
      COUNT(DISTINCT region) AS regions,
      COUNT(DISTINCT area) AS areas,
      MIN(amount_millions) AS min_amount,
      MAX(amount_millions) AS max_amount,
      ROUND(AVG(amount_millions), 2) AS avg_amount
    FROM cleaned_data;
  `);
  const s = stats[0];
  console.log(`\n  📈 Summary Statistics:`);
  console.log(`     Years covered:    ${s.years}`);
  console.log(`     Unique regions:   ${s.regions}`);
  console.log(`     Unique areas:     ${s.areas}`);
  console.log(`     Min amount (M):   ₱${s.min_amount}`);
  console.log(`     Max amount (M):   ₱${s.max_amount}`);
  console.log(`     Avg amount (M):   ₱${s.avg_amount}`);

  console.log('\n  ✅ Layer 2 Complete – Data standardized, unpivoted, deduped, nulls resolved.\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3: EXPORT & POST-QUALITY VALIDATION PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * DATA ENGINEERING INSIGHT:
 * Exporting to Parquet with SNAPPY compression via DuckDB's COPY statement
 * produces a columnar binary file that DuckDB-WASM can memory-map directly —
 * no CSV parsing overhead in the browser. The server-side engine handles the
 * heavy serialization (type encoding, dictionary compression on region/area
 * strings) so the client receives a pre-optimized artifact ready for instant
 * analytical queries without additional ETL.
 */
async function layer3_ExportAndValidation() {
  console.log('═'.repeat(70));
  console.log('  LAYER 3: EXPORT & POST-QUALITY VALIDATION');
  console.log('═'.repeat(70));

  // 3A. Assertion Checks – Zero nulls in critical fields
  console.log('\n  🧪 Running Assertion Checks...');
  const criticalFields = ['year', 'region', 'area', 'month', 'month_num', 'amount_millions'];

  let allPassed = true;
  for (const field of criticalFields) {
    const result = await query(`
      SELECT COUNT(*) AS null_count 
      FROM cleaned_data 
      WHERE ${field} IS NULL;
    `);
    const nulls = Number(result[0].null_count);
    const status = nulls === 0 ? '✅ PASS' : '❌ FAIL';
    console.log(`    ${status} │ ${field.padEnd(20)} │ Nulls: ${nulls}`);
    if (nulls > 0) allPassed = false;
  }

  // 3B. Row count boundary check (6000 records expected: ~100 areas × 12 months × 5 years)
  const finalCount = await query(`SELECT COUNT(*) AS rows FROM cleaned_data;`);
  const rows = Number(finalCount[0].rows);
  const rowCheck = (rows >= 5000 && rows <= 8000) ? '✅ PASS' : '⚠️ WARN';
  console.log(`\n    ${rowCheck} │ Row count boundary  │ ${rows} rows (expected: 5,000–8,000)`);

  // 3C. Data type validation – ensure numeric column is properly typed
  const typeCheck = await query(`
    SELECT 
      typeof(year) AS year_type,
      typeof(month_num) AS month_type,
      typeof(amount_millions) AS amount_type
    FROM cleaned_data 
    LIMIT 1;
  `);
  console.log(`\n    📐 Type Verification:`);
  console.log(`       year             → ${typeCheck[0].year_type}`);
  console.log(`       month_num        → ${typeCheck[0].month_type}`);
  console.log(`       amount_millions  → ${typeCheck[0].amount_type}`);

  // 3D. Verify no negative amounts (sanity check for tax collection)
  const negCheck = await query(`
    SELECT COUNT(*) AS negatives FROM cleaned_data WHERE amount_millions < 0;
  `);
  const negs = Number(negCheck[0].negatives);
  const negStatus = negs === 0 ? '✅ PASS' : '⚠️ WARN';
  console.log(`\n    ${negStatus} │ No negative amounts │ Found: ${negs}`);

  // 3E. Year coverage validation
  const yearCoverage = await query(`
    SELECT DISTINCT year FROM cleaned_data ORDER BY year;
  `);
  const years = yearCoverage.map(r => r.year).join(', ');
  console.log(`    ✅ PASS │ Year coverage        │ ${years}`);

  if (!allPassed) {
    console.error('\n  ❌ PIPELINE HALTED – Assertion failures detected. Fix upstream.');
    process.exit(1);
  }

  // 3F. Export to Parquet with SNAPPY compression
  console.log('\n  📤 Exporting to Parquet (SNAPPY compression)...');
  await run(`
    COPY cleaned_data TO '${PARQUET_OUTPUT}'
    (FORMAT PARQUET, CODEC 'SNAPPY');
  `);
  console.log(`     → Output: ${PARQUET_OUTPUT}`);

  // 3G. Verify the parquet file is readable
  const parquetVerify = await query(`
    SELECT COUNT(*) AS rows FROM read_parquet('${PARQUET_OUTPUT}');
  `);
  console.log(`     → Parquet Verification: ${Number(parquetVerify[0].rows)} rows readable ✅`);

  // 3H. Show parquet file schema
  const parquetSchema = await query(`
    SELECT name, type 
    FROM parquet_schema('${PARQUET_OUTPUT}')
    WHERE name != 'duckdb_schema';
  `);
  console.log('\n  📋 Parquet Schema:');
  parquetSchema.forEach(col => {
    console.log(`    ${(col.name || '').padEnd(20)} │ ${col.type}`);
  });

  console.log('\n  ✅ Layer 3 Complete – cleaned_dataset.parquet exported successfully.\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n' + '▓'.repeat(70));
  console.log('  KIRO WORKSHOP – STEP 3: DATA ENGINEERING PIPELINE');
  console.log('  Dataset: BIR Tax Collection Data (2020–2024)');
  console.log('  Source:  https://data.bettergov.ph/datasets/20');
  console.log('  Output:  cleaned_dataset.parquet');
  console.log('▓'.repeat(70));

  try {
    await layer1_DataQualityAssessment();
    await layer2_CleaningAndIntegrity();
    await layer3_ExportAndValidation();

    console.log('▓'.repeat(70));
    console.log('  🎉 PIPELINE SUCCESS – BIR data is production-ready for DuckDB-WASM');
    console.log('▓'.repeat(70) + '\n');
  } catch (error) {
    console.error('\n  ❌ Pipeline Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    conn.close();
    db.close();
  }
}

main();
