import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- VOS CLÉS SUPABASE SONT À METTRE ICI ---
// Allez dans votre projet Supabase > Project Settings > API pour les trouver.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://srpdyatoxfdgdyahyewo.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycGR5YXRveGZkZ2R5YWh5ZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MjYwMTksImV4cCI6MjA3MjUwMjAxOX0.mA5tyMhHCbjzZE-jBd__pift2jeoF7Cvf_8zn2umnhg";

let supabase: SupabaseClient;

if (supabaseUrl === "VOTRE_URL_SUPABASE" || supabaseAnonKey === "VOTRE_CLE_ANON_SUPABASE") {
    console.warn("****************************************************************");
    console.warn("ATTENTION: Les clés Supabase ne sont pas configurées.");
    console.warn("Veuillez mettre à jour le fichier src/lib/supabase.ts");
    console.warn("****************************************************************");
    // Crée un client factice pour éviter que l'application ne plante
    supabase = {} as SupabaseClient;
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

export const BUCKET_NAME = 'photos';

// Helper function to get public URL for a storage object
export function getPhotoPublicUrl(path: string): string {
    if (!supabase.storage) return '';
    const { data } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    return data.publicUrl;
}
