
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase, BUCKET_NAME, getPhotoPublicUrl } from "@/lib/supabase";
import { useAuth } from "@/context/auth-provider";

export default function UploadView() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (file) {
        toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner un fichier image valide." });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
        toast({ variant: "destructive", title: "Erreur", description: "Vous devez être connecté et sélectionner un fichier." });
        return;
    };
    setIsUploading(true);
    setUploadProgress(0);

    try {
        const compressedFile = await compressImage(selectedFile, 1080, 'file');
        if (!compressedFile) throw new Error("La compression de l'image a échoué.");

        setUploadProgress(33);

        const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        setUploadProgress(66);
        
        const publicUrl = getPhotoPublicUrl(fileName);

        const { error: dbError } = await supabase
            .from('photos')
            .insert({
                uploader_id: user.id,
                image_url: publicUrl,
                description,
                average_rating: 0,
                rating_count: 0,
                total_rating_sum: 0,
            });

        if (dbError) throw dbError;
        
        setUploadProgress(100);
        
        toast({ title: "Photo téléversée avec succès !" });
        setSelectedFile(null);
        setPreviewUrl(null);
        setDescription("");
        if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
         console.error("Supabase upload error:", error);
         let errorMessage = "Erreur lors du téléversement de la photo.";
         if (error.message && error.message.includes('security policy')) {
           errorMessage = "Erreur de permission. Veuillez vérifier les politiques de sécurité de votre bucket Supabase.";
         } else if (error.message) {
           errorMessage = error.message;
         }
         toast({ variant: "destructive", title: "Erreur", description: errorMessage });
    } finally {
         setIsUploading(false);
         setUploadProgress(0);
    }
  };

  const loadingText = isUploading ? `Téléversement ${Math.round(uploadProgress)}%` : "Envoyer la Photo";

  return (
    <div className="w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Télécharger une Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewUrl && (
            <div className="w-full aspect-video relative rounded-lg overflow-hidden bg-muted">
              <Image src={previewUrl} alt="Aperçu de l'image sélectionnée" fill className="object-contain" />
            </div>
          )}
          <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={isUploading} />
          <Textarea placeholder="Ajoutez une description..." value={description} onChange={e => setDescription(e.target.value)} disabled={isUploading} />
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
            {loadingText}
          </Button>
          {isUploading && <Progress value={uploadProgress} />}
        </CardContent>
      </Card>
    </div>
  );
}
