"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/auth-provider";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from "@/lib/utils";
import { moderateImage } from "@/ai/flows/moderate-image";
import { generatePhotoDescription } from "@/ai/flows/generate-photo-description";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";


const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "default-app-id";

type Photo = {
  photoId: string;
  uploaderId: string;
  imageUrl: string;
  description?: string;
  uploadTimestamp: Date;
  averageRating: number;
  ratingCount: number;
  totalRatingSum: number;
};


export default function UploadView() {
  const { user, profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
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
    setIsModerating(true);
    try {
        const dataUri = await fileToDataUri(selectedFile);
        const moderationResult = await moderateImage({ photoDataUri: dataUri });
        if (moderationResult.isExplicit) {
            toast({ variant: "destructive", title: t.error, description: t.explicitContentDetected });
            return;
        }
        if (moderationResult.hasWeapons) {
            toast({ variant: "destructive", title: t.error, description: t.weaponsDetected });
            return;
        }
        if (moderationResult.hasDrugs) {
            toast({ variant: "destructive", title: t.error, description: t.drugsDetected });
            return;
        }

        setIsUploading(true);
        const photoId = crypto.randomUUID();
        const storageRef = ref(storage, `artifacts/${appId}/public/images/${user.uid}/${photoId}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => {
                toast({ variant: "destructive", title: t.error, description: t.errorUpload });
                setIsUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const newPhoto: Photo = {
                    photoId,
                    uploaderId: user.uid,
                    imageUrl: downloadURL,
                    description,
                    uploadTimestamp: new Date(),
                    averageRating: 0,
                    ratingCount: 0,
                    totalRatingSum: 0,
                };

                await setDoc(doc(db, `artifacts/${appId}/public/data/public_photos`, photoId), newPhoto);
                const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/user_data`, user.uid);
                await updateDoc(userDocRef, { uploadedPhotos: arrayUnion(newPhoto) });
                
                if (updateProfile && profile) {
                  const currentPhotos = profile.uploadedPhotos || [];
                  updateProfile({ ...profile, uploadedPhotos: [...currentPhotos, newPhoto] });
                }

                toast({ title: t.uploadSuccess });
                setSelectedFile(null);
                setPreviewUrl(null);
                setDescription("");
                if(fileInputRef.current) fileInputRef.current.value = "";
                setIsUploading(false);
            }
        );

    } catch (error) {
        toast({ variant: "destructive", title: t.error, description: t.errorUpload });
    } finally {
        setIsModerating(false);
    }
  };
  
  const handleDelete = async () => {
    if (!photoToDelete || !user || !profile) return;
    const { photoId, imageUrl } = photoToDelete;
    
    try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/public_photos`, photoId));
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);

        const photoToRemove = profile.uploadedPhotos.find((p: any) => p.photoId === photoId);
        
        if (photoToRemove) {
          const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/user_data`, user.uid);
          await updateDoc(userDocRef, { uploadedPhotos: arrayRemove(photoToRemove) });
          
          if (updateProfile) {
            const updatedPhotos = profile.uploadedPhotos.filter((p: any) => p.photoId !== photoId);
            updateProfile({ ...profile, uploadedPhotos: updatedPhotos });
          }
        }
        
        toast({ title: t.deleteSuccess });
    } catch (error) {
        toast({ variant: "destructive", title: t.error, description: t.errorDelete });
    } finally {
        setPhotoToDelete(null);
    }
  };

  const isLoading = isModerating || isUploading || isGenerating;
  const loadingText = isModerating ? t.moderatingImage : isGenerating ? t.generatingDescription : `${t.uploading} ${Math.round(uploadProgress)}%`;


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
          <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
          <Textarea placeholder={t.photoDescriptionPlaceholder} value={description} onChange={e => setDescription(e.target.value)} />
          <Button onClick={handleGenerateDescription} disabled={!selectedFile || isLoading} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            {isGenerating ? t.generatingDescription : t.generateAIDescription}
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isLoading} className="w-full">
            {isLoading ? loadingText : t.upload}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile?.uploadedPhotos?.map((photo) => (
                    <div key={photo.photoId} className="relative group aspect-square">
                        <Image src={photo.imageUrl} alt={photo.description || ""} fill className="object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white">
                           <p className="text-xs">{t.note}: {photo.averageRating?.toFixed(1) || 'N/A'}</p>
                           <p className="text-xs">({photo.ratingCount} {t.votes})</p>
                           <Button variant="destructive" size="icon" className="mt-2 h-8 w-8" onClick={() => setPhotoToDelete(photo)}>
                                <Trash2 className="h-4 w-4"/>
                           </Button>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
      
      <ConfirmationDialog
        isOpen={!!photoToDelete}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
        onConfirm={handleDelete}
        title={t.delete}
        description={`${t.confirmDelete} "${photoToDelete?.description || 'photo sans description'}"?`}
        confirmText={t.delete}
        cancelText={t.cancel}
       />
    </div>
  );
}
