"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TextRevealCardProps {
  text: string;
  revealText: string;
  children: React.ReactNode;
  className?: string;
}

interface TextRevealCardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface TextRevealCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const TextRevealCard: React.FC<TextRevealCardProps> = ({
  text,
  revealText,
  children,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-2xl border border-white/[0.08] bg-black p-8 transition-all duration-300 hover:border-white/[0.12] hover:bg-black/80",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative z-10 h-full w-full">
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="relative h-20">
              <div
                className={cn(
                  "text-2xl font-bold text-white transition-all duration-500",
                  isHovered ? "opacity-0" : "opacity-100"
                )}
              >
                {text}
              </div>
              <div
                className={cn(
                  "absolute inset-0 text-lg text-gray-300 transition-all duration-500",
                  isHovered ? "opacity-100" : "opacity-0"
                )}
              >
                {revealText}
              </div>
            </div>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const TextRevealCardTitle: React.FC<TextRevealCardTitleProps> = ({
  children,
  className,
}) => {
  return (
    <h3 className={cn("text-xl font-bold text-white", className)}>
      {children}
    </h3>
  );
};

export const TextRevealCardDescription: React.FC<TextRevealCardDescriptionProps> = ({
  children,
  className,
}) => {
  return (
    <p className={cn("mt-2 text-sm text-gray-400", className)}>
      {children}
    </p>
  );
}; 