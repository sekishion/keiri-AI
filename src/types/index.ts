export type StatusType = 'processed' | 'pending' | 'error' | 'preparing' | 'submitting' | 'completed';
export type ChangeType = 'positive' | 'negative' | 'neutral';

export interface Transaction {
  id: string;
  date: string;
  time: string;
  description: string;
  category: string;
  categoryLabel: string;
  amount: number;
  type: 'income' | 'expense';
  source: string;
  counterparty: string;
  status: StatusType;
  confidence: number;
  receiptUrl?: string;
  memo?: string;
}

export interface PendingItem {
  id: string;
  transaction: Transaction;
  question: string;
  choices: PendingChoice[];
}

export interface PendingChoice {
  label: string;
  value: string;
}

export interface MonthlyReport {
  month: string;
  createdAt: string;
  summary: string;
  pl: ProfitLoss;
  bs: BalanceSheet;
  cashflow: Cashflow;
  aiComments: string[];
}

export interface ProfitLoss {
  revenue: number;
  revenueChange: number;
  expenses: number;
  expensesChange: number;
  profit: number;
  profitChange: number;
  expenseBreakdown: ExpenseCategory[];
}

export interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
  changeNote?: string;
}

export interface BalanceSheet {
  assets: BalanceItem[];
  liabilities: BalanceItem[];
  totalAssets: number;
  totalLiabilities: number;
  netAssets: number;
}

export interface BalanceItem {
  name: string;
  amount: number;
}

export interface Cashflow {
  inflow: number;
  outflow: number;
  net: number;
  message: string;
}

export interface CashForecast {
  monthsRemaining: number;
  level: 'safe' | 'caution' | 'warning' | 'critical';
  message: string;
  projectedBalance: number;
  fixedCosts: number;
}

export interface AIAccuracy {
  month: string;
  totalTransactions: number;
  autoProcessed: number;
  manualReview: number;
  corrections: number;
  accuracy: number;
}

export interface Filing {
  id: string;
  name: string;
  deadline: string;
  currentStep: 1 | 2 | 3 | 4;
  steps: string[];
  taxAmount?: number;
  submittedAt?: string;
  receiptNumber?: string;
  questions?: FilingQuestion[];
}

export interface FilingQuestion {
  id: string;
  question: string;
  choices: { label: string; value: string }[];
  answered?: string;
}

export interface Notice {
  id: string;
  message: string;
  type: 'info' | 'action' | 'deadline';
  link?: string;
  date: string;
}

export interface ReportListItem {
  month: string;
  label: string;
  pdfUrl: string;
  createdAt: string;
}

export interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: ChangeType;
}

// 経費精算
export interface ExpenseRequest {
  id: string;
  submittedBy: string;      // 社員名
  date: string;
  description: string;
  amount: number;
  category: string;
  categoryLabel: string;
  receiptUrl?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewComment?: string;
}

// 証憑保存（電子帳簿保存法）
export interface Document {
  id: string;
  transactionId?: string;
  type: 'receipt' | 'invoice' | 'bank_statement' | 'other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;           // base64 or blob URL
  timestamp: string;         // 保存タイムスタンプ
  searchTags: string[];      // 検索用タグ（取引先、日付、金額等）
  amount?: number;
  counterparty?: string;
  date?: string;
}
