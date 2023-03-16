// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  index: number;
  word: string;
  name: string;
  readonly?: boolean;
  isError?: boolean;
  onChange?: (value: string, key: any) => void;
}

const MnemonicPill = ({ className, index, name, onChange, readonly = true, word }: Props) => {
  const _handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(event.target.value, index);
      }
    },
    [index, onChange]
  );

  return (
    <div className={className}>
      <div className='mnemonic-index'>{index + 1}</div>
      <input
        name={name}
        onChange={_handleChange}
        readOnly={!!readonly}
        value={word}
      />
    </div>
  );
};

export default styled(MnemonicPill)(
  ({ isError, theme }: Props) => `
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1px;
  border: 1px solid ${isError ? theme.textColorDanger : theme.boxBorderColor};
  background: ${theme.mnemonicBackground};
  border-radius: ${theme.buttonBorderRadius};
  padding: 4px;
  max-width: 106px;

  &:focus-within {
    border: 1px solid ${isError ? theme.textColorDanger : theme.primaryColor};
  }

  input {
    background: transparent;
    border: none;
    font-size: 14px;
    font-weight: 300;
    line-height: 145%;
    letter-spacing: 0.07em;
    color: ${theme.textColor};
    flex: 1;
    text-align: left;
    width: 70px;
    border-radius: ${theme.buttonBorderRadius};
    outline: none;

    :read-only {
      cursor: default;
    }

  }

  .mnemonic-index {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.subTextColor};
    background: ${theme.menuBackground};
    min-width: 24px;
    min-height: 24px;
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    border-radius: 50%;
  }
`
);
