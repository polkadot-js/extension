// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { ActionContext, Address, Loading } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri, createSeed, flushAccountCache, getAccountCache, setAccountCache } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import AccountName from './AccountName';
import Mnemonic from './Mnemonic';

export default function CreateAccount (): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);

  useEffect((): void => {
    getAccountCache()
      .then((cachedAccount) => {
        if (cachedAccount?.address) {
          setAccount(cachedAccount);
        } else {
          createSeed()
            .then((account) => {
              setAccount(account);
              setAccountCache(account).catch((e) => console.error(e));
            })
            .catch((error: Error) => console.error(error));
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // FIXME Duplicated between here and Import.tsx
  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && account) {
        setIsBusy(true);

        createAccountSuri(name, password, account.seed)
          .then(() => {
            flushAccountCache().catch((e) => console.error(e));
            onAction('/');
          })
          .catch((error: Error): void => {
            setIsBusy(false);
            console.error(error);
          });
      }
    },
    [account, onAction]
  );

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);
  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);
  const _onCancel = useCallback(() => {
    flushAccountCache().catch((e) => console.error(e));
    onAction('/', { resetCachedAccount: true });
  }
  , [onAction]);

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
