import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:8001'; // Use your SUPABASE_PUBLIC_URL if different
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'; // Replace with your actual anon key if needed

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
