import { createClient } from '@supabase/supabase-js';

// 👉 Diese Werte bekommst du aus deinem Supabase-Projekt (Settings → API)
const SUPABASE_URL = 'https://gwpsblqhcbwegjydhxfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cHNibHFoY2J3ZWdqeWRoeGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDgyNDgsImV4cCI6MjA3NTYyNDI0OH0.qliscV_LVz9dU9AFt2MVAv_MxYTYihOPkjWUwgcacxU';

// Client einmalig erstellen und exportieren
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
