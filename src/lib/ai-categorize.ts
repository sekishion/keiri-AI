import type { RawBankTransaction } from './csv-parser';

export interface CategorizedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryLabel: string;
  counterparty: string;
  confidence: number;
  aiReason: string;
  needsReview: boolean;
  reviewQuestion?: string;
  reviewChoices?: { label: string; value: string }[];
  originalText: string;
}

const CATEGORY_MAP: Record<string, { category: string; label: string }> = {
  '給与': { category: '給料手当', label: '人件費' },
  '給料': { category: '給料手当', label: '人件費' },
  '賞与': { category: '賞与', label: '賞与' },
  '家賃': { category: '地代家賃', label: '家賃' },
  '電気': { category: '水道光熱費', label: '光熱費' },
  '水道': { category: '水道光熱費', label: '光熱費' },
  'ガス': { category: '水道光熱費', label: '光熱費' },
  '電話': { category: '通信費', label: '通信費' },
  'ドコモ': { category: '通信費', label: '通信費' },
  'ソフトバンク': { category: '通信費', label: '通信費' },
  'KDDI': { category: '通信費', label: '通信費' },
  'NTT': { category: '通信費', label: '通信費' },
  'ガソリン': { category: '車両費', label: '車両費' },
  'ENEOS': { category: '車両費', label: '車両費' },
  '出光': { category: '車両費', label: '車両費' },
  'コスモ': { category: '車両費', label: '車両費' },
  '保険': { category: '保険料', label: '保険料' },
  '社会保険': { category: '法定福利費', label: '社会保険' },
  '年金': { category: '法定福利費', label: '社会保険' },
  '健康保険': { category: '法定福利費', label: '社会保険' },
  '税金': { category: '租税公課', label: '税金' },
  '印紙': { category: '租税公課', label: '税金' },
  '振込手数料': { category: '支払手数料', label: '手数料' },
  'ATM': { category: '支払手数料', label: '手数料' },
  'Amazon': { category: '消耗品費', label: '消耗品' },
  'コンビニ': { category: '雑費', label: 'その他' },
};

// ルールベースの高速分類（Claude APIコール前のプレフィルタ）
function ruleBasedCategorize(description: string): { category: string; label: string; confidence: number } | null {
  const desc = description.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (desc.includes(keyword.toLowerCase())) {
      return { ...cat, confidence: 0.90 };
    }
  }
  return null;
}

// Claude APIで仕訳分類
async function aiCategorize(transactions: { description: string; amount: number; type: string }[]): Promise<{
  category: string;
  categoryLabel: string;
  counterparty: string;
  confidence: number;
  reason: string;
  needsReview: boolean;
  reviewQuestion?: string;
  reviewChoices?: { label: string; value: string }[];
}[]> {
  const response = await fetch('/api/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions }),
  });

  if (!response.ok) {
    throw new Error('AI categorization failed');
  }

  return response.json();
}

export async function categorizeTransactions(
  rawTransactions: RawBankTransaction[]
): Promise<CategorizedTransaction[]> {
  const results: CategorizedTransaction[] = [];
  const needsAI: { index: number; tx: RawBankTransaction }[] = [];

  // Step 1: ルールベースで分類できるものは先にやる
  for (let i = 0; i < rawTransactions.length; i++) {
    const tx = rawTransactions[i];
    const isIncome = tx.deposit > 0;
    const amount = isIncome ? tx.deposit : tx.withdrawal;
    const ruleResult = ruleBasedCategorize(tx.description);

    if (ruleResult && ruleResult.confidence >= 0.85) {
      results[i] = {
        date: tx.date,
        description: tx.description,
        amount,
        type: isIncome ? 'income' : 'expense',
        category: isIncome ? '売上' : ruleResult.category,
        categoryLabel: isIncome ? '売上' : ruleResult.label,
        counterparty: tx.description.split(/\s+/)[0] || '',
        confidence: ruleResult.confidence,
        aiReason: `ルールベース: "${tx.description}" にキーワード一致`,
        needsReview: false,
        originalText: JSON.stringify(tx.raw),
      };
    } else {
      needsAI.push({ index: i, tx });
    }
  }

  // Step 2: 残りをClaude APIで分類（バッチ処理）
  if (needsAI.length > 0) {
    const batchSize = 20;
    for (let batch = 0; batch < needsAI.length; batch += batchSize) {
      const chunk = needsAI.slice(batch, batch + batchSize);
      const aiInput = chunk.map(({ tx }) => ({
        description: tx.description,
        amount: tx.deposit > 0 ? tx.deposit : tx.withdrawal,
        type: tx.deposit > 0 ? 'income' : 'expense',
      }));

      try {
        const aiResults = await aiCategorize(aiInput);
        for (let j = 0; j < chunk.length; j++) {
          const { index, tx } = chunk[j];
          const ai = aiResults[j];
          const isIncome = tx.deposit > 0;
          results[index] = {
            date: tx.date,
            description: tx.description,
            amount: isIncome ? tx.deposit : tx.withdrawal,
            type: isIncome ? 'income' : 'expense',
            category: ai.category,
            categoryLabel: ai.categoryLabel,
            counterparty: ai.counterparty,
            confidence: ai.confidence,
            aiReason: ai.reason,
            needsReview: ai.needsReview,
            reviewQuestion: ai.reviewQuestion,
            reviewChoices: ai.reviewChoices,
            originalText: JSON.stringify(tx.raw),
          };
        }
      } catch {
        // AI失敗時は未分類にして確認待ちにする
        for (const { index, tx } of chunk) {
          const isIncome = tx.deposit > 0;
          results[index] = {
            date: tx.date,
            description: tx.description,
            amount: isIncome ? tx.deposit : tx.withdrawal,
            type: isIncome ? 'income' : 'expense',
            category: '未分類',
            categoryLabel: '未分類',
            counterparty: tx.description.split(/\s+/)[0] || '',
            confidence: 0,
            aiReason: 'AI分類に失敗しました',
            needsReview: true,
            reviewQuestion: 'これは何ですか？',
            reviewChoices: [
              { label: '経費', value: 'expense' },
              { label: '売上', value: 'income' },
              { label: '個人の取引', value: 'personal' },
            ],
            originalText: JSON.stringify(tx.raw),
          };
        }
      }
    }
  }

  return results.filter(Boolean);
}
