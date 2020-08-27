import * as React from 'react';
export const SvgPlusPlain = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" {...props}>
    <path
      d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4 9H9v3H7V9H4V7h3V4h2v3h3v2z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
