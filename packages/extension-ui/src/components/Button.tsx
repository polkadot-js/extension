// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';

import Spinner from './Spinner';
import { Svg } from '.';

interface Props extends ThemeProps {
  className?: string;
  children?: React.ReactNode;
  isBusy?: boolean;
  isDanger?: boolean;
  isDisabled?: boolean;
  isSuccess?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  onClick?: () => void | Promise<void | boolean>;
  to?: string;
}

function Button({ children, className = '', isBusy, isDisabled, onClick, to }: Props): React.ReactElement<Props> {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const _onClick = useCallback((): void => {
    if (isBusy || isDisabled) {
      return;
    }

    // TODO: check why is it giving errors
    if (onClick) {
      onClick()?.catch(console.error);
    }

    if (to) {
      window.location.hash = to;
    }
  }, [isBusy, isDisabled, onClick, to]);

  const onMouseLeave = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.blur();
    }
  }, []);

  return (
    <button
      className={`${className}${isDisabled || isBusy ? ' isDisabled' : ''}${isBusy ? ' isBusy' : ''}`}
      disabled={isDisabled || isBusy}
      onClick={_onClick}
      ref={buttonRef}
      onMouseLeave={onMouseLeave}
    >
      <div className='children'>{children}</div>
      <Spinner className='busyOverlay' />
    </button>
  );
}

export default styled(Button)(
  ({ isBusy, isDanger, isSuccess, secondary, tertiary, theme }: Props) => `
  background: ${
    isDanger
      ? theme.buttonBackgroundDanger
      : isSuccess
      ? theme.buttonBackgroundSuccess
      : secondary
      ? theme.buttonSecondaryBackground
      : tertiary
      ? theme.buttonTertiaryBackground
      : theme.buttonBackground
  };

  cursor: pointer;
  display: block;
  width: ${tertiary ? 'max-content' : '100%'};
  height: ${tertiary ? 'unset' : '48px'};
  box-sizing: border-box;
  border: none;
  border-radius: ${tertiary ? '2px' : theme.buttonBorderRadius};
  color: ${
    isBusy
      ? 'transparent'
      : isDanger
      ? theme.buttonTextColor
      : secondary
      ? theme.buttonSecondaryTextColor
      : tertiary
      ? theme.buttonTertiaryTextColor
      : theme.buttonTextColor
  };
  font-family: ${theme.secondaryFontFamily};
  font-weight: 500;
  font-size: 16px;
  line-height: 135%;
  padding: ${tertiary ? '2px 0px;' : '0 1rem'};
  position: relative;
  text-align: center;
  letter-spacing: 0.05em;
  transition: 0.2s ease;

  &:disabled {
    cursor: default;
    pointer-events: none;
    color: ${isSuccess ? theme.buttonTextColor : isBusy ? 'transparent' : theme.buttonTextColor};
    background: ${
      isDanger
        ? theme.buttonBackgroundDangerDisabled
        : isSuccess
        ? theme.buttonBackgroundSuccessDisabled
        : secondary
        ? theme.buttonSecondaryBackgroundDisabled
        : tertiary
        ? theme.buttonTertiaryBackground
        : theme.buttonBackgroundDisabled
    };
    opacity: ${secondary || tertiary ? theme.buttonTertiaryDisabledOpacity : 1};

    ${Svg} { 
      background: ${isBusy ? 'transparent' : 'currentColor'};
    }
  }

  &:focus {
    outline: none;
    border: ${secondary ? theme.buttonSecondaryBorderFocused : tertiary ? 'none' : theme.buttonBorderFocused};
  }

  &:not(:disabled):hover, &:active {
    border: none;
    background: ${
      isDanger
        ? theme.buttonBackgroundDangerHover
        : secondary
        ? theme.buttonSecondaryBackgroundHover
        : isSuccess
        ? theme.buttonBackgroundSuccessHover
        : tertiary
        ? theme.buttonTertiaryBackground
        : theme.buttonBackgroundHover
    };
    color: ${
      isDanger
        ? theme.buttonTextColor
        : secondary
        ? theme.buttonSecondaryTextColor
        : tertiary
        ? theme.buttonTertiaryHoverTextColor
        : theme.buttonTextColor
    };
    box-shadow: ${
      isDanger
        ? theme.buttonDangerBoxShadow
        : secondary
        ? theme.buttonSecondaryHoverBoxShadow
        : tertiary
        ? 'none'
        : theme.buttonHoverBoxShadow
    };
  }

  &:active .children {
    margin-top: 2px;
  }
  
  .busyOverlay,
  .disabledOverlay {
    visibility: hidden;
  }

  .disabledOverlay {
    border-radius: ${tertiary ? '2px' : theme.buttonBorderRadius};
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  svg {
    margin-right: 0.3rem;
  }

  .children {
    display:flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: ${isBusy ? 'transparent' : 'currentColor'};
    font-family: ${theme.secondaryFontFamily};
  }

  &.isBusy {
    color: transparent;
    .busyOverlay {
      visibility: visible;
    }
  }


`
);
