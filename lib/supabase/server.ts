import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client de servidor usando a service role key — nunca importar isto em
 * componentes client. O acesso é protegido pela senha única de equipe
 * (ver middleware.ts), não por RLS.
 */
export function supabaseServer() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
