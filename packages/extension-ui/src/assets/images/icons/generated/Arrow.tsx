import * as React from 'react';
export const SvgArrow = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 16 14" {...props}>
    <path
      d="M3.4 8H16V6H3.3l5-4.7L7 0 0 7l7 7 1.3-1.3z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
