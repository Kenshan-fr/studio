
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Photo } from "@/types";
import { useToast } from "@/hooks/use-toast";

const RATED_PHOTOS_KEY = "ratedPhotos";
const ALL_PHOTOS_KEY = "allPhotos";

export default function RateView() {
  const [photosToRate, setPhotosToRate] = useState<Photo[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { toast } = useToast();

  const getRatedPhotos = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    const rated = localStorage.getItem(RATED_PHOTOS_KEY);
    return rated ? new Set(JSON.parse(rated)) : new Set();
  };

  const addRatedPhoto = (photoId: string) => {
    if (typeof window === "undefined") return;
    const ratedPhotos = getRatedPhotos();
    ratedPhotos.add(photoId);
    localStorage.setItem(RATED_PHOTOS_KEY, JSON.stringify(Array.from(ratedPhotos)));
  };

  const fetchPhotos = useCallback(() => {
    setLoading(true);
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    try {
      const allPhotosData = localStorage.getItem(ALL_PHOTOS_KEY);
      const allPhotos: Photo[] = allPhotosData ? JSON.parse(allPhotosData) : [];
      
      const ratedPhotoIds = getRatedPhotos();
      
      const unratedPhotos = allPhotos
        .filter(photo => !ratedPhotoIds.has(photo.id))
        .sort((a, b) => (new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime())); // Newest first

      setPhotosToRate(unratedPhotos);
      setCurrentPhotoIndex(0);
      if (unratedPhotos.length > 0) {
        setIsImageLoading(true);
      }
    } catch (error) {
      console.error("Error fetching photos from local storage: ", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les photos depuis le stockage local." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPhotos();
    const handleStorageChange = () => fetchPhotos();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchPhotos]);
  
  const currentPhoto = photosToRate[currentPhotoIndex];

  useEffect(() => {
    if (currentPhoto) {
      setIsImageLoading(true);
    }
  }, [currentPhotoIndex, currentPhoto]);

  const handleRate = async (score: number) => {
    if (!currentPhoto || typeof window === "undefined") return;
    
    addRatedPhoto(currentPhoto.id);

    try {
      const allPhotosData = localStorage.getItem(ALL_PHOTOS_KEY);
      let allPhotos: Photo[] = allPhotosData ? JSON.parse(allPhotosData) : [];

      const photoIndex = allPhotos.findIndex(p => p.id === currentPhoto.id);
      if (photoIndex === -1) throw new Error("Photo not found in local storage");

      const photoToUpdate = allPhotos[photoIndex];
      const newRatingCount = (photoToUpdate.ratingCount || 0) + 1;
      const newTotalRatingSum = (photoToUpdate.totalRatingSum || 0) + score;
      const newAverageRating = newTotalRatingSum / newRatingCount;

      allPhotos[photoIndex] = {
        ...photoToUpdate,
        ratingCount: newRatingCount,
        totalRatingSum: newTotalRatingSum,
        averageRating: newAverageRating
      };
      
      localStorage.setItem(ALL_PHOTOS_KEY, JSON.stringify(allPhotos));
      
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new Event('storage'));

      toast({ title: `Vous avez noté cette photo ${score}/10 !` });

      if (currentPhotoIndex < photosToRate.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1);
      } else {
        setPhotosToRate([]); // You've rated all available photos
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de l'enregistrement de votre note." });
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Noter les Photos</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
        {loading ? (
          <Skeleton className="w-full h-96" />
        ) : currentPhoto ? (
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted">
            {isImageLoading && <Skeleton className="w-full h-full" />}
            <Image
              key={currentPhoto.id}
              src={currentPhoto.imageDataUri}
              alt={currentPhoto.description || "Photo à noter"}
              fill
              className={`object-contain transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {currentPhoto.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-sm truncate">{currentPhoto.description}</p>
              </div>
            )}
          </div>
        ) : (
          <p>Il n'y a pas de nouvelles photos à noter. Revenez plus tard ou téléchargez la vôtre !</p>
        )}
      </CardContent>
      {!loading && currentPhoto && (
        <CardFooter>
          <div className="grid grid-cols-5 gap-2 w-full">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(score => (
              <Button key={score} onClick={() => handleRate(score)} className="aspect-square h-auto p-0 flex flex-col text-lg hover:bg-primary/80 transition-all duration-200 ease-in-out transform hover:scale-105">
                <span className="text-xl font-bold">{score}</span>
                <span className="text-xs">⭐</span>
              </Button>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
