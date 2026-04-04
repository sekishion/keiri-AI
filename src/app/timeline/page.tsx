'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatAmount, groupByDate } from '@/lib/format';
import Link from 'next/link';

type Filter = 'all' | 'income' | 'expense' | 'pending';

export default function Timeline() {
  const { state } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = state.transactions.filter(t => {
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type === 'expense';
    if (filter === 'pending') return t.status === 'pending';
    return true;
  });

  const groupedMap = groupByDate(filtered);
  const grouped = Array.from(groupedMap.entries());
  const processed = state.transactions.filter(t => t.status === 'processed').length;
  const total = state.transactions.length;
  const pendingCount = state.transactions.filter(t => t.status === 'pending').length;

  const tabs: { id: Filter; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'income', label: '入金' },
    { id: 'expense', label: '出金' },
    { id: 'pending', label: '確認待ち' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-[17px] font-bold text-[#1A3A5C]">取引</h1>
        <span className="text-[12px] text-[#1A3A5C] font-bold">3月 ▼</span>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-[3px]">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`flex-1 py-[7px] text-[12px] font-medium rounded-md transition-all ${
              filter === t.id ? 'bg-white text-[#1A3A5C] font-bold shadow-sm' : 'text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex justify-between text-[11px] text-gray-400">
        <span>{total}件中 {processed}件処理済み</span>
        {pendingCount > 0 && (
          <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">確認待ち {pendingCount}件</span>
        )}
      </div>

      {/* Grouped transactions */}
      {grouped.map(([date, txs]) => (
        <div key={date}>
          <p className="text-[11px] font-bold text-gray-400 mb-1.5">{date}</p>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold ${
                  tx.status === 'pending' ? 'bg-amber-50 text-amber-500' :
                  tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-red-50 text-red-400'
                }`}>
                  {tx.status === 'pending' ? '？' : tx.type === 'income' ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{tx.counterparty}</p>
                  <p className={`text-[11px] ${tx.status === 'pending' ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
                    {tx.status === 'pending' ? '確認待ち' : tx.categoryLabel} ・ {tx.source.split(' ')[0]}
                  </p>
                </div>
                <p className={`text-[14px] font-bold ${
                  tx.type === 'income' ? 'text-emerald-600' : 'text-gray-700'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[32px] mb-2">📭</p>
          <p className="text-[13px] text-gray-400">該当する取引はありません</p>
        </div>
      )}
    </div>
  );
}
