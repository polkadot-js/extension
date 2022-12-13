// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Name } from '@subwallet/extension-koni-ui/partials';
import Password from '@subwallet/extension-koni-ui/partials/Password';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/Popup/CreateAccount';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { ThemeContext } from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

import { AccountInfoEl, ButtonArea, Checkbox, NextStepButton } from './index';

interface Props {
  address?: string | null;
  buttonLabel?: string;
  checked?: boolean | null;
  children?: any;
  className?: string;
  evmAddress?: string | null;
  isBusy: boolean;
  keyTypes: KeypairType[];
  name: string;
  onCreate: (name: string, password?: string) => void | Promise<void | boolean>;
  onPasswordChange?: (password: string | null) => void;
  renderErrors?: () => JSX.Element;
  selectedGenesis?: string;
  setChecked?: (val: boolean) => void;
  setName?: (val: string) => void;
}

function AccountNamePasswordCreation ({ address,
  buttonLabel,
  checked = null,
  children,
  className,
  evmAddress,
  isBusy,
  keyTypes,
  name,
  onCreate,
  onPasswordChange,
  renderErrors,
  selectedGenesis,
  setChecked,
  setName }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [password, setPassword] = useState<string | null>(null);

  const hasMasterPassword = useSelector((state: RootState) => state.keyringState.hasMasterPassword);

  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const _onCreate = useCallback(
    () => {
      name && (hasMasterPassword || (!hasMasterPassword && password)) && onCreate(name, password || '');
    },
    [name, password, onCreate, hasMasterPassword]
  );

  const handleChangePassword = useCallback((val: string | null) => {
    setPassword(val);
    onPasswordChange && onPasswordChange(val);
  }, [onPasswordChange]);

  const onChangeName = useCallback((val: string | null) => {
    setName && setName(val || '');
  }, [setName]);

  return (
    <>
      <div className={className}>
        <div className='account-info-wrapper'>
          <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} account-name-and-password-creation-wrapper`}>
            {keyTypes.includes(SUBSTRATE_ACCOUNT_TYPE) &&
              <AccountInfoEl
                address={address}
                genesisHash={selectedGenesis}
                name={name}
              />
            }

            {keyTypes.includes(EVM_ACCOUNT_TYPE) &&
              <AccountInfoEl
                address={evmAddress}
                genesisHash={selectedGenesis}
                name={`${name} - EVM`}
                type={EVM_ACCOUNT_TYPE}
              />
            }
            <div className={ children ? 'children-wrapper' : ''}>
              {children}
            </div>
            {setName && (
              <Name
                className='name-margin-bottom'
                disabled={isBusy}
                isFocused
                onChange={onChangeName}
                value={name || ''}
              />
            )
            }
            {!hasMasterPassword && <Password
              disable={isBusy}
              onChange={handleChangePassword}
            />}
          </div>
        </div>
        {
          typeof checked === 'boolean' && setChecked && (
            <Checkbox
              checked={checked}
              label={t<string>('Auto connect to all DApps after importing')}
              onChange={setChecked}
            />
          )
        }
        {renderErrors && renderErrors()}
        <ButtonArea className='kn-button-area'>
          <NextStepButton
            className='next-step-btn'
            data-button-action='add new root'
            isBusy={isBusy}
            isDisabled={(!hasMasterPassword && !password) || !name}
            onClick={_onCreate}
          >
            {buttonLabel}
          </NextStepButton>
        </ButtonArea>
      </div>
    </>
  );
}

export default styled(AccountNamePasswordCreation)(({ theme }: ThemeProps) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: auto;

  .account-name-and-password-creation-wrapper {
    padding-bottom: 15px;
  }

  .children-wrapper {
    margin-top: 6px;
  }

  .next-step-btn > .children {
    display: flex;
    align-items: center;
    position: relative;
    justify-content: center;
  }
`);
