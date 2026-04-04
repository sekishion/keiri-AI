'use client';

import Link from 'next/link';

interface TaxEvent {
  id: string;
  title: string;
  deadline: string;
  category: 'payment' | 'filing' | 'notice';
  amount?: number;
  status: 'upcoming' | 'due-soon' | 'overdue' | 'done';
  description: string;
}

const events: TaxEvent[] = [
  { id: 't1', title: '源泉所得税の納付', deadline: '2026-04-10', category: 'payment', amount: 185000, status: 'due-soon', description: '3月分の給与・報酬から徴収した源泉所得税の納付' },
  { id: 't2', title: '消費税 中間納付', deadline: '2026-04-30', category: 'payment', amount: 350000, status: 'upcoming', description: '前年度の消費税額に基づく中間納付' },
  { id: 't3', title: '労働保険 年度更新', deadline: '2026-06-01', category: 'filing', status: 'upcoming', description: '労働保険料の確定・概算申告。年1回の手続き' },
  { id: 't4', title: '住民税 特別徴収', deadline: '2026-06-10', category: 'payment', amount: 120000, status: 'upcoming', description: '従業員の住民税を給与から天引きして納付' },
  { id: 't5', title: '法人税 確定申告', deadline: '2026-05-31', category: 'filing', status: 'upcoming', description: '3月決算の場合の法人税・地方税の申告' },
  { id: 't6', title: '固定資産税 第1期', deadline: '2026-04-30', category: 'payment', amount: 80000, status: 'upcoming', description: '事業用資産に対する固定資産税の納付' },
  // 完了済み
  { id: 't7', title: '源泉所得税の納付（2月分）', deadline: '2026-03-10', category: 'payment', amount: 185000, status: 'done', description: '2月分の源泉所得税' },
];

const statusConfig = {
  'due-soon': { label: 'もうすぐ', color: 'bg-red-50 text-red-600 border-red-100', icon: '🔴' },
  'upcoming': { label: '予定', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: '📅' },
  'overdue': { label: '期限超過', color: 'bg-red-100 text-red-700 border-red-200', icon: '⚠️' },
  'done': { label: '完了', color: 'bg-gray-50 text-gray-400 border-gray-100', icon: '✅' },
};

export default function TaxCalendarPage() {
  const active = events.filter(e => e.status !== 'done').sort((a, b) => a.deadline.localeCompare(b.deadline));
  const done = events.filter(e => e.status === 'done');
  const nextPayment = active.find(e => e.category === 'payment');
  const totalUpcoming = active.filter(e => e.amount).reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/analysis" className="text-[#1A3A5C] p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-[17px] font-bold text-[#1A3A5C]">税務カレンダー</h1>
      </div>

      {/* Alert: Next payment */}
      {nextPayment && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-[20px]">💴</span>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-red-800">次の納付: {nextPayment.title}</p>
              <p className="text-[12px] text-red-600">期限 {nextPayment.deadline} ・ 約¥{((nextPayment.amount || 0) / 10000).toFixed(0)}万円</p>
            </div>
          </div>
        </div>
      )}

      {/* Total upcoming */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
        <p className="text-[11px] text-gray-400">今後3ヶ月の納付予定額</p>
        <p className="text-[24px] font-black text-[#1A3A5C]">¥{(totalUpcoming / 10000).toFixed(0)}万</p>
        <p className="text-[12px] text-gray-400">資金を確保しておいてください</p>
      </div>

      {/* Active events */}
      <p className="text-[11px] font-bold text-gray-400">今後の予定</p>
      {active.map(e => {
        const sc = statusConfig[e.status];
        return (
          <div key={e.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${e.status === 'due-soon' ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="flex items-start gap-3">
              <div className="text-[18px] mt-0.5">{sc.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[14px] font-bold text-gray-800">{e.title}</p>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                </div>
                <p className="text-[12px] text-gray-500 mb-1">{e.description}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px]">
                  <span className="text-gray-400 whitespace-nowrap">期限: <strong className="text-gray-600">{e.deadline}</strong></span>
                  {e.amount && (
                    <span className="text-gray-400 whitespace-nowrap">金額: <strong className="text-[#1A3A5C]">¥{e.amount.toLocaleString()}</strong></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Done */}
      {done.length > 0 && (
        <>
          <p className="text-[11px] font-bold text-gray-400 mt-2">完了済み</p>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {done.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3 opacity-50">
                <span className="text-[14px]">✅</span>
                <div className="flex-1">
                  <p className="text-[13px] text-gray-600">{e.title}</p>
                  <p className="text-[11px] text-gray-400">{e.deadline}</p>
                </div>
                {e.amount && <p className="text-[12px] text-gray-400">¥{e.amount.toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
