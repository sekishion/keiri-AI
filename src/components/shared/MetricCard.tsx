'use client';

import type { MetricCardProps } from '@/types';

export function MetricCard({ label, value, change, changeType }: MetricCardProps) {
  const changeColor =
    changeType === 'positive' ? 'text-blue-600' :
    changeType === 'negative' ? 'text-red-500' :
    'text-gray-400';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-w-[140px] flex-shrink-0">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-600">{value}</p>
      {change && (
        <p className={`text-sm font-medium mt-1 ${changeColor}`}>
          {change}
        </p>
      )}
    </div>
  );
}
