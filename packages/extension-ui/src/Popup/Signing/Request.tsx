// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { RequestExtrinsicSign } from '@polkadot/extension/background/types';
import { OnActionFromCtx } from '../../components/types';

import React from 'react';
import { createType } from '@polkadot/types';

import { ActionBar, Address, Link, withOnAction } from '../../components';
import { approveSignRequest, cancelSignRequest } from '../../messaging';
import Details from './Details';
import Unlock from './Unlock';

interface Props {
  isFirst: boolean;
  onAction: OnActionFromCtx;
  request: RequestExtrinsicSign;
  signId: string;
  url: string;
}

function Request ({ isFirst, onAction, request, signId, url }: Props): React.ReactElement<Props> {
  const onCancel = (): Promise<void> =>
    cancelSignRequest(signId)
      .then((): void => onAction())
      .catch(console.error);
  const onSign = (password: string): Promise<void> =>
    approveSignRequest(signId, password)
      .then((): void => onAction());
  const blockNumber = createType('BlockNumber', request.blockNumber);
  const payload = createType('ExtrinsicPayload', request, { version: request.version });

  return (
    <Address address={request.address}>
      <Details
        blockNumber={blockNumber}
        genesisHash={request.genesisHash}
        isDecoded={isFirst}
        method={request.method}
        payload={payload}
        url={url}
      />
      <ActionBar>
        <Link isDanger onClick={onCancel}>Cancel</Link>
      </ActionBar>
      {isFirst && <Unlock onSign={onSign} />}
    </Address>
  );
}

export default withOnAction(Request);
