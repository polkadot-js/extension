/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { validateSeedV2 } from '@polkadot/extension-koni-ui/messaging';
import { Password } from '@polkadot/extension-koni-ui/partials';
import { EVM_ACCOUNT_TYPE } from '@polkadot/extension-koni-ui/Popup/CreateAccount';
import { objectSpread } from '@polkadot/util';

import { AccountInfoEl, ButtonArea, NextStepButton, TextAreaWithLabel, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Theme } from '../../types';

interface Props {
  className?: string;
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
  onAccountChange: (account: AccountInfo | null) => void;
  keyTypes: KeypairType[];
  type: KeypairType;
  account: AccountInfo | null;
  name: string;
}

function SeedAndPath ({ account, className, keyTypes, name, onAccountChange, onCreate, type }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [seed, setSeed] = useState<string | null>(null);
  const [error, setError] = useState('');
  const genesis = '';
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const dep = keyTypes.toString();
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);

      return;
    }

    const suri = `${seed || ''}`;

    validateSeedV2(seed, keyTypes)
      .then(({ addressMap, seed }) => {
        const address = addressMap[EVM_ACCOUNT_TYPE];

        setAddress(address);
        setError('');
        onAccountChange(
          objectSpread<AccountInfo>({}, { address, suri, genesis, EVM_ACCOUNT_TYPE })
        );
      })
      .catch(() => {
        setAddress('');
        onAccountChange(null);
        setError(t<string>('Invalid mnemonic seed'));
      });
  }, [t, genesis, seed, onAccountChange, type, dep]);

  const _onCreate = useCallback(
    () => {
      name && password && onCreate(name, password);
    },
    [name, password, onCreate]
  );

  return (
    <div className={className}>
      <div className='account-info-wrapper'>
        <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} seed-and-path-wrapper`}>
          <AccountInfoEl
            address={address}
            className='account-info'
            genesisHash={account?.genesis}
            name={`${name} - EVM`}
            type={EVM_ACCOUNT_TYPE}
          />

          <TextAreaWithLabel
            className='seed-and-path__seed-input'
            isError={!!error}
            isFocused
            label={t<string>('existing 12 or 24-word private key')}
            onChange={setSeed}
            rowsCount={2}
            value={seed || ''}
          />
          {!!error && !seed && (
            <Warning
              className='seed-and-path__error'
              isBelowInput
              isDanger
            >
              {t<string>('Mnemonic needs to contain 12, 15, 18, 21, 24 words')}
            </Warning>
          )}
          {!!error && !!seed && (
            <Warning
              isDanger
            >
              {error}
            </Warning>
          )}
          <Password onChange={setPassword} />
        </div>
      </div>
      <ButtonArea>
        <NextStepButton
          className='next-step-btn'
          isDisabled={!address || !!error || !seed}
          onClick={_onCreate}
        >
          {t<string>('Add the account with the private key')}
        </NextStepButton>
      </ButtonArea>
    </div>
  );
}

export default styled(SeedAndPath)(({ theme }: ThemeProps) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: auto;

  .seed-and-path__advanced-toggle {
    color: ${theme.textColor};
    cursor: pointer;
    line-height: ${theme.lineHeight};
    letter-spacing: 0.04em;
    opacity: 0.65;
    text-transform: uppercase;
    margin-top: 13px;

    > span {
      font-size: ${theme.inputLabelFontSize};
      line-height: 26px;
      margin-left: .5rem;
      vertical-align: middle;
      color: ${theme.textColor2};
      font-weight: 500;
    }
  }

  .seed-and-path-wrapper {
    padding-bottom: 15px;
  }

  .next-step-btn {
    > .children {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
  }

  .seed-and-path__genesis-selection {
    line-height: 26px;
    label {
      color: ${theme.textColor2};
    }
  }

  .seed-and-path__seed-input {
    margin-bottom: 16px;
    color: ${theme.textColor2};
    textarea {
      height: 80px;
      margin-top: 4px;
    }
  }

  .account-info-item__radio-btn {
    padding-right: 10px;
  }

  .seed-and-path__error {
    margin-bottom: 1rem;
  }

  .account-info-item {
    display: flex;
    align-items: center;
  }

  .account-info {
    width: 100%;
  }
`);
