import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Section = {
  id: string;
  key: string;
  sort_order: number;
  visible: boolean;
  content: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type MediaRow = {
  id: string;
  section_key: string;
  bucket: string;
  path: string;
  kind: 'image' | 'video';
  alt: string | null;
  sort_order: number;
  meta: Record<string, unknown>;
};
