/**
 * MonthlyTrendChart — Line chart showing year-over-year monthly trends.
 * Clean axis labels, monospace tooltip values, clickable legend.
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { MonthlyTrend } from '../lib/queries';

const YEAR_COLORS: Record<number, string> = {
  2020: '#2563eb',
  2021: '#dc2626',
  2022: '#059669',
  2023: '#d97706',
  2024: '#7c3aed',
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  data: MonthlyTrend[];
  region: string;
}

export default function MonthlyTrendChart({ data, region }: Props) {
  const years = [...new Set(data.map((d) => Number(d.year)))].sort();

  const chartData = MONTH_LABELS.map((label, idx) => {
    const point: Record<string, string | number> = { month: label };
    for (const year of years) {
      const match = data.find((d) => Number(d.year) === year && Number(d.month_num) === idx + 1);
      point[String(year)] = match ? Number(match.total_millions) : 0;
    }
    return point;
  });

  const shortRegion = region
    .replace(/National Capital Region \(NCR\)/, 'NCR')
    .replace(/Bangsamoro.*/, 'BARMM')
    .replace(/Region\s+[\w-]+\s+\((.+)\)/, '$1');

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `₱${v.toLocaleString()}`}
          tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
          axisLine={false}
          tickLine={false}
          width={70}
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
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          formatter={(value) => <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>}
        />
        {years.map((year) => (
          <Line
            key={year}
            type="monotone"
            dataKey={String(year)}
            stroke={YEAR_COLORS[year] || '#666'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            name={`${year} — ${shortRegion}`}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
