// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import Checkmark from '../assets/checkmark.svg';
import Subtract from '../assets/subtract.svg';

interface Props {
  checked: boolean;
  indeterminate?: boolean;
  className?: string;
  label: ReactNode;
  onChange?: (checked: boolean) => void;
  onClick?: () => void;
  variant?: 'default' | 'small';
}

function Checkbox({
  checked,
  className,
  indeterminate,
  label,
  onChange,
  onClick,
  variant = 'default'
}: Props): React.ReactElement<Props> {
  const checkboxRef = React.useRef<HTMLInputElement | null>(null);

  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  const _onChange = useCallback((event: { target: HTMLInputElement }) => onChange?.(event.target.checked), [onChange]);

  const _onClick = useCallback(() => onClick && onClick(), [onClick]);

  return (
    <div className={className}>
      <Label
        isOutlined={isFocusVisible}
        variant={variant}
      >
        {label}
        <input
          checked={checked && !indeterminate}
          onBlur={() => setIsFocusVisible(false)}
          onChange={_onChange}
          onClick={_onClick}
          onFocus={() => {
            const isFocusVisible = !!checkboxRef.current?.matches(':focus-visible');

            setIsFocusVisible(isFocusVisible);
          }}
          ref={checkboxRef}
          type='checkbox'
        />
        <span className={`checkbox-ui ${indeterminate ? 'indeterminate' : ''}`} />
      </Label>
    </div>
  );
}

const variantToStyles = {
  small: {
    height: '11px',
    width: '11px',
    top: '4px',
    left: '0px',
    paddingLeft: '24px',
    after: {
      height: '11px',
      width: '11px',
      top: '0px',
      left: '0px'
    }
  },
  default: {
    height: '16px',
    width: '16px',
    top: '2px',
    left: '0px',
    paddingLeft: '26px',
    after: {
      height: '10px',
      width: '13px',
      top: '2px',
      left: '1px'
    }
  }
};

const Label = styled.label<{ isOutlined: boolean; variant: NonNullable<Props['variant']> }>`
    display: block;
    position: relative;
    min-height: ${({ variant }) => `calc(${variantToStyles[variant].width} + 4px)`};
    cursor: pointer;
    user-select: none;
    padding-left: ${({ variant }) => variantToStyles[variant].paddingLeft};;
    padding-top: 1px;
    color: ${({ theme }) => theme.subTextColor};
    font-size: ${({ theme }) => theme.fontSize};
    line-height: ${({ theme }) => theme.lineHeight};
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    letter-spacing: 0.07em;

    :has(input:focus-visible) {
      outline-style: auto;
    }

    /* :has selector is the pure css solution to this problem, but doesn't have (so far) enough support ;( */
    ${({ isOutlined }) => (isOutlined ? 'outline-style: auto;' : '')}
`;

export default styled(Checkbox)(
  ({ theme, variant = 'default' }) => `
  margin: ${theme.boxMargin};
  box-sizing: border-box;

  label {

    & input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    & .checkbox-ui {
      position: absolute;
      top: ${variantToStyles[variant].top};
      left: ${variantToStyles[variant].left};
      height: ${variantToStyles[variant].height};
      width: ${variantToStyles[variant].width};
      border-radius: 4px;
      background-color: ${theme.inputBackground};
      border: 2px solid ${theme.inputBackground};
      box-shadow: 0 0 0 1px ${theme.checkboxBorderColor};
      transition: 0.2s ease;

      &:after {
        content: '';
        display: none;
        width: ${variantToStyles[variant].after.width};
        height: ${variantToStyles[variant].after.height};
        position: absolute;
        left: ${variantToStyles[variant].after.left};
        top: ${variantToStyles[variant].after.top};
        mask: url(${Checkmark});
        mask-size: cover;
        background: ${theme.boxBackground};
      }

      &:focus {
        box-shadow: 0 0 0 1px ${theme.primaryColor};
      }
    }

    input:checked ~ .checkbox-ui:after {
      display: block;
      background: ${theme.boxBackground};
    }

    input:checked ~ .checkbox-ui {
      background: ${theme.primaryColor};
      border-radius: 4px;
    }

    input:indeterminate ~ .checkbox-ui {
      background: ${theme.primaryColor};
      &:after {
        content: '';
        display: block;
        width: 13px;
        height: 10px;
        position: absolute;
        left: 1px;
        top: 2px;
        mask: url(${Subtract});
        mask-size: cover;
      }
    }
  }

  &:hover {
    label .checkbox-ui {
      box-shadow: 0 0 0 1px ${theme.primaryColor};
    }
  }
`
);
