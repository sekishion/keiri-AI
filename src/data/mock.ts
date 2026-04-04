import type {
  Transaction, PendingItem, MonthlyReport, CashForecast,
  AIAccuracy, Filing, Notice, ReportListItem, MetricCardProps
} from '@/types';

// テスト_銀行明細_建設業.csv の実データをベースに生成
export const mockTransactions: Transaction[] = [
  // === 3月 ===
  { id: 'tx-063', date: '2026-03-31', time: '09:00', description: '消費税中間納付', category: '租税公課', categoryLabel: '税金', amount: 350000, type: 'expense', source: 'みずほ銀行 普通', counterparty: '税務署', status: 'processed', confidence: 0.99 },
  { id: 'tx-062', date: '2026-03-31', time: '09:00', description: '源泉所得税 3月分', category: '預り金', categoryLabel: '源泉税', amount: 185000, type: 'expense', source: 'みずほ銀行 普通', counterparty: '税務署', status: 'processed', confidence: 0.99 },
  { id: 'tx-061', date: '2026-03-26', time: '09:00', description: '振込手数料', category: '支払手数料', categoryLabel: '手数料', amount: 880, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'みずほ銀行', status: 'processed', confidence: 0.95 },
  { id: 'tx-060', date: '2026-03-26', time: '09:00', description: '普通預金利息', category: '受取利息', categoryLabel: '利息', amount: 120, type: 'income', source: 'みずほ銀行 普通', counterparty: 'みずほ銀行', status: 'processed', confidence: 0.99 },
  { id: 'tx-059', date: '2026-03-25', time: '09:00', description: '労働保険料 概算', category: '法定福利費', categoryLabel: '社会保険', amount: 156000, type: 'expense', source: 'みずほ銀行 普通', counterparty: '労働局', status: 'processed', confidence: 0.95 },
  { id: 'tx-058', date: '2026-03-25', time: '09:00', description: '個人 関史音 役員報酬 3月分', category: '役員報酬', categoryLabel: '役員報酬', amount: 300000, type: 'expense', source: 'みずほ銀行 普通', counterparty: '関史音', status: 'processed', confidence: 0.97 },
  { id: 'tx-057', date: '2026-03-24', time: '09:00', description: 'NTTドコモ 携帯料金5回線', category: '通信費', categoryLabel: '通信費', amount: 44000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'NTTドコモ', status: 'processed', confidence: 0.99 },
  { id: 'tx-056', date: '2026-03-23', time: '09:00', description: 'アスクル 事務用品・トナー', category: '消耗品費', categoryLabel: '消耗品', amount: 28500, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'アスクル', status: 'processed', confidence: 0.96 },
  { id: 'tx-055', date: '2026-03-22', time: '09:00', description: 'VWX塗装 追加塗装工事', category: '外注費', categoryLabel: '外注費', amount: 320000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'VWX塗装', status: 'processed', confidence: 0.94 },
  { id: 'tx-054', date: '2026-03-21', time: '09:00', description: 'MNO設計事務所 設計変更料', category: '外注費', categoryLabel: '外注費', amount: 180000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'MNO設計事務所', status: 'processed', confidence: 0.92 },
  { id: 'tx-053', date: '2026-03-20', time: '09:00', description: 'JKLデベロップメント 3月分工事代金', category: '売上', categoryLabel: '売上', amount: 3200000, type: 'income', source: 'みずほ銀行 普通', counterparty: 'JKLデベロップメント', status: 'processed', confidence: 0.99 },
  { id: 'tx-052', date: '2026-03-18', time: '09:00', description: 'ビックカメラ ノートPC購入', category: '消耗品費', categoryLabel: '備品', amount: 198000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'ビックカメラ', status: 'pending', confidence: 0.55, memo: '10万円以上のため固定資産の可能性' },
  { id: 'tx-051', date: '2026-03-17', time: '09:00', description: 'STU電気工事 追加電気工事', category: '外注費', categoryLabel: '外注費', amount: 215000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'STU電気工事', status: 'processed', confidence: 0.93 },
  { id: 'tx-050', date: '2026-03-16', time: '09:00', description: '佐川急便 資材配送料', category: '荷造運賃', categoryLabel: '配送料', amount: 23500, type: 'expense', source: 'みずほ銀行 普通', counterparty: '佐川急便', status: 'processed', confidence: 0.94 },
  { id: 'tx-049', date: '2026-03-15', time: '09:00', description: 'DEF不動産 事務所家賃 3月分', category: '地代家賃', categoryLabel: '家賃', amount: 180000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'DEF不動産', status: 'processed', confidence: 0.99 },
  { id: 'tx-048', date: '2026-03-14', time: '09:00', description: 'コマツレンタル ユンボリース料', category: 'リース料', categoryLabel: 'リース', amount: 275000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'コマツレンタル', status: 'processed', confidence: 0.96 },
  { id: 'tx-047', date: '2026-03-13', time: '09:00', description: 'GHI工務店 下請工事代金', category: '外注費', categoryLabel: '外注費', amount: 750000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'GHI工務店', status: 'processed', confidence: 0.95 },
  { id: 'tx-046', date: '2026-03-12', time: '09:00', description: 'ABC建設 2月分工事代金', category: '売上', categoryLabel: '売上', amount: 2800000, type: 'income', source: 'みずほ銀行 普通', counterparty: 'ABC建設', status: 'processed', confidence: 0.99 },
  { id: 'tx-045', date: '2026-03-10', time: '09:00', description: '社会保険料 3月分', category: '法定福利費', categoryLabel: '社会保険', amount: 380000, type: 'expense', source: 'みずほ銀行 普通', counterparty: '日本年金機構', status: 'processed', confidence: 0.99 },
  { id: 'tx-044', date: '2026-03-10', time: '09:00', description: '従業員給与 3月分', category: '給料手当', categoryLabel: '人件費', amount: 2400000, type: 'expense', source: 'みずほ銀行 普通', counterparty: '従業員', status: 'processed', confidence: 0.99 },
  { id: 'tx-043', date: '2026-03-07', time: '09:00', description: 'ENEOS 社用車ガソリン代', category: '車両費', categoryLabel: '車両費', amount: 52300, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'ENEOS', status: 'processed', confidence: 0.98 },
  { id: 'tx-042', date: '2026-03-06', time: '09:00', description: '丸山建材 コンクリート・砂利', category: '仕入高', categoryLabel: '材料費', amount: 534000, type: 'expense', source: 'みずほ銀行 普通', counterparty: '丸山建材', status: 'processed', confidence: 0.96 },
  { id: 'tx-041', date: '2026-03-05', time: '09:00', description: '三井住友海上 賠償責任保険', category: '保険料', categoryLabel: '保険料', amount: 124000, type: 'expense', source: 'みずほ銀行 普通', counterparty: '三井住友海上', status: 'pending', confidence: 0.60, memo: '損害保険料か支払保険料か確認が必要' },
  { id: 'tx-040', date: '2026-03-04', time: '09:00', description: '東京ガス ガス代', category: '水道光熱費', categoryLabel: '光熱費', amount: 10200, type: 'expense', source: 'みずほ銀行 普通', counterparty: '東京ガス', status: 'processed', confidence: 0.99 },
  { id: 'tx-039', date: '2026-03-04', time: '09:00', description: '東京電力エナジーパートナー 電気代', category: '水道光熱費', categoryLabel: '光熱費', amount: 29800, type: 'expense', source: 'みずほ銀行 普通', counterparty: '東京電力', status: 'processed', confidence: 0.99 },
  { id: 'tx-038', date: '2026-03-03', time: '09:00', description: 'PQR商事 2月分追加工事代金', category: '売上', categoryLabel: '売上', amount: 1800000, type: 'income', source: 'みずほ銀行 普通', counterparty: 'PQR商事', status: 'processed', confidence: 0.99 },
  { id: 'tx-037', date: '2026-03-02', time: '09:00', description: 'YZ建機リース クレーン使用料', category: 'リース料', categoryLabel: 'リース', amount: 390000, type: 'expense', source: 'みずほ銀行 普通', counterparty: 'YZ建機リース', status: 'processed', confidence: 0.94 },
];

// 3月の集計
const marchIncome = mockTransactions.filter(t => t.date.startsWith('2026-03') && t.type === 'income').reduce((s, t) => s + t.amount, 0); // 7,800,120
const marchExpense = mockTransactions.filter(t => t.date.startsWith('2026-03') && t.type === 'expense').reduce((s, t) => s + t.amount, 0);

export const mockPendingItems: PendingItem[] = [
  {
    id: 'p-001',
    transaction: mockTransactions.find(t => t.id === 'tx-052')!,
    question: '¥198,000のPC購入です。経費ですか？固定資産ですか？',
    choices: [
      { label: '経費（消耗品）', value: 'consumables' },
      { label: '固定資産（備品）', value: 'fixed_asset' },
    ],
  },
  {
    id: 'p-002',
    transaction: mockTransactions.find(t => t.id === 'tx-041')!,
    question: '賠償責任保険です。勘定科目はどちらですか？',
    choices: [
      { label: '損害保険料', value: 'casualty_insurance' },
      { label: '支払保険料', value: 'insurance' },
      { label: 'わからない', value: 'unknown' },
    ],
  },
];

export const mockDashboardMetrics: MetricCardProps[] = [
  { label: '売上', value: '780万円', change: '+5.3%', changeType: 'positive' },
  { label: '利益', value: '158万円', change: '+12%', changeType: 'positive' },
  { label: '手元資金', value: '1,084万円', change: '+67万', changeType: 'positive' },
];

export const mockCashForecast: CashForecast = {
  monthsRemaining: 18,
  level: 'safe',
  message: '今のペースなら、あと18ヶ月分の運転資金があります。',
  projectedBalance: 10844240,
  fixedCosts: 3500000,
};

export const mockNotices: Notice[] = [
  { id: 'n-001', message: '3月の帳簿づけ、27件中25件を自動処理しました', type: 'info', date: '2026-03-31' },
  { id: 'n-002', message: '2件、確認をお願いしたい取引があります', type: 'action', link: '/pending', date: '2026-03-31' },
  { id: 'n-003', message: '消費税の確定申告（5/31期限）の準備を開始します', type: 'deadline', date: '2026-03-31' },
];

export const mockAccuracy: AIAccuracy[] = [
  { month: '2026-01', totalTransactions: 16, autoProcessed: 15, manualReview: 1, corrections: 0, accuracy: 0.938 },
  { month: '2026-02', totalTransactions: 20, autoProcessed: 19, manualReview: 1, corrections: 0, accuracy: 0.950 },
  { month: '2026-03', totalTransactions: 27, autoProcessed: 25, manualReview: 2, corrections: 0, accuracy: 0.926 },
];

export const mockReport: MonthlyReport = {
  month: '2026-03',
  createdAt: '2026-03-31',
  summary: '売上780万円、経費622万円、利益158万円。売上は先月比+5.3%。外注費が増加傾向（VWX塗装・STU電気の追加工事）。資金繰りに問題はありません。',
  pl: {
    revenue: 7800120,
    revenueChange: 0.053,
    expenses: 6220180,
    expensesChange: 0.028,
    profit: 1579940,
    profitChange: 0.12,
    expenseBreakdown: [
      { name: '人件費（給与+役員報酬）', amount: 2700000, percentage: 0.434 },
      { name: '外注費', amount: 1465000, percentage: 0.236, changeNote: '先月比+33万。追加工事が2件発生' },
      { name: '材料費', amount: 534000, percentage: 0.086 },
      { name: 'リース料', amount: 665000, percentage: 0.107 },
      { name: '社会保険・労働保険', amount: 536000, percentage: 0.086 },
      { name: '家賃・光熱費・通信', amount: 264000, percentage: 0.042 },
      { name: 'その他（税金・保険・消耗品等）', amount: 1056180, percentage: 0.170 },
    ],
  },
  bs: {
    assets: [
      { name: '現金・預金', amount: 10844240 },
      { name: '売掛金', amount: 2400000 },
      { name: '固定資産', amount: 800000 },
    ],
    liabilities: [
      { name: '買掛金', amount: 650000 },
      { name: '未払金', amount: 420000 },
      { name: '預り金（源泉税等）', amount: 185000 },
    ],
    totalAssets: 14044240,
    totalLiabilities: 1255000,
    netAssets: 12789240,
  },
  cashflow: {
    inflow: 7800120,
    outflow: 6220180,
    net: 1579940,
    message: '手元資金は先月より約67万円増えました。',
  },
  aiComments: [
    '売上は3ヶ月連続で増加中。年間ペースは約9,100万円です。',
    '外注費が先月比+33万円。VWX塗装とSTU電気の追加工事が発生しています。',
    '¥198,000のPC購入があります。10万円以上のため固定資産計上が必要な可能性があります。',
    '消費税の確定申告期限（5/31）が近づいています。準備を開始します。',
  ],
};

export const mockReportList: ReportListItem[] = [
  { month: '2026-03', label: '2026年3月', pdfUrl: '#', createdAt: '2026-03-31' },
  { month: '2026-02', label: '2026年2月', pdfUrl: '#', createdAt: '2026-02-28' },
  { month: '2026-01', label: '2026年1月', pdfUrl: '#', createdAt: '2026-01-31' },
];

export const mockFilings: Filing[] = [
  {
    id: 'f-001',
    name: '消費税 確定申告',
    deadline: '2026-05-31',
    currentStep: 1,
    steps: ['準備中', '確認待ち', '提出', '完了'],
  },
  {
    id: 'f-002',
    name: '法人税 確定申告',
    deadline: '2026-05-31',
    currentStep: 1,
    steps: ['準備中', '確認待ち', '提出', '完了'],
  },
  {
    id: 'f-003',
    name: '源泉所得税（1月分）',
    deadline: '2026-02-10',
    currentStep: 4,
    steps: ['準備中', '確認待ち', '提出', '完了'],
    submittedAt: '2026-02-08',
    receiptNumber: 'e-Tax-2026-00089',
  },
];
