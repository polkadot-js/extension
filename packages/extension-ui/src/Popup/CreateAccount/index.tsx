// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Address, Dropdown, Loading } from '../../components';
import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri, createSeed } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import { DEFAULT_TYPE } from '../../util/defaultType';
import Mnemonic from './Mnemonic';

interface Props {
  className?: string;
}

function CreateAccount ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [name, setName] = useState('');
  const options = useGenesisHashOptions();
  const [genesisHash, setGenesis] = useState('');

  function getChainName (genesisHash: string): string {
    const filtered = options.filter(({ value }) => {
      return genesisHash === value;
    });

    return filtered.length > 0 ? filtered[0].text : '';
  }

  useEffect((): void => {
    createSeed(undefined, type)
      .then(setAccount)
      .catch((error: Error) => console.error(error));
  }, [type]);

  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && account) {
        setIsBusy(true);

        createAccountSuri(name, password, account.seed, type, genesisHash)
          .then(() => onAction('/'))
          .catch((error: Error): void => {
            setIsBusy(false);
            console.error(error);
          });
      }
    },
    [account, genesisHash, onAction, type]
  );

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);
  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);

  return (
    <>
      <HeaderWithSteps
        step={step}
        text={t<string>('Create an account')}
      />
      <Loading>
        <div>
          <Address
            address={account?.address}
            genesisHash={genesisHash}
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
              <>
                <Dropdown
                  className={className}
                  label={t<string>('Network')}
                  onChange={(newGenesisHash: string) => {
                    if (getChainName(newGenesisHash) === 'Moonbase Alpha') { // TODO: use list
                      setType('ethereum');
                    }

                    setGenesis(newGenesisHash);
                  }}
                  options={options}
                  value={genesisHash}
                />
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
