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
      className={`ui--Toggle${value ? ' isChecked' : ''}${isDisabled ? ' isDisabled' : ''}${isOverlay ? ' isOverlay' : ''}${isRadio ? ' isRadio' : ''} ${className}`}
    >
      {label && <label>{label}</label>}
      <div
        className={`ui--Toggle-Slider${isRadio ? ' highlight--before-border' : ''}`}
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

  .ui--Toggle-Slider {
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

  &:not(.isDisabled) {
    cursor: pointer;

    > label {
      color: ${theme.textColor2};
    }
  }

  &.isChecked {
    &:not(.isRadio) {
      .ui--Toggle-Slider {
        background: ${theme.buttonBackground2};
      }

      .ui--Toggle-Slider:before {
        background-color: #fff;
        transform: translateX(26px);
        box-shadow: none;
      }
    }

    &.isRadio {
      .ui--Toggle-Slider:before {
        border-width: 0.5rem;
      }
    }
  }

  &.isRadio {
    .ui--Toggle-Slider {
      width: 1.5rem;
    }
  }

  // &.isOverlay {
  //   bottom: 1.375rem;
  //   position: absolute;
  //   right: 3.5rem;
  // }
`));
