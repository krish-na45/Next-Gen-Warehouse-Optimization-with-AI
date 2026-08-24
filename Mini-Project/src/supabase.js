import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jswwisxjytkxdvvnnzxy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3dpc3hqeXRreGR2dm5uenh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Njc5NTcsImV4cCI6MjA5NzU0Mzk1N30.a8VpU_9bhol14SnVwUy6E6vcy_Qs0LDl2Mx9zEznUBQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
