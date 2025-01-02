// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from '@polkadot/util/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';

import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation.js';
import { ActionContext, Address, Dropdown, Loading } from '../../components/index.js';
import { useGenesisHashOptions, useMetadata, useTranslation } from '../../hooks/index.js';
import { createAccountSuri, createSeed, validateSeed } from '../../messaging.js';
import { HeaderWithSteps } from '../../partials/index.js';
import { styled } from '../../styled.js';
import { DEFAULT_TYPE } from '../../util/defaultType.js';
import Mnemonic from './Mnemonic.js';

interface Props {
  className?: string;
}

function CreateAccount ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<null | string>(null);
  const [seed, setSeed] = useState<null | string>(null);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [name, setName] = useState('');
  const options = useGenesisHashOptions();
  const [genesisHash, setGenesis] = useState<HexString | null>(null);
  const chain = useMetadata(genesisHash, true);

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

        createAccountSuri(name, password, seed, type, genesisHash)
          .then(() => onAction('/'))
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
    (newGenesisHash: HexString) => setGenesis(newGenesisHash),
    []
  );

  return (
    <>
      <HeaderWithSteps
        step={step}
        text={t('Create an account')}
      />
      <Loading>
        <div>
          <Address
            address={address}
            genesisHash={genesisHash}
            name={name}
          />
        </div>
        {seed && (
          step === 1
            ? (
              <Mnemonic
                onNextStep={_onNextStep}
                seed={seed}
              />
            )
            : (
              <>
                <Dropdown
                  className={className}
                  label={t('Network')}
                  onChange={_onChangeNetwork}
                  options={options}
                  value={genesisHash}
                />
                <AccountNamePasswordCreation
                  buttonLabel={t('Add the account with the generated seed')}
                  isBusy={isBusy}
                  onBackClick={_onPreviousStep}
                  onCreate={_onCreate}
                  onNameChange={setName}
                />
              </>
            )
        )}
      </Loading>
    </>
  );
}

export default styled(CreateAccount)<Props>`
  margin-bottom: 16px;

  label::after {
    right: 36px;
  }
`;
