
"use client";

import { LanguageSelector } from "@/components/shared/language-selector";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuth } from "@/context/auth-provider";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="w-full bg-primary p-4 shadow-md flex justify-between items-center sticky top-0 z-50 rounded-b-xl mb-4">
      <h1 className="text-3xl font-bold text-primary-foreground font-pacifico">
        Surdice
      </h1>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <span className="text-sm text-primary-foreground hidden sm:block">
          {user?.email}
        </span>
        <LanguageSelector />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
