
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Photo } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-provider";

const RATED_PHOTOS_KEY = "supabase_ratedPhotos";

export default function RateView() {
  const { user } = useAuth();
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

  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const ratedPhotoIds = Array.from(getRatedPhotos());
    
    try {
        let query = supabase
            .from('photos')
            .select('*')
            .not('uploader_id', 'eq', user.id) // Ne pas charger les photos de l'utilisateur actuel
            .order('created_at', { ascending: false })
            .limit(20);

        if (ratedPhotoIds.length > 0) {
            query = query.not('id', 'in', `(${ratedPhotoIds.join(',')})`);
        }
      
        const { data, error } = await query;

        if (error) throw error;
        
        setPhotosToRate(data || []);
        setCurrentPhotoIndex(0);
        setIsImageLoading(true); // Réinitialiser l'état de chargement pour la nouvelle image
    } catch (error) {
        console.error("Error fetching photos from Supabase: ", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les photos." });
    } finally {
        setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user, fetchPhotos]);
  
  const currentPhoto = photosToRate.length > 0 ? photosToRate[currentPhotoIndex] : null;

  useEffect(() => {
    if (currentPhoto) {
      setIsImageLoading(true);
    }
  }, [currentPhoto]);

  const handleRate = async (score: number) => {
    if (!currentPhoto) return;
    
    addRatedPhoto(currentPhoto.id);

    try {
        const { error } = await supabase.rpc('rate_photo', {
            photo_id: currentPhoto.id,
            rating_value: score
        });

        if (error) throw error;
      
        toast({ title: `Vous avez noté cette photo ${score}/10 !` });

        if (currentPhotoIndex < photosToRate.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
        } else {
            fetchPhotos();
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur", description: error.message || "Erreur lors de l'enregistrement de votre note." });
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
              src={currentPhoto.image_url}
              alt={currentPhoto.description || "Photo à noter"}
              fill
              className={`object-contain transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={true}
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
