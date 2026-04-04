'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: '売上', label: '売上' },
  { value: '外注費', label: '外注費' },
  { value: '給料手当', label: '人件費' },
  { value: '地代家賃', label: '家賃' },
  { value: '消耗品費', label: '消耗品' },
  { value: '旅費交通費', label: '交通費' },
  { value: '通信費', label: '通信費' },
  { value: '交際費', label: '交際費' },
  { value: '水道光熱費', label: '光熱費' },
  { value: '雑費', label: 'その他' },
];

export default function AddPage() {
  const { dispatch } = useApp();
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('消耗品費');
  const [counterparty, setCounterparty] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [done, setDone] = useState(false);

  const handleSave = () => {
    const tx = {
      id: `tx-manual-${Date.now()}`,
      date,
      time: new Date().toTimeString().slice(0, 5),
      description: description || counterparty,
      category: type === 'income' ? '売上' : category,
      categoryLabel: type === 'income' ? '売上' : (CATEGORIES.find(c => c.value === category)?.label || 'その他'),
      amount: parseInt(amount) || 0,
      type,
      source: '手動入力',
      counterparty: counterparty || description,
      status: 'processed' as const,
      confidence: 1.0,
    };

    dispatch({ type: 'ADD_TRANSACTIONS', transactions: [tx], pending: [] });
    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center">
          <span className="text-[36px]">✅</span>
        </div>
        <p className="text-[18px] font-bold text-[#1A3A5C]">記録しました</p>
        <div className="space-y-2">
          <button onClick={() => { setDone(false); setAmount(''); setDescription(''); setCounterparty(''); }} className="w-full py-3 bg-[#1A3A5C] text-white rounded-2xl text-[14px] font-bold">
            もう1件入力
          </button>
          <Link href="/" className="block w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[13px] text-center">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[#1A3A5C] p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-[17px] font-bold text-[#1A3A5C]">取引を記録</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {/* Type */}
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl text-[14px] font-bold transition-colors ${
                type === t ? 'bg-[#1A3A5C] text-white' : 'border-2 border-gray-200 text-gray-500'
              }`}
            >
              {t === 'expense' ? '支出' : '入金'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="text-[12px] font-bold text-gray-500 block mb-1">金額</label>
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-gray-400">¥</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 text-[24px] font-black text-[#1A3A5C] bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 outline-none focus:border-[#1A3A5C]"
            />
          </div>
        </div>

        {/* Counterparty */}
        <div>
          <label className="text-[12px] font-bold text-gray-500 block mb-1">取引先</label>
          <input
            type="text"
            value={counterparty}
            onChange={e => setCounterparty(e.target.value)}
            placeholder="例: ABC建設"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#1A3A5C]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[12px] font-bold text-gray-500 block mb-1">摘要</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="例: 3月分工事代金"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#1A3A5C]"
          />
        </div>

        {/* Category */}
        {type === 'expense' && (
          <div>
            <label className="text-[12px] font-bold text-gray-500 block mb-1">勘定科目</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c.value !== '売上').map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
                    category === c.value ? 'bg-[#1A3A5C] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="text-[12px] font-bold text-gray-500 block mb-1">日付</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#1A3A5C]"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!amount || parseInt(amount) === 0}
        className="w-full py-4 bg-[#1A3A5C] text-white rounded-2xl text-[15px] font-bold disabled:opacity-30"
      >
        記録する
      </button>
    </div>
  );
}
