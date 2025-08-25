"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Separator } from "@/components/ui/separator";

export default function ProfileView() {
  const { user, profile, loading, updateUserProfile, updateUserPassword, signOutUser } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [username, setUsername] = useState(profile?.username || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast({ variant: "destructive", title: t.error, description: t.errorUsernameEmpty });
      return;
    }
    try {
      await updateUserProfile({ username: username.trim() });
      toast({ title: t.profileUpdated });
    } catch (error) {
      toast({ variant: "destructive", title: t.error, description: t.errorProfileUpdate });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: t.error, description: t.errorWeakPassword });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ variant: "destructive", title: t.error, description: t.errorPasswordMismatch });
      return;
    }
    try {
      await updateUserPassword(newPassword);
      toast({ title: t.passwordUpdated });
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
       toast({ variant: "destructive", title: t.error, description: error.message || t.errorPasswordUpdate });
    }
  };

  if (!user || !profile) {
    return (
        <Card className="w-full max-w-2xl text-center p-8">
            <p>{t.mustBeLoggedIn}</p>
        </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.myAccount}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t.accountName}</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Button onClick={handleUpdateProfile} disabled={loading}>{loading ? t.loading : t.updateName}</Button>
          </div>
          <div className="space-y-2">
            <Label>{t.associatedEmail}</Label>
            <Input value={user.email || ""} readOnly disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>{t.changePassword}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="newPassword">{t.newPasswordPlaceholder}</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">{t.confirmNewPasswordPlaceholder}</Label>
                <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
            </div>
            <Button onClick={handleChangePassword} disabled={loading || !newPassword || !confirmNewPassword}>{loading ? t.loading : t.updatePassword}</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
            <CardTitle>{t.history}</CardTitle>
            <CardDescription>{t.noRatingsHistory}</CardDescription>
        </CardHeader>
        <CardContent>
            {/* This feature is not fully implemented in the provided logic */}
            <p className="text-sm text-muted-foreground">{t.noRatingsHistory}</p>
        </CardContent>
      </Card>
      
      <Separator/>

      <Button variant="destructive" className="w-full" onClick={() => setIsSignOutConfirmOpen(true)}>{t.signOut}</Button>
      
      <ConfirmationDialog
        isOpen={isSignOutConfirmOpen}
        onOpenChange={setIsSignOutConfirmOpen}
        onConfirm={signOutUser}
        title={t.signOut}
        description={t.confirmSignOut}
        confirmText={t.signOut}
        cancelText={t.cancel}
      />
    </div>
  );
}
