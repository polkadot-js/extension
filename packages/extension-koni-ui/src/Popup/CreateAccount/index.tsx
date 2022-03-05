// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import LoadingContainer from '@polkadot/extension-koni-ui/components/LoadingContainer';
import HeaderWithSteps from '@polkadot/extension-koni-ui/partials/HeaderWithSteps';
import { getGenesisOptionsByAddressType } from '@polkadot/extension-koni-ui/util';
import { KeypairType } from '@polkadot/util-crypto/types';

import { AccountContext, AccountNamePasswordCreation, ActionContext, Dropdown } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuriV2, createSeedV2, validateSeedV2 } from '../../messaging';
import Mnemonic from './Mnemonic';

interface Props {
  className?: string;
  defaultClassName?: string;
}

export const SUBSTRATE_ACCOUNT_TYPE: KeypairType = 'sr25519';
export const EVM_ACCOUNT_TYPE: KeypairType = 'ethereum';

function CreateAccount ({ className, defaultClassName }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  // @ts-ignore
  const [keyTypes, setKeyTypes] = useState<Array<KeypairType>>([SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE]);
  const [address, setAddress] = useState<null | string>(null);
  const [evmAddress, setEvmAddress] = useState<null | string>(null);
  const [seed, setSeed] = useState<null | string>(null);
  const { accounts } = useContext(AccountContext);
  const accountsWithoutAll = accounts.filter((acc: { address: string; }) => acc.address !== 'ALL');
  const name = `Account ${accountsWithoutAll.length + 1}`;
  const options = getGenesisOptionsByAddressType(null, accounts, useGenesisHashOptions());
  const [genesisHash, setGenesis] = useState('');
  // @ts-ignore
  const chain = useMetadata(genesisHash, true);
  const networkRef = useRef(null);
  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';

  if (isFirefox || isLinux) {
    window.localStorage.setItem('popupNavigation', '');
  }

  useEffect((): void => {
    createSeedV2(undefined, undefined, keyTypes)
      .then((response): void => {
        // @ts-ignore
        setAddress(response.addressMap[SUBSTRATE_ACCOUNT_TYPE]);
        setEvmAddress(response.addressMap[EVM_ACCOUNT_TYPE]);
        setSeed(response.seed);
      })
      .catch(console.error);
  }, [keyTypes]);

  useEffect((): void => {
    if (seed) {
      validateSeedV2(seed, keyTypes)
        .then(({ addressMap, seed }) => {
          setAddress(addressMap[SUBSTRATE_ACCOUNT_TYPE]);
          setEvmAddress(addressMap[EVM_ACCOUNT_TYPE]);
        })
        .catch(console.error);
    }
  }, [keyTypes, seed]);

  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && seed) {
        setIsBusy(true);
        createAccountSuriV2(name, password, seed, [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE], genesisHash)
          .then((response) => {
            window.localStorage.setItem('popupNavigation', '/');
            onAction('/');
          })
          .catch((error: Error): void => {
            setIsBusy(false);
            console.error(error);
          });
      }
    },
    [genesisHash, onAction, seed]
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
                evmAddress={evmAddress}
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
                  name={name}
                  onCreate={_onCreate}
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
