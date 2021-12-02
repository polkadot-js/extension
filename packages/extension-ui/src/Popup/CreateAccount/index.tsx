// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Address, Dropdown, Loading } from '../../components';
import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri, createSeed, validateSeed } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import { DEFAULT_TYPE } from '../../util/defaultType';
import CreateEthDerivationPath from './CreateEthDerivationPath';
import Mnemonic from './Mnemonic';

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
  const [ethDerivePath, setEthDerivePath] = useState<string>("m/44'/60'/0'/0/0");
  const options = useGenesisHashOptions();
  const [genesisHash, setGenesis] = useState('');
  const chain = useMetadata(genesisHash, true);

  useEffect((): void => {
    createSeed(undefined, type, ethDerivePath)
      .then(({ address, seed }): void => {
        setAddress(address);
        setSeed(seed);
      })
      .catch(console.error);
  }, [type, ethDerivePath]);

  useEffect((): void => {
    console.log("CHAIN ",chain)
    console.log(JSON.stringify(chain,null,2))
    if (seed) {
      // const chain = useMetadata(genesisHash, true);
      const type = chain && chain.definition.chainType === 'ethereum'
        ? 'ethereum'
        : DEFAULT_TYPE;
        console.log(" set tupeTYPE")

      setType(type);
      validateSeed(seed, type, ethDerivePath)
        .then(({ address }) => setAddress(address))
        .catch(console.error);
    }
  }, [seed, chain, ethDerivePath]);

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
    (newGenesisHash: string) => {console.log("_onChangeNetwork",newGenesisHash)
      setGenesis(newGenesisHash)},
    []
  );

  return (
    <>
      <HeaderWithSteps
        step={step}
        text={t<string>('Create an account')}
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
            ? (<>
              <Dropdown
                className={className}
                label={t<string>('Network')}
                onChange={_onChangeNetwork}
                options={options}
                value={genesisHash}
              />
              {type === 'ethereum'
                ? <CreateEthDerivationPath
                  derivePath={ethDerivePath}
                  onChange={setEthDerivePath}
                />
                : null}
              <Mnemonic
                onNextStep={_onNextStep}
                seed={seed}
              />
            </>
            )
            : (
              <>
                <AccountNamePasswordCreation
                  buttonLabel={t<string>('Add the account with the generated seed')}
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

export default styled(CreateAccount)`
  margin-bottom: 16px;

  label::after {
    right: 36px;
  }
`;
