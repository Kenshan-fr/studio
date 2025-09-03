
export type Photo = {
  id: string; // Will be a UUID from Supabase
  uploader_id: string; // Corresponds to the user's ID from supabase.auth.users
  image_url: string; // Public URL from Supabase Storage
  description?: string;
  created_at: string; // ISO 8601 timestamp
  average_rating: number;
  rating_count: number;
  total_rating_sum: number;
};
