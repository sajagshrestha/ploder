"use client";

import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/responsive-alert-dialog";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  loading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
  trigger?: ReactNode;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  loading = false,
  open,
  onOpenChange,
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const destructive = confirmVariant === "destructive";
  const content = (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia
          className={cn(
            destructive &&
              "border-destructive/25 bg-destructive/10 text-destructive",
          )}
        >
          {destructive ? <CircleAlert /> : <Info />}
        </AlertDialogMedia>
        <Eyebrow>Please confirm</Eyebrow>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description &&
          (typeof description === "string" ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : (
            <div className="text-sm text-muted-foreground">{description}</div>
          ))}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          disabled={loading}
          variant={destructive ? "destructive" : "default"}
          onClick={(event) => {
            // Prevent automatic close so callers can keep the dialog open
            // on error; Radix closes on action by default, so we only
            // prevent when loading. Otherwise run confirm handler.
            if (loading) {
              event.preventDefault();
              return;
            }
            onConfirm();
          }}
        >
          {loading ? "Working…" : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        {content}
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {content}
    </AlertDialog>
  );
}

export function ConfirmTriggerButton({
  "aria-label": ariaLabel,
  disabled,
  onClick,
  children,
}: {
  "aria-label"?: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  // Helper for consistent destructive trigger styling when needed.
  return (
    <Button
      aria-label={ariaLabel}
      disabled={disabled}
      size="sm"
      variant="ghost"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
