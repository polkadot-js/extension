import * as React from 'react';
export const SvgBrush = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M0 0h24v24H0V0z" fill="#fff" />
    <path
      d="M20.71 4.63l-1.34-1.34c-.37-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.04 0-1.41zM7 14a3 3 0 00-3 3c0 1.31-1.16 2-2 2 .92 1.22 2.5 2 4 2a4 4 0 004-4 3 3 0 00-3-3z"
      fill="currentColor"
    />
  </svg>
);
