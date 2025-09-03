
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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

const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "default-app-id";
const UPLOADED_PHOTOS_KEY = "uploadedPhotos";

export default function MyPhotosView() {
  const [myPhotos, setMyPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const getUploadedPhotoIds = (): string[] => {
    if (typeof window === "undefined") return [];
    const uploaded = localStorage.getItem(UPLOADED_PHOTOS_KEY);
    return uploaded ? JSON.parse(uploaded) : [];
  };

  const fetchMyPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const photoIds = getUploadedPhotoIds();
      if (photoIds.length === 0) {
        setMyPhotos([]);
        return;
      }

      const photoPromises = photoIds.map(async (id) => {
        const docRef = doc(db, `artifacts/${appId}/public/data/public_photos`, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Photo;
        }
        return null;
      });

      const fetchedPhotos = (await Promise.all(photoPromises)).filter(
        (p): p is Photo => p !== null
      );
      
      // Sort by upload timestamp descending
      fetchedPhotos.sort((a, b) => {
        const timestampA = a.uploadTimestamp?.toDate?.() || new Date(0);
        const timestampB = b.uploadTimestamp?.toDate?.() || new Date(0);
        return timestampB.getTime() - timestampA.getTime();
      });

      setMyPhotos(fetchedPhotos);
    } catch (error) {
      console.error("Error fetching my photos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPhotos();
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
