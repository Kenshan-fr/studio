"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAuth } from "@/context/auth-provider";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

type Page = "home" | "auth" | "upload" | "rate" | "profile";

interface AuthViewProps {
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}

export default function AuthView({ setCurrentPage }: AuthViewProps) {
  const [isSigningUp, setIsSigningUp] = useState(true);
  const { signUp, signIn, loading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const formSchema = z.object({
    username: isSigningUp ? z.string().min(1, t.errorUsernameEmpty) : z.string().optional(),
    email: z.string().email(t.errorInvalidEmail),
    password: z.string().min(6, t.errorWeakPassword),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isSigningUp) {
        await signUp(values.email, values.password, values.username!);
        toast({ title: t.signInSuccess });
        setCurrentPage("rate");
      } else {
        await signIn(values.email, values.password);
        toast({ title: t.signInSuccess });
        setCurrentPage("rate");
      }
    } catch (error: any) {
      let errorMessage = t.error;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t.errorEmailInUse;
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = t.errorInvalidCredentials;
      } else if (error.code) {
        errorMessage = error.code;
      }
      toast({
        variant: "destructive",
        title: isSigningUp ? t.errorSignUp : t.errorSignIn,
        description: errorMessage,
      });
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {isSigningUp ? t.createAccount : t.signIn}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isSigningUp && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.usernamePlaceholder}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.usernamePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.emailPlaceholder}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.passwordPlaceholder}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.loading : isSigningUp ? t.createAccount : t.signIn}
            </Button>
          </form>
        </Form>
        <Button
          variant="link"
          className="w-full mt-4"
          onClick={() => {
            setIsSigningUp(!isSigningUp);
            form.reset();
          }}
        >
          {isSigningUp ? t.switchToSignIn : t.switchToSignUp}
        </Button>
      </CardContent>
    </Card>
  );
}
