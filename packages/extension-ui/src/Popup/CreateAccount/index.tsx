// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ActionContext, Header, Loading, ActionText } from '../../components';
import { createAccountSuri, createSeed } from '../../messaging';
import { KeypairType } from '@polkadot/util-crypto/types';
import Mnemonic from './Mnemonic';
import AccountCredentials from './AccountCredentials';

export default function CreateAccount (): React.ReactElement {
  const onAction = useContext(ActionContext);
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);

  useEffect((): void => {
    createSeed()
      .then(setAccount)
      .catch((error: Error) => console.error(error));
  }, []);

  // FIXME Duplicated between here and Import.tsx
  const _onCreate = (name: string, password: string, suri: string, type?: KeypairType): void => {
    if (name && password && suri) {
      createAccountSuri(name, password, suri, type)
        .then((): void => onAction('/'))
        .catch((error: Error) => console.error(error));
    }
  };

  const _onNextStep = (): void => setStep(step + 1);

  const _onCancel = (): void => {
    if (step === 2) {
      setStep(step - 1);
    } else {
      onAction('/');
    }
  };

  return (
    <>
      <Header text={'Create an account '}>
        <CreationSteps>
          <div>
            <CurrentStep>{step}</CurrentStep>
            <TotalSteps>/2</TotalSteps>
          </div>
          <ActionText text={step === 1 ? 'Cancel' : 'Back'} onClick={_onCancel} />
        </CreationSteps>
      </Header>
      <Loading>{account && (step === 1 ? (
        <Mnemonic seed={account.seed} onNextStep={_onNextStep} />
      ) : (
        <AccountCredentials seed={account.seed} onCreate={_onCreate} />
      ))}</Loading>
    </>
  );
}

const CreationSteps = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  padding-right: 24px;
  margin-top: 3px;
`;

const CurrentStep = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.primaryColor};
  font-weight: 800;
  margin-left: 10px;
`;

const TotalSteps = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.textColor};
  font-weight: 800;
`;
