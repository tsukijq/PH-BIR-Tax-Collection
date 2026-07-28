/**
 * GaaComparisonChart — Grouped bar chart: GAA Budget vs BIR Collection by region.
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
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ left: 20, right: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v: number) => `₱${v.toLocaleString()}`} />
        <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()} M`]} />
        <Legend />
        <Bar dataKey="gaa" name={`GAA Budget ${year}`} fill="#2563eb" opacity={0.7} />
        <Bar dataKey="bir" name={`BIR Collection ${year}`} fill="#059669" opacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  );
}
