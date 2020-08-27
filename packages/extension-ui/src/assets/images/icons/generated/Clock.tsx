import * as React from 'react';
export const SvgClock = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" {...props}>
    <path
      d="M10 0a10 10 0 100 20 10 10 0 000-20zm4.2 14.2L9 11V5h1.5v5.2l4.5 2.7-.8 1.3z"
      fill="currentColor"
    />
  </svg>
);
