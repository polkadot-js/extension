// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props {
  className?: string;
  isDisabled?: boolean;
  isOverlay?: boolean;
  isRadio?: boolean;
  label: React.ReactNode;
  onChange?: (isChecked: boolean) => void;
  preventDefault?: boolean;
  value?: boolean;
}

function Toggle ({ className = '', isDisabled, isOverlay, isRadio, label, onChange, preventDefault, value }: Props): React.ReactElement<Props> {
  const _onClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
      if (!isDisabled) {
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }

        onChange && onChange(!value);
      }
    },
    [isDisabled, onChange, preventDefault, value]
  );

  return (
    <div
      className={`ui--Toggle${value ? ' is-checked' : ''}${isDisabled ? 'is-disabled' : ''}${isOverlay ? ' isOverlay' : ''}${isRadio ? ' is-radio' : ''} ${className}`}
    >
      {label && <label>{label}</label>}
      <div
        className={`toggle-slider${isRadio ? ' highlight--before-border' : ''}`}
        onClick={_onClick}
      />
    </div>
  );
}

export default React.memo(styled(Toggle)(({ theme }: ThemeProps) => `
  > label {
    display: inline-block;
    margin-right: 12px;
    font-size: 15px;
  }

  > label,
  > div {
    vertical-align: middle;
  }

  .toggle-slider {
    background: ${theme.toggleInactiveBgc};
    border-radius: 28px;
    display: inline-block;
    height: 28px;
    position: relative;
    width: 54px;

    &::before {
      background: ${theme.toggleInactiveThumbColor};
      box-shadow: ${theme.toggleInactiveThumbBoxShadow};
      border-radius: 50%;
      content: "";
      height: 22px;
      left: 3px;
      position: absolute;
      top: 0;
      bottom: 0;
      margin-top: auto;
      margin-bottom: auto;
      width: 22px;
    }
  }

  &:not(.is-disabled) {
    cursor: pointer;

    > label {
      color: ${theme.textColor2};
    }
  }

  &.is-checked {
    &:not(.is-radio) {
      .toggle-slider {
        background: ${theme.buttonBackground2};
      }

      .toggle-slider:before {
        background-color: #fff;
        transform: translateX(26px);
        box-shadow: none;
      }
    }

    &.is-radio {
      .toggle-slider:before {
        border-width: 0.5rem;
      }
    }
  }

  &.is-radio {
    .toggle-slider {
      width: 1.5rem;
    }
  }
`));
