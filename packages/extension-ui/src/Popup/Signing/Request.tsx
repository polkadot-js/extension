// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign } from '@polkadot/extension/background/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';

import React from 'react';

import { ActionBar, Address } from '../../components';
import { cancelRequest } from '../../messaging';
import Details from './Details';
import Unlock from './Unlock';

type Props = {
  accounts: Array<KeyringJson>,
  className?: string,
  isFirst: boolean,
  onAction: () => void,
  request: MessageExtrinsicSign,
  signId: number,
  url: string
};

export default function Request ({ accounts, isFirst, onAction, request: { address, method, nonce }, signId, url }: Props) {
  const account = accounts.find((account) => address === account.address);

  const _onCancel = (): void => {
    cancelRequest(signId)
      .then(onAction)
      .catch(console.error);
  };

  return (
    <Address
      address={address}
      name={account && account.meta.name}
    >
      <Details
        method={method}
        nonce={nonce}
        url={url}
      />
      <ActionBar>
        <a onClick={_onCancel}>Cancel</a>
      </ActionBar>
      <Unlock
        isVisible={isFirst}
        onAction={onAction}
        signId={signId}
      />
    </Address>
  );
}
