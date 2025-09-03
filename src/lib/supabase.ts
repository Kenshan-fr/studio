import { createClient } from '@supabase/supabase-js'
import type { Photo } from '@/types';

// IMPORTANT: Remplissez ces valeurs avec les informations de votre projet Supabase.
// Allez dans votre projet Supabase > Project Settings > API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn("Supabase URL or Anon Key is not set. Please update src/lib/supabase.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET_NAME = 'photos';

// Helper function to get public URL for a storage object
export function getPhotoPublicUrl(path: string): string {
    const { data } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    return data.publicUrl;
}
