import * as React from 'react';
export const SvgPolyB = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" {...props}>
    <defs>
      <circle id="poly-b_svg__a" cx={12.5} cy={12.5} r={12.5} />
    </defs>
    <g fill="none" fillRule="evenodd">
      <mask id="poly-b_svg__b" fill="#fff">
        <use xlinkHref="#poly-b_svg__a" />
      </mask>
      <use fill="#C1E6FE" xlinkHref="#poly-b_svg__a" />
      <path
        fill="#3C6586"
        fillRule="nonzero"
        mask="url(#poly-b_svg__b)"
        d="M21 8.972l-.032-.548-.159.457-.891.792-1.021.161-.306-.3.892-1.256.92-.278-.992.022-1.442 1.063-1.352-.099 1.356.943.668.479-2.035-1.454L14.716 8l-1.123.227-3.498 2.959-1.683.552-.694.72-1.244.014-.611 1.162-.863.252.816.117.759-1.041 1.168.248-.018 1.11-.586 1.605-.334 1.483-.36.592.914-.205-.105-.606.773-1.63 1.5-.61.579-.975.978-.727 1.938.292 1.96-.873-.335 1.377-.87.08-.248 1.137.747-.508 1.23-.544.967-1.535.058-.73.521.547 1.507.958.852-.41-.05-2.035-.245-.785 1.118-.285z"
      />
    </g>
  </svg>
);
