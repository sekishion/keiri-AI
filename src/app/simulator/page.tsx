'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import Link from 'next/link';

export default function SimulatorPage() {
  const { state } = useApp();
  // 実データから初期値を計算
  const realIncome = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const realExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const [revenue, setRevenue] = useState(realIncome || 7800000);
  const [expenses, setExpenses] = useState(realExpense || 6220000);
  const profit = revenue - expenses;
  const profitRate = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';
  const annualProfit = profit * 12;
  const annualRevenue = revenue * 12;
  const estimatedTax = Math.max(0, annualProfit * 0.3);
  const breakeven = expenses;

  const [tab, setTab] = useState<'forecast' | 'whatif' | 'tax'>('forecast');

  return (
    <div className="pt-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="text-[#1A3A5C] p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-base font-bold text-[#1A3A5C]">シミュレーション</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-200 rounded-lg p-0.5">
        {[
          { id: 'forecast' as const, label: '決算予測' },
          { id: 'whatif' as const, label: 'What-if' },
          { id: 'tax' as const, label: '税金' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${tab === t.id ? 'bg-white text-[#1A3A5C] shadow-sm' : 'text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'forecast' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-xs text-gray-500 mb-1">今のペースが続くと…</p>
            <p className="text-sm font-bold text-[#1A3A5C] mb-3">2026年度 決算予測</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-[11px] text-emerald-600">年間売上</p>
                <p className="text-xl font-black text-emerald-700">¥{(annualRevenue / 10000).toLocaleString()}万</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-[11px] text-blue-600">年間利益</p>
                <p className="text-xl font-black text-blue-700">¥{(annualProfit / 10000).toLocaleString()}万</p>
              </div>
            </div>
            <div className="mt-3 bg-amber-50 rounded-lg p-2 text-xs text-amber-800">
              💡 予想法人税: 約¥{(estimatedTax / 10000).toLocaleString()}万（実効税率30%で概算）
            </div>
          </div>
        </div>
      )}

      {tab === 'whatif' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-[#1A3A5C] mb-3">もし売上が変わったら？</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">月間売上</span>
                  <span className="font-bold text-[#1A3A5C]">¥{revenue.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15000000}
                  step={100000}
                  value={revenue}
                  onChange={(e) => setRevenue(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A3A5C]"
                />
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>¥0</span><span>¥1,500万</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">月間費用</span>
                  <span className="font-bold text-[#1A3A5C]">¥{expenses.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15000000}
                  step={100000}
                  value={expenses}
                  onChange={(e) => setExpenses(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A3A5C]"
                />
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>¥0</span><span>¥1,500万</span>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-baseline">
                <div>
                  <p className="text-xs text-gray-500">月間利益</p>
                  <p className={`text-2xl font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ¥{profit.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">利益率</p>
                  <p className={`text-lg font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profitRate}%
                  </p>
                </div>
              </div>

              <div className="bg-sky-50 rounded-lg p-3 text-xs text-sky-800 leading-relaxed">
                🤖 {profit >= 0
                  ? `赤字ラインは月売上¥${breakeven.toLocaleString()}以下です。${revenue > breakeven * 1.2 ? 'まだ余裕があります。' : '注意が必要です。'}`
                  : `現在赤字です。売上を¥${(breakeven - revenue).toLocaleString()}増やすか、費用を削減する必要があります。`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tax' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-[#1A3A5C] mb-3">節税チェック</p>

            {[
              { icon: '✅', title: '小規模企業共済', desc: '月¥7万 → 年¥84万の所得控除', save: '節税¥25万', color: 'bg-emerald-50 text-emerald-600' },
              { icon: '💡', title: '経営セーフティ共済', desc: '月¥20万 → 年¥240万を経費化', save: '節税¥72万', color: 'bg-blue-50 text-blue-600' },
              { icon: '💡', title: '役員報酬の最適化', desc: '法人税+所得税+社保のバランス', save: 'シミュレーション→', color: 'bg-blue-50 text-blue-600', isLink: true },
              { icon: '💡', title: '消費税（原則 vs 簡易）', desc: '簡易課税の方が有利な可能性', save: '要検討', color: 'bg-amber-50 text-amber-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">{item.title}</p>
                  <p className="text-[11px] text-gray-500">{item.desc}</p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${item.color}`}>
                  {item.save}
                </span>
              </div>
            ))}

            <div className="mt-3 bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">節税ポテンシャル合計</p>
              <p className="text-xl font-black text-emerald-600">約¥97万/年</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
