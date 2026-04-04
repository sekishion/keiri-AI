'use client';

import { useApp } from '@/lib/store';
import { BottomNav } from './BottomNav';

export function BottomNavConnected() {
  const { state } = useApp();
  return <BottomNav pendingCount={state.pendingItems.length} />;
}
