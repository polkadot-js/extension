// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import AccountNamePasswordCreation from '@polkadot/extension-koni-ui/components/AccountNamePasswordCreation';
import HeaderWithSteps from '@polkadot/extension-koni-ui/partials/HeaderWithSteps';

import { AccountContext, ActionContext } from '../../components';
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
  const { address: parentAddress } = useParams<AddressState>();
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | PathState>(null);
  const [parentPassword, setParentPassword] = useState<string | null>(null);

  const parentGenesis = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.genesisHash || null,
    [accounts, parentAddress]
  );

  const _onCreate = useCallback((name: string, password: string) => {
    if (!account || !name || !password || !parentPassword) {
      return;
    }

    setIsBusy(true);
    deriveAccountV2(parentAddress, account.suri, parentPassword, name, password, parentGenesis)
      .then(() => onAction('/'))
      .catch((error): void => {
        setIsBusy(false);
        console.error(error);
      });
  }, [account, onAction, parentAddress, parentGenesis, parentPassword]);

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
        onBackClick={_onBackClick}
        step={account ? 2 : 1}
        text={t<string>('Add new account')}
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
          <AccountNamePasswordCreation
            address={account?.address}
            buttonLabel={t<string>('Create derived account')}
            className='koni-import-seed-content'
            genesis={parentGenesis}
            isBusy={isBusy}
            onBackClick={_onBackClick}
            onCreate={_onCreate}
          />
        </>
      )}
    </>
  );
}

export default styled(React.memo(Derive))`
`;
