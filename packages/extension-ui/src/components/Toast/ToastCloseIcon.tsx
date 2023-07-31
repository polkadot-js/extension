/* eslint-disable @typescript-eslint/no-unused-vars */

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  animationDurationInSeconds: number;
}

function ToastCloseIcon({ animationDurationInSeconds = 1500, className }: Props): React.ReactElement<Props> {
  const STROKE_WIDTH = 1.5;

  return (
    <svg
      className={className}
      height='32'
      width='32'
      xmlns='http://www.w3.org/2000/svg'
    >
      <circle
        cx='16'
        cy='16'
        fill='none'
        id='grey-circle'
        r='14'
        strokeWidth={STROKE_WIDTH}
      ></circle>
      <circle
        className='circle_animation'
        cx='16'
        cy='16'
        fill='none'
        id='black-circle'
        r='14'
        strokeWidth={STROKE_WIDTH}
      ></circle>
      <svg
        fill='none'
        height='14'
        viewBox='0 0 14 14'
        width='14'
        x='9'
        xmlns='http://www.w3.org/2000/svg'
        y='9'
      >
        <path
          clipRule='evenodd'
          d='M7.00005 7.88394L12.8081 13.692L13.692 12.8081L7.88394 7.00005L13.692 1.192L12.8081 0.308115L7.00005 6.11617L1.19199 0.308105L0.308105 1.19199L6.11617 7.00005L0.308105 12.8081L1.19199 13.692L7.00005 7.88394Z'
          fill='#111B24'
          fillRule='evenodd'
          id='times-icon'
        />
      </svg>
    </svg>
  );
}

export default styled(ToastCloseIcon)(
  ({ animationDurationInSeconds, theme }: Props) => `
  transform: rotate(-90deg);

  .circle_animation {
    stroke-dasharray: 89;
    stroke-dashoffset: 89;
    animation: clockwise ${animationDurationInSeconds}s linear forwards;
  }

  #grey-circle {
    stroke: ${theme.toastTextColor};
    opacity: 0.1;
  }

  #black-circle, #grey-circle {
    stroke: ${theme.toastTextColor};
  }
      
  @keyframes clockwise {
    from {
      stroke-dashoffset: 89;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  
`
);
