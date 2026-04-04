'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  id: string;
  from: 'user' | 'bot';
  type: 'text' | 'image' | 'card' | 'confirm' | 'receipt-result';
  content: string;
  time: string;
  card?: {
    title: string;
    rows: { label: string; value: string }[];
    actions?: { label: string; primary?: boolean }[];
  };
  confirm?: {
    title: string;
    detail: string;
    approveLabel: string;
    rejectLabel: string;
  };
}

const now = () => {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

let msgId = 0;
const id = () => `msg-${++msgId}`;

export default function LinePage() {
  const { state } = useApp();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { id: id(), from: 'bot', type: 'text', content: `${state.ownerName}さん、こんにちは！👋\nAI経理部長です。\n\n下のメニューからアクションを選ぶか、何でも聞いてください。`, time: now() },
      ]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBot = (msg: Omit<ChatMessage, 'id' | 'from' | 'time'>) => {
    setMessages(prev => [...prev, { ...msg, id: id(), from: 'bot', time: now() }]);
  };

  const addUser = (content: string) => {
    setMessages(prev => [...prev, { id: id(), from: 'user', type: 'text', content, time: now() }]);
  };

  const sendToAI = async (text: string) => {
    addUser(text);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          context: `売上: ${state.dashboardMetrics[0]?.value}, 利益: ${state.dashboardMetrics[1]?.value}, 手元資金: ${state.dashboardMetrics[2]?.value}, 資金繰り: あと${state.cashForecast.monthsRemaining}ヶ月分, 会社名: ${state.companyName}, 業種: ${state.companyInfo?.industry || '建設業'}`,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      addBot({ type: 'text', content: data.content });
    } catch {
      addBot({ type: 'text', content: 'すみません、接続に問題が発生しました。' });
    } finally {
      setLoading(false);
    }
  };

  const handleReceipt = () => {
    fileRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ユーザーが画像を送った風のメッセージ
    setMessages(prev => [...prev, { id: id(), from: 'user', type: 'image', content: '🧾 レシート画像', time: now() }]);
    setLoading(true);

    // デモ: 1.5秒後にOCR結果を返す
    setTimeout(() => {
      addBot({
        type: 'confirm',
        content: '',
        confirm: {
          title: '🧾 経費を記録しました',
          detail: '¥1,280\n📍 スターバックス 渋谷店\n📂 会議費\n📅 ' + new Date().toISOString().split('T')[0],
          approveLabel: '✓ OK',
          rejectLabel: '✎ 修正',
        },
      });
      setLoading(false);
    }, 1500);

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleConfirm = (action: 'approve' | 'reject') => {
    if (action === 'approve') {
      addUser('OK');
      setTimeout(() => {
        addBot({ type: 'text', content: '✅ 記録しました！\n今月の会議費: ¥4,560（3件）\n\n他にレシートがあれば送ってください 📸' });
      }, 500);
    } else {
      addUser('修正');
      setTimeout(() => {
        addBot({ type: 'text', content: '了解です。何を修正しますか？\n\n・金額が違う → 正しい金額を教えてください\n・分類が違う → 正しい勘定科目を教えてください\n・店名が違う → 正しい店名を教えてください' });
      }, 500);
    }
  };

  // 請求書フローの続き（取引先選択後）
  const handleInvoiceClientSelected = (client: string) => {
    addUser(client);
    setLoading(true);
    setTimeout(() => {
      if (client === '新しい取引先') {
        addBot({ type: 'text', content: '新しい取引先ですね。\n会社名を入力してください。' });
      } else {
        addBot({
          type: 'confirm',
          content: '',
          confirm: {
            title: `📄 請求書プレビュー`,
            detail: `請求書 #0025\n\n宛先: ${client}\n金額: ¥3,316,500（税込）\n内訳: 前回と同じ\n支払期限: 2026年5月31日\n\n前回と同じ内容で作成しました`,
            approveLabel: '📧 送信',
            rejectLabel: '✏️ 変更',
          },
        });
      }
      setLoading(false);
    }, 1000);
  };

  const handleMenuAction = (action: string) => {
    if (action === 'receipt') {
      handleReceipt();
    } else if (action === 'question') {
      // フォーカスを入力欄に
      const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
      inputEl?.focus();
    } else if (action === 'invoice') {
      addUser('請求書を作りたい');
      setLoading(true);
      setTimeout(() => {
        addBot({ type: 'text', content: 'どちらに送りますか？' });
        setTimeout(() => {
          addBot({
            type: 'card',
            content: '',
            card: {
              title: '📄 取引先を選択',
              rows: [],
              actions: [
                { label: 'ABC建設', primary: true },
                { label: '山田工務店' },
                { label: '+ 新しい取引先' },
              ],
            },
          });
          setLoading(false);
        }, 300);
      }, 800);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendToAI(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* LINE Header */}
      <div className="bg-[#06C755] text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.push('/')} className="text-white/80 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-[16px]">
          📊
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold">AI経理部長</p>
          <p className="text-[11px] opacity-80">LINE体験プレビュー</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-[#7ECBF5]" style={{ background: 'linear-gradient(180deg, #8FD3F8, #7ECBF5)' }}>
        <div className="px-3 py-4 space-y-3">
          {/* Date */}
          <div className="text-center">
            <span className="bg-black/15 text-white text-[11px] px-3 py-0.5 rounded-full">今日</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {/* Bot avatar */}
              {msg.from === 'bot' && (
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[14px] flex-shrink-0 self-start mt-0.5">
                  📊
                </div>
              )}

              <div className="max-w-[75%]">
                {/* Text bubble */}
                {msg.type === 'text' && (
                  <div className={`px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.from === 'user'
                      ? 'bg-[#06C755] text-white rounded-2xl rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                )}

                {/* Image */}
                {msg.type === 'image' && (
                  <div className="w-[160px] h-[120px] bg-gray-200 rounded-2xl rounded-br-sm flex items-center justify-center text-[28px]">
                    🧾
                  </div>
                )}

                {/* Confirm card */}
                {msg.type === 'confirm' && msg.confirm && (
                  <div className="bg-white rounded-2xl rounded-bl-sm overflow-hidden shadow-sm">
                    <div className="p-3">
                      <p className="text-[13px] font-bold text-gray-800 mb-1">{msg.confirm.title}</p>
                      <p className="text-[12px] text-gray-600 whitespace-pre-line leading-relaxed">{msg.confirm.detail}</p>
                    </div>
                    <div className="flex border-t border-gray-100">
                      <button
                        onClick={() => handleConfirm('approve')}
                        className="flex-1 py-2.5 text-[13px] font-bold text-[#06C755] border-r border-gray-100"
                      >
                        {msg.confirm.approveLabel}
                      </button>
                      <button
                        onClick={() => handleConfirm('reject')}
                        className="flex-1 py-2.5 text-[13px] font-bold text-red-500"
                      >
                        {msg.confirm.rejectLabel}
                      </button>
                    </div>
                  </div>
                )}

                {/* Card */}
                {msg.type === 'card' && msg.card && (
                  <div className="bg-white rounded-2xl rounded-bl-sm overflow-hidden shadow-sm">
                    <div className="bg-[#1A3A5C] text-white px-3 py-2 text-[12px] font-bold">
                      {msg.card.title}
                    </div>
                    {msg.card.actions && (
                      <div>
                        {msg.card.actions.map((a, i) => (
                          <button
                            key={i}
                            onClick={() => handleInvoiceClientSelected(a.label)}
                            className={`w-full py-2.5 text-[13px] font-bold border-t border-gray-100 ${
                              a.primary ? 'text-[#06C755]' : 'text-gray-600'
                            }`}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className={`text-[11px] mt-0.5 ${msg.from === 'user' ? 'text-right' : ''}`} style={{ color: 'rgba(0,0,0,0.3)' }}>
                  {msg.from === 'user' && <span className="mr-1">既読</span>}
                  {msg.time}
                </p>
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[14px] flex-shrink-0">📊</div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 px-3 py-2 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-[13px] outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-[#06C755] rounded-full flex items-center justify-center text-white disabled:opacity-30 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>

      {/* Rich Menu */}
      <div className="bg-white border-t border-gray-100 grid grid-cols-3 flex-shrink-0">
        <button
          onClick={() => handleMenuAction('receipt')}
          className="flex flex-col items-center justify-center py-3 gap-1 border-r border-gray-100 active:bg-gray-50"
        >
          <span className="text-[22px]">📸</span>
          <span className="text-[11px] font-bold text-gray-700">レシート</span>
        </button>
        <button
          onClick={() => handleMenuAction('question')}
          className="flex flex-col items-center justify-center py-3 gap-1 border-r border-gray-100 active:bg-gray-50"
        >
          <span className="text-[22px]">💬</span>
          <span className="text-[11px] font-bold text-gray-700">質問する</span>
        </button>
        <button
          onClick={() => handleMenuAction('invoice')}
          className="flex flex-col items-center justify-center py-3 gap-1 active:bg-gray-50"
        >
          <span className="text-[22px]">📄</span>
          <span className="text-[11px] font-bold text-gray-700">請求書</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
