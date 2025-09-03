
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Photo } from "@/types";

const ALL_PHOTOS_KEY = "allPhotos";

export default function MyPhotosView() {
  const [myPhotos, setMyPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const getUploadedPhotoIds = (): string[] => {
    if (typeof window === "undefined") return [];
    const uploaded = localStorage.getItem("uploadedPhotos");
    return uploaded ? JSON.parse(uploaded) : [];
  };

  const fetchMyPhotos = useCallback(() => {
    setLoading(true);
    if (typeof window === "undefined") return;

    try {
      const allPhotosData = localStorage.getItem(ALL_PHOTOS_KEY);
      const allPhotos: Photo[] = allPhotosData ? JSON.parse(allPhotosData) : [];
      const myPhotoIds = new Set(getUploadedPhotoIds());

      const filteredPhotos = allPhotos.filter(p => myPhotoIds.has(p.id));

      // Sort by upload timestamp descending
      filteredPhotos.sort((a, b) => {
        const timestampA = a.uploadTimestamp ? new Date(a.uploadTimestamp).getTime() : 0;
        const timestampB = b.uploadTimestamp ? new Date(b.uploadTimestamp).getTime() : 0;
        return timestampB - timestampA;
      });

      setMyPhotos(filteredPhotos);
    } catch (error) {
      console.error("Error fetching my photos from local storage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPhotos();
    // Listen for storage changes to update the view
    const handleStorageChange = () => fetchMyPhotos();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchMyPhotos]);

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mes Photos Téléversées</CardTitle>
          <CardDescription>
            Voici les photos que vous avez téléversées depuis ce navigateur.
          </CardDescription>
        </CardHeader>
      </Card>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-full h-80 rounded-lg" />
          ))}
        </div>
      ) : myPhotos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src={photo.imageDataUri}
                    alt={photo.description || "Photo téléversée"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start p-4 space-y-2">
                <p className="text-sm text-muted-foreground truncate w-full">
                  {photo.description || "Aucune description"}
                </p>
                <div className="flex justify-between w-full">
                  <Badge variant="secondary">
                    Note: {photo.averageRating ? photo.averageRating.toFixed(2) : '0.00'} / 10
                  </Badge>
                  <Badge variant="outline">
                    {photo.ratingCount || 0} vote{photo.ratingCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Vous n'avez pas encore téléversé de photos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
