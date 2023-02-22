// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SigningRequest } from '@subwallet/extension-base/services/request-service/types';
import { approveSignPasswordV2, keyringChangeMasterPassword, keyringMigrateMasterPassword, keyringUnlock, makeTransfer } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Button } from '@subwallet/react-ui';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

/* eslint-disable no-void */

const createMasterPassword = () => {
  void keyringChangeMasterPassword({ newPassword: '100299', createNew: true }).then(console.log);
};

const migrate = () => {
  void keyringMigrateMasterPassword({ password: '123123', address: '5CXCbp6HeFDGeNZpgP6LmQdxxGaM7DosN9bNmVj72nQ3hU3G' }).then(console.log);
};

const unlock = () => {
  void keyringUnlock({ password: '100299' }).then(console.log);
};

const signTransaction = (request?: SigningRequest) => {
  return () => {
    if (request) {
      void approveSignPasswordV2({ id: request.id }).then(console.log);
    }
  };
};

const sendFund = () => {
  void makeTransfer({
    from: '5CXCbp6HeFDGeNZpgP6LmQdxxGaM7DosN9bNmVj72nQ3hU3G',
    networkKey: 'polkadot',
    to: '5EhSb8uHkbPRF869wynQ4gh5V7B62YgkEQvMdk6tzHD9bK7b',
    tokenSlug: 'polkadot-NATIVE-DOT',
    value: '1000000000000'
  }, console.log);
};

const _SendFund: React.FC = () => {
  const requests = useSelector((state: RootState) => state.requestState.signingRequest);
  const request = requests[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Button onClick={createMasterPassword}>Create Password</Button>
      <Button onClick={migrate}>Migrate</Button>
      <Button onClick={unlock}>Unlock</Button>
      <Button onClick={sendFund}>Send</Button>
      <Button onClick={signTransaction(request)}>Sign</Button>
    </div>
  );
};

const SendFund = styled(_SendFund)(({ theme }) => {
  return ({

  });
});

export default SendFund;
