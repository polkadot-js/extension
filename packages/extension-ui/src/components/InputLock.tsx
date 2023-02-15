// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import lockedIcon from '../assets/locked.svg';
import unlockedIcon from '../assets/unlocked.svg';
import { ThemeProps } from '../types';
import Svg from './Svg';

interface InputLockProps extends ThemeProps {
  className?: string;
  isLocked: boolean;
  onClick: (isLocked: boolean) => void;
}

const InputLock: React.FC<InputLockProps> = ({ className, isLocked, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(!isLocked);
  }, [isLocked, onClick]);

  return (
    <div
      className={className}
      onClick={handleClick}
    >
      <Svg
        className='lock-icon'
        src={isLocked ? lockedIcon : unlockedIcon}
      />
    </div>
  );
};

export default styled(InputLock)(
  ({ theme }: InputLockProps) => `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 56px;
  
  .lock-icon {
    background: ${theme.subTextColor};
    width: 24px;
    height: 24px;
    cursor: pointer;
  }

  `
);
