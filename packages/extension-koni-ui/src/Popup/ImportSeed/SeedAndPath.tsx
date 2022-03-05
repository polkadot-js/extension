/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { validateSeedV2 } from '@polkadot/extension-koni-ui/messaging';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@polkadot/extension-koni-ui/Popup/CreateAccount';
import { objectSpread } from '@polkadot/util';

import { AccountInfoEl, ButtonArea, Checkbox, Dropdown, InputWithLabel, NextStepButton, TextAreaWithLabel, Warning } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { Theme } from '../../types';

interface Props {
  className?: string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  onEvmAccountChange: (evmAccount: AccountInfo | null) => void;
  keyTypes: KeypairType[];
  onSelectAccountImported?: (keyTypes: KeypairType[]) => void
  type: KeypairType;
  account: AccountInfo | null;
  name: string | null;
  evmName: string | null;
}

function SeedAndPath ({ account, className, evmName, keyTypes, name, onAccountChange, onEvmAccountChange, onNextStep, onSelectAccountImported, type }: Props): React.ReactElement {
  const { t } = useTranslation();
  const genesisOptions = useGenesisHashOptions();
  const [address, setAddress] = useState('');
  const [evmAddress, setEvmAddress] = useState<null | string>(null);
  const [seed, setSeed] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [advanced, setAdvances] = useState(false);
  const [error, setError] = useState('');
  const [genesis, setGenesis] = useState('');
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const [isNormalAccountSelected, setNormalAccountSelected] = useState(false);
  const [isEvmAccountSelected, setEvmAccountSelected] = useState(false);
  const dep = keyTypes.toString();

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);

      return;
    }

    const suri = `${seed || ''}${path || ''}`;

    validateSeedV2(seed, keyTypes)
      .then(({ addressMap, seed }) => {
        const address = addressMap[SUBSTRATE_ACCOUNT_TYPE];
        const evmAddress = addressMap[EVM_ACCOUNT_TYPE];

        setAddress(address);
        setEvmAddress(addressMap[EVM_ACCOUNT_TYPE]);
        setError('');
        onAccountChange(
          objectSpread<AccountInfo>({}, { address, suri, genesis, type })
        );

        onEvmAccountChange(
          objectSpread<AccountInfo>({}, { address: evmAddress, suri, genesis, EVM_ACCOUNT_TYPE })
        );
      })
      .catch(() => {
        setAddress('');
        setEvmAddress('');
        onAccountChange(null);
        setError(path
          ? t<string>('Invalid mnemonic seed or derivation path')
          : t<string>('Invalid mnemonic seed')
        );
      });
  }, [t, genesis, seed, path, onAccountChange, type, dep]);

  const _onSelectNormalAccount = useCallback(() => {
    if (!isNormalAccountSelected) {
      if (isEvmAccountSelected) {
        onSelectAccountImported && onSelectAccountImported([SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE]);
      } else {
        onSelectAccountImported && onSelectAccountImported([SUBSTRATE_ACCOUNT_TYPE]);
      }
    } else {
      if (isEvmAccountSelected) {
        onSelectAccountImported && onSelectAccountImported([EVM_ACCOUNT_TYPE]);
      } else {
        onSelectAccountImported && onSelectAccountImported([]);
      }
    }

    setNormalAccountSelected(!isNormalAccountSelected);
  }, [isEvmAccountSelected, isNormalAccountSelected, onSelectAccountImported]);

  const _onSelectEvmAccount = useCallback(() => {
    if (!isEvmAccountSelected) {
      if (isNormalAccountSelected) {
        onSelectAccountImported && onSelectAccountImported([SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE]);
      } else {
        onSelectAccountImported && onSelectAccountImported([EVM_ACCOUNT_TYPE]);
      }
    } else {
      if (isNormalAccountSelected) {
        onSelectAccountImported && onSelectAccountImported([SUBSTRATE_ACCOUNT_TYPE]);
      } else {
        onSelectAccountImported && onSelectAccountImported([]);
      }
    }

    setEvmAccountSelected(!isEvmAccountSelected);
  }, [isEvmAccountSelected, isNormalAccountSelected, onSelectAccountImported]);

  const _onToggleAdvanced = useCallback(() => {
    setAdvances(!advanced);
  }, [advanced]);

  return (
    <div className={className}>
      <div className='account-info-wrapper'>
        <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} seed-and-path-wrapper`}>
          <div className='account-info-item'>
            <Checkbox
              checked={isNormalAccountSelected}
              label={''}
              onChange={_onSelectNormalAccount}
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
              checked={isEvmAccountSelected}
              label={''}
              onChange={_onSelectEvmAccount}
            />
            <AccountInfoEl
              address={evmAddress}
              className='account-info'
              genesisHash={account?.genesis}
              name={evmName}
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
          <Dropdown
            className='seed-and-path__genesis-selection'
            label={t<string>('Network')}
            onChange={setGenesis}
            options={genesisOptions}
            value={genesis}
          />
          <div
            className='seed-and-path__advanced-toggle'
            onClick={_onToggleAdvanced}
          >
            <FontAwesomeIcon
              color='#888888'
              // @ts-ignore
              icon={advanced ? faChevronDown : faChevronRight}
            />
            <span>{t<string>('advanced')}</span>
          </div>
          { advanced && (
            <InputWithLabel
              className='derivationPath'
              isError={!!path && !!error}
              label={t<string>('derivation path')}
              onChange={setPath}
              value={path || ''}
            />
          )}
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
          isDisabled={(!address && !evmAddress) || !!error || !seed || (!isNormalAccountSelected && !isEvmAccountSelected)}
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
