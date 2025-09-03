
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/utils";
import { generatePhotoDescription } from "@/ai/flows/generate-photo-description";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import type { Photo } from "@/types";

const UPLOADED_PHOTOS_KEY = "uploadedPhotos";
const ALL_PHOTOS_KEY = "allPhotos";

const addUploadedPhotoId = (photoId: string) => {
    if (typeof window === "undefined") return;
    const uploaded = localStorage.getItem(UPLOADED_PHOTOS_KEY);
    const uploadedIds = uploaded ? JSON.parse(uploaded) : [];
    uploadedIds.push(photoId);
    localStorage.setItem(UPLOADED_PHOTOS_KEY, JSON.stringify(uploadedIds));
};

const savePhotoToLocal = (photo: Photo) => {
    if (typeof window === "undefined") return;
    const allPhotosData = localStorage.getItem(ALL_PHOTOS_KEY);
    const allPhotos = allPhotosData ? JSON.parse(allPhotosData) : [];
    allPhotos.push(photo);
    localStorage.setItem(ALL_PHOTOS_KEY, JSON.stringify(allPhotos));
    addUploadedPhotoId(photo.id);
    // Dispatch a storage event to notify other components (like RateView) of new data
    window.dispatchEvent(new Event('storage'));
}

export default function UploadView() {
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDisabled, setAiDisabled] = useState(false);
  
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
  
  const handleGenerateDescription = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    try {
      const dataUri = await compressImage(selectedFile);
      const result = await generatePhotoDescription({ photoDataUri: dataUri });
      setDescription(result.description);
    } catch (error: any) {
        if (error.message && (error.message.includes('billing') || error.message.includes('API key'))) {
            setAiDisabled(true);
            toast({ variant: "destructive", title: "Fonctionnalité non disponible", description: "La génération IA nécessite une connexion et un forfait payant." });
        } else {
            console.error(error);
            toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de la génération de la description IA." });
        }
    } finally {
        setIsGenerating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
        setUploadProgress(33);
        const imageDataUri = await compressImage(selectedFile);
        setUploadProgress(66);
        
        if (new Blob([imageDataUri]).size > 1048487) {
            toast({ variant: "destructive", title: "Erreur", description: "Même après compression, l'image est trop volumineuse pour être enregistrée." });
            setIsUploading(false);
            setUploadProgress(0);
            return;
        }

        const newPhoto: Photo = {
            id: `local_${new Date().getTime()}_${Math.random()}`, // Unique local ID
            uploaderId: "local_user",
            imageDataUri: imageDataUri,
            description,
            uploadTimestamp: new Date().toISOString(),
            averageRating: 0,
            ratingCount: 0,
            totalRatingSum: 0,
        };
        
        savePhotoToLocal(newPhoto);
        setUploadProgress(100);
        
        toast({ title: "Photo enregistrée localement !" });
        setSelectedFile(null);
        setPreviewUrl(null);
        setDescription("");
        if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (localError) {
         console.error("Local save error:", localError);
         toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de l'enregistrement local de la photo." });
    } finally {
         setIsUploading(false);
         setUploadProgress(0);
    }
  };

  const isLoading = isUploading || isGenerating;
  const loadingText = isGenerating ? "Génération..." : isUploading ? `Enregistrement ${Math.round(uploadProgress)}%` : "Enregistrer la Photo";

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
          <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={isLoading} />
          <Textarea placeholder="Ajoutez une description..." value={description} onChange={e => setDescription(e.target.value)} disabled={isLoading} />
          <Button onClick={handleGenerateDescription} disabled={!selectedFile || isLoading || aiDisabled} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Génération..." : "Générer une description IA"}
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isLoading} className="w-full">
            {loadingText}
          </Button>
          {isUploading && <Progress value={uploadProgress} />}
        </CardContent>
      </Card>
    </div>
  );
}
