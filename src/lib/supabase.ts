import { createClient } from '@supabase/supabase-js';

/**
 * Função para obter o cliente do Supabase
 * 
 * Utilizado para:
 * - Upload de arquivos no bucket 'avatars' (fotos de perfil de leads)
 * - Armazenamento de arquivos
 * 
 * Os buckets disponíveis são:
 * - avatars: fotos de perfil de leads e usuários
 * - documents: documentos e arquivos gerais
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
  }
  
  return createClient(supabaseUrl, supabaseKey);
} 