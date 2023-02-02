// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  index: number;
  word: string;
}

const MnemonicPill = ({ className, index, word }: Props) => {
  return (
    <div className={className}>
      <div className='mnemonic-index'>{index}</div>
      <input
        readOnly
        value={word}
      />
    </div>
  );
};

export default styled(MnemonicPill)(
  ({ theme }: Props) => `
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  border: 1px solid ${theme.boxBorderColor};
  background: ${theme.mnemonicBackground};
  border-radius: ${theme.buttonBorderRadius};
  padding: 4px;
  max-width: 106px;

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
    max-width: 80px;
    border-radius: ${theme.buttonBorderRadius};
    outline: none;
    cursor: default;
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
