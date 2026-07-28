/**
 * App.tsx — Main Dashboard Orchestrator
 *
 * Manages state for filters, triggers queries, renders charts.
 * Multi-select regions, drill-down breadcrumb, per-chart states.
 * Query/data logic in lib/queries.ts — untouched.
 */

import { useState, useEffect, useCallback } from 'react';
import { useDuckDB } from './hooks/useDuckDB';
import {
  getYears, getRegions, getCollectionByRegion,
  getMonthlyTrend, getGaaVsBir, getRegionDrilldown,
  type RegionTotal, type MonthlyTrend, type GaaComparison, type AreaDetail, type AggMode,
} from './lib/queries';
import Filters from './components/Filters';
import RegionBarChart from './components/RegionBarChart';
import MonthlyTrendChart from './components/MonthlyTrendChart';
import GaaComparisonChart from './components/GaaComparisonChart';
import DrilldownChart from './components/DrilldownChart';
import ThemeToggle from './components/ThemeToggle';
import Skeleton from './components/Skeleton';
import EmptyState from './components/EmptyState';

const DEFAULT_REGIONS = ['National Capital Region (NCR)'];

export default function App() {
  const { ready, loading, error } = useDuckDB();

  // Filter state
  const [years, setYears] = useState<number[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([2024]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [aggMode, setAggMode] = useState<AggMode>('total');

  // Chart data
  const [regionData, setRegionData] = useState<RegionTotal[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [gaaData, setGaaData] = useState<GaaComparison[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  // Drill-down state
  const [drillRegion, setDrillRegion] = useState<string | null>(null);
  const [drillData, setDrillData] = useState<AreaDetail[]>([]);

  // Load filter options once DB is ready
  useEffect(() => {
    if (!ready) return;
    Promise.all([getYears(), getRegions()]).then(([y, r]) => {
      setYears(y);
      setRegions(r);
    });
  }, [ready]);

  // Refresh bar chart + GAA when years or aggMode change
  const refreshRegionCharts = useCallback(async () => {
    if (!ready || selectedYears.length === 0) return;
    setChartsLoading(true);
    const [barData, gaa] = await Promise.all([
      getCollectionByRegion(selectedYears, aggMode),
      getGaaVsBir(selectedYears[selectedYears.length - 1]),
    ]);
    setRegionData(barData);
    setGaaData(gaa);
    setChartsLoading(false);
  }, [ready, selectedYears, aggMode]);

  useEffect(() => { refreshRegionCharts(); }, [refreshRegionCharts]);

  // Refresh trend chart — use first selected region (or top region from data)
  const trendRegion = selectedRegions.length > 0
    ? selectedRegions[0]
    : (regionData[0]?.region || 'National Capital Region (NCR)');

  const refreshTrend = useCallback(async () => {
    if (!ready || selectedYears.length === 0) return;
    setTrendLoading(true);
    const trend = await getMonthlyTrend(trendRegion, selectedYears);
    setTrendData(trend);
    setTrendLoading(false);
  }, [ready, trendRegion, selectedYears]);

  useEffect(() => { refreshTrend(); }, [refreshTrend]);

  // Drill-down handler
  const handleRegionClick = useCallback(async (region: string) => {
    if (!ready) return;
    setDrillRegion(region);
    const detail = await getRegionDrilldown(region, selectedYears);
    setDrillData(detail);
  }, [ready, selectedYears]);

  const handleDrillBack = () => {
    setDrillRegion(null);
    setDrillData([]);
  };

  // Reset all filters
  const handleReset = () => {
    setSelectedYears([years[years.length - 1] || 2024]);
    setSelectedRegions(DEFAULT_REGIONS);
    setAggMode('total');
    setDrillRegion(null);
    setDrillData([]);
  };

  // Computed summary metrics
  const totalCollection = regionData.reduce((sum, r) => sum + Number(r.total_millions), 0);
  const topRegion = regionData[0];

  // ─── LOADING STATE ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Initializing DuckDB-WASM...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="max-w-sm p-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 space-y-2">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Failed to initialize DuckDB-WASM</p>
          <p className="text-xs text-red-500 dark:text-red-400/70">{error}</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-3">
            Check browser console and ensure the Parquet file is in <code className="font-mono">public/</code>.
          </p>
        </div>
      </div>
    );
  }

  // ─── MAIN LAYOUT ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-data">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              BIR Tax Collection
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
              Philippines • {selectedYears.join('–')} • All queries run client-side
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* ── Summary Metrics ───────────────────────────────────────────────── */}
        {!chartsLoading && regionData.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-14" aria-label="Key metrics">
            <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
                Total Collection
              </p>
              <p className="font-data text-3xl md:text-4xl font-semibold tracking-tight">
                ₱{Math.round(totalCollection).toLocaleString()}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 font-medium">millions PHP</p>
            </div>
            <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
                Top Region
              </p>
              <p className="text-base md:text-lg font-semibold truncate">{topRegion?.region}</p>
              <p className="font-data text-sm text-[var(--color-text-secondary)] mt-1">
                ₱{Math.round(Number(topRegion?.total_millions || 0)).toLocaleString()} M
              </p>
            </div>
            <div className="hidden md:block p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
                Regions Tracked
              </p>
              <p className="font-data text-3xl md:text-4xl font-semibold tracking-tight">{regionData.length}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 font-medium">active regions</p>
            </div>
          </section>
        )}

        {/* ── Filters ───────────────────────────────────────────────────────── */}
        <div className="mb-10 py-3 px-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] relative">
          <Filters
            years={years}
            regions={regions}
            selectedYears={selectedYears}
            selectedRegions={selectedRegions}
            aggMode={aggMode}
            onYearsChange={setSelectedYears}
            onRegionsChange={setSelectedRegions}
            onAggModeChange={setAggMode}
            onReset={handleReset}
          />
        </div>

        {/* ── Primary Chart: Region Comparison / Drilldown ──────────────────── */}
        <section className="mb-12" aria-label="Regional tax collection">
          {drillRegion ? (
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 mb-4 text-sm bg-[var(--color-surface-sunken)] px-4 py-2.5 rounded-lg" aria-label="Breadcrumb">
                <span className="text-[var(--color-text-tertiary)]">Viewing:</span>
                <span className="font-medium text-[var(--color-text-primary)]">{drillRegion}</span>
                <span className="text-[var(--color-text-tertiary)]">—</span>
                <button
                  onClick={handleDrillBack}
                  className="text-[var(--color-accent)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
                >
                  ← All regions
                </button>
              </nav>
              <DrilldownChart data={drillData} region={drillRegion} onBack={handleDrillBack} />
            </div>
          ) : (
            <div>
              <h2 className="text-base font-medium text-[var(--color-text-secondary)] mb-4">
                Collection by Region
                <span className="ml-2 text-xs font-normal text-[var(--color-text-tertiary)]">
                  Click a bar to drill down
                </span>
              </h2>
              {chartsLoading ? (
                <Skeleton height="540px" />
              ) : regionData.length === 0 ? (
                <EmptyState message="No collection data for the selected years." />
              ) : (
                <RegionBarChart data={regionData} onRegionClick={handleRegionClick} />
              )}
            </div>
          )}
        </section>

        {/* ── Secondary Charts ──────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12" aria-label="Trend and comparison charts">
          {/* Monthly Trend */}
          <div>
            <h2 className="text-base font-medium text-[var(--color-text-secondary)] mb-1">
              Monthly Trend
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
              Year-over-year for {trendRegion.replace(/Region\s+[\w-]+\s+\((.+)\)/, '$1').replace(/National Capital Region \(NCR\)/, 'NCR')}
            </p>
            {trendLoading ? (
              <Skeleton height="320px" />
            ) : trendData.length === 0 ? (
              <EmptyState message="No trend data available for this region." />
            ) : (
              <MonthlyTrendChart data={trendData} region={trendRegion} />
            )}
          </div>

          {/* GAA vs BIR */}
          <div>
            <h2 className="text-base font-medium text-[var(--color-text-secondary)] mb-1">
              GAA Budget vs Collection
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
              {selectedYears[selectedYears.length - 1]} — General Appropriations Act allocation vs actual BIR revenue
            </p>
            {chartsLoading ? (
              <Skeleton height="380px" />
            ) : gaaData.length === 0 ? (
              <EmptyState message="No GAA comparison data for this year." />
            ) : (
              <GaaComparisonChart data={gaaData} year={selectedYears[selectedYears.length - 1]} />
            )}
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="mt-16 pt-6 border-t border-[var(--color-border)] space-y-2">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Data current through 2024 — sourced from BIR /{' '}
            <a
              href="https://data.bettergov.ph/datasets/20"
              className="hover:text-[var(--color-text-secondary)] underline underline-offset-2 transition-data"
              target="_blank"
              rel="noopener noreferrer"
            >
              BetterGov.PH Open Data Portal
            </a>
            . Updated when the next year's collection data is published.
          </p>
          <p className="text-[10px] text-[var(--color-text-tertiary)]/60">
            As of July 2026 • Built with React, DuckDB-WASM, Recharts
          </p>
        </footer>
      </div>
    </div>
  );
}
