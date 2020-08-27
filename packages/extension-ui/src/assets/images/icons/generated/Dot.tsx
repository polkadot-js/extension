import * as React from 'react';
export const SvgDot = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" {...props}>
    <circle fill="currentColor" cx={12} cy={12} r={6} />
  </svg>
);
