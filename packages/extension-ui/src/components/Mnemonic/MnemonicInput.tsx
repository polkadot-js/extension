// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useRef } from 'react';
import styled from 'styled-components';

import MnemonicPill from './MnemonicPill';

type Props = {
  className?: string;
  seedWords: string[];
  showError: boolean;
  onChange: (seedWords: string[]) => void;
};

const MnemonicInput = ({
  className,
  onChange,
  seedWords,
  showError,
}: Props) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();

    const pastedWords = event.clipboardData.getData('text').trim().split(/\s+/);

    inputRefs.current[Math.min(pastedWords.length, seedWords.length - 1)]?.focus();

    onChange(pastedWords);
  };

  const handleChange = (value: string, index: number) => {
    const nextSeedWords = [...seedWords];

    const words = value.split(/\s+/);

    words.forEach((word, subIndex) => {
      nextSeedWords[index + subIndex] = word;
    });

    inputRefs.current[index + words.length - 1]?.focus();

    onChange(nextSeedWords);
  };

  const onBackspaceFocusPrevInput = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.code !== 'Backspace') {
      return;
    }

    if (seedWords[index]) {
      return;
    }

    event.preventDefault();
    inputRefs.current[index - 1]?.focus();
  };

  return (
    <div
      className={className}
      onPaste={handlePaste}
    >
      <div className='mnemonic-container'>
        {seedWords.map((value, index) => (
          <MnemonicPill
            className='mnemonic-pill'
            index={index}
            inputRef={(elem) => {
              inputRefs.current[index] = elem;
            }}
            key={index}
            name={`input${index}`}
            onChange={handleChange}
            onKeyDown={(event) => onBackspaceFocusPrevInput(event, index)}
            showError={showError}
            word={value}
          />
        ))}
      </div>
    </div>
  );
};

export default styled(MnemonicInput)`
  .mnemonic-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px 5px;
    width: 100%;
  }

  .mnemonic-pill {
    box-sizing: border-box;
    min-width: 0;
  }

  .mnemonic-index {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.subTextColor};
    background: ${({ theme }) => theme.menuBackground};
    min-width: 24px;
    min-height: 24px;
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    border-radius: 50%;
  }
`;
