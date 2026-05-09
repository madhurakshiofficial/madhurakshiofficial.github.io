// ============================================================
// js/supabase.js  —  Shared Supabase client
// Import this in EVERY page that needs Supabase
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://cvhepeydpmxmwjmenrqz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aGVwZXlkcG14bXdqbWVucnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwODI0OTksImV4cCI6MjA1OTY1ODQ5OX0.9YKBDKbPUMbsB3hFKbfBnKUSJPJsMz9fXGnWaeSXi00';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);