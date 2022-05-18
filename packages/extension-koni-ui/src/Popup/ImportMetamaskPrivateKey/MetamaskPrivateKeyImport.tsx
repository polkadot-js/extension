// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import { validateMetamaskPrivateKeyV2 } from '@subwallet/extension-koni-ui/messaging';
import { Password } from '@subwallet/extension-koni-ui/partials';
import { EVM_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/Popup/CreateAccount';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

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

interface PrivateKeyInfoType {
  address: string;
  error: string;
}

function MetamaskPrivateKeyImport ({ account, className, keyTypes, name, onAccountChange, onCreate, type }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [{ address, error }, setPrivateKeyInfo] = useState<PrivateKeyInfoType>({ address: '', error: '' });
  const [seed, setSeed] = useState<string | null>(null);
  const [autoCorrectedSeed, setAutoCorrectedSeed] = useState<string | null>(null);
  const genesis = '';
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const [password, setPassword] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    let isSync = true;

    if (!seed) {
      onAccountChange(null);

      return;
    }

    const suri = `${seed || ''}`;

    validateMetamaskPrivateKeyV2(seed, keyTypes)
      .then(({ addressMap, autoAddPrefix }) => {
        if (isSync) {
          const address = addressMap[EVM_ACCOUNT_TYPE];

          if (autoAddPrefix) {
            setAutoCorrectedSeed(`0x${suri}`);
          }

          setPrivateKeyInfo({ address, error: '' });
          onAccountChange(
            objectSpread<AccountInfo>({}, { address, suri, genesis, EVM_ACCOUNT_TYPE })
          );
        }
      })
      .catch(() => {
        if (isSync) {
          onAccountChange(null);
          setPrivateKeyInfo({ address: '', error: t<string>('Not a valid private key') });
        }
      });

    return () => {
      isSync = false;
    };
  }, [t, genesis, seed, onAccountChange, type, keyTypes]);

  const _onCreate = useCallback(
    () => {
      name && password && onCreate(name, password);
    },
    [name, password, onCreate]
  );

  const _onChange = useCallback(
    (password: string | null) => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setPassword(password);
    },
    []
  );

  const _onFocusPasswordInput = useCallback(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const _onFocusRepeatPasswordInput = useCallback(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const _onScrollToError = useCallback(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const onChangeSeed = useCallback((text: string | null) => {
    setAutoCorrectedSeed(null);
    setSeed(text);
  }, []);

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
            label={t<string>('private key')}
            onChange={onChangeSeed}
            rowsCount={2}
            value={autoCorrectedSeed || seed || ''}
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
          <Password
            onChange={_onChange}
            onFocusPasswordInput={_onFocusPasswordInput}
            onFocusRepeatPasswordInput={_onFocusRepeatPasswordInput}
            onScrollToError={_onScrollToError}
          />
        </div>
      </div>
      <ButtonArea>
        <NextStepButton
          className='next-step-btn'
          isDisabled={!address || !!error || !seed}
          onClick={_onCreate}
        >
          {t<string>('Add the account with the supplied private key')}
        </NextStepButton>
      </ButtonArea>
      <div ref={ref} />
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
  }

  .account-info {
    width: 100%;
  }
`);
