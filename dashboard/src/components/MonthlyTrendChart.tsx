/**
 * MonthlyTrendChart — Line chart showing year-over-year monthly trends for a region.
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
  // Pivot data: { month: 'Jan', 2020: val, 2021: val, ... }
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
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(v: number) => `₱${v.toLocaleString()}`} />
        <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()} M`]} />
        <Legend />
        {years.map((year) => (
          <Line
            key={year}
            type="monotone"
            dataKey={String(year)}
            stroke={YEAR_COLORS[year] || '#666'}
            strokeWidth={2}
            dot={false}
            name={`${year} — ${shortRegion}`}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
