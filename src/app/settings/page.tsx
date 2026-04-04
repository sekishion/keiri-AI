'use client';

import { useApp } from '@/lib/store';

export default function SettingsPage() {
  const { state, dispatch } = useApp();

  return (
    <div className="space-y-4">
      <h1 className="text-[17px] font-bold text-[#1A3A5C]">設定</h1>

      {/* Account */}
      <p className="text-[11px] font-bold text-gray-400 tracking-wider">アカウント</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 bg-[#1A3A5C] rounded-full text-white flex items-center justify-center font-bold text-[14px]">
            {state.ownerName?.[0] || '田'}
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-gray-800">{state.companyName || '田中建設 株式会社'}</p>
            <p className="text-[12px] text-gray-400">{state.ownerName || '田中太郎'} ・ スタンダードプラン</p>
          </div>
        </div>
      </div>

      {/* Connections */}
      <p className="text-[11px] font-bold text-gray-400 tracking-wider">連携サービス</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {[
          { icon: '🏦', name: '銀行口座', detail: 'みずほ銀行 ****1234', status: '接続中' },
          { icon: '💳', name: 'クレジットカード', detail: 'VISA ****5678', status: '接続中' },
          { icon: '📚', name: '会計ソフト', detail: 'freee', status: '接続中' },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3 px-4 py-3">
            <span className="text-[18px]">{item.icon}</span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-gray-800">{item.name}</p>
              <p className="text-[11px] text-gray-400">{item.detail}</p>
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2 py-0.5 rounded-full">{item.status}</span>
          </div>
        ))}
      </div>

      {/* Notifications */}
      <p className="text-[11px] font-bold text-gray-400 tracking-wider">通知</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {[
          { name: '週次レポート（LINE）', on: true },
          { name: '月次レポート（LINE）', on: true },
          { name: '入金通知（LINE）', on: true },
          { name: '異常値アラート', on: true },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3 px-4 py-3">
            <p className="flex-1 text-[13px] text-gray-700">{item.name}</p>
            <div className={`w-[44px] h-[26px] rounded-full relative cursor-pointer ${item.on ? 'bg-[#06C755]' : 'bg-gray-300'}`}>
              <div className={`w-[22px] h-[22px] bg-white rounded-full absolute top-[2px] transition-all ${item.on ? 'right-[2px]' : 'left-[2px]'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Plan */}
      <p className="text-[11px] font-bold text-gray-400 tracking-wider">プラン</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
        <p className="text-[13px] font-bold text-[#1A3A5C]">スタンダードプラン</p>
        <p className="text-[24px] font-black text-[#1A3A5C] mt-1">¥5,000<span className="text-[13px] font-normal text-gray-400">/月</span></p>
        <p className="text-[11px] text-gray-400 mt-1">次回請求: 2026年5月1日</p>
      </div>

      {/* Data management */}
      <p className="text-[11px] font-bold text-gray-400 tracking-wider">データ管理</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => {
            if (confirm('すべてのデータをリセットしますか？この操作は取り消せません。')) {
              dispatch({ type: 'RESET_DATA' });
              window.location.href = '/onboarding';
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          <span className="text-[18px]">🗑️</span>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-red-600">データをリセット</p>
            <p className="text-[11px] text-gray-400">すべての取引・設定を初期化します</p>
          </div>
        </button>
      </div>

      <div className="h-4" />
    </div>
  );
}
