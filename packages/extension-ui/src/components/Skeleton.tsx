import React, { useState } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
  height?: number;
  type: 'avatar' | 'paragraph';
  width?: number;

}

const Skeleton: React.FC<Props> = ({ className,height, type, width,  }) => {
  return <div className={className}>{type === 'avatar' ? <div className='skeleton-avatar' /> : <div className='skeleton-paragraph' />}</div>;
};

export default styled(Skeleton)(({ height,theme, width }: Props) => `
  .skeleton-avatar {
    border-radius: 50%;
    width: 48px;
    height: 48px;
    background-color: ${theme.skeletonBackground};
    animation: skeleton-loading 1s linear infinite alternate;
  }
  .skeleton-paragraph {
    width:  ${width ? `${width}px` : '100%'};
    height: ${height ? `${height}px` : '16px'};
    border-radius: 4px;
    background-color: ${theme.skeletonBackground};
    animation: skeleton-loading 1s linear infinite alternate;
  }

  @keyframes skeleton-loading {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
`
);
