
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AuthView() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Connexion réussie !" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Inscription réussie !",
          description: "Veuillez vérifier votre email pour confirmer votre compte.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'authentification",
        description: error.error_description || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleAuth}>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isSignIn ? "Se connecter" : "Créer un compte"}
            </CardTitle>
            <CardDescription>
              Entrez vos informations pour accéder à l'application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="email"
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              id="password"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Chargement..." : isSignIn ? "Se connecter" : "S'inscrire"}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignIn(!isSignIn)}
              disabled={loading}
            >
              {isSignIn
                ? "Pas de compte ? Créez-en un"
                : "Déjà un compte ? Connectez-vous"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
