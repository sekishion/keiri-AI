// AI学習エンジン: 取引パターンを記憶し、次回から自動適用
// 「使うほど賢くなる」を実現する

const STORAGE_KEY = 'ai-tax-learning';

export interface LearnedPattern {
  counterparty: string;      // 取引先名
  description: string;       // 摘要のパターン
  category: string;          // 学習した勘定科目
  categoryLabel: string;     // 表示名
  type: 'income' | 'expense';
  count: number;             // この判断が使われた回数
  lastUsed: string;          // 最後に使われた日
}

export function loadPatterns(): LearnedPattern[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

export function savePatterns(patterns: LearnedPattern[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  } catch { /* quota exceeded */ }
}

// 取引を学習する（確認待ちの回答時、手動修正時に呼ぶ）
export function learnFromTransaction(
  counterparty: string,
  description: string,
  category: string,
  categoryLabel: string,
  type: 'income' | 'expense'
): void {
  const patterns = loadPatterns();
  const existing = patterns.find(p =>
    p.counterparty === counterparty || descriptionMatches(p.description, description)
  );

  if (existing) {
    existing.category = category;
    existing.categoryLabel = categoryLabel;
    existing.count += 1;
    existing.lastUsed = new Date().toISOString().split('T')[0];
  } else {
    patterns.push({
      counterparty,
      description: extractKeywords(description),
      category,
      categoryLabel,
      type,
      count: 1,
      lastUsed: new Date().toISOString().split('T')[0],
    });
  }

  savePatterns(patterns);
}

// 学習済みパターンで仕訳を推定する
export function predictCategory(
  counterparty: string,
  description: string,
  isIncome: boolean
): { category: string; categoryLabel: string; confidence: number; learned: boolean } | null {
  const patterns = loadPatterns();

  // 取引先名で完全一致
  const byCounterparty = patterns.find(p =>
    p.counterparty === counterparty && p.type === (isIncome ? 'income' : 'expense')
  );
  if (byCounterparty) {
    return {
      category: byCounterparty.category,
      categoryLabel: byCounterparty.categoryLabel,
      confidence: Math.min(0.95, 0.85 + byCounterparty.count * 0.02),
      learned: true,
    };
  }

  // 摘要のキーワードマッチ
  const byDescription = patterns.find(p =>
    descriptionMatches(p.description, description) && p.type === (isIncome ? 'income' : 'expense')
  );
  if (byDescription) {
    return {
      category: byDescription.category,
      categoryLabel: byDescription.categoryLabel,
      confidence: Math.min(0.90, 0.75 + byDescription.count * 0.02),
      learned: true,
    };
  }

  return null;
}

// 学習状況のサマリー
export function getLearningStats(): { totalPatterns: number; topPatterns: LearnedPattern[] } {
  const patterns = loadPatterns();
  return {
    totalPatterns: patterns.length,
    topPatterns: patterns.sort((a, b) => b.count - a.count).slice(0, 10),
  };
}

// ヘルパー
function extractKeywords(desc: string): string {
  return desc.replace(/\d+/g, '').replace(/[月分年回]/g, '').trim();
}

function descriptionMatches(pattern: string, description: string): boolean {
  if (!pattern || !description) return false;
  const keywords = pattern.split(/\s+/).filter(w => w.length >= 2);
  if (keywords.length === 0) return false;
  // キーワードの過半数が一致すればマッチ（1語の場合はその1語が必要）
  const matchCount = keywords.filter(kw => description.includes(kw)).length;
  return matchCount >= Math.max(1, Math.ceil(keywords.length / 2));
}
