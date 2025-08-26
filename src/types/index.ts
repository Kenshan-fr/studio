export type Photo = {
  id: string;
  uploaderId: string;
  imageUrl: string;
  description?: string;
  uploadTimestamp: any; // Using `any` for Firebase Timestamp compatibility
  averageRating: number;
  ratingCount: number;
  totalRatingSum: number;
};
