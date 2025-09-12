import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

interface SharedSelectInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  className?: string;
  valueClassName?: string;
  options?: { value: string; label: string }[];
}

export default function SharedSelectInput({
  placeholder,
  value,
  onChange,
  style,
  className,
  valueClassName,
  options = [],
}: SharedSelectInputProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn(className, "")} style={style}>
        <SelectValue placeholder={placeholder} className={valueClassName} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
