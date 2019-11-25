// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

function Checkbox ({ onChange, label, className, checked }: Props): React.ReactElement<Props> {
  return <div className={className}>
    <label>
      {label}
      <input type="checkbox" checked={checked} onChange={((event): void => onChange(event.target.checked))}/>
      <span/>
    </label>
  </div>;
}

export default styled(Checkbox)`
  label {
    display: block;
    position: relative;
    cursor: pointer;
    user-select: none;
    margin: ${({ theme }): string => theme.boxMargin};
    padding-left: 24px;
    color: ${({ theme }): string => theme.labelColor};
    font-size: ${({ theme }): string => theme.fontSize};
    line-height: ${({ theme }): string => theme.lineHeight};

    & input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    & span {
      position: absolute;
      top: 4px;
      left: 0;
      height: 16px;
      width: 16px;
      border-radius: ${({ theme }): string => theme.borderRadius};
      background-color: ${({ theme }): string => theme.inputBackground};
      border: 1px solid ${({ theme }): string => theme.inputBorderColor};

      &:after {
        content: "✓";
        display: none;
        left: 3px;
        top: -4px;
        position: absolute;
        color: ${({ theme }): string => theme.textColor};
        font-size: 14px;
      }
    }

    &:hover input ~ span {
      background-color: ${({ theme }): string => theme.labelColor};
    }

    input:checked ~ span {
      background-color: ${({ theme }): string => theme.primaryColor};
    }

    input:checked ~ span:after {
      display: block;
    }
  }
`;
