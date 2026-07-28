/**
 * App.tsx — Main Dashboard Orchestrator
 *
 * Manages state for filters, triggers queries, renders charts.
 * Drill-down: clicking a region in the bar chart re-queries area-level data.
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
    const [barData, gaa] = await Promise.all([
      getCollectionByRegion(selectedYears, aggMode),
      getGaaVsBir(selectedYears[selectedYears.length - 1]), // GAA uses latest selected year
    ]);
    setRegionData(barData);
    setGaaData(gaa);
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

  // ─── RENDER ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading DuckDB-WASM and dataset...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Initialization Error</h2>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">
          🇵🇭 PH BIR Tax Collection Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Powered by DuckDB-WASM — All queries run in your browser
        </p>
      </header>

      {/* Filters */}
      <div className="mb-6">
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Region Bar Chart or Drill-down */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            {drillRegion
              ? `📊 Area Breakdown — ${drillRegion}`
              : `📊 Tax Collection by Region (${selectedYears.join(', ')} — ${aggMode})`}
          </h2>
          {drillRegion ? (
            <DrilldownChart data={drillData} region={drillRegion} onBack={handleDrillBack} />
          ) : (
            <RegionBarChart data={regionData} onRegionClick={handleRegionClick} />
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            📈 Monthly Trend — {selectedRegion.replace(/Region\s+[\w-]+\s+\((.+)\)/, '$1')}
          </h2>
          <MonthlyTrendChart data={trendData} region={selectedRegion} />
        </div>

        {/* GAA vs BIR */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            ⚖️ GAA Budget vs BIR Collection — {selectedYears[selectedYears.length - 1]}
          </h2>
          <GaaComparisonChart data={gaaData} year={selectedYears[selectedYears.length - 1]} />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-8 text-xs text-slate-400">
        Data: <a href="https://data.bettergov.ph/datasets/20" className="text-blue-500 hover:underline" target="_blank" rel="noopener">BIR Tax Collection</a> (CC0 1.0) |
        Built with React + DuckDB-WASM + Recharts
      </footer>
    </div>
  );
}
