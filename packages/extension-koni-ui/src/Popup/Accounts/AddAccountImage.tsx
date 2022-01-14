// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// We _could_ reformat, but just keep it as-is, since this is actually
// externally generated and not really user-editable

/* eslint-disable react/jsx-sort-props */
/* eslint-disable react/jsx-max-props-per-line */

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  onClick: () => void;
}

function AddAccountImage ({ className, onClick }: Props): React.ReactElement<Props> {
  return (
    <svg className={className} width='265' height='265' viewBox='0 0 265 265' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <mask id='mask0' mask-type='alpha' maskUnits='userSpaceOnUse' x='40' y='40' width='185' height='185'>
        <circle cx='132.5' cy='132.5' r='92' fill='white' fillOpacity='0.9' stroke='#E3E7ED' />
      </mask>
      <g mask='url(#mask0)'>
        <circle
          cx='132.5'
          cy='132.5' r='92'
          strokeWidth='1px'
          fill='#1A1B20'
          stroke='#E3E7ED'
          onClick={onClick}
        />
        <g filter='url(#filter0_f)'>
          <circle cx='132.5' cy='73.1154' r='12.1154' fill='#FEE05F' />
          <circle cx='132.5' cy='104.269' r='12.1154' fill='#F5836B' />
          <circle cx='132.5' cy='135.423' r='12.1154' fill='#EE6C89' />
          <circle cx='132.5' cy='166.577' r='12.1154' fill='#397893' />
          <circle cx='132.5' cy='166.577' r='12.1154' fill='#E2327D' />
          <circle cx='77.1154' cy='104.269' r='12.1154' fill='#F0512A' />
          <circle cx='77.1154' cy='135.423' r='12.1154' fill='#966EAC' />
          <circle cx='77.1154' cy='166.577' r='12.1154' fill='#397893' />
          <circle cx='77.1154' cy='166.577' r='12.1154' fill='#9195C9' />
          <circle cx='187.884' cy='104.269' r='12.1154' fill='#FFFACA' />
          <circle cx='187.884' cy='135.423' r='12.1154' fill='#ECCCDB' />
          <circle cx='187.884' cy='166.577' r='12.1154' fill='#397893' />
          <circle cx='187.884' cy='166.577' r='12.1154' fill='#ED3432' />
          <circle cx='132.5' cy='197.731' r='12.1154' fill='#B24594' />
          <circle cx='160.193' cy='86.9615' r='12.1154' fill='#FFBB50' />
          <circle cx='160.193' cy='118.115' r='12.1154' fill='#F6E768' />
          <circle cx='160.193' cy='149.269' r='12.1154' fill='#FF5A5A' />
          <circle cx='160.193' cy='180.423' r='12.1154' fill='#397893' />
          <circle cx='160.193' cy='180.423' r='12.1154' fill='#D6234A' />
          <circle cx='104.808' cy='86.9615' r='12.1154' fill='#FFA800' />
          <circle cx='104.808' cy='118.115' r='12.1154' fill='#F78D53' />
          <circle cx='104.808' cy='149.269' r='12.1154' fill='#BD87BB' />
          <circle cx='104.808' cy='180.423' r='12.1154' fill='#397893' />
          <circle cx='104.808' cy='180.423' r='12.1154' fill='#AF71AF' />
        </g>
        <path
          d='M145.768 133.776C146.323 133.776 146.792 133.968 147.176 134.352C147.603 134.736 147.816 135.205 147.816 135.76C147.816 136.315 147.624 136.805 147.24 137.232C146.856 137.616 146.365 137.808 145.768 137.808H134.184V149.328C134.184 149.925 133.992 150.416 133.608 150.8C133.224 151.184 132.755 151.376 132.2 151.376C131.645 151.376 131.176 151.184 130.792 150.8C130.408 150.373 130.216 149.883 130.216 149.328V137.808H118.632C118.077 137.808 117.587 137.616 117.16 137.232C116.776 136.805 116.584 136.315 116.584 135.76C116.584 135.205 116.776 134.736 117.16 134.352C117.587 133.968 118.077 133.776 118.632 133.776H130.216V122.256C130.216 121.659 130.408 121.168 130.792 120.784C131.176 120.357 131.645 120.144 132.2 120.144C132.755 120.144 133.224 120.357 133.608 120.784C133.992 121.168 134.184 121.659 134.184 122.256V133.776H145.768Z'
          fill='#242529' onClick={onClick}
        />
      </g>
      <defs>
        <filter
          id='filter0_f' x='-3' y='-7' width='271' height='284.846' filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
          <feGaussianBlur stdDeviation='10' result='effect1_foregroundBlur' />
        </filter>
      </defs>
    </svg>
  );
}

export default React.memo(styled(AddAccountImage)(({ theme }: Props) => `
  circle, path {
    cursor: pointer;
  }

  path {
    fill: ${theme.textColor};
  }

  & > g > circle {
    stroke: ${theme.inputBorderColor};
    fill: ${theme.addAccountImageBackground};
  }
`));
