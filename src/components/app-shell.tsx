
"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import UploadView from "@/components/views/upload-view";
import RateView from "@/components/views/rate-view";
import MyPhotosView from "@/components/views/my-photos-view";

export type Page = "rate" | "upload" | "my-photos";

export default function AppShell() {
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
