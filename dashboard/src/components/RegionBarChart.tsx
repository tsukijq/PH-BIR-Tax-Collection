/**
 * RegionBarChart — Horizontal bar chart comparing tax collection across regions.
 * Clicking a bar triggers drill-down. Uses consistent region colors.
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { RegionTotal } from '../lib/queries';

const REGION_COLOR_MAP: Record<string, string> = {
  'National Capital Region (NCR)': '#3b82f6',
  'Region III (Central Luzon)': '#06b6d4',
  'Region IV-A (CALABARZON)': '#10b981',
  'Region VII (Central Visayas)': '#f59e0b',
  'Region VI (Western Visayas)': '#8b5cf6',
  'Region XI (Davao Region)': '#ef4444',
  'Region I (Ilocos Region)': '#14b8a6',
  'Region V (Bicol Region)': '#f97316',
  'Region X (Northern Mindanao)': '#6366f1',
  'Region VIII (Eastern Visayas)': '#84cc16',
  'Region II (Cagayan Valley)': '#ec4899',
  'Region XII (SOCCSKSARGEN)': '#eab308',
  'Cordillera Administrative Region (CAR)': '#0ea5e9',
  'Region XIII (Caraga)': '#22c55e',
  'Region IX (Zamboanga Peninsula)': '#a855f7',
  'Negros Island Region (NIR)': '#6366f1',
  'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)': '#f43f5e',
  'MIMAROPA Region': '#d946ef',
};

const FALLBACK_COLOR = '#71717a';

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

interface Props {
  data: RegionTotal[];
  onRegionClick?: (region: string) => void;
}

export default function RegionBarChart({ data, onRegionClick }: Props) {
  const chartData = data.map((d) => ({
    name: shortenRegion(d.region),
    fullName: d.region,
    value: Number(d.total_millions),
    color: REGION_COLOR_MAP[d.region] || FALLBACK_COLOR,
  }));

  return (
    <ResponsiveContainer width="100%" height={540}>
      <BarChart data={chartData} layout="vertical" barCategoryGap="20%" margin={{ left: 70, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-border-subtle)" />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}B`}
          tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={68}
          tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-surface-sunken)', radius: 4 }}
          contentStyle={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            padding: '8px 12px',
          }}
          formatter={(value) => [`₱${Number(value).toLocaleString()} M`, 'Collection']}
          labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600, fontFamily: 'var(--font-sans)', marginBottom: '2px' }}
        />
        <Bar
          dataKey="value"
          cursor="pointer"
          radius={[0, 6, 6, 0]}
          onClick={(_data, index) => {
            if (index !== undefined && chartData[index]) {
              onRegionClick?.(chartData[index].fullName);
            }
          }}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
