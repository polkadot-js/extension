// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import AccountInfo from '@polkadot/extension-koni-ui/components/AccountInfo';
import ButtonArea from '@polkadot/extension-koni-ui/components/ButtonArea';
import KoniNextStepButton from '@polkadot/extension-koni-ui/components/NextStepButton';
import Name from '@polkadot/extension-koni-ui/partials/Name';
import Password from '@polkadot/extension-koni-ui/partials/Password';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props {
  buttonLabel: string;
  isBusy: boolean;
  onBackClick: () => void;
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
  onNameChange: (name: string) => void;
  className?: string;
  children?: any;
  address?: string;
  genesis?: string;
}

function AccountNamePasswordCreation ({ address, buttonLabel, children, className, genesis, isBusy, onBackClick, onCreate, onNameChange }: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const _onCreate = useCallback(
    () => {
      name && password && onCreate(name, password);
    },
    [name, password, onCreate]
  );

  const _onNameChange = useCallback(
    (name: string | null) => {
      onNameChange(name || '');
      setName(name);
    },
    [onNameChange]
  );

  return (
    <>
      <div className={className}>
        <div className='account-info-wrapper'>

          <AccountInfo
            address={address}
            className='account-info'
            genesisHash={genesis}
            name={name}
          >
            <div className={ children ? 'children-wrapper' : ''}>
              {children}
            </div>
            <Name
              isFocused
              onChange={_onNameChange}
            />
            <Password onChange={setPassword} />
          </AccountInfo>
        </div>
        <ButtonArea className='kn-button-area'>
          <KoniNextStepButton
            className='next-step-btn'
            data-button-action='add new root'
            isBusy={isBusy}
            isDisabled={!password || !name}
            onClick={_onCreate}
          >
            {buttonLabel}
          </KoniNextStepButton>
        </ButtonArea>
      </div>
    </>
  );
}

export default styled(AccountNamePasswordCreation)(({ theme }: ThemeProps) => `
  padding: 25px 15px 15px;
  flex: 1;
  margin-top: -25px;
  overflow-y: auto;
  .account-info-wrapper {
  }

  // .create-account-network-select label {
  //   color: ${theme.textColor2};
  //   font-weight: 500;
  // }

  .account-info {
    padding-bottom: 15px;
  }

  .children-wrapper {
    margin-top: 6px;
  }

  .next-step-btn {
    > .children {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
  }
`);
