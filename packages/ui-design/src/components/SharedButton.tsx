import React from "react";
import { Button } from "@workspace/ui/components/button";

interface SharedButtonProps {
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  onClick?: () => void;
}

export default function SharedButton({
  title,
  style,
  className,
  variant = "secondary",
  onClick,
}: SharedButtonProps) {
  return (
    <Button
      variant={variant}
      className={className}
      style={style}
      onClick={onClick}
    >
      {title}
    </Button>
  );
}
