// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import LoadingContainer from '@polkadot/extension-koni-ui/components/LoadingContainer';
import HeaderWithSteps from '@polkadot/extension-koni-ui/partials/HeaderWithSteps';

import { AccountContext, AccountNamePasswordCreation, ActionContext, Dropdown } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuriV2, createSeed, validateSeed } from '../../messaging';
import { DEFAULT_TYPE } from '../../util/defaultType';
import Mnemonic from './Mnemonic';

interface Props {
  className?: string;
  defaultClassName?: string;
}

function CreateAccount ({ className, defaultClassName }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<null | string>(null);
  const [seed, setSeed] = useState<null | string>(null);
  const [type, setType] = useState(DEFAULT_TYPE);
  const { accounts } = useContext(AccountContext);
  const accountsWithoutAll = accounts.filter((acc: { address: string; }) => acc.address !== 'ALL');
  const name = `Account ${accountsWithoutAll.length + 1}`;
  const options = useGenesisHashOptions();
  const [genesisHash, setGenesis] = useState('');
  const chain = useMetadata(genesisHash, true);
  const networkRef = useRef(null);
  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';

  if (isFirefox || isLinux) {
    window.localStorage.setItem('popupNavigation', '');
  }

  useEffect((): void => {
    createSeed(undefined)
      .then(({ address, seed }): void => {
        setAddress(address);
        setSeed(seed);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect((): void => {
    if (seed) {
      const type = chain && chain.definition.chainType === 'ethereum'
        ? 'ethereum'
        : DEFAULT_TYPE;

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

        createAccountSuriV2(name, password, seed, type, genesisHash)
          .then(() => {
            window.localStorage.setItem('popupNavigation', '/');
            onAction('/');
          })
          .catch((error: Error): void => {
            setIsBusy(false);
            console.error(error);
          });
      }
    },
    [genesisHash, onAction, seed, type]
  );

  const _onNextStep = useCallback(
    () => setStep((step) => step + 1),
    []
  );

  const _onPreviousStep = useCallback(
    () => setStep((step) => step - 1),
    []
  );

  const _onChangeNetwork = useCallback(
    (newGenesisHash: string) => setGenesis(newGenesisHash),
    []
  );

  return (
    <>
      <HeaderWithSteps
        isBusy={isBusy}
        onBackClick={_onPreviousStep}
        step={step}
        text={t<string>('Create an account')}
      />
      <LoadingContainer>
        {seed && (
          step === 1
            ? (
              <Mnemonic
                address={address}
                genesisHash={genesisHash}
                name={name}
                onNextStep={_onNextStep}
                seed={seed}
              />
            )
            : (
              <>
                <AccountNamePasswordCreation
                  address={address}
                  buttonLabel={t<string>('Add the account with the generated seed')}
                  genesis={genesisHash}
                  isBusy={isBusy}
                  onCreate={_onCreate}
                  name={name}
                >
                  <Dropdown
                    className='create-account-network-select'
                    label={t<string>('Network')}
                    onChange={_onChangeNetwork}
                    options={options}
                    reference={networkRef}
                    value={genesisHash}
                  />
                </AccountNamePasswordCreation>
              </>
            )
        )}
      </LoadingContainer>
    </>
  );
}

export default styled(CreateAccount)`
  margin-bottom: 16px;

  .create-account-network-select {
    font-weight: 500;
  }

  .create-account-network-dropdown {
    margin-bottom: 10px;
  }

  label::after {
    right: 36px;
  }
`;
