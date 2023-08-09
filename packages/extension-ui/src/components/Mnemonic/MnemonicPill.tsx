import type { ThemeProps } from '../../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  index: number;
  word: string;
  name: string;
  showError?: boolean;
  onChange?: (value: string, key: number) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

const MnemonicPill = ({ className, index, inputRef, name, onChange, onKeyDown, word }: Props) => {
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
        autoCapitalize='off'
        name={name}
        onChange={_handleChange}
        onKeyDown={onKeyDown}
        ref={inputRef}
        value={word}
      />
    </div>
  );
};

export default styled(MnemonicPill)`
  display: flex;
  flex-direction: row;
  align-items: center;

  box-sizing: border-box;
  width: 106px;
  height: 26px;
  border: 1px solid ${({ showError, theme }) => (showError ? theme.textColorDanger : theme.boxBorderColor)};
  border-radius: ${({ theme }) => theme.buttonBorderRadius};

  background: ${({ theme }) => theme.mnemonicBackground};

  &:focus-within {
    border: 1px solid ${({ showError, theme }) => (showError ? theme.textColorDanger : theme.primaryColor)};
  }

  input {
    background: transparent;
    border: none;
    font-size: 14px;
    font-weight: 300;
    line-height: 145%;
    letter-spacing: 0.07em;
    color: ${({ theme }) => theme.textColor};
    flex: 1;
    text-align: center;
    width: 60px;
    margin-left: -3px;
    padding-inline: 0;
    border-radius: ${({ theme }) => theme.buttonBorderRadius};
    outline: none;

    :read-only {
      cursor: default;
    }

  }

  .mnemonic-index {
    display: flex;
    align-items: center;
    justify-content: center;

    min-width: 22px;
    min-height: 22px;
    margin-left: 1px;

    color: ${({ theme }) => theme.subTextColor};
    background: ${({ theme }) => theme.menuBackground};
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    border-radius: 50%;
  }
`;
