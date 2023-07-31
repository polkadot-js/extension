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

  const _onKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === 'Enter' || event.key === 'Space') {
        onClick(!isLocked);
      }
    },
    [isLocked, onClick]
  );

  return (
    <div
      className={className}
      onClick={handleClick}
      onKeyDown={_onKeyPress}
      tabIndex={0}
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
    
    :hover, :focus {
      background: ${theme.headerIconBackgroundHover};
    }
  }

  `
);
