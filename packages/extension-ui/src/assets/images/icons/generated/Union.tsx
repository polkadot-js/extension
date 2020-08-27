import * as React from 'react';
export const SvgUnion = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 16 10" fill="none" {...props}>
    <path d="M3 8V0H1L0 2h1v6H0v2h4V8H3z" fill="currentColor" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14 0h-2a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V2a2 2 0 00-2-2zm-2 8V2h2v6h-2z"
      fill="currentColor"
    />
    <path
      d="M6.293 9.707a1 1 0 101.414-1.414 1 1 0 00-1.414 1.414z"
      fill="currentColor"
    />
  </svg>
);
