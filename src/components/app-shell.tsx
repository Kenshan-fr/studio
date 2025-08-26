"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-provider";
import { useLanguage } from "@/hooks/use-language";

import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import HomeView from "@/components/views/home-view";
import AuthView from "@/components/views/auth-view";
import UploadView from "@/components/views/upload-view";
import RateView from "@/components/views/rate-view";
import ProfileView from "@/components/views/profile-view";
import DisclaimerDialog from "@/components/shared/disclaimer-dialog";

type Page = "home" | "auth" | "upload" | "rate" | "profile";

export default function AppShell() {
  const { user, loading, profile, acceptDisclaimer } = useAuth();
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<Page>("home");

  useEffect(() => {
    if (!loading) {
      if (user && !user.isAnonymous) {
        setCurrentPage("rate");
      } else if (user && user.isAnonymous) {
        setCurrentPage("auth");
      } else {
        setCurrentPage("home");
      }
    }
  }, [loading, user]);

  const showDisclaimer = user && !user.isAnonymous && profile && !profile.hasAcceptedDisclaimer;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center w-full max-w-sm px-4">
          <p className="text-xl font-semibold mb-4">{t.loadingApp}</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (showDisclaimer) {
       // Render a placeholder or nothing while disclaimer is up
       return <div className="flex-grow"/>;
    }
    
    switch (currentPage) {
      case "home":
        return <HomeView setCurrentPage={setCurrentPage} />;
      case "auth":
        return <AuthView setCurrentPage={setCurrentPage} />;
      case "upload":
        return <UploadView />;
      case "rate":
        return <RateView />;
      case "profile":
        return <ProfileView />;
      default:
        return <HomeView setCurrentPage={setCurrentPage} />;
    }
  };

  const showNav = user && !user.isAnonymous && !showDisclaimer;

  return (
    <div className="min-h-screen flex flex-col items-center">
      <Header />
      <main className="flex-grow w-full flex flex-col items-center px-4 pb-24">
        {renderContent()}
      </main>
      {showNav && (
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      )}
      <DisclaimerDialog isOpen={showDisclaimer} onAccept={acceptDisclaimer} />
    </div>
  );
}
