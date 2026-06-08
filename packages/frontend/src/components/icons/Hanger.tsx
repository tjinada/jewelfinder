import { forwardRef, type SVGProps } from 'react';

export interface HangerProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Clasp hanger mark — a filled icon traced from the brand hanger artwork and
 * optimised (single path, holes preserved). Uses `currentColor`, so it themes
 * exactly like the other icons: `<Hanger className="h-5 w-5" />`, inline
 * `style={{ color }}`, `{ icon: Hanger }`, etc. It is filled rather than
 * stroked, so `strokeWidth` has no effect here.
 */
export const Hanger = forwardRef<SVGSVGElement, HangerProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="22.4 24.0 274 274"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="m174 67 2.8.9c2.7 1.4 2.9 2.4 4.2 5.1l3.4 3.8a31 31 0 0 1 7.9 22.7c-1 8.6-5.3 15.7-10.3 22.5l-2 3-1.8.3c-3.5 1.1-5.4 3.7-7.2 6.7q-1.4 4-2 8l2.2.3c3.2.8 5.4 2 8.3 3.8l3.3 2 1.7 1.2 9.4 5.8 2 1.2 20 12Q239.2 180 262 194l2.5 1.5 6.1 3.8 3.1 2c2.4 1.8 3.1 3 4.3 5.7l3 3.3c5.2 6 6.6 12 6.3 20a28 28 0 0 1-9.6 18.8c-2 1.9-2 1.9-2.7 4.9-9.8 4.5-21.7 3.4-32.2 3.4H203l-66-.2H62.5q-5.7 0-11.4-.5l-2.1-.2c-2.5-.6-3.4-1.7-5-3.5l-2-1c-3.3-1.7-4.4-4.8-6-8l-1-1.9a32 32 0 0 1-3-21.1 43 43 0 0 1 21.3-25l4-2.5q5.5-3 11-6.3l2.2-1.3a1690 1690 0 0 0 40.1-24.4l2.5-1.5 4.6-2.9c4.9-3 4.9-3 7.4-3.6l1.9-.5 1-2 4-1 1-2 4-1 1-2 1.9-.4c2.5-.7 3.3-1.7 5.1-3.6l3-2c.7-2.6.7-2.6 1-5h2l1-2.4 1.3-3.3 1.3-3.2q1.9-4.2 4.4-8.1l1-2.1c1.8-3.4 3.4-4.7 7-5.9l4-4 2-2c1.7-5.4.5-10-2-15-4.8-3.2-7.8-4.4-13.6-3.3l-2.8.5c-2.8.8-4.4 2-6.6 3.8l-2 1q-1.3 4.5-2.1 9c-1 3-1.8 4.7-3.9 7a24 24 0 0 1-9 1c-3.7-5.4-5-9.5-4-16q1.4-4 3-7.7c1.1-2.5 1.1-2.5 2-5.8 1.2-3 2.1-3.2 5-4.5l1-2c1.5-2.9 3-3.6 6-5a60 60 0 0 1 30 1m-19 15v1h8v-1zm-2.5 78.2-1.7 1-9.3 5.7-18.3 11.3-3.1 2-5.9 3.6-2.7 1.6-2.3 1.5a23 23 0 0 1-7.2 2.1v2l-5 1v2l-5 1v2l-5 1v2l-5 1v2l-5 1v2l-5 1v2l-3.8 2.6-2.5 1.5-2.5 1.5-2.5 1.6c-6.3 3.8-6.3 3.8-9.7 3.8a16 16 0 0 0-2 12c1.7 3 1.7 3 4 5h2l1.6 1.5c3.4 2.1 6.6 2 10.4 1.9h186.3c4.2 0 6.6-.5 9.7-3.4l2-.4c2.2-.5 2.2-.5 3.8-2.6a17 17 0 0 0 .2-12c-2.1-2.3-3.8-3-6.7-4l-2.3-1-1-3-2.2-.3c-3-.8-4.5-1.7-6.8-3.7l-1-2-2-.5-2-.5-1-2-2-.5-2-.5-1-2-2-.5-2-.5-1-2-2-.5-2-.5-1-2-2-.5-2-.5-1-2-2-.5-2-.5-1-2-2.2-.4c-3.4-.7-5.8-2.1-8.8-3.9l-1.7-1-9.4-5.6-29.3-17.6-3-1.8-2.5-1.6c-4-2.2-6-.1-9.6 2.1" />
    </svg>
  ),
);

Hanger.displayName = 'Hanger';
