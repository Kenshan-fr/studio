"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DisclaimerDialogProps {
  isOpen: boolean;
  onAccept: () => Promise<void>;
}

export default function DisclaimerDialog({
  isOpen,
  onAccept,
}: DisclaimerDialogProps) {
  const { t } = useLanguage();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept();
    // No need to set isAccepting back to false as the component will unmount
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.disclaimerTitle}</DialogTitle>
          <DialogDescription className="text-left py-4">
            {t.disclaimerContent}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? t.loading : t.acceptDisclaimer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
