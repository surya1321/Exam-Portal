"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";

import { cn } from "@/lib/utils";

const sliderVariants = cva(
  "fixed z-50 flex flex-col bg-white shadow-2xl transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right dark:bg-gray-900 overflow-hidden inset-y-0 right-0 h-full w-full sm:inset-y-2 sm:right-2 sm:h-[calc(100%-1rem)] sm:w-3/4 sm:rounded-lg sm:border sm:border-gray-200/50 dark:sm:border-gray-700/50",
  {
    variants: {
      width: {
        "max-w-xs": "sm:max-w-xs",
        "max-w-sm": "sm:max-w-sm",
        "max-w-md": "sm:max-w-md",
        "max-w-lg": "sm:max-w-lg",
        "max-w-xl": "sm:max-w-xl",
        "max-w-2xl": "sm:max-w-2xl",
        "max-w-3xl": "sm:max-w-3xl",
        "max-w-4xl": "sm:max-w-4xl",
        "max-w-5xl": "sm:max-w-5xl"
      },
    },
    defaultVariants: {
      width: "max-w-md",
    },
  }
);

export interface SliderProps extends VariantProps<typeof sliderVariants> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  heading?: React.ReactNode;
}

const Slider = ({ isOpen, onClose, children, width = "max-w-md", heading }: SliderProps) => {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/10 dark:bg-black/20",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />

        <DialogPrimitive.Content
          className={cn(sliderVariants({ width }), "focus:outline-none focus-visible:outline-none")}
          onInteractOutside={onClose}
        >
          {heading ? (
            <div className="sticky top-0 flex items-start gap-2 px-4 py-4 bg-white dark:bg-gray-900 border-b border-border sm:gap-4 sm:px-6">
              <div className="flex-1 min-w-0">
                {typeof heading === "string" ? (
                  <DialogPrimitive.Title className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate sm:text-lg">
                    {heading}
                  </DialogPrimitive.Title>
                ) : (
                  <>
                    <DialogPrimitive.Title className="sr-only">Panel</DialogPrimitive.Title>
                    {heading}
                  </>
                )}
              </div>
            </div>
          ) : (
            <DialogPrimitive.Title className="sr-only">Panel</DialogPrimitive.Title>
          )}

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default Slider;
