// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useEffect } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  visible: boolean;
  onClick?: () => void;
}

const baseClassName = 'custom-background-mask';

const Component: React.FC<Props> = ({ className,
  onClick, visible }: Props) => {
  useEffect(() => {
    // Remove the mask from the DOM after the transition ends
    const mask: HTMLElement | null = document.querySelector(`.${baseClassName}`);

    const handleTransitionEnd = () => {
      if (!visible) {
        if (mask) {
          mask.removeEventListener('transitionend', handleTransitionEnd);
          mask.style.height = ''; // Reset the height
        }
      }
    };

    mask?.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      mask?.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [visible]);

  return (
    <div
      className={CN(baseClassName, className, {
        '-visible': visible
      })}
      onClick={onClick}
    ></div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BackgroundMask = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.75)',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out, height 0.1s ease-in-out',
    pointerEvents: 'none',
    zIndex: 999,

    '&.-visible': {
      opacity: 1,
      height: '100%',
      pointerEvents: 'auto'
    }
  };
});
