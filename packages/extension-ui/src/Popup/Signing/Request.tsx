// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { RequestExtrinsicSign } from '@polkadot/extension/background/types';

import React, { useContext } from 'react';
import { createType } from '@polkadot/types';

import { ActionBar, ActionContext, Address, Link } from '../../components';
import { approveSignRequest, cancelSignRequest } from '../../messaging';
import Details from './Details';
import Unlock from './Unlock';

interface Props {
  isFirst: boolean;
  request: RequestExtrinsicSign;
  signId: string;
  url: string;
}

export default function Request ({ isFirst, request, signId, url }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const onCancel = (): Promise<void> =>
    cancelSignRequest(signId)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));
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
