/**
 * Supabase côté serveur (API routes).
 * - createServiceRoleClient : pour l'API collect (insert sessions/events, bypass RLS).
 * - getAdminFromRequest : vérifie le JWT et retourne l'admin ou null.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

let _serviceClient: SupabaseClient | null = null;

export function createServiceRoleClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) return null;
  if (!_serviceClient) {
    _serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  }
  return _serviceClient;
}

/**
 * Récupère le token Bearer depuis Authorization.
 * Retourne { adminId } si succès, ou { adminId: null, reason } si échec.
 */
export async function getAdminIdFromRequest(req: NextRequest): Promise<{ adminId: string | null; reason?: string }> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { adminId: null, reason: 'no_token' };

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { adminId: null, reason: `auth_failed: ${error?.message ?? 'no user'}` };

  const service = createServiceRoleClient();
  if (!service) return { adminId: null, reason: 'service_role_key_missing' };

  const { data: admin, error: adminErr } = await service.from('admin_users').select('id').eq('id', user.id).maybeSingle();
  if (adminErr) return { adminId: null, reason: `admin_query_error: ${adminErr.message}` };
  if (!admin) return { adminId: null, reason: 'not_admin' };
  return { adminId: user.id };
}
