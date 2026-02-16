import { createClient } from '@supabase/supabase-js'

// Next.js는 자동으로 .env.local 파일의 변수를 읽습니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or ANON KEY from .env.local file')
}

// 클라이언트 생성 (이제 이 'supabase' 변수로 모든 DB 작업을 합니다)
export const supabase = createClient(supabaseUrl, supabaseKey)
