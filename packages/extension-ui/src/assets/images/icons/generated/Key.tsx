import * as React from 'react';
export const SvgKey = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...props}>
    <g clipPath="url(#key_svg__clip0)">
      <path
        d="M22 18v4h-4v-3h-3v-3h-3l-2.26-2.26a6 6 0 114-4L22 18zM7 5a2 2 0 100 4 2 2 0 000-4z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="key_svg__clip0">
        <path d="M0 0h24v24H0V0z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
);
