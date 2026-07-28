/**
 * Filters — Year toggles, multi-select region with chips, agg mode, reset action.
 */

import { useState, useRef, useEffect } from 'react';

interface Props {
  years: number[];
  regions: string[];
  selectedYears: number[];
  selectedRegions: string[];
  aggMode: 'total' | 'average';
  onYearsChange: (years: number[]) => void;
  onRegionsChange: (regions: string[]) => void;
  onAggModeChange: (mode: 'total' | 'average') => void;
  onReset: () => void;
}

function shortenRegion(region: string): string {
  return region
    .replace('Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)', 'BARMM')
    .replace('Cordillera Administrative Region (CAR)', 'CAR')
    .replace('National Capital Region (NCR)', 'NCR')
    .replace('Negros Island Region (NIR)', 'NIR')
    .replace('MIMAROPA Region', 'MIMAROPA')
    .replace(/Region\s+([\w-]+)\s+\(.+\)/, '$1')
    .replace(/Region\s+([\w-]+)/, '$1');
}

export default function Filters({
  years, regions, selectedYears, selectedRegions, aggMode,
  onYearsChange, onRegionsChange, onAggModeChange, onReset,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        onYearsChange(selectedYears.filter((y) => y !== year));
      }
    } else {
      onYearsChange([...selectedYears, year].sort());
    }
  };

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      onRegionsChange(selectedRegions.filter((r) => r !== region));
    } else {
      onRegionsChange([...selectedRegions, region]);
    }
  };

  const removeRegion = (region: string) => {
    onRegionsChange(selectedRegions.filter((r) => r !== region));
  };

  return (
    <div className="flex flex-wrap items-start gap-6 py-3 px-1">
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
      </fieldset>

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--color-border)] mt-1.5" aria-hidden="true" />

      {/* Multi-select Region */}
      <div className="flex flex-col gap-2" ref={dropdownRef}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Regions
          </span>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-2.5 py-1.5 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-data hover:border-[var(--color-accent)]"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            {selectedRegions.length === 0 ? 'Select regions…' : `${selectedRegions.length} selected`}
            <span className="ml-1.5 text-[var(--color-text-tertiary)]">▾</span>
          </button>
        </div>

        {/* Chips */}
        {selectedRegions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-w-md">
            {selectedRegions.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20"
              >
                {shortenRegion(r)}
                <button
                  onClick={() => removeRegion(r)}
                  className="hover:text-red-500 transition-data focus:outline-none"
                  aria-label={`Remove ${shortenRegion(r)}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dropdown */}
        {dropdownOpen && (
          <div
            className="absolute mt-1 z-20 w-72 max-h-56 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg"
            role="listbox"
            aria-label="Region selection"
          >
            {regions.map((r) => (
              <button
                key={r}
                role="option"
                aria-selected={selectedRegions.includes(r)}
                onClick={() => toggleRegion(r)}
                className={`w-full text-left px-3 py-2 text-sm transition-data hover:bg-[var(--color-surface-sunken)] focus:outline-none ${
                  selectedRegions.includes(r)
                    ? 'text-[var(--color-accent)] font-medium'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {selectedRegions.includes(r) && <span className="mr-1.5">✓</span>}
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--color-border)] mt-1.5" aria-hidden="true" />

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

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--color-border)] mt-1.5" aria-hidden="true" />

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] rounded-md transition-data focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        Reset all
      </button>
    </div>
  );
}
