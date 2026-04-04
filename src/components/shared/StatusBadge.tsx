'use client';

import type { StatusType } from '@/types';

const styles: Record<StatusType, string> = {
  processed: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-amber-50 text-amber-600',
  error: 'bg-red-50 text-red-600',
  preparing: 'bg-gray-100 text-gray-500',
  submitting: 'bg-blue-50 text-blue-600',
  completed: 'bg-emerald-50 text-emerald-600',
};

const labels: Record<StatusType, string> = {
  processed: '処理済み',
  pending: '確認待ち',
  error: '要修正',
  preparing: '準備中',
  submitting: '提出中',
  completed: '完了',
};

export function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
