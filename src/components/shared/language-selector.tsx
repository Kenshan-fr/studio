"use client";

import { useLanguage } from "@/hooks/use-language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="w-auto gap-2 bg-primary/80 hover:bg-primary/90 border-0 text-primary-foreground focus:ring-0 focus:ring-offset-0">
        <Globe className="h-4 w-4" />
        <SelectValue placeholder={t.selectLanguage} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="fr">Français</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}
