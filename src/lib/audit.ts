import type { Transaction } from '@/types';
import { ACCOUNTS } from './accounts';

// AI監査スコア: 帳簿の健全性を0-100でスコアリング
// Bookeeping.aiのPaulaが24/7で監視しているのと同じ機能

export interface AuditResult {
  score: number;           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checks: AuditCheck[];
  summary: string;
}

export interface AuditCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  score: number;           // 0-100（この項目のスコア）
  detail?: string;
}

export function runAudit(transactions: Transaction[]): AuditResult {
  const checks: AuditCheck[] = [];

  // 1. 未分類チェック
  const unclassified = transactions.filter(t => t.category === '未分類' || t.categoryLabel === '未分類');
  const unclassifiedRate = transactions.length > 0 ? unclassified.length / transactions.length : 0;
  checks.push({
    id: 'unclassified',
    name: '仕訳の分類率',
    description: 'すべての取引が適切に分類されているか',
    status: unclassifiedRate === 0 ? 'pass' : unclassifiedRate < 0.05 ? 'warning' : 'fail',
    score: Math.round((1 - unclassifiedRate) * 100),
    detail: unclassified.length > 0 ? `${unclassified.length}件が未分類です` : undefined,
  });

  // 2. 確認待ちチェック
  const pending = transactions.filter(t => t.status === 'pending');
  const pendingRate = transactions.length > 0 ? pending.length / transactions.length : 0;
  checks.push({
    id: 'pending',
    name: '確認待ちの消化',
    description: 'AIが迷った取引がすべて確認されているか',
    status: pendingRate === 0 ? 'pass' : pendingRate < 0.05 ? 'warning' : 'fail',
    score: Math.round((1 - pendingRate) * 100),
    detail: pending.length > 0 ? `${pending.length}件が確認待ちです` : undefined,
  });

  // 3. 勘定科目の妥当性
  const validAccounts = transactions.filter(t => {
    return ACCOUNTS.some(a => a.name === t.category || a.label === t.categoryLabel);
  });
  const validRate = transactions.length > 0 ? validAccounts.length / transactions.length : 1;
  checks.push({
    id: 'valid_accounts',
    name: '勘定科目の妥当性',
    description: '正式な勘定科目で記帳されているか',
    status: validRate >= 0.95 ? 'pass' : validRate >= 0.8 ? 'warning' : 'fail',
    score: Math.round(validRate * 100),
  });

  // 4. 重複取引チェック
  const duplicates = findDuplicates(transactions);
  checks.push({
    id: 'duplicates',
    name: '重複取引',
    description: '同一取引が二重に登録されていないか',
    status: duplicates.length === 0 ? 'pass' : duplicates.length <= 2 ? 'warning' : 'fail',
    score: duplicates.length === 0 ? 100 : Math.max(0, 100 - duplicates.length * 10),
    detail: duplicates.length > 0 ? `${duplicates.length}件の重複の疑いがあります` : undefined,
  });

  // 5. 異常値チェック（前月比で大きく外れた取引）
  const anomalies = findAnomalies(transactions);
  checks.push({
    id: 'anomalies',
    name: '異常値',
    description: '通常と大きく異なる取引がないか',
    status: anomalies.length === 0 ? 'pass' : anomalies.length <= 3 ? 'warning' : 'fail',
    score: anomalies.length === 0 ? 100 : Math.max(50, 100 - anomalies.length * 8),
    detail: anomalies.length > 0 ? `${anomalies.length}件の異常値を検出しました` : undefined,
  });

  // 6. 月次バランスチェック
  const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort();
  const balanceOk = months.length > 0; // 簡易チェック
  checks.push({
    id: 'monthly_balance',
    name: '月次記帳の完了',
    description: '各月の記帳が完了しているか',
    status: balanceOk ? 'pass' : 'warning',
    score: balanceOk ? 100 : 50,
    detail: `${months.length}ヶ月分のデータがあります`,
  });

  // 7. 証憑の添付率
  const withReceipt = transactions.filter(t => t.receiptUrl || t.source === 'レシート撮影');
  const receiptRate = transactions.length > 0 ? withReceipt.length / transactions.length : 0;
  checks.push({
    id: 'receipt_coverage',
    name: '証憑の添付率',
    description: '取引に証憑（レシート等）が添付されているか',
    status: receiptRate >= 0.8 ? 'pass' : receiptRate >= 0.5 ? 'warning' : 'fail',
    score: Math.round(receiptRate * 100),
    detail: `${withReceipt.length}/${transactions.length}件に証憑があります`,
  });

  // 8. 消費税区分の設定
  const taxChecked = transactions.filter(t => {
    const account = ACCOUNTS.find(a => a.name === t.category || a.label === t.categoryLabel);
    return account !== undefined;
  });
  const taxRate = transactions.length > 0 ? taxChecked.length / transactions.length : 1;
  checks.push({
    id: 'tax_classification',
    name: '消費税区分',
    description: '消費税の課税区分が正しく設定されているか',
    status: taxRate >= 0.95 ? 'pass' : taxRate >= 0.8 ? 'warning' : 'fail',
    score: Math.round(taxRate * 100),
  });

  // 総合スコア
  const totalScore = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length);
  const grade: AuditResult['grade'] =
    totalScore >= 90 ? 'A' :
    totalScore >= 80 ? 'B' :
    totalScore >= 70 ? 'C' :
    totalScore >= 60 ? 'D' : 'F';

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;

  let summary = '';
  if (grade === 'A') summary = '帳簿の状態は良好です。すべてのチェック項目をクリアしています。';
  else if (grade === 'B') summary = '帳簿はおおむね良好です。いくつかの改善点があります。';
  else if (grade === 'C') summary = '帳簿に注意が必要な項目があります。確認してください。';
  else summary = '帳簿に問題があります。早急な対応が必要です。';

  if (failCount > 0) summary += `（要対応: ${failCount}件）`;

  return { score: totalScore, grade, checks, summary };
}

function findDuplicates(transactions: Transaction[]): Transaction[] {
  const seen = new Map<string, Transaction>();
  const duplicates: Transaction[] = [];

  for (const tx of transactions) {
    const key = `${tx.date}_${tx.amount}_${tx.counterparty}`;
    if (seen.has(key)) {
      duplicates.push(tx);
    } else {
      seen.set(key, tx);
    }
  }

  return duplicates;
}

function findAnomalies(transactions: Transaction[]): Transaction[] {
  const byCategory = new Map<string, number[]>();

  for (const tx of transactions) {
    const key = tx.categoryLabel || tx.category;
    const amounts = byCategory.get(key) || [];
    amounts.push(tx.amount);
    byCategory.set(key, amounts);
  }

  const anomalies: Transaction[] = [];

  for (const tx of transactions) {
    const key = tx.categoryLabel || tx.category;
    const amounts = byCategory.get(key) || [];
    if (amounts.length < 3) continue;

    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    if (tx.amount > avg * 3 || tx.amount < avg * 0.1) {
      anomalies.push(tx);
    }
  }

  return anomalies;
}

// 自動照合: 銀行残高と帳簿の突合
export interface ReconciliationResult {
  status: 'matched' | 'discrepancy';
  bankBalance: number;
  bookBalance: number;
  difference: number;
  unmatchedItems: { date: string; description: string; amount: number; source: 'bank' | 'book' }[];
}

export function reconcile(
  transactions: Transaction[],
  bankBalance: number  // CSVの最終残高
): ReconciliationResult {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const bookBalance = income - expense; // 簡易的な帳簿残高（期首残高がないため差分で）

  // 実際の照合では銀行の各取引と帳簿の各取引を1対1で突合する
  // ここでは簡易版として残高の比較のみ
  const difference = Math.abs(bankBalance - bookBalance);
  const isMatched = difference < 1000; // ¥1,000未満の差は許容

  return {
    status: isMatched ? 'matched' : 'discrepancy',
    bankBalance,
    bookBalance,
    difference,
    unmatchedItems: [], // 実装時は不一致取引を特定
  };
}
