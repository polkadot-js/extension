// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import useToast from '@polkadot/extension-ui/hooks/useToast';

import { AccountContext, ActionContext, BottomWrapper, ScrollWrapper, Success } from '../../components';
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
  const { show } = useToast();

  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [step, setStep] = useState<number>(1);

  const chain = useMetadata(account && account.genesis, true);

  const type = chain && chain.definition.chainType === 'ethereum' ? 'ethereum' : DEFAULT_TYPE;

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

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

  const _onChangeNetwork = useCallback(
    (newGenesisHash: string) => {
      if (!account) {
        return;
      }

      setAccount({ ...account, genesis: newGenesisHash });
    },
    [account]
  );

  const genesisHash = account?.genesis || ALEPH_ZERO_GENESIS_HASH;

  const isLastStep = step === 3;

  return (
    <>
      {isLastStep || (
        <HeaderWithSteps
          step={step}
          text={t<string>('Import existing account')}
          total={2}
        />
      )}
      <StyledScrollWrapper>
        {step === 1 && (
          <SeedAndPath
            genesis={genesisHash}
            onAccountChange={setAccount}
            onNextStep={_onNextStep}
            type={type}
          />
        )}
        {step === 2 && (
          <AccountNamePasswordCreation
            address={account?.address}
            buttonLabel={t<string>('Import')}
            genesisHash={genesisHash}
            isBusy={isBusy}
            isImporting
            onBackClick={_onPreviousStep}
            onCreate={_onCreate}
            setGenesis={_onChangeNetwork}
          />
        )}
        {step === 3 && <Success text={t('New account has been imported successfully!')} />}
      </StyledScrollWrapper>
    </>
  );
}

const StyledScrollWrapper = styled(ScrollWrapper)`
  ${BottomWrapper} {
    margin-inline: -16px;
    padding-inline: 16px;
  }
`;

export default ImportSeed;
