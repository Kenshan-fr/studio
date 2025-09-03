
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from "@/lib/utils";
import { generatePhotoDescription } from "@/ai/flows/generate-photo-description";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import type { Photo } from "@/types";

const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "default-app-id";
const UPLOADED_PHOTOS_KEY = "uploadedPhotos";

const addUploadedPhoto = (photoId: string) => {
    if (typeof window === "undefined") return;
    const uploaded = localStorage.getItem(UPLOADED_PHOTOS_KEY);
    const uploadedIds = uploaded ? JSON.parse(uploaded) : [];
    uploadedIds.push(photoId);
    localStorage.setItem(UPLOADED_PHOTOS_KEY, JSON.stringify(uploadedIds));
};

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
      const dataUri = await fileToDataUri(selectedFile);
      const result = await generatePhotoDescription({ photoDataUri: dataUri });
      setDescription(result.description);
    } catch (error: any) {
        if (error.message && error.message.includes('billing')) {
            setAiDisabled(true);
            toast({ variant: "destructive", title: "Fonctionnalité non disponible", description: "La génération IA nécessite un forfait payant." });
        } else {
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
        const photoId = doc(collection(db, `artifacts/${appId}/public/data/public_photos`)).id;
        
        setUploadProgress(33);
        const imageDataUri = await fileToDataUri(selectedFile);
        setUploadProgress(66);
        
        const newPhotoData: Omit<Photo, 'id'> = {
            uploaderId: "anonymous",
            imageDataUri: imageDataUri,
            description,
            uploadTimestamp: serverTimestamp(),
            averageRating: 0,
            ratingCount: 0,
            totalRatingSum: 0,
        };

        await setDoc(doc(db, `artifacts/${appId}/public/data/public_photos`, photoId), newPhotoData);
        setUploadProgress(100);
        
        addUploadedPhoto(photoId);

        toast({ title: "Photo téléchargée avec succès !" });
        setSelectedFile(null);
        setPreviewUrl(null);
        setDescription("");
        if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (dbError) {
         console.error("Database error:", dbError);
         toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de l'enregistrement des données de la photo." });
    } finally {
         setIsUploading(false);
         setUploadProgress(0);
    }
  };

  const isLoading = isUploading || isGenerating;
  const loadingText = isGenerating ? "Génération..." : isUploading ? `Téléchargement ${Math.round(uploadProgress)}%` : "Télécharger";

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
