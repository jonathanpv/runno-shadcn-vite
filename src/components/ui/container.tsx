/*
 * Design Explanation:
 * 
 * The Container component provides consistent horizontal padding and maximum width
 * constraints across the application. It helps with:
 * 
 * 1. Responsiveness: Automatically adjusts padding and max-width based on viewport size
 * 2. Consistency: Ensures layout consistency across different pages
 * 3. Readability: Prevents content from becoming too wide on large screens
 */

import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div 
      className={cn(
        "container mx-auto px-4 md:px-6 max-w-screen-xl", 
        className
      )}
    >
      {children}
    </div>
  );
} 