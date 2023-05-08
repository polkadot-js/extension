// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';

import useToast from "@polkadot/extension-ui/hooks/useToast";

import { AccountContext, ActionContext, ScrollWrapper } from '../../components';
import AccounCreationSuccess from "../../components/AccounCreationSuccess";
import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation';
import { ALEPH_ZERO_GENESIS_HASH } from '../../constants';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import { DEFAULT_TYPE } from '../../util/defaultType';
import SeedAndPath from './SeedAndPath';

export interface AccountInfo {
  address: string;
  genesis?: string;
  suri: string;
}

function ImportSeed(): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [step, setStep] = useState<number>(1);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [path, setPath] = useState<string | null>(null);
  const [genesis, setGenesis] = useState(ALEPH_ZERO_GENESIS_HASH);
  const [seed, setSeed] = useState<string | null>(null);
  const chain = useMetadata(account && account.genesis, true);
  const { show } = useToast();

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  useEffect((): void => {
    setType(chain && chain.definition.chainType === 'ethereum' ? 'ethereum' : DEFAULT_TYPE);
  }, [chain]);

  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && account) {
        setIsBusy(true);

        createAccountSuri(name, password, account.suri, type, account.genesis)
          .then(() => setStep((currentStep) => currentStep + 1))
          .catch((error): void => {
            setIsBusy(false);
            show(t('Account creation was not successful.'), 'critical');
            console.error(error);
          });
      }
    },
    [account, type, show, t]
  );

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);

  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);

  const _onChangeNetwork = useCallback((newGenesisHash: string) => setGenesis(newGenesisHash), []);

  const isLastStep = step === 3;

  return (
    <ScrollWrapper>
      {isLastStep || (
        <HeaderWithSteps
          step={step}
          text={t<string>('Import existing account')}
          total={2}
          withBackArrow
          withBackdrop
        />
      )}
      {step === 1 && (
        <SeedAndPath
          genesis={genesis}
          onAccountChange={setAccount}
          onNextStep={_onNextStep}
          path={path}
          seed={seed}
          setPath={setPath}
          setSeed={setSeed}
          type={type}
        />
      )}
      {step === 2 && (
        <AccountNamePasswordCreation
          address={account?.address}
          buttonLabel={t<string>('Import')}
          genesisHash={genesis}
          isBusy={isBusy}
          isImporting
          onBackClick={_onPreviousStep}
          onCreate={_onCreate}
          seed={seed}
          setGenesis={_onChangeNetwork}
        />
      )}
      {step === 3 && <AccounCreationSuccess />}
    </ScrollWrapper>
  );
}

export default ImportSeed;
