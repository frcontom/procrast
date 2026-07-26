import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gkwllekbplxdetxdrhmw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GS-0LDxBbmvGjjfCnQ5sgw_xRzM1k6d'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
