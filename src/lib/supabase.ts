import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 1. Cliente Público: Usado no Front-end
// Seguro para o navegador, pois usa chaves NEXT_PUBLIC_
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Cliente Administrador (Service Role): Usado apenas no Back-end
// Pega a chave secreta. O navegador verá isso como 'undefined'.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Só tenta criar o cliente administrador se a chave existir (ou seja, no servidor).
// Isso impede o erro de 'supabaseKey is required' no front-end.
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
