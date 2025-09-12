import React from "react";
import { Input } from "@workspace/ui/components/input";

interface SharedInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  className?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function SharedInput({
  placeholder,
  value,
  onChange,
  style,
  className,
  type = "text",
  onKeyPress,
}: SharedInputProps) {
  return (
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyPress={onKeyPress}
      style={style}
      className={className}
    />
  );
}
