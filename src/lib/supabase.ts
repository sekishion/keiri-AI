import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          fiscal_year_end_month: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at'>;
      };
      transactions: {
        Row: {
          id: string;
          company_id: string;
          date: string;
          description: string;
          amount: number;
          type: 'income' | 'expense';
          category: string;
          category_label: string;
          counterparty: string;
          source: string;
          status: 'processed' | 'pending' | 'error';
          confidence: number;
          ai_reason: string | null;
          original_text: string | null;
          receipt_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
      };
      pending_reviews: {
        Row: {
          id: string;
          transaction_id: string;
          question: string;
          choices: { label: string; value: string }[];
          answered_value: string | null;
          answered_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pending_reviews']['Row'], 'id' | 'created_at'>;
      };
      monthly_reports: {
        Row: {
          id: string;
          company_id: string;
          month: string;
          summary: string;
          revenue: number;
          expenses: number;
          profit: number;
          revenue_change: number;
          expenses_change: number;
          profit_change: number;
          expense_breakdown: { name: string; amount: number; percentage: number }[];
          ai_comments: string[];
          pdf_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['monthly_reports']['Row'], 'id' | 'created_at'>;
      };
      accuracy_logs: {
        Row: {
          id: string;
          company_id: string;
          month: string;
          total_transactions: number;
          auto_processed: number;
          manual_review: number;
          corrections: number;
          accuracy: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['accuracy_logs']['Row'], 'id' | 'created_at'>;
      };
    };
  };
};
