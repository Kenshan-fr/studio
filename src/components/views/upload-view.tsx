
"use client";

import { useState, useRef, useEffect } from "react";
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
import { supabase, BUCKET_NAME, getPhotoPublicUrl } from "@/lib/supabase";

const UPLOADED_PHOTOS_KEY = "supabase_uploadedPhotos";

const addUploadedPhotoId = (photoId: string) => {
    if (typeof window === "undefined") return;
    const uploaded = localStorage.getItem(UPLOADED_PHOTOS_KEY);
    const uploadedIds = uploaded ? JSON.parse(uploaded) : [];
    uploadedIds.push(photoId);
    localStorage.setItem(UPLOADED_PHOTOS_KEY, JSON.stringify(uploadedIds));
};

// Generate a simple, anonymous user ID and store it
const getUploaderId = (): string => {
    if (typeof window === "undefined") return 'anonymous';
    let uploaderId = localStorage.getItem('supabase_uploaderId');
    if (!uploaderId) {
        uploaderId = `anon_${new Date().getTime()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('supabase_uploaderId', uploaderId);
    }
    return uploaderId;
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
  const [uploaderId, setUploaderId] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUploaderId(getUploaderId());
  }, []);

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
      const dataUri = await compressImage(selectedFile, 800); // Smaller compression for AI
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
    if (!selectedFile || !uploaderId) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
        const compressedFile = await compressImage(selectedFile, 1080, 'file');
        if (!compressedFile) throw new Error("Compression failed");

        setUploadProgress(33);

        const fileName = `${uploaderId}/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        setUploadProgress(66);
        
        const publicUrl = getPhotoPublicUrl(fileName);

        const { data: photoData, error: dbError } = await supabase
            .from('photos')
            .insert({
                uploader_id: uploaderId,
                image_url: publicUrl,
                description,
                average_rating: 0,
                rating_count: 0,
                total_rating_sum: 0,
            })
            .select('id')
            .single();

        if (dbError) throw dbError;
        if (!photoData) throw new Error("Failed to get photo ID from database.");
        
        setUploadProgress(100);
        addUploadedPhotoId(photoData.id);
        
        toast({ title: "Photo téléversée avec succès !" });
        setSelectedFile(null);
        setPreviewUrl(null);
        setDescription("");
        if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
         console.error("Supabase upload error:", error);
         toast({ variant: "destructive", title: "Erreur", description: error.message || "Erreur lors du téléversement de la photo." });
    } finally {
         setIsUploading(false);
         setUploadProgress(0);
    }
  };

  const isLoading = isUploading || isGenerating;
  const loadingText = isGenerating ? "Génération..." : isUploading ? `Téléversement ${Math.round(uploadProgress)}%` : "Envoyer la Photo";

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
