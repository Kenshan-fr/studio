"use client";

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
import { useAuth } from "@/context/auth-provider";

interface DisclaimerDialogProps {
  isOpen: boolean;
  onAccept: () => void;
}

export default function DisclaimerDialog({
  isOpen,
  onAccept,
}: DisclaimerDialogProps) {
  const { t } = useLanguage();
  const { loading } = useAuth();

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
          <Button onClick={onAccept} disabled={loading}>
            {loading ? t.loading : t.acceptDisclaimer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
