'use client';

import { useApp } from '@/lib/store';
import Link from 'next/link';

export default function CashflowPage() {
  const { state } = useApp();

  // 実データから月別集計
  const monthlyNet = new Map<string, number>();
  state.transactions.forEach(t => {
    const m = t.date.slice(0, 7); // "2026-03"
    const current = monthlyNet.get(m) || 0;
    monthlyNet.set(m, current + (t.type === 'income' ? t.amount : -t.amount));
  });

  // 実績月のバーを生成
  const sortedMonths = Array.from(monthlyNet.keys()).sort();
  let runningBalance = state.cashForecast.projectedBalance;
  const actualBars = sortedMonths.map(m => {
    const label = `${parseInt(m.split('-')[1])}月`;
    return { month: label, value: Math.round(runningBalance / 10000), actual: true };
  });

  // 予測月を追加（月間平均ネットで3ヶ月先を予測）
  const avgNet = sortedMonths.length > 0
    ? Array.from(monthlyNet.values()).reduce((s, v) => s + v, 0) / sortedMonths.length
    : 0;
  const lastBalance = runningBalance;
  const forecastBars = [1, 2, 3].map(i => {
    const val = Math.round((lastBalance + avgNet * i) / 10000);
    const mNum = sortedMonths.length > 0
      ? (parseInt(sortedMonths[sortedMonths.length - 1].split('-')[1]) + i)
      : i + 3;
    return { month: `${mNum > 12 ? mNum - 12 : mNum}月`, value: Math.max(0, val), actual: false };
  });

  const forecastData = [...actualBars.slice(-3), ...forecastBars];
  const maxVal = Math.max(...forecastData.map(d => d.value), 1);

  // 直近の大きな取引を表示
  const recentTx = state.transactions
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(t => ({
      type: (t.type === 'income' ? 'in' : 'out') as 'in' | 'out',
      name: t.counterparty,
      date: t.date.slice(5).replace('-', '/'),
      amount: t.amount,
    }));
  const level = state.cashForecast.level;
  const months = state.cashForecast.monthsRemaining;

  const safetyColor = level === 'safe' ? 'text-emerald-600' : level === 'caution' ? 'text-amber-600' : 'text-red-600';
  const safetyBg = level === 'safe' ? 'bg-emerald-500' : level === 'caution' ? 'bg-amber-500' : 'bg-red-500';
  const safetyLabel = level === 'safe' ? '安全' : level === 'caution' ? '注意' : '危険';
  const safetyPct = Math.min((months / 24) * 100, 100);

  return (
    <div className="pt-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="text-[#1A3A5C] p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-base font-bold text-[#1A3A5C]">資金繰り予測</h1>
      </div>

      {/* Safety indicator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <p className="text-xs text-gray-500 mb-1">資金の安全度</p>
        <p className={`text-4xl font-black ${safetyColor}`}>{safetyLabel}</p>
        <p className={`text-sm font-bold ${safetyColor} mt-1`}>あと{months}ヶ月以上</p>
        <div className="mt-3 mx-auto w-4/5 h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${safetyBg} rounded-full transition-all`} style={{ width: `${safetyPct}%` }} />
        </div>
        <div className="flex justify-between w-4/5 mx-auto mt-1 text-[11px] text-gray-400">
          <span>危険</span><span>注意</span><span>安全</span>
        </div>
      </div>

      {/* Forecast chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-[#1A3A5C] mb-3">月別予測（8ヶ月）</p>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex items-end gap-2 h-28" style={{ minWidth: `${forecastData.length * 52}px` }}>
            {forecastData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 min-w-[40px]">
                <span className="text-[11px] font-bold text-[#1A3A5C] whitespace-nowrap">{d.value}万</span>
                <div
                  className={`w-full rounded-t transition-all ${
                    d.actual ? 'bg-[#1A3A5C]' : 'bg-blue-100 border border-dashed border-blue-400'
                  }`}
                  style={{ height: `${(d.value / maxVal) * 80}px` }}
                />
                <span className={`text-[11px] whitespace-nowrap ${d.actual ? 'text-gray-500 font-bold' : 'text-blue-400'}`}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 justify-center mt-2 text-[11px] text-gray-500">
          <span>■ 実績</span><span className="text-blue-400">┅ AI予測</span>
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-[#1A3A5C] mb-3">今後の入出金予定</p>
        <div className="space-y-0">
          {recentTx.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                tx.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {tx.type === 'in' ? '↓' : '↑'}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800">{tx.name}</p>
                <p className="text-[11px] text-gray-400">{tx.date}</p>
              </div>
              <p className={`text-sm font-bold ${tx.type === 'in' ? 'text-emerald-600' : 'text-gray-700'}`}>
                {tx.type === 'in' ? '+' : '-'}¥{tx.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
