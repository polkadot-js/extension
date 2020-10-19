// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { AccountCachedContext, ActionContext, Address, Loading } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri, createSeed, flushAccountCache, setAccountCache } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import AccountName from './AccountName';
import Mnemonic from './Mnemonic';

export default function CreateAccount (): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);
  const { accountCache, resetCache } = useContext(AccountCachedContext);

  useEffect((): void => {
    if (accountCache?.address) {
      setAccount(accountCache);
    } else {
      createSeed()
        .then((account) => {
          setAccount(account);
          setAccountCache(account).catch((e) => console.error(e));
        })
        .catch((error: Error) => console.error(error));
    }
  }, [accountCache]);

  // FIXME Duplicated between here and Import.tsx
  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && account) {
        setIsBusy(true);

        createAccountSuri(name, password, account.seed)
          .then(() => {
            resetCache();
            onAction('/');
          })
          .catch((error: Error): void => {
            setIsBusy(false);
            console.error(error);
          });
      }
    },
    [account, onAction, resetCache]
  );

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);
  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);
  const _onCancel = useCallback(() => {
    resetCache();
    onAction('/');
  }
  , [onAction, resetCache]);

  return (
    <>
      <HeaderWithSteps
        onCancel={_onCancel}
        step={step}
        text={t<string>('Create an account')}
      />
      <Loading>
        <div>
          <Address
            address={account?.address}
            name={name}
          />
        </div>
        {account && (
          step === 1
            ? (
              <Mnemonic
                onNextStep={_onNextStep}
                seed={account.seed}
              />
            )
            : (
              <AccountName
                address={account.address}
                isBusy={isBusy}
                onBackClick={_onPreviousStep}
                onCreate={_onCreate}
              />
            )
        )}
      </Loading>
    </>
  );
}
