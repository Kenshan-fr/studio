"use client";

import type { Dispatch, SetStateAction } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";

type Page = "home" | "auth" | "upload" | "rate" | "profile";

interface HomeViewProps {
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}

export default function HomeView({ setCurrentPage }: HomeViewProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center flex-grow text-center p-4">
      <h1 className="text-6xl font-extrabold text-primary mb-8 font-pacifico animate-in fade-in slide-in-from-top duration-1000">
        Surdice
      </h1>
      <p className="text-xl text-foreground/80 mb-10 max-w-md">
        {t.homeDescription}
      </p>
      <div className="flex flex-col space-y-4 w-full max-w-xs">
        {user && !user.isAnonymous ? (
          <>
            <Button
              size="lg"
              onClick={() => setCurrentPage("rate")}
              aria-label={t.ratePhotos}
            >
              {t.ratePhotos}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setCurrentPage("upload")}
              aria-label={t.myPhotosUpload}
            >
              {t.myPhotosUpload}
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            onClick={() => setCurrentPage("auth")}
            aria-label={t.signInSignUp}
          >
            {t.signInSignUp}
          </Button>
        )}
      </div>
    </div>
  );
}
