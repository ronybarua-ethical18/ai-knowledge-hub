import React from "react";

interface SharedCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function SharedCard({
  children,
  style,
  className,
}: SharedCardProps) {
  return (
    <div
      className={`rounded-lg p-6 bg-white shadow-sm border border-gray-200 ${className || ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
