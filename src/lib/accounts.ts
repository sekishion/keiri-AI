// 中小企業向け勘定科目マスタ
// freee/マネフォの科目体系をベースに、中小企業が実際に使うものに絞っている

export interface Account {
  code: string;        // 勘定科目コード
  name: string;        // 正式名称
  label: string;       // 社長向け表示名（やさしい言葉）
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  taxType: TaxType;    // 消費税区分
  group: string;       // グループ（P/L・B/Sのセクション）
}

export type TaxType =
  | 'taxable_10'     // 課税10%
  | 'taxable_8'      // 課税8%（軽減税率）
  | 'exempt'         // 非課税
  | 'non_taxable'    // 不課税
  | 'tax_free';      // 免税

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  taxable_10: '課税10%',
  taxable_8: '課税8%（軽減）',
  exempt: '非課税',
  non_taxable: '不課税',
  tax_free: '免税',
};

export const ACCOUNTS: Account[] = [
  // === 収益 ===
  { code: '400', name: '売上高', label: '売上', type: 'revenue', taxType: 'taxable_10', group: '売上' },
  { code: '410', name: '受取利息', label: '利息', type: 'revenue', taxType: 'non_taxable', group: '営業外収益' },
  { code: '420', name: '雑収入', label: 'その他の収入', type: 'revenue', taxType: 'taxable_10', group: '営業外収益' },

  // === 費用（売上原価） ===
  { code: '500', name: '材料仕入高', label: '材料費', type: 'expense', taxType: 'taxable_10', group: '売上原価' },
  { code: '510', name: '外注費', label: '外注費', type: 'expense', taxType: 'taxable_10', group: '売上原価' },

  // === 費用（販管費・人件費） ===
  { code: '600', name: '役員報酬', label: '役員報酬', type: 'expense', taxType: 'non_taxable', group: '人件費' },
  { code: '601', name: '給料手当', label: '人件費', type: 'expense', taxType: 'non_taxable', group: '人件費' },
  { code: '602', name: '賞与', label: '賞与', type: 'expense', taxType: 'non_taxable', group: '人件費' },
  { code: '603', name: '法定福利費', label: '社会保険', type: 'expense', taxType: 'non_taxable', group: '人件費' },
  { code: '604', name: '福利厚生費', label: '福利厚生', type: 'expense', taxType: 'taxable_10', group: '人件費' },

  // === 費用（販管費・経費） ===
  { code: '610', name: '地代家賃', label: '家賃', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '611', name: '水道光熱費', label: '光熱費', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '612', name: '通信費', label: '通信費', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '613', name: '旅費交通費', label: '交通費', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '614', name: '交際費', label: '接待', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '615', name: '会議費', label: '会議費', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '616', name: '消耗品費', label: '消耗品', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '617', name: '車両費', label: '車両費', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '618', name: '保険料', label: '保険料', type: 'expense', taxType: 'exempt', group: '経費' },
  { code: '619', name: 'リース料', label: 'リース', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '620', name: '支払手数料', label: '手数料', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '621', name: '荷造運賃', label: '配送料', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '622', name: '広告宣伝費', label: '広告費', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '623', name: '新聞図書費', label: '書籍・新聞', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '624', name: '修繕費', label: '修繕費', type: 'expense', taxType: 'taxable_10', group: '経費' },
  { code: '625', name: '雑費', label: 'その他', type: 'expense', taxType: 'taxable_10', group: '経費' },

  // === 費用（税金） ===
  { code: '630', name: '租税公課', label: '税金', type: 'expense', taxType: 'non_taxable', group: '税金' },
  { code: '631', name: '減価償却費', label: '減価償却', type: 'expense', taxType: 'non_taxable', group: '税金' },

  // === 資産 ===
  { code: '100', name: '現金', label: '現金', type: 'asset', taxType: 'non_taxable', group: '流動資産' },
  { code: '101', name: '普通預金', label: '銀行口座', type: 'asset', taxType: 'non_taxable', group: '流動資産' },
  { code: '110', name: '売掛金', label: '未入金', type: 'asset', taxType: 'non_taxable', group: '流動資産' },
  { code: '120', name: '工具器具備品', label: '備品', type: 'asset', taxType: 'taxable_10', group: '固定資産' },

  // === 負債 ===
  { code: '200', name: '買掛金', label: '未払い', type: 'liability', taxType: 'non_taxable', group: '流動負債' },
  { code: '201', name: '未払金', label: '未払金', type: 'liability', taxType: 'non_taxable', group: '流動負債' },
  { code: '202', name: '預り金', label: '源泉税等', type: 'liability', taxType: 'non_taxable', group: '流動負債' },
  { code: '210', name: '長期借入金', label: '借入金', type: 'liability', taxType: 'non_taxable', group: '固定負債' },
];

export function findAccount(nameOrLabel: string): Account | undefined {
  return ACCOUNTS.find(a =>
    a.name === nameOrLabel || a.label === nameOrLabel || a.code === nameOrLabel
  );
}

export function getExpenseAccounts(): Account[] {
  return ACCOUNTS.filter(a => a.type === 'expense');
}

export function getRevenueAccounts(): Account[] {
  return ACCOUNTS.filter(a => a.type === 'revenue');
}

// 消費税計算
export function calcTax(amount: number, taxType: TaxType): { taxExcluded: number; tax: number; total: number } {
  switch (taxType) {
    case 'taxable_10': {
      const taxExcluded = Math.floor(amount / 1.1);
      return { taxExcluded, tax: amount - taxExcluded, total: amount };
    }
    case 'taxable_8': {
      const taxExcluded = Math.floor(amount / 1.08);
      return { taxExcluded, tax: amount - taxExcluded, total: amount };
    }
    default:
      return { taxExcluded: amount, tax: 0, total: amount };
  }
}

// 月次の消費税集計
export function calcMonthlyTax(transactions: { amount: number; type: 'income' | 'expense'; category: string }[]): {
  salesTax: number;       // 仮受消費税（売上にかかる）
  purchaseTax: number;    // 仮払消費税（仕入・経費にかかる）
  taxOwed: number;        // 納付額
} {
  let salesTax = 0;
  let purchaseTax = 0;

  for (const tx of transactions) {
    const account = ACCOUNTS.find(a => a.name === tx.category || a.label === tx.category);
    if (!account) continue;

    const { tax } = calcTax(tx.amount, account.taxType);
    if (tx.type === 'income') {
      salesTax += tax;
    } else {
      purchaseTax += tax;
    }
  }

  return { salesTax, purchaseTax, taxOwed: salesTax - purchaseTax };
}
