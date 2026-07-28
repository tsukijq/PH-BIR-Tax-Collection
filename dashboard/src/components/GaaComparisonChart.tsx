/**
 * GaaComparisonChart — Grouped bar: GAA Budget vs BIR Collection by region.
 * Paired colors (blue for budget, green for actual) with accessible contrast.
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { GaaComparison } from '../lib/queries';

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
  data: GaaComparison[];
  year: number;
}

export default function GaaComparisonChart({ data, year }: Props) {
  const chartData = data.map((d) => ({
    name: shortenRegion(d.region),
    gaa: Number(d.gaa_millions),
    bir: Number(d.bir_millions),
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 56 }}>
        <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="name"
          angle={-40}
          textAnchor="end"
          height={70}
          tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}B`}
          tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
          }}
          formatter={(value) => [`₱${Number(value).toLocaleString()} M`]}
          labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 500, fontFamily: 'var(--font-sans)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>}
        />
        <Bar dataKey="gaa" name={`GAA Budget ${year}`} fill="#2563eb" opacity={0.6} radius={[2, 2, 0, 0]} />
        <Bar dataKey="bir" name={`BIR Collection ${year}`} fill="#059669" opacity={0.85} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
