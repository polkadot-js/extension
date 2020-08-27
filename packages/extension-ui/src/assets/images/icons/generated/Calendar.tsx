import * as React from 'react';
export const SvgCalendar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 18 20" fill="none" {...props}>
    <path
      d="M6 9H4v2h2V9zm4 0H8v2h2V9zm4 0h-2v2h2V9zm2-7h-1V0h-2v2H5V0H3v2H2a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V4a2 2 0 00-2-2zm0 16H2V7h14v11z"
      fill="currentColor"
    />
  </svg>
);
