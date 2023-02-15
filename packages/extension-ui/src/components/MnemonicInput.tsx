// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { validateSeed } from '@polkadot/extension-ui/messaging';
import { objectSpread } from '@polkadot/util';
import { KeypairType } from '@polkadot/util-crypto/types';

import useTranslation from '../hooks/useTranslation';
import { AccountInfo } from '../Popup/ImportSeed';
import MnemonicPill from './MnemonicPill';

interface Props extends ThemeProps {
  className?: string;
  onAccountChange: (account: AccountInfo | null) => void;
  type: KeypairType;
  seed: string | null;
  genesis: string;
  path: string | null;
  setAddress: (address: string) => void;
  error: string;
  setError: (error: string) => void;
  onChange: (seed: string) => void;
}

export type MnemonicWordKeys = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11';
type MnemonicWords = { [key in MnemonicWordKeys]: string };

const MNEMONIC_WORDS_INITIAL_STATE: MnemonicWords = {
  '0': '',
  '1': '',
  '2': '',
  '3': '',
  '4': '',
  '5': '',
  '6': '',
  '7': '',
  '8': '',
  '9': '',
  // eslint-disable-next-line sort-keys
  '10': '',
  '11': ''
};

const MnemonicInput = ({
  className,
  error,
  genesis,
  onAccountChange,
  onChange,
  path,
  seed,
  setAddress,
  setError,
  type
}: Props) => {
  const [mnemonicWords, setMnemonicWords] = useState<MnemonicWords>({ ...MNEMONIC_WORDS_INITIAL_STATE });
  const { t } = useTranslation();
  const isValid = !!error && !!seed;

  const _handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      event.preventDefault();

      const pastedWords = event.clipboardData.getData('text').trim().split(' ').slice(0, 12);

      const newMnemonicWords: { [key in MnemonicWordKeys]: string } = { ...MNEMONIC_WORDS_INITIAL_STATE };

      pastedWords.forEach((word, index) => {
        const key = index.toString() as MnemonicWordKeys;

        newMnemonicWords[key] = word;
      });
      setMnemonicWords(newMnemonicWords);
      onChange(pastedWords.join(' '));
    },
    [onChange, setMnemonicWords]
  );

  const _handleChange = useCallback(
    (value: string, key: MnemonicWordKeys) => {
      const newMnemonicWords = { ...mnemonicWords };

      newMnemonicWords[key] = value;

      onChange(Object.values(newMnemonicWords).join(' '));
      setMnemonicWords(newMnemonicWords);
    },
    [mnemonicWords, onChange, setMnemonicWords]
  );

  useEffect(() => {
    if (!seed) {
      return;
    }

    setMnemonicWords(
      seed.split(' ').reduce(
        (obj: MnemonicWords, word, index) => {
          const key = index.toString() as MnemonicWordKeys;

          obj[key] = word;

          return obj;
        },
        { ...MNEMONIC_WORDS_INITIAL_STATE }
      )
    );
  }, [seed, setMnemonicWords]);

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);

      return;
    }

    const suri = `${seed || ''}${path || ''}`;

    validateSeed(suri, type)
      .then((validatedAccount) => {
        setError('');
        setAddress(validatedAccount.address);
        onAccountChange(objectSpread<AccountInfo>({}, validatedAccount, { genesis, type }));
      })
      .catch(() => {
        setAddress('');
        onAccountChange(null);
        setError(path ? t<string>('Invalid secret phrase or path') : t<string>('Invalid secret phrase'));
      });
  }, [t, genesis, seed, path, onAccountChange, type, setError, setAddress]);

  return (
    <div
      className={className}
      onPaste={_handlePaste}
    >
      <div className='mnemonic-container'>
        {Object.keys(mnemonicWords).map((key) => (
          <MnemonicPill
            className='mnemonic-pill'
            index={parseInt(key, 10)}
            isError={isValid}
            key={key}
            name={`input${key}`}
            onChange={_handleChange}
            readonly={false}
            word={mnemonicWords[key as MnemonicWordKeys]}
          />
        ))}
      </div>
    </div>
  );
};

export default styled(MnemonicInput)(
  ({ theme }: Props) => `

  .mnemonic-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    width: 100%;
    user-select: all;

  }

  .mnemonic-pill {
    width: 30%;
    margin-bottom: 8px;
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
