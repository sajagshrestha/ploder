"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "14px",
          "--success-bg":
            "color-mix(in srgb, var(--primary) 22%, var(--popover))",
          "--success-border":
            "color-mix(in srgb, var(--primary) 45%, var(--border))",
          "--success-text": "var(--foreground)",
          "--error-bg":
            "color-mix(in srgb, var(--destructive) 10%, var(--popover))",
          "--error-border":
            "color-mix(in srgb, var(--destructive) 35%, var(--border))",
          "--error-text": "var(--foreground)",
          "--warning-bg":
            "color-mix(in srgb, #e8a13d 14%, var(--popover))",
          "--warning-border":
            "color-mix(in srgb, #e8a13d 40%, var(--border))",
          "--warning-text": "var(--foreground)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
