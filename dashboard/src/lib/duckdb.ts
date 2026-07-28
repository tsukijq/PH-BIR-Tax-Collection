import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let initPromise: Promise<void> | null = null;

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

export async function initDuckDB(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    conn = await db.connect();

    const parquetResp = await fetch('/cleaned_dataset.parquet');
    const parquetBuf = await parquetResp.arrayBuffer();
    await db.registerFileBuffer('bir.parquet', new Uint8Array(parquetBuf));

    const gaaResp = await fetch('/gaa_by_region.csv');
    const gaaBuf = await gaaResp.arrayBuffer();
    await db.registerFileBuffer('gaa.csv', new Uint8Array(gaaBuf));

    await conn.query(`CREATE VIEW bir_data AS SELECT * FROM read_parquet('bir.parquet');`);
    await conn.query(`
      CREATE VIEW gaa_data AS
      WITH raw_gaa AS (
        SELECT * FROM read_csv('gaa.csv', header = true, null_padding = true)
      )
      SELECT
        TRY_CAST("Year" AS INTEGER) AS year,
        region_name AS region,
        amount_val / 1000000.0 AS gaa_millions
      FROM raw_gaa
      UNPIVOT (
        amount_val FOR region_name IN (
          "Region I (Ilocos Region)",
          "Region II (Cagayan Valley)",
          "Region III (Central Luzon)",
          "Region IV-A (CALABARZON)",
          "Region V (Bicol Region)",
          "Region VI (Western Visayas)",
          "Region VII (Central Visayas)",
          "Region VIII (Eastern Visayas)",
          "Region IX (Zamboanga Peninsula)",
          "Region X (Northern Mindanao)",
          "Region XI (Davao Region)",
          "Region XII (SOCCSKSARGEN)",
          "National Capital Region (NCR)",
          "Cordillera Administrative Region (CAR)",
          "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
          "Region XIII (Caraga)",
          "Negros Island Region (NIR)"
        )
      )
      WHERE TRY_CAST("Year" AS INTEGER) BETWEEN 2020 AND 2024;
    `);
  })();

  return initPromise;
}

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  if (!conn) throw new Error('DuckDB not initialized');
  const result = await conn.query(sql);
  return result.toArray().map((row) => row.toJSON() as T);
}
