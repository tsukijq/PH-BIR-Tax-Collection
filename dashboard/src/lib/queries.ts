import { query } from './duckdb';

export interface RegionTotal { region: string; total_millions: number; }
export interface MonthlyTrend { year: number; month: string; month_num: number; total_millions: number; }
export interface GaaComparison { region: string; gaa_millions: number; bir_millions: number; }
export interface AreaDetail { area: string; year: number; total_millions: number; }
export type AggMode = 'total' | 'average';

export async function getYears(): Promise<number[]> {
  const rows = await query<{ year: number }>(`SELECT DISTINCT year FROM bir_data ORDER BY year;`);
  return rows.map((r) => Number(r.year));
}

export async function getRegions(): Promise<string[]> {
  const rows = await query<{ region: string }>(`SELECT DISTINCT region FROM bir_data ORDER BY region;`);
  return rows.map((r) => r.region);
}

export async function getCollectionByRegion(years: number[], mode: AggMode = 'total'): Promise<RegionTotal[]> {
  const aggFn = mode === 'average' ? 'AVG' : 'SUM';
  return query<RegionTotal>(`
    SELECT region, ROUND(${aggFn}(amount_millions), 2) AS total_millions
    FROM bir_data WHERE year IN (${years.join(',')})
    GROUP BY region ORDER BY total_millions DESC;
  `);
}

export async function getMonthlyTrend(region: string, years: number[]): Promise<MonthlyTrend[]> {
  const escaped = region.replace(/'/g, "''");
  return query<MonthlyTrend>(`
    SELECT year, month, month_num, ROUND(SUM(amount_millions), 2) AS total_millions
    FROM bir_data WHERE region = '${escaped}' AND year IN (${years.join(',')})
    GROUP BY year, month, month_num ORDER BY year, month_num;
  `);
}

export async function getGaaVsBir(year: number): Promise<GaaComparison[]> {
  return query<GaaComparison>(`
    WITH bir_totals AS (
      SELECT region, ROUND(SUM(amount_millions), 2) AS bir_millions
      FROM bir_data WHERE year = ${year} GROUP BY region
    ),
    gaa_totals AS (
      SELECT region, ROUND(gaa_millions, 2) AS gaa_millions
      FROM gaa_data WHERE year = ${year}
    )
    SELECT COALESCE(b.region, g.region) AS region,
           COALESCE(g.gaa_millions, 0) AS gaa_millions,
           COALESCE(b.bir_millions, 0) AS bir_millions
    FROM bir_totals b FULL OUTER JOIN gaa_totals g ON b.region = g.region
    WHERE COALESCE(b.bir_millions, 0) > 0 OR COALESCE(g.gaa_millions, 0) > 0
    ORDER BY bir_millions DESC;
  `);
}

export async function getRegionDrilldown(region: string, years: number[]): Promise<AreaDetail[]> {
  const escaped = region.replace(/'/g, "''");
  return query<AreaDetail>(`
    SELECT area, year, ROUND(SUM(amount_millions), 2) AS total_millions
    FROM bir_data WHERE region = '${escaped}' AND year IN (${years.join(',')})
    GROUP BY area, year ORDER BY total_millions DESC;
  `);
}
