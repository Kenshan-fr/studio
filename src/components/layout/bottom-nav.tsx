
"use client";

import type { Dispatch, SetStateAction } from "react";
import { Image as ImageIcon, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/components/app-shell";

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
      "flex flex-col items-center py-1 px-2 rounded-lg text-white text-sm font-medium transition-colors duration-200 w-24",
      isActive ? "bg-primary/80" : "hover:bg-primary/90"
    )}
    aria-label={label}
  >
    <Icon className="w-6 h-6 mb-1" />
    {label}
  </button>
);

export default function BottomNav({ currentPage, setCurrentPage }: BottomNavProps) {
  const navItems = [
    {
      page: "rate" as Page,
      label: "Noter",
      icon: Star,
    },
    {
      page: "upload" as Page,
      label: "Télécharger",
      icon: ImageIcon,
    },
    {
      page: "my-photos" as Page,
      label: "Mes Photos",
      icon: User,
    }
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
