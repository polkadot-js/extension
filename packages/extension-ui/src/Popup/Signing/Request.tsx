// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign } from '@polkadot/extension/background/types';
import { OnActionFromCtx } from '../../components/types';

import React, { useState } from 'react';
import { createType } from '@polkadot/types';

import { ActionBar, Address, Button, Link, withOnAction } from '../../components';
import { approveSignRequest, cancelSignRequest } from '../../messaging';
import Details from './Details';
import Qr from './Qr';
import Unlock from './Unlock';

interface Props {
  isExternal: boolean;
  isFirst: boolean;
  onAction: OnActionFromCtx;
  request: MessageExtrinsicSign;
  signId: string;
  url: string;
}

function Request ({ isExternal, isFirst, onAction, request, signId, url }: Props): React.ReactElement<Props> {
  const [showQr, setShowQr] = useState(false);
  const payload = createType('ExtrinsicPayload', request, { version: request.version });

  const onCancel = (): Promise<void> =>
    cancelSignRequest(signId)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));
  const onSign = (password: string): Promise<void> =>
    approveSignRequest(signId, password)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));
  const onShowQr = (): void => setShowQr(true);
  const onSignature = (signature: string): void => {
    console.error(signature);
  };
  const action = (
    <ActionBar>
      <Link isDanger onClick={onCancel}>Cancel</Link>
    </ActionBar>
  );

  return (
    showQr
      ? <Qr
        payload={payload}
        request={request}
        onSignature={onSignature}
      >
        {action}
      </Qr>
      : <Address address={request.address}>
        <Details
          isDecoded={isFirst}
          payload={payload}
          request={request}
          url={url}
        />
        {action}
        {isFirst && (
          isExternal
            ? <Button
              label='Display QR to external signer'
              onClick={onShowQr}
            />
            : <Unlock onSign={onSign} />
        )}
      </Address>
  );
}

export default withOnAction(Request);
