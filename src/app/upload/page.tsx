'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/lib/store';
import { parseBankCSV } from '@/lib/csv-parser';
import { categorizeTransactions } from '@/lib/ai-categorize';
import { formatAmount } from '@/lib/format';
import Link from 'next/link';
import type { Transaction, PendingItem } from '@/types';

type Step = 'select' | 'processing' | 'preview' | 'done';

export default function UploadPage() {
  const { dispatch } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('select');
  const [fileName, setFileName] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStep('processing');
    setError('');

    try {
      const text = await file.text();
      const raw = parseBankCSV(text);

      if (raw.length === 0) {
        setError('CSVの読み込みに失敗しました。フォーマットを確認してください。');
        setStep('select');
        return;
      }

      const categorized = await categorizeTransactions(raw);

      const txs: Transaction[] = [];
      const pends: PendingItem[] = [];

      categorized.forEach((c, i) => {
        const tx: Transaction = {
          id: `tx-csv-${Date.now()}-${i}`,
          date: c.date,
          time: '09:00',
          description: c.description,
          category: c.category,
          categoryLabel: c.categoryLabel,
          amount: c.amount,
          type: c.type,
          source: fileName.replace('.csv', ''),
          counterparty: c.counterparty,
          status: c.needsReview ? 'pending' : 'processed',
          confidence: c.confidence,
        };
        txs.push(tx);

        if (c.needsReview && c.reviewQuestion) {
          pends.push({
            id: `p-csv-${Date.now()}-${i}`,
            transaction: tx,
            question: c.reviewQuestion,
            choices: c.reviewChoices || [
              { label: 'この分類でOK', value: c.category },
              { label: 'わからない', value: 'unknown' },
            ],
          });
        }
      });

      setTransactions(txs);
      setPendingItems(pends);
      setStep('preview');
    } catch (err) {
      setError('ファイルの処理中にエラーが発生しました。');
      setStep('select');
    }
  };

  const handleSave = () => {
    dispatch({ type: 'ADD_TRANSACTIONS', transactions, pending: pendingItems });
    setStep('done');
  };

  const incomeCount = transactions.filter(t => t.type === 'income').length;
  const expenseCount = transactions.filter(t => t.type === 'expense').length;
  const pendingCount = pendingItems.length;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[#1A3A5C] p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-[17px] font-bold text-[#1A3A5C]">銀行CSV取込</h1>
      </div>

      {step === 'select' && (
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center">
            <span className="text-[36px]">📂</span>
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#1A3A5C]">銀行の明細CSVを取り込む</p>
            <p className="text-[12px] text-gray-400 mt-1">みずほ・MUFG・SMBC・楽天に対応</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[13px] text-red-600">{error}</div>
          )}

          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-4 bg-[#1A3A5C] text-white rounded-2xl text-[15px] font-bold"
          >
            CSVファイルを選択
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center space-y-4 py-12">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#1A3A5C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#1A3A5C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#1A3A5C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-[14px] text-gray-500">AIが仕訳を分類中...</p>
          <p className="text-[12px] text-gray-400">{fileName}</p>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
            <p className="text-[14px] font-bold text-emerald-800">{transactions.length}件の取引を読み込みました</p>
            <p className="text-[12px] text-emerald-600 mt-1">{fileName}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center min-w-[96px] flex-1">
              <p className="text-[11px] text-gray-400 whitespace-nowrap">入金</p>
              <p className="text-[16px] font-black text-emerald-600">{incomeCount}件</p>
              <p className="text-[11px] text-gray-400 whitespace-nowrap">{formatAmount(totalIncome)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center min-w-[96px] flex-1">
              <p className="text-[11px] text-gray-400 whitespace-nowrap">出金</p>
              <p className="text-[16px] font-black text-[#1A3A5C]">{expenseCount}件</p>
              <p className="text-[11px] text-gray-400 whitespace-nowrap">{formatAmount(totalExpense)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center min-w-[96px] flex-1">
              <p className="text-[11px] text-gray-400 whitespace-nowrap">確認待ち</p>
              <p className="text-[16px] font-black text-amber-600">{pendingCount}件</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {transactions.slice(0, 10).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] ${
                  tx.status === 'pending' ? 'bg-amber-50 text-amber-500' :
                  tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'
                }`}>
                  {tx.status === 'pending' ? '？' : tx.type === 'income' ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{tx.counterparty || tx.description}</p>
                  <p className="text-[11px] text-gray-400">{tx.categoryLabel} ・ {tx.date}</p>
                </div>
                <p className={`text-[13px] font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                </p>
              </div>
            ))}
            {transactions.length > 10 && (
              <p className="text-center text-[12px] text-gray-400 py-2">他{transactions.length - 10}件</p>
            )}
          </div>

          <button onClick={handleSave} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[15px] font-bold">
            ✓ {transactions.length}件を保存する
          </button>
          <button onClick={() => { setStep('select'); setTransactions([]); }} className="w-full py-3 text-gray-400 text-[13px]">
            やり直す
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center space-y-6 py-12">
          <div className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center">
            <span className="text-[36px]">✅</span>
          </div>
          <div>
            <p className="text-[18px] font-bold text-[#1A3A5C]">{transactions.length}件を保存しました</p>
            {pendingCount > 0 && (
              <p className="text-[13px] text-amber-600 mt-2">{pendingCount}件の確認待ちがあります</p>
            )}
          </div>
          <div className="space-y-2">
            {pendingCount > 0 && (
              <Link href="/pending" className="block w-full py-3 bg-[#1A3A5C] text-white rounded-2xl text-[14px] font-bold text-center">
                確認待ちを処理する
              </Link>
            )}
            <Link href="/" className="block w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[13px] text-center">
              ホームに戻る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
