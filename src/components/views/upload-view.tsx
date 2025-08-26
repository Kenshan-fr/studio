"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/auth-provider";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from "@/lib/utils";
import { generatePhotoDescription } from "@/ai/flows/generate-photo-description";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "default-app-id";

type Photo = {
  id: string; // Changed from photoId to id for consistency
  uploaderId: string;
  imageUrl: string;
  description?: string;
  uploadTimestamp: Date;
  averageRating: number;
  ratingCount: number;
  totalRatingSum: number;
};


export default function UploadView() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

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
        toast({ variant: "destructive", title: t.error, description: t.invalidImage });
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
    } catch (error) {
        toast({ variant: "destructive", title: t.error, description: t.aiDescriptionError });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setIsUploading(true);
    try {
        const photoId = crypto.randomUUID();
        const storageRef = ref(storage, `artifacts/${appId}/public/images/${user.uid}/${photoId}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => {
                console.error("Upload error:", error);
                toast({ variant: "destructive", title: t.error, description: t.errorUpload });
                setIsUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Simplified object for Firestore
                const newPhotoData = {
                    uploaderId: user.uid,
                    imageUrl: downloadURL,
                    description,
                    uploadTimestamp: new Date(),
                    averageRating: 0,
                    ratingCount: 0,
                    totalRatingSum: 0,
                };

                await setDoc(doc(db, `artifacts/${appId}/public/data/public_photos`, photoId), newPhotoData);
                
                await refreshProfile();

                toast({ title: t.uploadSuccess });
                setSelectedFile(null);
                setPreviewUrl(null);
                setDescription("");
                if(fileInputRef.current) fileInputRef.current.value = "";
                setIsUploading(false);
                setUploadProgress(0);
            }
        );

    } catch (error) {
        console.error("Upload preparation error:", error);
        toast({ variant: "destructive", title: t.error, description: t.errorUpload });
        setIsUploading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!photoToDelete || !user || !profile) return;
    const { id, imageUrl } = photoToDelete;
    
    try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/public_photos`, id));
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
        
        await refreshProfile();
        
        toast({ title: t.deleteSuccess });
    } catch (error) {
        console.error("Delete error:", error);
        toast({ variant: "destructive", title: t.error, description: t.errorDelete });
    } finally {
        setPhotoToDelete(null);
    }
  };

  const isLoading = isUploading || isGenerating;
  const loadingText = isGenerating ? t.generatingDescription : isUploading ? `${t.uploading} ${Math.round(uploadProgress)}%` : t.upload;


  return (
    <div className="w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.uploadPhoto}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewUrl && (
            <div className="w-full aspect-video relative rounded-lg overflow-hidden bg-muted">
              <Image src={previewUrl} alt={t.previewAlt} fill className="object-contain" />
            </div>
          )}
          <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={isLoading} />
          <Textarea placeholder={t.photoDescriptionPlaceholder} value={description} onChange={e => setDescription(e.target.value)} disabled={isLoading} />
          <Button onClick={handleGenerateDescription} disabled={!selectedFile || isLoading} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            {isGenerating ? t.generatingDescription : t.generateAIDescription}
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isLoading} className="w-full">
            {loadingText}
          </Button>
          {isUploading && <Progress value={uploadProgress} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>{t.yourUploadedPhotos}</CardTitle>
            {(!profile?.uploadedPhotos || profile.uploadedPhotos.length === 0) && (
                <CardDescription>{t.noPhotosUploaded}</CardDescription>
            )}
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-72 w-full">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                    {profile?.uploadedPhotos?.map((photo) => (
                        <div key={photo.id} className="relative group aspect-square">
                            <Image src={photo.imageUrl} alt={photo.description || ""} fill className="object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white">
                               <p className="text-xs">{t.note}: {photo.averageRating?.toFixed(1) || '0.0'}</p>
                               <p className="text-xs">({photo.ratingCount} {photo.ratingCount === 1 ? t.voteSingular : t.votes})</p>
                               <Button variant="destructive" size="icon" className="mt-2 h-8 w-8" onClick={() => setPhotoToDelete(photo)}>
                                    <Trash2 className="h-4 w-4"/>
                               </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </CardContent>
      </Card>
      
      <ConfirmationDialog
        isOpen={!!photoToDelete}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
        onConfirm={handleDelete}
        title={t.delete}
        description={`${t.confirmDelete} "${photoToDelete?.description || 'photo'}"?`}
        confirmText={t.delete}
        cancelText={t.cancel}
       />
    </div>
  );
}
