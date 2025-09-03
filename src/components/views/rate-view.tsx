
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useAuth } from "@/context/auth-provider";
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc, setDoc, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Photo } from "@/types";

const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "default-app-id";

export default function RateView() {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [photosToRate, setPhotosToRate] = useState<Photo[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;
  
    setLoading(true);
    // Fetch photos not uploaded by the current user
    const photosRef = collection(db, `artifacts/${appId}/public/data/public_photos`);
    const q = query(photosRef, where("uploaderId", "!=", user.uid), limit(20));
  
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let fetchedPhotos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      
      // Filter out photos the user has already rated
      const ratingsRef = collection(db, `artifacts/${appId}/public/data/ratings`);
      const userRatingsQuery = query(ratingsRef, where("raterId", "==", user.uid));
      const userRatingsSnapshot = await getDocs(userRatingsQuery);
      
      const ratedPhotoIds = new Set(userRatingsSnapshot.docs.map(doc => doc.data().ratedPhotoId));
      
      fetchedPhotos = fetchedPhotos.filter(photo => !ratedPhotoIds.has(photo.id));

      setPhotosToRate(fetchedPhotos);
      setCurrentPhotoIndex(0);
      setLoading(false);
      setIsImageLoading(true);
  
    }, (error) => {
      console.error("Error fetching photos: ", error);
      toast({ variant: "destructive", title: t.error, description: t.errorPhotosFetch });
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [user, profile, t.error, t.errorPhotosFetch, toast]);
  
  const currentPhoto = photosToRate[currentPhotoIndex];

  useEffect(() => {
    if (currentPhoto) {
      setIsImageLoading(true);
    }
  }, [currentPhoto]);

  const handleRate = async (score: number) => {
    if (!user || !currentPhoto) return;
    
    const ratingId = crypto.randomUUID();
    const photoDocRef = doc(db, `artifacts/${appId}/public/data/public_photos`, currentPhoto.id);
    const ratingDocRef = doc(db, `artifacts/${appId}/public/data/ratings`, ratingId);

    try {
        const photoSnap = await getDoc(photoDocRef);
        if (!photoSnap.exists()) throw new Error("Photo not found");

        const photoData = photoSnap.data();
        const newRatingCount = (photoData.ratingCount || 0) + 1;
        const newTotalRatingSum = (photoData.totalRatingSum || 0) + score;
        const newAverageRating = newTotalRatingSum / newRatingCount;

        await updateDoc(photoDocRef, {
            ratingCount: newRatingCount,
            totalRatingSum: newTotalRatingSum,
            averageRating: newAverageRating
        });

        await setDoc(ratingDocRef, {
            ratingId,
            raterId: user.uid,
            ratedPhotoId: currentPhoto.id,
            score,
            timestamp: new Date(),
        });
        
        toast({ title: t.ratedPhoto(score) });

        if (currentPhotoIndex < photosToRate.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
        } else {
            // Re-fetch or show "no more photos"
            setLoading(true);
            setPhotosToRate([]);
        }

    } catch (error) {
        toast({ variant: "destructive", title: t.error, description: t.errorRateSave });
    }
  };


  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t.ratePhotosTitle}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
        {loading ? (
          <Skeleton className="w-full h-96" />
        ) : currentPhoto ? (
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted">
            {isImageLoading && <Skeleton className="w-full h-full" />}
            <Image
              src={currentPhoto.imageUrl}
              alt={currentPhoto.description || t.photoToRate}
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
          <p>{t.noPhotosMessage}</p>
        )}
      </CardContent>
      {currentPhoto && (
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
