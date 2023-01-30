// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';
import Skeleton from './Skeleton';

interface Props extends ThemeProps {
  className?: string;
}

const SkeletonCard: React.FC<Props> = ({ className }) => {
  return (
    <div className={className}>
      <div className='avatar-group'>
        <Skeleton type='avatar' />
      </div>
      <div className='paragraph-group'>
        <Skeleton
          height={16}
          type='paragraph'
          width={130}
        />
        <Skeleton
          height={12}
          type='paragraph'
          width={80}
        />
      </div>
    </div>
  );
};

export default styled(SkeletonCard)(({ theme }: Props) => `

  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 80px;
  border-radius: 8px;
  padding: 16px;

  .avatar-group {
    display:flex;
  }
  .paragraph-group {
    display:flex;
    flex-direction: column;
    gap: 8px;
  }

`
);
