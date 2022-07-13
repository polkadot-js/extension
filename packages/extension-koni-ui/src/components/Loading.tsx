// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useContext } from 'react';
import styled, { ThemeContext } from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function Loading ({ className = '' }: Props): React.ReactElement<Props> {
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  return (
    <div className={`${className} loading-layer`}>
      <div className='loading-img'>
        <svg
          viewBox='0 0 100 100'
          xmlns='http://www.w3.org/2000/svg'
        >
          <g transform='rotate(0 50 50)'>
            <rect
              fill={`${themeContext?.textColor2 || '#888'}`}
              height='16'
              rx='4'
              ry='4'
              width='8'
              x='46'
              y='22'
            >
              <animate
                attributeName='opacity'
                begin='-0.546875s'
                dur='0.625s'
                keyTimes='0;1'
                repeatCount='indefinite'
                values='1;0'
              ></animate>
            </rect>
          </g><g transform='rotate(45 50 50)'>
            <rect
              fill={`${themeContext?.textColor2 || '#888'}`}
              height='16'
              rx='4'
              ry='4'
              width='8'
              x='46'
              y='22'
            >
              <animate
                attributeName='opacity'
                begin='-0.46875s'
                dur='0.625s'
                keyTimes='0;1'
                repeatCount='indefinite'
                values='1;0'
              ></animate>
            </rect>
          </g><g transform='rotate(90 50 50)'>
            <rect
              fill={`${themeContext?.textColor2 || '#888'}`}
              height='16'
              rx='4'
              ry='4'
              width='8'
              x='46'
              y='22'
            >
              <animate
                attributeName='opacity'
                begin='-0.390625s'
                dur='0.625s'
                keyTimes='0;1'
                repeatCount='indefinite'
                values='1;0'
              ></animate>
            </rect>
          </g><g transform='rotate(135 50 50)'>
            <rect
              fill={`${themeContext?.textColor2 || '#888'}`}
              height='16'
              rx='4'
              ry='4'
              width='8'
              x='46'
              y='22'
            >
              <animate
                attributeName='opacity'
                begin='-0.3125s'
                dur='0.625s'
                keyTimes='0;1'
                repeatCount='indefinite'
                values='1;0'
              ></animate>
            </rect>
          </g><g transform='rotate(180 50 50)'>
            <rect
              fill={`${themeContext?.textColor2 || '#888'}`}
              height='16'
              rx='4'
              ry='4'
              width='8'
              x='46'
              y='22'
            >
              <animate
                attributeName='opacity'
                begin='-0.234375s'
                dur='0.625s'
                keyTimes='0;1'
                repeatCount='indefinite'
                values='1;0'
              ></animate>
            </rect>
          </g><g transform='rotate(225 50 50)'>
            <rect
              fill={`${themeContext?.textColor2 || '#888'}`}
              height='16'
              rx='4'
              ry='4'
              width='8'
              x='46'
              y='22'
            >
              <animate
                attributeName='opacity'
                begin='-0.15625s'
                dur='0.625s'
                keyTimes='0;1'
                repeatCount='indefinite'
                values='1;0'
              ></animate>
            </rect>
          </g><g transform='rotate(270 50 50)'>
            <rect
              fill={`${themeContext?.textColor2 || '#888'}`}
              height='16'
              rx='4'
              ry='4'
              width='8'
              x='46'
              y='22'
            >
              <animate
                attributeName='opacity'
                begin='-0.078125s'
                dur='0.625s'
                keyTimes='0;1'
                repeatCount='indefinite'
                values='1;0'
              ></animate>
            </rect>
          </g><g transform='rotate(315 50 50)'>
            <rect
              fill={`${themeContext?.textColor2 || '#888'}`}
              height='16'
              rx='4'
              ry='4'
              width='8'
              x='46'
              y='22'
            >
              <animate
                attributeName='opacity'
                begin='0s'
                dur='0.625s'
                keyTimes='0;1'
                repeatCount='indefinite'
                values='1;0'
              ></animate>
            </rect>
          </g>
        </svg>
      </div>
    </div>
  );
}

export default React.memo(styled(Loading)(({ theme }: Props) => ''));
