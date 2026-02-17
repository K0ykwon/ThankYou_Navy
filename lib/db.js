import { createClient } from '@supabase/supabase-js'

// Codespaces Secrets 또는 .env.local에서 자동으로 읽습니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or ANON KEY from .env.local file or Codespaces Secrets')
}

// 클라이언트 생성 (이제 이 'supabase' 변수로 모든 DB 작업을 합니다)
export const supabase = createClient(supabaseUrl, supabaseKey)
