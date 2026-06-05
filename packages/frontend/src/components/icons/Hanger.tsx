import { forwardRef, type SVGProps } from 'react';

export interface HangerProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Coat-hanger icon drawn in the Lucide style (24x24 grid, 2px currentColor
 * stroke, round caps/joins). Lucide's core set has no hanger — its only one
 * lives in the separate @lucide/lab package with a different API — so this is a
 * lightweight, dependency-free drop-in that matches how the other icons are used
 * (`<Hanger className="h-5 w-5" />`, `{ icon: Hanger }`, inline `style`, etc.).
 */
export const Hanger = forwardRef<SVGSVGElement, HangerProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 11V7.5a1.25 1.25 0 0 1 2.5 0V8.4" />
      <path d="M4.5 17 12 11l7.5 6" />
      <path d="M4.5 17h15" />
    </svg>
  ),
);

Hanger.displayName = 'Hanger';
