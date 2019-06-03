// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageAuthorize } from '@polkadot/extension/background/types';
import { OnActionFromCtx } from '../../components/types';

import React from 'react';
import styled from 'styled-components';

import { ActionBar, Button, Icon, IconBox, Link, Tip, defaults, withOnAction } from '../../components';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';

type Props = {
  authId: string,
  className?: string,
  isFirst: boolean,
  onAction: OnActionFromCtx,
  request: MessageAuthorize,
  url: string
};

function Request ({ authId, className, isFirst, onAction, request: { origin }, url }: Props) {
  const onApprove = () =>
    approveAuthRequest(authId)
      .then(() => onAction())
      .catch(console.error);
  const onReject = () =>
    rejectAuthRequest(authId)
      .then(() => onAction())
      .catch(console.error);

  return (
    <IconBox
      className={className}
      icon={
        <Icon
          icon='X'
          onClick={onReject}
        />
      }
      intro={
        <div>An application, identified as <div className='tab-name'>{origin}</div> is requesting access from <div className='tab-url'>{url}</div>.</div>
      }
    >
      <ActionBar>
        <Link isDanger onClick={onReject}>Reject</Link>
      </ActionBar>
      <Tip header='access' type='warn'>Only approve this request if you trust the application. Approving gives the application access to the addresses of your accounts.</Tip>
      {isFirst && (
        <Button
          label='Yes, allow this application access'
          onClick={onApprove}
        />
      )}
    </IconBox>
  );
}

export default withOnAction(styled(Request)`
  .icon {
    background: ${defaults.btnBgDanger};
    color: ${defaults.btnColorDanger};
  }

  .tab-name,
  .tab-url {
    color: ${defaults.linkColor};
    display: inline-block;
  }
`);
