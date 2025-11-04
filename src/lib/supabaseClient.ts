import { createClient } from '@supabase/supabase-js'

// GEÄNDERT: 'import.meta.env' zu 'process.env'
// GEÄNDERT: Variablennamen mit NEXT_PUBLIC_ Präfix
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)