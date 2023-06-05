// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import useToast from '@polkadot/extension-ui/hooks/useToast';

import { Loading, ScrollWrapper, Success } from '../../components';
import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation';
import { ALEPH_ZERO_GENESIS_HASH } from '../../constants';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri, createSeed, validateSeed } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import { DEFAULT_TYPE } from '../../util/defaultType';
import SafetyFirst from './SafetyFirst';
import SaveMnemonic from './SaveMnemonic';

function CreateAccount(): React.ReactElement {
  const { t } = useTranslation();
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<null | string>(null);
  const [seed, setSeed] = useState<null | string>(null);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [genesisHash, setGenesis] = useState(ALEPH_ZERO_GENESIS_HASH);
  const chain = useMetadata(genesisHash, true);
  const { show } = useToast();

  useEffect((): void => {
    createSeed(undefined)
      .then(({ address, seed }): void => {
        setAddress(address);
        setSeed(seed);
      })
      .catch(console.error);
  }, []);

  useEffect((): void => {
    if (seed) {
      const type = chain && chain.definition.chainType === 'ethereum' ? 'ethereum' : DEFAULT_TYPE;

      setType(type);
      validateSeed(seed, type)
        .then(({ address }) => setAddress(address))
        .catch(console.error);
    }
  }, [seed, chain]);

  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && seed) {
        setIsBusy(true);

        createAccountSuri(name, password, seed, type, genesisHash)
          .then(() => setStep((currentStep) => currentStep + 1))
          .catch((error: Error): void => {
            setIsBusy(false);
            show(t('Account creation was not successful.'), 'critical');
            console.error(error);
          });
      }
    },
    [genesisHash, seed, type, show, t]
  );

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);

  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);

  const isLastStep = step === 4;

  return (
    <ScrollWrapper>
      {isLastStep || (
        <HeaderWithSteps
          step={step}
          text={t<string>('Create an account')}
          total={3}
          withBackdrop
        />
      )}
      <Loading>
        {step === 1 && <StyledSafetyFirst onNextStep={_onNextStep} />}
        {seed && step === 2 && (
          <StyledSaveMnemonic
            onNextStep={_onNextStep}
            onPreviousStep={_onPreviousStep}
            seed={seed}
          />
        )}
        {seed && step === 3 && (
          <StyledAccountNamePasswordCreation
            address={address}
            buttonLabel={t<string>('Create')}
            genesisHash={genesisHash}
            isBusy={isBusy}
            onBackClick={_onPreviousStep}
            onCreate={_onCreate}
            setGenesis={setGenesis}
          />
        )}
        {step === 4 && <Success text={t('Account created successfully!')} />}
      </Loading>
    </ScrollWrapper>
  );
}

const StyledSafetyFirst = styled(SafetyFirst)`
  margin-block: auto;
`;

const StyledSaveMnemonic = styled(SaveMnemonic)`
  margin-top: 36px;
`;

const StyledAccountNamePasswordCreation = styled(AccountNamePasswordCreation)`
  margin-top: 36px;
`;

export default styled(CreateAccount)`
  label::after {
    right: 36px;
  }
`;
