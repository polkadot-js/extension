// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign } from '@polkadot/extension/background/types';

import React from 'react';

import { ActionBar, Address } from '../../components';
import { ActionContext } from '../../components/contexts';
import { cancelRequest } from '../../messaging';
import Details from './Details';
import Unlock from './Unlock';

type Props = {
  className?: string,
  isFirst: boolean,
  request: MessageExtrinsicSign,
  signId: number,
  url: string
};

export default function Request ({ isFirst, request: { address, method, nonce }, signId, url }: Props) {
  return (
    <ActionContext.Consumer>
      {(onAction) => {
        const onCancel = (): void => {
          cancelRequest(signId)
            .then(() => onAction())
            .catch(console.error);
        };

        return (
          <Address address={address}>
            <Details
              method={method}
              nonce={nonce}
              url={url}
            />
            <ActionBar>
              <a href='#' onClick={onCancel}>Cancel</a>
            </ActionBar>
            <Unlock
              isVisible={isFirst}
              signId={signId}
            />
          </Address>
        );
      }}
    </ActionContext.Consumer>
  );
}
