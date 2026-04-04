-- AI税務サービス DBスキーマ
-- Supabase SQL Editor で実行

-- 会社マスタ
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade,
  fiscal_year_end_month int default 3,
  created_at timestamptz default now()
);

alter table public.companies enable row level security;
create policy "Users can view own company" on public.companies
  for select using (auth.uid() = owner_id);
create policy "Users can insert own company" on public.companies
  for insert with check (auth.uid() = owner_id);

-- 取引データ
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  date date not null,
  description text not null,
  amount bigint not null, -- 円単位
  type text check (type in ('income', 'expense')) not null,
  category text not null default '未分類',
  category_label text not null default '未分類',
  counterparty text not null default '',
  source text not null default '', -- 銀行名、カード名等
  status text check (status in ('processed', 'pending', 'error')) not null default 'pending',
  confidence real default 0,
  ai_reason text,
  original_text text, -- CSV元データ
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.transactions enable row level security;
create policy "Users can view own transactions" on public.transactions
  for select using (
    company_id in (select id from public.companies where owner_id = auth.uid())
  );
create policy "Users can insert own transactions" on public.transactions
  for insert with check (
    company_id in (select id from public.companies where owner_id = auth.uid())
  );
create policy "Users can update own transactions" on public.transactions
  for update using (
    company_id in (select id from public.companies where owner_id = auth.uid())
  );

-- 確認待ちレビュー
create table public.pending_reviews (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  question text not null,
  choices jsonb not null default '[]',
  answered_value text,
  answered_at timestamptz,
  created_at timestamptz default now()
);

alter table public.pending_reviews enable row level security;
create policy "Users can view own reviews" on public.pending_reviews
  for select using (
    transaction_id in (
      select t.id from public.transactions t
      join public.companies c on t.company_id = c.id
      where c.owner_id = auth.uid()
    )
  );
create policy "Users can update own reviews" on public.pending_reviews
  for update using (
    transaction_id in (
      select t.id from public.transactions t
      join public.companies c on t.company_id = c.id
      where c.owner_id = auth.uid()
    )
  );

-- 月次レポート
create table public.monthly_reports (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  month text not null, -- "2026-03"
  summary text not null,
  revenue bigint not null,
  expenses bigint not null,
  profit bigint not null,
  revenue_change real default 0,
  expenses_change real default 0,
  profit_change real default 0,
  expense_breakdown jsonb not null default '[]',
  ai_comments jsonb not null default '[]',
  pdf_url text,
  created_at timestamptz default now(),
  unique(company_id, month)
);

alter table public.monthly_reports enable row level security;
create policy "Users can view own reports" on public.monthly_reports
  for select using (
    company_id in (select id from public.companies where owner_id = auth.uid())
  );

-- AI精度ログ
create table public.accuracy_logs (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  month text not null,
  total_transactions int not null,
  auto_processed int not null,
  manual_review int not null,
  corrections int not null,
  accuracy real not null,
  created_at timestamptz default now(),
  unique(company_id, month)
);

alter table public.accuracy_logs enable row level security;
create policy "Users can view own accuracy" on public.accuracy_logs
  for select using (
    company_id in (select id from public.companies where owner_id = auth.uid())
  );

-- インデックス
create index idx_transactions_company_date on public.transactions(company_id, date desc);
create index idx_transactions_status on public.transactions(status);
create index idx_monthly_reports_company on public.monthly_reports(company_id, month desc);
