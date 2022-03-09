/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import React, { useContext, useEffect, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { ethereumChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { validateSeedV2 } from '@polkadot/extension-koni-ui/messaging';
import { EVM_ACCOUNT_TYPE } from '@polkadot/extension-koni-ui/Popup/CreateAccount';
import { objectSpread } from '@polkadot/util';

import { AccountInfoEl, ButtonArea, Dropdown, InputWithLabel, NextStepButton, Warning } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { Theme } from '../../types';

interface Props {
  className?: string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  type: KeypairType;
  account: AccountInfo | null;
  name: string | null;
}

function MetamaskPrivateKeyImport ({ account, className, name, onAccountChange, onNextStep, type }: Props): React.ReactElement {
  const { t } = useTranslation();
  const genesisOptions = useGenesisHashOptions().filter((network) => {
    return ethereumChains.indexOf(network.networkKey) > -1 || network.networkKey === 'all';
  });
  const [address, setAddress] = useState('');
  const [seed, setSeed] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [genesis, setGenesis] = useState('');
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);

      return;
    }

    const suri = `${seed || ''}`;

    validateSeedV2(seed, [EVM_ACCOUNT_TYPE])
      .then(({ addressMap, seed }) => {
        const address = addressMap[EVM_ACCOUNT_TYPE];

        setAddress(address);
        setError('');
        onAccountChange(
          objectSpread<AccountInfo>({}, { address, suri, genesis, type })
        );
      })
      .catch(() => {
        setAddress('');
        onAccountChange(null);
        setError(t<string>('Invalid private key')
        );
      });
  }, [t, genesis, seed, onAccountChange, type]);

  return (
    <div className={className}>
      <div className='account-info-wrapper'>
        <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} seed-and-path-wrapper`}>
          <div className='account-info-item'>
            <AccountInfoEl
              address={address}
              className='account-info'
              genesisHash={account?.genesis}
              name={name}
            />
          </div>

          <InputWithLabel
            className='seed-and-path__seed-input'
            isError={!!error}
            isFocused
            label={t<string>('Metamask private key')}
            onChange={setSeed}
            value={seed || ''}
          />
          {!!error && !seed && (
            <Warning
              className='seed-and-path__error'
              isBelowInput
              isDanger
            >
              {t<string>('Private key needs to start with 0x and 64 keys')}
            </Warning>
          )}
          <Dropdown
            className='seed-and-path__genesis-selection'
            label={t<string>('Network')}
            onChange={setGenesis}
            options={genesisOptions}
            value={genesis}
          />
          {!!error && !!seed && (
            <Warning
              isDanger
            >
              {error}
            </Warning>
          )}
        </div>
      </div>
      <ButtonArea>
        <NextStepButton
          className='next-step-btn'
          isDisabled={(!address) || !!error || !seed}
          onClick={onNextStep}
        >
          {t<string>('Next Step')}
        </NextStepButton>
      </ButtonArea>
    </div>
  );
}

export default styled(MetamaskPrivateKeyImport)(({ theme }: ThemeProps) => `
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
