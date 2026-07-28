/**
 * Filters — Year and Region selection controls.
 */

interface Props {
  years: number[];
  regions: string[];
  selectedYears: number[];
  selectedRegion: string;
  aggMode: 'total' | 'average';
  onYearsChange: (years: number[]) => void;
  onRegionChange: (region: string) => void;
  onAggModeChange: (mode: 'total' | 'average') => void;
}

export default function Filters({
  years, regions, selectedYears, selectedRegion, aggMode,
  onYearsChange, onRegionChange, onAggModeChange,
}: Props) {
  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        onYearsChange(selectedYears.filter((y) => y !== year));
      }
    } else {
      onYearsChange([...selectedYears, year].sort());
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Year toggles */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">Years:</span>
        {years.map((year) => (
          <button
            key={year}
            onClick={() => toggleYear(year)}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              selectedYears.includes(year)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Region select */}
      <div className="flex items-center gap-2">
        <label htmlFor="region-select" className="text-sm font-semibold text-slate-600">
          Region:
        </label>
        <select
          id="region-select"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Aggregation mode */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">Mode:</span>
        <button
          onClick={() => onAggModeChange('total')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${
            aggMode === 'total'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-green-400'
          }`}
        >
          Total
        </button>
        <button
          onClick={() => onAggModeChange('average')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${
            aggMode === 'average'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-green-400'
          }`}
        >
          Average
        </button>
      </div>
    </div>
  );
}
