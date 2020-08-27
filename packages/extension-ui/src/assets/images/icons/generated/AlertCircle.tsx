import * as React from 'react';
export const SvgAlertCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" {...props}>
    <path
      d="M11 11H9V5h2v6zm0 4H9v-2h2v2zM10 0a10 10 0 100 20 10 10 0 000-20z"
      fill="currentColor"
    />
  </svg>
);
