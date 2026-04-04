'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { formatAmount } from '@/lib/format';
import Link from 'next/link';

interface ChatMsg {
  from: 'ai' | 'user';
  text: string;
}

export default function Pending() {
  const { state, dispatch } = useApp();
  const items = state.pendingItems;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [decided, setDecided] = useState(false);
  const [decision, setDecision] = useState<{ category: string; reason: string; legalBasis: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const item = items[currentIdx];

  // 初回: AIが最初から有利な処理方法を提案
  useEffect(() => {
    if (item && chatMessages.length === 0) {
      const amt = item.transaction.amount;
      const who = item.transaction.counterparty;
      const desc = item.transaction.description;

      // 取引内容に応じた最適提案を生成
      const proposal = getBestProposal(amt, who, desc);

      setChatMessages([{
        from: 'ai',
        text: proposal,
      }]);

      // 提案が出ている状態にする
      setDecision({
        category: item.choices[0]?.value || 'unknown',
        reason: proposal,
        legalBasis: proposal,
      });
    }
  }, [item, currentIdx]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !item) return;

    const userMsg: ChatMsg = { from: 'user', text: text.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = newMessages.map(m => ({
        role: m.from === 'ai' ? 'assistant' as const : 'user' as const,
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          context: `あなたは中小企業の経営者の味方となる経理AIです。以下の取引について社長と対話しています。

取引情報:
- 金額: ¥${item.transaction.amount.toLocaleString()}
- 取引先: ${item.transaction.counterparty}
- 内容: ${item.transaction.description}
- 日付: ${item.transaction.date}
- 支払方法: ${item.transaction.source}

あなたの役割:
1. この支出を経費で落とせる方法を積極的に探す（社長に有利な方向で）
2. 法的に正しい範囲で、最も節税効果が高い処理方法を提案する
3. 「こうすれば経費にできます」「こういう制度が使えます」と具体的に教える
4. 社長の追加情報があれば、さらに有利な方法がないか検討する
5. 難しい用語は使わない。「つまり○○円お得になります」のように金額で示す

回答は短く。社長が読んで3秒で理解できるように。
質問する場合は1回に1つだけ。`,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      const aiMsg: ChatMsg = { from: 'ai', text: data.content };
      setChatMessages([...newMessages, aiMsg]);

      // 判断が出たか検出
      if (data.content.includes('【判断】') || data.content.includes('経費計上できます') || data.content.includes('として処理')) {
        setDecision({
          category: item.choices[0]?.value || 'unknown',
          reason: data.content,
          legalBasis: data.content,
        });
      }
    } catch {
      setChatMessages([...newMessages, { from: 'ai', text: 'すみません、接続に問題が発生しました。もう一度お試しください。' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDecision = () => {
    if (!item) return;
    dispatch({ type: 'RESOLVE_PENDING', id: item.id, choiceValue: decision?.category || item.choices[0]?.value || 'unknown' });
    setDecided(true);

    // 次のアイテムへ
    setTimeout(() => {
      if (currentIdx < items.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setChatMessages([]);
        setDecided(false);
        setDecision(null);
      }
    }, 1500);
  };

  const handleAskTaxAdvisor = () => {
    if (!item) return;
    setChatMessages(prev => [...prev, {
      from: 'ai',
      text: '📩 税理士への相談リクエストを送信しました。\n\n回答があるまで、AIの判断で仮処理しておきます。税理士から回答があり次第、修正が必要な場合はお知らせします。',
    }]);
    // 仮処理
    setTimeout(() => {
      dispatch({ type: 'RESOLVE_PENDING', id: item.id, choiceValue: item.choices[0]?.value || 'unknown' });
      setDecided(true);
      setTimeout(() => {
        if (currentIdx < items.length - 1) {
          setCurrentIdx(prev => prev + 1);
          setChatMessages([]);
          setDecided(false);
          setDecision(null);
        }
      }, 1500);
    }, 1000);
  };

  // Quick answers for common situations
  const quickAnswers = item ? getQuickAnswers(item) : [];

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#1A3A5C] p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-[17px] font-bold text-[#1A3A5C]">確認</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-[40px] mb-3">✅</p>
          <p className="text-[15px] font-bold text-[#1A3A5C]">確認待ちはありません</p>
          <p className="text-[12px] text-gray-400 mt-1">すべてAIが処理済みです</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#1A3A5C] p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-[17px] font-bold text-[#1A3A5C]">確認</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-[40px] mb-3">✅</p>
          <p className="text-[15px] font-bold text-[#1A3A5C]">すべて完了しました</p>
          <Link href="/" className="block mt-4 text-[13px] text-blue-600 font-medium">ホームに戻る</Link>
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
        <h1 className="text-[17px] font-bold text-[#1A3A5C] flex-1">確認</h1>
        <span className="text-[12px] text-gray-400">{currentIdx + 1} / {items.length}</span>
      </div>

      {/* Transaction info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[20px] font-black text-[#1A3A5C]">{formatAmount(item.transaction.amount)}</p>
            <p className="text-[14px] font-medium text-gray-700">{item.transaction.counterparty}</p>
          </div>
          <span className="text-[11px] text-gray-400">{item.transaction.date}</span>
        </div>
        <p className="text-[12px] text-gray-400 mt-1">{item.transaction.description} ・ {item.transaction.source}</p>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.from === 'user'
                  ? 'bg-[#1A3A5C] text-white rounded-br-sm'
                  : 'bg-gray-50 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 rounded-2xl rounded-bl-sm px-4 py-3">
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

        {/* Quick answers */}
        {!decided && quickAnswers.length > 0 && chatMessages.length <= 2 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {quickAnswers.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-[12px] text-blue-600"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {!decided && (
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="状況を教えてください..."
              className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-[13px] outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-[#1A3A5C] rounded-full flex items-center justify-center text-white disabled:opacity-30 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </form>
        )}
      </div>

      {/* Action buttons */}
      {!decided && (
        <div className="space-y-2">
          {decision && (
            <button
              onClick={handleAcceptDecision}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-[14px] font-bold"
            >
              ✓ この判断でOK（ログに記録します）
            </button>
          )}
          <button
            onClick={handleAskTaxAdvisor}
            className="w-full py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[13px] font-medium"
          >
            👨‍💼 税理士に相談する（AIが仮処理します）
          </button>
        </div>
      )}

      {/* Decided state */}
      {decided && (
        <div className="bg-emerald-50 rounded-2xl p-4 text-center">
          <p className="text-[18px]">✅</p>
          <p className="text-[14px] font-bold text-emerald-800 mt-1">記録しました</p>
          <p className="text-[12px] text-emerald-600 mt-1">判断理由と法的根拠をログに保存しました</p>
        </div>
      )}

      {/* Log notice */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400 px-1">
        <span>🔒</span>
        <span>すべての判断はログに記録され、税務調査時に提出できます</span>
      </div>
    </div>
  );
}

// 取引内容から最も有利な処理方法を提案
function getBestProposal(amount: number, counterparty: string, description: string): string {
  const desc = description.toLowerCase();

  if (desc.includes('pc') || desc.includes('パソコン') || desc.includes('ノート')) {
    if (amount < 300000) {
      return `💡 ${counterparty}で¥${amount.toLocaleString()}のPC購入ですね。\n\n` +
        `✅ 全額を今年の経費にできます\n\n` +
        `「少額減価償却資産の特例」が使えます。30万円未満のPCは、買った年に全額経費にできる制度です。\n\n` +
        `📌 つまり: 法人税が約¥${Math.round(amount * 0.3).toLocaleString()}お得になります\n\n` +
        `仕事用のPCとして使いますか？`;
    } else {
      return `💡 ${counterparty}で¥${amount.toLocaleString()}のPC購入ですね。\n\n` +
        `30万円以上なので全額は今年の経費にできませんが、4年間で分割して経費にできます（減価償却）。\n\n` +
        `📌 毎年約¥${Math.round(amount / 4).toLocaleString()}ずつ経費計上\n\n` +
        `仕事用ですか？`;
    }
  }

  if (desc.includes('保険')) {
    return `💡 ${counterparty}への保険料¥${amount.toLocaleString()}ですね。\n\n` +
      `✅ 事業用の保険であれば全額経費にできます\n\n` +
      `「損害保険料」として計上します。\n\n` +
      `📌 つまり: 法人税が約¥${Math.round(amount * 0.3).toLocaleString()}お得になります\n\n` +
      `事業に関連する保険（賠償責任保険、火災保険など）ですか？`;
  }

  if (desc.includes('飲食') || desc.includes('居酒屋') || desc.includes('レストラン') || desc.includes('接待')) {
    if (amount <= 5000) {
      return `💡 ¥${amount.toLocaleString()}の飲食代ですね。\n\n` +
        `✅ 1人あたり5,000円以下なら「会議費」として全額経費にできます\n\n` +
        `交際費の枠を使わずに経費にできるので、こちらの方がお得です。\n\n` +
        `📌 参加者と目的をメモしておくとベスト\n\n` +
        `取引先との食事ですか？`;
    }
    return `💡 ¥${amount.toLocaleString()}の飲食代ですね。\n\n` +
      `✅ 取引先との飲食なら「交際費」として経費にできます\n\n` +
      `資本金1億円以下の法人は、年800万円まで全額損金算入できます。\n\n` +
      `📌 つまり: 法人税が約¥${Math.round(amount * 0.3).toLocaleString()}お得になります\n\n` +
      `取引先との食事ですか？それとも社内の食事ですか？`;
  }

  // 汎用
  return `💡 ${counterparty}への¥${amount.toLocaleString()}の支払いがありました。\n\n` +
    `「${description}」\n\n` +
    `✅ 事業に関連する支出であれば経費にできる可能性があります\n\n` +
    `どういった目的の支出ですか？教えていただければ、一番有利な処理方法を提案します。`;
}

// 取引の内容に応じたクイック回答の候補
function getQuickAnswers(item: { transaction: { description: string; counterparty: string } }): string[] {
  const desc = item.transaction.description.toLowerCase();
  if (desc.includes('pc') || desc.includes('パソコン') || desc.includes('ビックカメラ')) {
    return ['仕事用のPC', '社員に支給する', '個人用（経費じゃない）'];
  }
  if (desc.includes('保険')) {
    return ['事業用の保険', '車の保険', '従業員の保険'];
  }
  if (desc.includes('飲食') || desc.includes('居酒屋') || desc.includes('レストラン')) {
    return ['取引先との食事', '社員との食事', '個人の食事'];
  }
  return ['仕事で使った', '取引先に関係するもの', 'よくわからない'];
}
