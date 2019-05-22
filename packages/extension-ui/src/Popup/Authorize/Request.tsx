// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageAuthorize } from '@polkadot/extension/background/types';
import { OnActionFromCtx } from '../../components/types';

import React from 'react';

import { Box, Button, withOnAction } from '../../components';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';

type Props = {
  authId: number,
  onAction: OnActionFromCtx,
  request: MessageAuthorize,
  url: string
};

function Request ({ authId, onAction, request: { origin }, url }: Props) {
  const onApprove = (): Promise<void> =>
    approveAuthRequest(authId)
      .then(() => onAction())
      .catch(console.error);
  const onReject = (): void => {
    rejectAuthRequest(authId)
      .then(() => onAction())
      .catch(console.error);
  };

  return (
    <Box>
      The application, identified as {origin} is requesting access from {url} to the accounts and signing capabilities of this extension. Only approve the request if you trust the applucation.
      <Button
        label='Yes, allow this application access'
        onClick={onApprove}
      />
      <Button
        isDanger
        label='Reject access from this application'
        onClick={onReject}
      />
    </Box>
  );
}

export default withOnAction(Request);
