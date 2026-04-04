import Papa from 'papaparse';

export interface RawBankTransaction {
  date: string;
  description: string;
  deposit: number;   // 入金
  withdrawal: number; // 出金
  balance: number;
  raw: Record<string, string>;
}

// 主要銀行のCSVフォーマットを自動検出
type BankFormat = 'mizuho' | 'mufg' | 'smbc' | 'rakuten' | 'generic';

function detectBankFormat(headers: string[]): BankFormat {
  const h = headers.join(',').toLowerCase();
  if (h.includes('お取引日') && h.includes('みずほ')) return 'mizuho';
  if (h.includes('日付') && h.includes('摘要') && h.includes('お支払金額')) return 'mufg';
  if (h.includes('年月日') && h.includes('お引出し')) return 'smbc';
  if (h.includes('取引日') && h.includes('入出金')) return 'rakuten';
  return 'generic';
}

function normalizeDate(dateStr: string): string {
  // "2026/03/26" or "2026-03-26" or "20260326" → "2026-03-26"
  const cleaned = dateStr.replace(/[年月]/g, '-').replace(/日/g, '').replace(/\//g, '-').trim();
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }
  return cleaned;
}

function parseAmount(str: string): number {
  if (!str) return 0;
  return Math.abs(parseInt(str.replace(/[,，円¥\s]/g, ''), 10)) || 0;
}

export function parseBankCSV(csvText: string): RawBankTransaction[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (!result.data || result.data.length === 0) return [];

  const headers = Object.keys(result.data[0] as Record<string, string>);
  const format = detectBankFormat(headers);
  const rows = result.data as Record<string, string>[];

  return rows.map((row) => {
    let date = '', description = '', deposit = 0, withdrawal = 0, balance = 0;

    switch (format) {
      case 'mizuho':
        date = row['お取引日'] || row['日付'] || '';
        description = row['お取引内容'] || row['摘要'] || '';
        deposit = parseAmount(row['お預入金額'] || row['入金'] || '');
        withdrawal = parseAmount(row['お引出金額'] || row['出金'] || '');
        balance = parseAmount(row['お取引後残高'] || row['残高'] || '');
        break;
      case 'mufg':
        date = row['日付'] || '';
        description = row['摘要'] || '';
        deposit = parseAmount(row['お預り金額'] || '');
        withdrawal = parseAmount(row['お支払金額'] || '');
        balance = parseAmount(row['残高'] || '');
        break;
      case 'smbc':
        date = row['年月日'] || '';
        description = row['お取引内容'] || '';
        deposit = parseAmount(row['お預入れ金額'] || '');
        withdrawal = parseAmount(row['お引出し金額'] || '');
        balance = parseAmount(row['残高'] || '');
        break;
      case 'rakuten':
        date = row['取引日'] || '';
        description = row['摘要'] || '';
        const amount = parseAmount(row['入出金(円)'] || row['金額'] || '');
        if (row['入出金(円)']?.includes('-') || row['入出金']?.includes('-')) {
          withdrawal = amount;
        } else {
          deposit = amount;
        }
        balance = parseAmount(row['残高(円)'] || row['残高'] || '');
        break;
      default:
        // 汎用: ヘッダーからそれっぽいカラムを探す
        const dateKey = headers.find(h => /日付|日|date/i.test(h)) || headers[0];
        const descKey = headers.find(h => /摘要|内容|desc/i.test(h)) || headers[1];
        const depositKey = headers.find(h => /入金|預入|deposit/i.test(h));
        const withdrawalKey = headers.find(h => /出金|引出|支払|withdrawal/i.test(h));
        const balanceKey = headers.find(h => /残高|balance/i.test(h));

        date = row[dateKey] || '';
        description = row[descKey] || '';
        deposit = depositKey ? parseAmount(row[depositKey]) : 0;
        withdrawal = withdrawalKey ? parseAmount(row[withdrawalKey]) : 0;
        balance = balanceKey ? parseAmount(row[balanceKey]) : 0;

        // 入出金が1カラムの場合
        if (!depositKey && !withdrawalKey) {
          const amountKey = headers.find(h => /金額|amount/i.test(h));
          if (amountKey) {
            const val = parseInt(row[amountKey].replace(/[,，円¥\s]/g, ''), 10) || 0;
            if (val >= 0) deposit = val;
            else withdrawal = Math.abs(val);
          }
        }
    }

    return {
      date: normalizeDate(date),
      description: description.trim(),
      deposit,
      withdrawal,
      balance,
      raw: row,
    };
  }).filter(tx => tx.date && (tx.deposit > 0 || tx.withdrawal > 0));
}
