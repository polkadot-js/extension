// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { AccountContext, AccountNamePasswordCreation, ActionContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { deriveAccount } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import SelectParent from './SelectParent';

interface Props {
  className?: string;
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

function Derive({ isLocked }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const { address: parentAddress } = useParams<AddressState>();
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | PathState>(null);
  const [name, setName] = useState<string | null>(null);
  const [parentPassword, setParentPassword] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const parentGenesis = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.genesisHash || null,
    [accounts, parentAddress]
  );

  const parentIsExternal = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.isExternal || 'false',
    [accounts, parentAddress]
  );

  const parentName = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.name || null,
    [accounts, parentAddress]
  );

  const _onCreate = useCallback(
    (name: string, password: string) => {
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
    },
    [account, onAction, parentAddress, parentGenesis, parentPassword]
  );

  const _onDerivationConfirmed = useCallback(({ account, parentPassword }: ConfirmState) => {
    setAccount(account);
    setParentPassword(parentPassword);
  }, []);

  const goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);

  return (
    <>
      <HeaderWithSteps
        step={step}
        text={t<string>('Derive sub-account')}
        total={2}
        withBackArrow
      />
      {!account && step === 1 && (
        <SelectParent
          externalString={parentIsExternal}
          isLocked={isLocked}
          onDerivationConfirmed={_onDerivationConfirmed}
          onNextStep={_onNextStep}
          parentAddress={parentAddress}
          parentGenesis={parentGenesis}
        />
      )}
      {account && step === 2 && (
        <AccountNamePasswordCreation
          address={account.address}
          buttonLabel={t<string>('Create')}
          genesisHash={parentGenesis}
          isBusy={isBusy}
          isDeriving
          onBackClick={goTo(`/account/edit-menu/${parentAddress}?isExternal=${parentIsExternal?.toString()}`)}
          onCreate={_onCreate}
          onNameChange={setName}
          parentName={parentName}
        />
      )}
    </>
  );
}

export default React.memo(Derive);
