/**
 * DrilldownChart — Shows area-level breakdown when user clicks a region.
 * Displays a bar chart of areas within the selected region.
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

export default function DrilldownChart({ data, region, onBack }: Props) {
  // Aggregate across years for the drilldown view
  const areaMap = new Map<string, number>();
  for (const row of data) {
    const current = areaMap.get(row.area) || 0;
    areaMap.set(row.area, current + Number(row.total_millions));
  }

  const chartData = [...areaMap.entries()]
    .map(([area, total]) => ({ name: area, value: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15); // Top 15 areas

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
        >
          ← Back to All Regions
        </button>
        <span className="text-sm text-slate-600">
          Showing top areas in <strong>{region}</strong>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 160, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v: number) => `₱${v.toLocaleString()}`} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()} M`, 'Total']} />
          <Bar dataKey="value" fill="#7c3aed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
