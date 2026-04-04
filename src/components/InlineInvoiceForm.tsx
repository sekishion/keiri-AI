'use client';

import { useState } from 'react';
import { formatAmount } from '@/lib/format';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceFormData {
  client: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
}

export function InlineInvoiceForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: InvoiceFormData;
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<InvoiceFormData>(initial);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      }),
    }));
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    setData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const subtotal = data.items.reduce((s, i) => s + i.amount, 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm w-full max-w-[320px]">
      {/* ヘッダー */}
      <div className="bg-[#2D5A8E] px-3.5 py-2">
        <p className="text-white text-sm font-bold">請求書</p>
      </div>

      <div className="p-3 space-y-2">
        {/* 請求先・日付 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-gray-400">請求先</p>
            <input
              type="text" value={data.client}
              onChange={e => setData(prev => ({ ...prev, client: e.target.value }))}
              className="w-full text-sm font-medium text-slate-600 border-b border-gray-200 py-0.5 focus:outline-none focus:border-[#2D5A8E]"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-gray-400">発行日</p>
            <input type="date" value={data.date}
              onChange={e => setData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full text-xs text-slate-600 border-b border-gray-200 py-0.5 focus:outline-none" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400">支払期限</p>
            <input type="date" value={data.dueDate}
              onChange={e => setData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full text-xs text-slate-600 border-b border-gray-200 py-0.5 focus:outline-none" />
          </div>
        </div>

        {/* 品目テーブル */}
        <div>
          <div className="flex text-[10px] text-gray-400 gap-1 mb-1">
            <span className="flex-1">品目</span>
            <span className="w-10 text-right">数量</span>
            <span className="w-16 text-right">単価</span>
            <span className="w-16 text-right">金額</span>
            <span className="w-4"></span>
          </div>
          {data.items.map((item, i) => (
            <div key={i} className="flex gap-1 items-center mb-1">
              <input
                type="text" value={item.description}
                onChange={e => updateItem(i, 'description', e.target.value)}
                placeholder="品目名"
                className="flex-1 text-xs text-slate-600 border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:border-[#2D5A8E]"
              />
              <input
                type="number" value={item.quantity || ''}
                onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                className="w-10 text-xs text-right text-slate-600 border border-gray-200 rounded px-1 py-1 focus:outline-none"
              />
              <input
                type="text" inputMode="numeric" value={item.unitPrice || ''}
                onChange={e => updateItem(i, 'unitPrice', parseInt(e.target.value.replace(/[^\d]/g, '')) || 0)}
                className="w-16 text-xs text-right text-slate-600 border border-gray-200 rounded px-1 py-1 focus:outline-none"
              />
              <span className="w-16 text-xs text-right font-medium text-slate-600">
                {item.amount > 0 ? formatAmount(item.amount) : '—'}
              </span>
              <button onClick={() => removeItem(i)} className="w-4 text-gray-300 hover:text-red-400 text-xs">
                {data.items.length > 1 ? '×' : ''}
              </button>
            </div>
          ))}
          <button onClick={addItem} className="w-full text-xs text-[#2D5A8E] font-medium py-1 hover:bg-gray-50 rounded">
            + 追加
          </button>
        </div>

        {/* 集計 */}
        <div className="border-t border-gray-100 pt-2 space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">小計</span>
            <span className="text-slate-600">{formatAmount(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">消費税（10%）</span>
            <span className="text-slate-600">{formatAmount(tax)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1 mt-1">
            <span className="text-slate-600">合計</span>
            <span className="text-slate-600">{formatAmount(total)}</span>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 text-xs text-gray-500 py-2 rounded-lg border border-gray-200 font-medium">
            キャンセル
          </button>
          <button
            onClick={() => onSubmit(data)}
            disabled={!data.client || subtotal === 0}
            className={`flex-1 text-xs py-2 rounded-lg font-medium ${
              data.client && subtotal > 0
                ? 'bg-[#2D5A8E] text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            作成する
          </button>
        </div>
      </div>
    </div>
  );
}
