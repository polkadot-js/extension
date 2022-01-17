// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, {useCallback, useState} from 'react';

import AccountInfo from "@polkadot/extension-koni-ui/components/AccountInfo";
import styled from "styled-components";
import ButtonArea from "@polkadot/extension-koni-ui/components/ButtonArea";
import KoniNextStepButton from "@polkadot/extension-koni-ui/components/NextStepButton";
import Name from "@polkadot/extension-koni-ui/partials/Name";
import Password from "@polkadot/extension-koni-ui/partials/Password";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";

interface Props {
  buttonLabel: string;
  isBusy: boolean;
  onBackClick: () => void;
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
  onNameChange: (name: string) => void;
  className?: string;
  children?: any;
  address?: any;
  genesis?: any;
}


function AccountNamePasswordCreation ({ buttonLabel, isBusy, onBackClick, onCreate, onNameChange, address, genesis, className, children }: Props): React.ReactElement<Props> {
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

          <AccountInfo address={address} genesisHash={genesis} name={name} className='account-info'>
            <div className={ children? 'children-wrapper': ''}>
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
            data-button-action='add new root'
            isBusy={isBusy}
            isDisabled={!password || !name}
            onClick={_onCreate}
            className='next-step-btn'
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
