"use client";

import { LanguageSelector } from "@/components/shared/language-selector";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function Header() {
  return (
    <header className="w-full bg-primary p-4 shadow-md flex justify-between items-center sticky top-0 z-50 rounded-b-xl mb-4">
      <h1 className="text-3xl font-bold text-primary-foreground font-pacifico">
        Surdice
      </h1>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </header>
  );
}
