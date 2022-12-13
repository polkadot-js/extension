/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import { validateSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/Popup/CreateAccount';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { objectSpread } from '@polkadot/util';

import { AccountInfoEl, ButtonArea, Checkbox, NextStepButton, TextAreaWithLabel, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Theme } from '../../types';

interface Props {
  account: AccountInfo | null;
  className?: string;
  evmAccount: AccountInfo | null;
  isConnectWhenImport: boolean;
  keyTypes: KeypairType[];
  name: string | null;
  onAccountChange: (account: AccountInfo | null) => void;
  onConnectWhenImport: (isConnectWhenImport: boolean) => void;
  onEvmAccountChange: (evmAccount: AccountInfo | null) => void;
  onNextStep: () => void;
  onSelectAccountImported?: (keyTypes: KeypairType[]) => void
  setSelectedGenesis: (genesis: string) => void;
}

function SeedAndPath ({ account, className, evmAccount, isConnectWhenImport, keyTypes, name, onAccountChange, onConnectWhenImport, onEvmAccountChange, onNextStep, onSelectAccountImported }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [evmAddress, setEvmAddress] = useState<null | string>(null);
  const [seed, setSeed] = useState<string | null>(null);
  const [error, setError] = useState('');
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const dep = keyTypes.toString();

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);
      onEvmAccountChange(null);

      return;
    }

    const suri = `${seed || ''}`;

    validateSeedV2(seed, keyTypes)
      .then(({ addressMap, seed }) => {
        const address = addressMap[SUBSTRATE_ACCOUNT_TYPE];
        const evmAddress = addressMap[EVM_ACCOUNT_TYPE];

        if (address) {
          setAddress(address);
        }

        if (evmAddress) {
          setEvmAddress(evmAddress);
        }

        onAccountChange(
          objectSpread<AccountInfo>({}, { address, suri, type: SUBSTRATE_ACCOUNT_TYPE })
        );

        onEvmAccountChange(
          objectSpread<AccountInfo>({}, { address: evmAddress, suri, type: EVM_ACCOUNT_TYPE })
        );

        setError('');
      })
      .catch(() => {
        setAddress('');
        setEvmAddress('');
        onAccountChange(null);
        onEvmAccountChange(null);
        setError(t<string>('Invalid mnemonic seed'));
      });
  }, [t, seed, onAccountChange, onEvmAccountChange, dep]);

  const _onSelectAccountType = useCallback((type: KeypairType) => {
    if (!onSelectAccountImported) {
      return;
    }

    const result = [...keyTypes];
    const exist = keyTypes.find((val) => val === type);

    if (exist) {
      onSelectAccountImported(result.filter((val) => val !== type));
    } else {
      result.push(type);
      onSelectAccountImported(result);
    }
  }, [onSelectAccountImported, keyTypes]);

  const _onSelectSubstrateAccount = useCallback(() => {
    _onSelectAccountType(SUBSTRATE_ACCOUNT_TYPE);
  }, [_onSelectAccountType]);

  const _onSelectEvmAccount = useCallback(() => {
    _onSelectAccountType(SUBSTRATE_ACCOUNT_TYPE);
  }, [_onSelectAccountType]);

  return (
    <div className={className}>
      <div className='account-info-wrapper'>
        <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} seed-and-path-wrapper`}>
          <div className='account-info-item'>
            <Checkbox
              checked={keyTypes.includes(SUBSTRATE_ACCOUNT_TYPE)}
              label=''
              onChange={_onSelectSubstrateAccount}
            />
            <AccountInfoEl
              address={address}
              className='account-info'
              genesisHash={account?.genesis}
              name={name}
            />
          </div>

          <div className='account-info-item'>
            <Checkbox
              checked={keyTypes.includes(EVM_ACCOUNT_TYPE)}
              label=''
              onChange={_onSelectEvmAccount}
            />
            <AccountInfoEl
              address={evmAddress}
              className='account-info'
              genesisHash={evmAccount?.genesis}
              name={`${name || '<unknown>'} - EVM`}
              type={EVM_ACCOUNT_TYPE}
            />
          </div>

          <TextAreaWithLabel
            className='seed-and-path__seed-input'
            isError={!!error}
            isFocused
            label={t<string>('existing 12 or 24-word mnemonic seed')}
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
              className='seed-and-path__error'
              isDanger
            >
              {error}
            </Warning>
          )}
          <Checkbox
            checked={isConnectWhenImport}
            label={t<string>('Auto connect to all DApps after importing')}
            onChange={onConnectWhenImport}
          />
        </div>
      </div>
      <ButtonArea>
        <NextStepButton
          className='next-step-btn'
          isDisabled={(!address && !evmAddress) || !!error || !seed}
          onClick={onNextStep}
        >
          {t<string>('Next Step')}
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
    padding-bottom: 5px;
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
    margin-bottom: 10px;
    label {
      color: ${theme.textColor2};
    }
  }

  .seed-and-path__seed-input {
    margin-bottom: 10px;
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
    margin-bottom: 10px;
  }

  .account-info-item {
    display: flex;
    align-items: center;
    position: relative;

    .account-info-banner.account-info-chain {
      right: 0;
    }
  }

  .account-info {
    width: 100%;
  }
`);
