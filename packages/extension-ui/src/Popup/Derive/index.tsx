// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { AccountContext, ActionContext, Address, BackButton, ButtonArea, NextStepButton, VerticalSpace } from '../../components';
import { deriveAccount } from '../../messaging';
import { HeaderWithSteps, Name, Password } from '../../partials';
import { SelectParent } from './SelectParent';

interface Props {
  isLocked?: boolean;
}

interface AddressState {
  address: string;
}

interface PathState extends AddressState {
  suri: string;
}

interface ConfirmState {
  account: PathState;
  parentPassword: string;
}

function Derive ({ isLocked }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const { address: parentAddress } = useParams<AddressState>();
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | PathState>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [parentPassword, setParentPassword] = useState<string | null>(null);

  const parentGenesis = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.genesisHash || null,
    [accounts, parentAddress]
  );

  const _onCreate = useCallback(() => {
    if (!account || !name || !password || !parentPassword) {
      return;
    }

    setIsBusy(true);
    deriveAccount(parentAddress, account.suri, parentPassword, name, password, parentGenesis)
      .then(() => onAction('/'))
      .catch((error): void => {
        setIsBusy(false);
        console.error(error);
      });
  }, [account, name, password, onAction, parentAddress, parentGenesis, parentPassword]);

  const _onDerivationConfirmed = useCallback(({ account, parentPassword }: ConfirmState) => {
    setAccount(account);
    setParentPassword(parentPassword);
  }, []);

  const _onBackClick = useCallback(() => {
    setAccount(null);
  }, []);

  return (
    <>
      <HeaderWithSteps
        step={account ? 2 : 1}
        text='Add new account:&nbsp;'
      />
      {!account && (
        <SelectParent
          isLocked={isLocked}
          onDerivationConfirmed={_onDerivationConfirmed}
          parentAddress={parentAddress}
          parentGenesis={parentGenesis}
        />
      )}
      {account && (
        <>
          <div>
            <Address
              address={account.address}
              genesisHash={parentGenesis}
              name={name}
            />
          </div>
          <Name
            isFocused
            onChange={setName}
          />
          <Password onChange={setPassword} />
          <VerticalSpace/>
          <ButtonArea>
            <BackButton onClick={_onBackClick}/>
            <NextStepButton
              isBusy={isBusy}
              isDisabled={!password}
              onClick={_onCreate}
            >
              Create derived account
            </NextStepButton>
          </ButtonArea>
        </>
      )}
    </>
  );
}

export default React.memo(Derive);
