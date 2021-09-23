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
import CreateEthDerivationPath from './CreateEthDerivationPath';
import Mnemonic from './Mnemonic';

interface Props {
  className?: string;
}

const ETHEREUM_CHAIN_NAMES = ['Moonbase Alpha', 'Moonriver'];
console.log('669')
function CreateAccount ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [name, setName] = useState('');
  const [ethDerivePath, setEthDerivePath] = useState("m/44'/60'/0'/0/0");
  const options = useGenesisHashOptions();
  const [genesisHash, setGenesis] = useState('');

  useEffect((): void => {
    console.log("TYPE",type)
    console.log("ethDerivePath",ethDerivePath)
    createSeed(undefined, type,ethDerivePath)
      .then(setAccount)
      .catch((error: Error) => console.error(error));
  }, [type,ethDerivePath]);

  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && account) {
        setIsBusy(true);
        console.log("account.seed",account.seed)
        // const suri=type==="ethereum"?account.seed+ethDerivePath:account.seed
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

  const _onChangeNetwork = useCallback((newGenesisHash: string) => {
    console.log('newGenesisHash', newGenesisHash);
    const chain = options.find(({ value }) => {
      return newGenesisHash === value;
    });

    // if chain has chain type ethereum or is in nbackup eth list, set type to eth
    console.log('opt1',(chain?.chainType === 'ethereum' || (chain && ETHEREUM_CHAIN_NAMES.includes(chain?.text))))
    console.log('opt2',type==="ethereum" )
    const currentType=type
    console.log('type ',currentType)
    if (chain?.chainType === 'ethereum' || (chain && ETHEREUM_CHAIN_NAMES.includes(chain?.text))) {
      setType('ethereum');
      // if type was set to type but new chain isnt, revert to sr25519
    } else if (type==="ethereum"){
      setType(DEFAULT_TYPE)
    } 

    setGenesis(newGenesisHash);
  }, [options, type]);

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
            ? (<>
              <Dropdown
                className={className}
                label={t<string>('Network')}
                onChange={_onChangeNetwork}
                options={options}
                value={genesisHash}
              />
              {type==="ethereum"?<CreateEthDerivationPath derivePath={ethDerivePath} onChange={setEthDerivePath}  />:null}
              <Mnemonic
                onNextStep={_onNextStep}
                seed={account.seed}
              />
            </>
            )
            : (

              <AccountNamePasswordCreation
                buttonLabel={t<string>('Add the account with the generated seed')}
                isBusy={isBusy}
                onBackClick={_onPreviousStep}
                onCreate={_onCreate}
                onNameChange={setName}
              />
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
