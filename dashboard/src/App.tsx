/**
 * App.tsx — Main Dashboard Orchestrator
 *
 * Manages state for filters, triggers queries, renders charts.
 * UI-only changes: layout, hierarchy, dark mode, skeleton states.
 * Query/data logic untouched.
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

export default function App() {
  const { ready, loading, error } = useDuckDB();

  // Filter state
  const [years, setYears] = useState<number[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([2024]);
  const [selectedRegion, setSelectedRegion] = useState('National Capital Region (NCR)');
  const [aggMode, setAggMode] = useState<AggMode>('total');

  // Chart data
  const [regionData, setRegionData] = useState<RegionTotal[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [gaaData, setGaaData] = useState<GaaComparison[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

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

  // Refresh trend chart when region or years change
  const refreshTrend = useCallback(async () => {
    if (!ready || selectedYears.length === 0) return;
    const trend = await getMonthlyTrend(selectedRegion, selectedYears);
    setTrendData(trend);
  }, [ready, selectedRegion, selectedYears]);

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
        <div className="max-w-sm p-6 space-y-2">
          <p className="text-sm font-medium text-red-500">Failed to initialize</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{error}</p>
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
        <div className="mb-10 py-3 px-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <Filters
            years={years}
            regions={regions}
            selectedYears={selectedYears}
            selectedRegion={selectedRegion}
            aggMode={aggMode}
            onYearsChange={setSelectedYears}
            onRegionChange={setSelectedRegion}
            onAggModeChange={setAggMode}
          />
        </div>

        {/* ── Primary Chart: Region Comparison / Drilldown ──────────────────── */}
        <section className="mb-12" aria-label="Regional tax collection">
          {drillRegion ? (
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 mb-4 text-sm" aria-label="Breadcrumb">
                <button
                  onClick={handleDrillBack}
                  className="text-[var(--color-accent)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
                >
                  All Regions
                </button>
                <span className="text-[var(--color-text-tertiary)]">/</span>
                <span className="text-[var(--color-text-secondary)]">{drillRegion}</span>
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
                <Skeleton height="500px" />
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
            <h2 className="text-base font-medium text-[var(--color-text-secondary)] mb-4">
              Monthly Trend
            </h2>
            {trendData.length === 0 ? (
              <Skeleton height="350px" />
            ) : (
              <MonthlyTrendChart data={trendData} region={selectedRegion} />
            )}
          </div>

          {/* GAA vs BIR */}
          <div>
            <h2 className="text-base font-medium text-[var(--color-text-secondary)] mb-4">
              GAA Budget vs Collection
            </h2>
            {chartsLoading ? (
              <Skeleton height="400px" />
            ) : (
              <GaaComparisonChart data={gaaData} year={selectedYears[selectedYears.length - 1]} />
            )}
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="mt-16 pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Data:{' '}
            <a
              href="https://data.bettergov.ph/datasets/20"
              className="hover:text-[var(--color-text-secondary)] underline underline-offset-2 transition-data"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bureau of Internal Revenue
            </a>
            {' '}(CC0 1.0) — Built with React, DuckDB-WASM, Recharts
          </p>
        </footer>
      </div>
    </div>
  );
}
