/**
 * Filters — Persistent control bar with year toggles, region selector, and agg mode.
 * Minimalist: no heavy borders, uses spacing and subtle backgrounds for structure.
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

  const resetYears = () => onYearsChange(years.length ? [years[years.length - 1]] : []);

  return (
    <div className="flex flex-wrap items-center gap-6 py-3 px-1">
      {/* Year toggles */}
      <fieldset className="flex items-center gap-1.5" role="group" aria-label="Select years">
        <legend className="sr-only">Years</legend>
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)] mr-1">
          Years
        </span>
        {years.map((year) => (
          <button
            key={year}
            onClick={() => toggleYear(year)}
            aria-pressed={selectedYears.includes(year)}
            className={`px-3 py-1.5 text-sm font-mono tabular-nums rounded-md transition-data focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
              selectedYears.includes(year)
                ? 'bg-[var(--color-accent)] text-white shadow-sm shadow-blue-500/25'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] border border-transparent hover:border-[var(--color-border)]'
            }`}
          >
            {year}
          </button>
        ))}
        {selectedYears.length > 1 && (
          <button
            onClick={resetYears}
            className="ml-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-data"
            aria-label="Reset to latest year"
          >
            Reset
          </button>
        )}
      </fieldset>

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--color-border)]" aria-hidden="true" />

      {/* Region select */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="region-select"
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]"
        >
          Region
        </label>
        <select
          id="region-select"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="px-2.5 py-1.5 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-data"
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--color-border)]" aria-hidden="true" />

      {/* Aggregation mode */}
      <fieldset className="flex items-center gap-1.5" role="group" aria-label="Aggregation mode">
        <legend className="sr-only">Aggregation</legend>
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)] mr-1">
          Agg
        </span>
        {(['total', 'average'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onAggModeChange(mode)}
            aria-pressed={aggMode === mode}
            className={`px-3 py-1.5 text-sm capitalize rounded-md transition-data focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
              aggMode === mode
                ? 'bg-[var(--color-text-primary)] text-[var(--color-surface)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] border border-transparent hover:border-[var(--color-border)]'
            }`}
          >
            {mode}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
