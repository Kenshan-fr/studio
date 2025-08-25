"use client";

import type { Dispatch, SetStateAction } from "react";
import { Image as ImageIcon, Star, User } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

type Page = "home" | "auth" | "upload" | "rate" | "profile";

interface BottomNavProps {
  currentPage: Page;
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}

const NavButton = ({
  Icon,
  label,
  isActive,
  onClick,
}: {
  Icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center py-1 px-2 rounded-lg text-white text-sm font-medium transition-colors duration-200",
      isActive ? "bg-primary/80" : "hover:bg-primary/90"
    )}
    aria-label={label}
  >
    <Icon className="w-6 h-6 mb-1" />
    {label}
  </button>
);

export default function BottomNav({ currentPage, setCurrentPage }: BottomNavProps) {
  const { t } = useLanguage();

  const navItems = [
    {
      page: "upload" as Page,
      label: t.myPhotosUpload,
      icon: ImageIcon,
    },
    {
      page: "rate" as Page,
      label: t.ratePhotos,
      icon: Star,
    },
    {
      page: "profile" as Page,
      label: t.myAccount,
      icon: User,
    },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-primary p-3 shadow-lg flex justify-around items-center rounded-t-xl z-40">
      {navItems.map((item) => (
        <NavButton
          key={item.page}
          Icon={item.icon}
          label={item.label}
          isActive={currentPage === item.page}
          onClick={() => setCurrentPage(item.page)}
        />
      ))}
    </footer>
  );
}
