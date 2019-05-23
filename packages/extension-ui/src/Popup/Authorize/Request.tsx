// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageAuthorize } from '@polkadot/extension/background/types';
import { OnActionFromCtx } from '../../components/types';

import React from 'react';
import styled from 'styled-components';

import { ActionBar, Box, Button, defaults, withOnAction } from '../../components';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';

type Props = {
  authId: number,
  className?: string,
  isFirst: boolean,
  onAction: OnActionFromCtx,
  request: MessageAuthorize,
  url: string
};

function Request ({ authId, className, isFirst, onAction, request: { origin }, url }: Props) {
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
    <Box className={className}>
      <div>The application, identified as <div className='tab-name'>{origin}</div> is requesting access from <div className='tab-url'>{url}</div> to the accounts and signing capabilities of this extension. Only approve the request if you trust the application.</div>
      <ActionBar>
        <a href='#' onClick={onReject}>Reject</a>
      </ActionBar>
      {isFirst && (<Button
        label='Yes, allow this application access'
        onClick={onApprove}
      />)}
    </Box>
  );
}

export default withOnAction(styled(Request)`
  .tab-name,
  .tab-url {
    color: ${defaults.linkColor};
    display: inline-block;
  }
`);
