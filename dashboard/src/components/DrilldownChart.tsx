/**
 * DrilldownChart — Area-level breakdown when user clicks a region.
 * Breadcrumb navigation is handled by parent (App.tsx).
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AreaDetail } from '../lib/queries';

interface Props {
  data: AreaDetail[];
  region: string;
  onBack: () => void;
}

export default function DrilldownChart({ data, region }: Props) {
  // Aggregate across years for the drilldown view
  const areaMap = new Map<string, number>();
  for (const row of data) {
    const current = areaMap.get(row.area) || 0;
    areaMap.set(row.area, current + Number(row.total_millions));
  }

  const chartData = [...areaMap.entries()]
    .map(([area, total]) => ({ name: area, value: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  return (
    <div>
      <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
        Top 15 areas in <span className="font-medium text-[var(--color-text-secondary)]">{region}</span> — total across selected years
      </p>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 150, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--color-border-subtle)" />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `₱${v.toLocaleString()}`}
            tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-sunken)' }}
            contentStyle={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
            }}
            formatter={(value) => [`₱${Number(value).toLocaleString()} M`, 'Total']}
            labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 500 }}
          />
          <Bar dataKey="value" fill="#7c3aed" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
