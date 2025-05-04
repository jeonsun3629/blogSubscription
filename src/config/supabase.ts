import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL 또는 API 키가 설정되지 않았습니다. 환경 변수를 확인하세요.');
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 