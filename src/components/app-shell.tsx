
"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import UploadView from "@/components/views/upload-view";
import RateView from "@/components/views/rate-view";
import MyPhotosView from "@/components/views/my-photos-view";
import { useAuth } from "@/context/auth-provider";
import AuthView from "./views/auth-view";
import { Skeleton } from "./ui/skeleton";

export type Page = "rate" | "upload" | "my-photos";

export default function AppShell() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("rate");

  const renderContent = () => {
    switch (currentPage) {
      case "upload":
        return <UploadView />;
      case "rate":
        return <RateView />;
      case "my-photos":
        return <MyPhotosView />;
      default:
        return <RateView />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4">
        <Skeleton className="h-16 w-full rounded-b-xl mb-4" />
        <div className="flex-grow w-full max-w-lg space-y-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-20 w-full fixed bottom-0" />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <Header />
      <main className="flex-grow w-full flex flex-col items-center px-4 pb-24">
        {renderContent()}
      </main>
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}
