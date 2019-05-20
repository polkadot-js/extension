// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign } from '@polkadot/extension/background/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';

import React from 'react';

import { Header } from '../../components';
import Request from './Request';

type Props = {
  accounts: Array<KeyringJson>,
  requests: Array<[number, MessageExtrinsicSign, string]>,
  onAction: () => void
};

export default function Signing ({ accounts, onAction, requests }: Props) {
  return (
    <div>
      <Header label='requests' />
      {requests.map(([id, request, url], index) => (
        <Request
          accounts={accounts}
          isFirst={index === 0}
          key={id}
          onAction={onAction}
          request={request}
          signId={id}
          url={url}
        />
      ))}
    </div>
  );
}
