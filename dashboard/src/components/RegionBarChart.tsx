/**
 * RegionBarChart — Horizontal bar chart comparing tax collection across regions.
 * Clicking a bar triggers drill-down into that region.
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { RegionTotal } from '../lib/queries';

const COLORS = [
  '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5',
  '#0d9488', '#c026d3', '#ca8a04', '#e11d48', '#0284c7',
  '#7c2d12', '#166534', '#4338ca',
];

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
  }));

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `₱${v.toLocaleString()}`}
          label={{ value: 'Amount (₱ Millions)', position: 'bottom', offset: 0 }}
        />
        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`₱${Number(value).toLocaleString()} M`, 'Collection']}
        />
        <Bar
          dataKey="value"
          cursor="pointer"
          onClick={(_data, index) => {
            if (index !== undefined && chartData[index]) {
              onRegionClick?.(chartData[index].fullName);
            }
          }}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
