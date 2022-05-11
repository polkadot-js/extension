// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import HeaderWithSteps from '@subwallet/extension-koni-ui/partials/HeaderWithSteps';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/Popup/CreateAccount';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { AccountContext, AccountNamePasswordCreation, ActionContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { deriveAccountV2 } from '../../messaging';
import SelectParent from './SelectParent';

interface Props {
  isLocked?: boolean;
  className?: string;
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

function Derive ({ className, isLocked }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const { address } = useParams<AddressState>();
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | PathState>(null);
  const [parentPassword, setParentPassword] = useState<string | null>(null);
  const [isConnectWhenDerive, setConnectWhenDerive] = useState(true);
  const accountsWithoutAll = accounts.filter((acc: { address: string; }) => acc.address !== 'ALL');
  const accountsWithoutEtheriumType = accountsWithoutAll.filter((acc) => acc.type !== EVM_ACCOUNT_TYPE);
  const name = `Account ${accountsWithoutAll.length + 1}`;
  const parentAccount = accounts.find((a) => a.address === address);
  let parentAddress: string;

  if (parentAccount && parentAccount.type === EVM_ACCOUNT_TYPE) {
    parentAddress = accountsWithoutEtheriumType[0].address;
  } else {
    parentAddress = address;
  }

  const parentGenesis = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.genesisHash || null,
    [accounts, parentAddress]
  );

  const _onCreate = useCallback((name: string, password: string) => {
    if (!account || !name || !password || !parentPassword) {
      return;
    }

    setIsBusy(true);
    deriveAccountV2(parentAddress, account.suri, parentPassword, name, password, parentGenesis, isConnectWhenDerive)
      .then(() => {
        window.localStorage.setItem('popupNavigation', '/');
        onAction('/');
      })
      .catch((error): void => {
        setIsBusy(false);
        console.error(error);
      });
  }, [account, isConnectWhenDerive, onAction, parentAddress, parentGenesis, parentPassword]);

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
        isBusy={isBusy}
        onBackClick={_onBackClick}
        step={account ? 2 : 1}
        text={t<string>('Add new account')}
      />
      {!account && (
        <SelectParent
          isBusy={isBusy}
          isConnectWhenDerive={isConnectWhenDerive}
          isLocked={isLocked}
          onConnectWhenDerive={setConnectWhenDerive}
          onDerivationConfirmed={_onDerivationConfirmed}
          parentAddress={parentAddress}
          parentGenesis={parentGenesis}
          setBusy={setIsBusy}
        />
      )}
      {account && (
        <>
          <AccountNamePasswordCreation
            address={account?.address}
            buttonLabel={t<string>('Create derived account')}
            className='koni-import-seed-content'
            isBusy={isBusy}
            keyTypes={[SUBSTRATE_ACCOUNT_TYPE]}
            name={name}
            onCreate={_onCreate}
          />
        </>
      )}
    </>
  );
}

export default styled(React.memo(Derive))`
`;
