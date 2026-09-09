"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

export interface HelpContent {
  title: string;
  description: string;
}

interface HelpTooltipProps {
  content: HelpContent;
  className?: string;
  align?: "left" | "center" | "right";
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  className = "",
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const alignmentClasses = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0",
  }[align];

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={`Information about ${content.title}`}
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (!nextTarget || !wrapperRef.current?.contains(nextTarget)) {
            setIsOpen(false);
          }
        }}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {isOpen && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`absolute top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3.5 text-left normal-case tracking-normal shadow-lg ${alignmentClasses}`}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="block text-[13px] font-semibold leading-snug text-slate-900 normal-case tracking-normal">
            {content.title}
          </span>
          <span className="mt-1.5 block text-[12px] font-normal leading-5 text-slate-600 normal-case tracking-normal">
            {content.description}
          </span>
        </span>
      )}
    </span>
  );
};

export default HelpTooltip;
