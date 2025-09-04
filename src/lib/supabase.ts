import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- VOS CLÉS SUPABASE SONT MAINTENANT GÉRÉES PAR DES VARIABLES D'ENVIRONNEMENT ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("****************************************************************");
    console.warn("ATTENTION: Les variables d'environnement Supabase ne sont pas configurées.");
    console.warn("Veuillez créer un fichier .env.local et y ajouter NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY");
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
