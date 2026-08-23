import { createClient } from '@supabase/supabase-js';

// TODO: Yahan apne Supabase project ki URL aur anon API key daalni hai.
// Yeh tumhe Supabase -> Project Settings (⚙️) -> API section mein mil jayegi.
const supabaseUrl = 'https://gemldhvokzapkbskxben.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbWxkaHZva3phcGtic2t4YmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NzkxODcsImV4cCI6MjEwMzA1NTE4N30.GxTjWpofvS9hIuDTq6R7kNABhSG1ZNXUCX6vvMCXrSw';

export const supabase = createClient(supabaseUrl, supabaseKey);