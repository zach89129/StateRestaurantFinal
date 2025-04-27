import React, { ReactNode } from "react";

type MessageType = "success" | "error" | "warning" | "info";

interface MessageBoxProps {
  type: MessageType;
  children: ReactNode;
  className?: string;
}

const backgrounds = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function MessageBox({
  type,
  children,
  className = "",
}: MessageBoxProps) {
  return (
    <div className={`border rounded p-4 ${backgrounds[type]} ${className}`}>
      {children}
    </div>
  );
}
