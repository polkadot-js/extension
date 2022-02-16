// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import AccountInfo from '@polkadot/extension-koni-ui/components/AccountInfo';
import ButtonArea from '@polkadot/extension-koni-ui/components/ButtonArea';
import NextStepButton from '@polkadot/extension-koni-ui/components/NextStepButton';
import Name from '@polkadot/extension-koni-ui/partials/Name';
import Password from '@polkadot/extension-koni-ui/partials/Password';
import { Theme, ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props {
  buttonLabel?: string;
  isBusy: boolean;
  onBackClick?: () => void;
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
  onNameChange?: (name: string) => void;
  className?: string;
  children?: any;
  address?: string | null;
  genesis?: string | null;
  onPasswordChange?: (password: string) => void;
}

function AccountNamePasswordCreation ({ address, buttonLabel, children, className, genesis, isBusy, onBackClick, onCreate, onNameChange }: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const _onCreate = useCallback(
    () => {
      name && password && onCreate(name, password);
    },
    [name, password, onCreate]
  );

  const _onNameChange = useCallback(
    (name: string | null) => {
      onNameChange && onNameChange(name || '');
      setName(name);
    },
    [onNameChange]
  );

  return (
    <>
      <div className={className}>
        <div className='account-info-wrapper'>
          <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} account-name-and-password-creation-wrapper`}>
            <AccountInfo
              address={address}
              genesisHash={genesis}
              name={name}
            />
            <div className={ children ? 'children-wrapper' : ''}>
              {children}
            </div>
            <Name
              isFocused
              onChange={_onNameChange}
            />
            <Password onChange={setPassword} />
          </div>
        </div>
        <ButtonArea className='kn-button-area'>
          <NextStepButton
            className='next-step-btn'
            data-button-action='add new root'
            isBusy={isBusy}
            isDisabled={!password || !name}
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
