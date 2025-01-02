// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { AccountContext, AccountNamePasswordCreation, ActionContext, Address } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { deriveAccount } from '../../messaging.js';
import { HeaderWithSteps } from '../../partials/index.js';
import SelectParent from './SelectParent.js';

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
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const { address: parentAddress } = useParams<AddressState>();
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | PathState>(null);
  const [name, setName] = useState<string | null>(null);
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
    deriveAccount(parentAddress, account.suri, parentPassword, name, password, parentGenesis)
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
        step={account ? 2 : 1}
        text={t('Add new account')}
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
          <AccountNamePasswordCreation
            buttonLabel={t('Create derived account')}
            isBusy={isBusy}
            onBackClick={_onBackClick}
            onCreate={_onCreate}
            onNameChange={setName}
          />
        </>
      )}
    </>
  );
}

export default React.memo(Derive);
