
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-provider";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { ConfirmationDialog } from "../shared/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";

export default function MyPhotosView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myPhotos, setMyPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  const fetchMyPhotos = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPhotos(data || []);
    } catch (error) {
      console.error("Error fetching my photos from Supabase:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger vos photos." });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMyPhotos();
  }, [fetchMyPhotos]);

  const openConfirmationDialog = (photo: Photo) => {
    setPhotoToDelete(photo);
  };

  const handleDeleteConfirm = async () => {
    if (!photoToDelete || !user) return;

    setIsDeleting(true);
    try {
      // 1. Delete from Storage
      const filePath = photoToDelete.image_url.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([filePath]);

      if (storageError) {
        // Log error but proceed to delete DB record anyway, as it might be an orphaned entry
        console.error("Storage deletion error:", storageError.message);
      }

      // 2. Delete from Database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoToDelete.id);

      if (dbError) throw dbError;

      // 3. Update UI
      setMyPhotos(myPhotos.filter((p) => p.id !== photoToDelete.id));
      toast({ title: "Photo supprimée avec succès !" });

    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: error.message || "La suppression de la photo a échoué.",
      });
    } finally {
      setIsDeleting(false);
      setPhotoToDelete(null);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mes Photos Téléversées</CardTitle>
          <CardDescription>
            Voici les photos que vous avez téléversées avec ce compte.
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
            <Card key={photo.id} className="overflow-hidden group">
              <CardContent className="p-0 relative">
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src={photo.image_url}
                    alt={photo.description || "Photo téléversée"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => openConfirmationDialog(photo)}
                  aria-label="Supprimer la photo"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </CardContent>
              <CardFooter className="flex-col items-start p-4 space-y-2">
                <p className="text-sm text-muted-foreground truncate w-full">
                  {photo.description || "Aucune description"}
                </p>
                <div className="flex justify-between w-full">
                  <Badge variant="secondary">
                    Note: {photo.average_rating ? photo.average_rating.toFixed(2) : '0.00'} / 10
                  </Badge>
                  <Badge variant="outline">
                    {photo.rating_count || 0} vote{photo.rating_count !== 1 ? "s" : ""}
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
      <ConfirmationDialog
        isOpen={!!photoToDelete}
        onOpenChange={(isOpen) => !isOpen && setPhotoToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Êtes-vous sûr ?"
        description="Cette action est irréversible et supprimera définitivement votre photo. Personne ne pourra plus la voir ni la noter."
        confirmText={isDeleting ? "Suppression..." : "Confirmer la suppression"}
        cancelText="Annuler"
      />
    </div>
  );
}
