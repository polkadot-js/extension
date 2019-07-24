// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageAuthorize } from '@polkadot/extension/background/types';
import { OnActionFromCtx } from '../../components/types';

import React from 'react';
import styled from 'styled-components';

import { ActionBar, Button, Icon, IconBox, Link, Tip, defaults, withOnAction } from '../../components';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';

interface Props {
  authId: string;
  className?: string;
  isFirst: boolean;
  onAction: OnActionFromCtx;
  request: MessageAuthorize['payload'];
  url: string;
}

function Request ({ authId, className, isFirst, onAction, request: { origin }, url }: Props): React.ReactElement<Props> {
  const onApprove = (): Promise<void> =>
    approveAuthRequest(authId)
      .then((): void => onAction())
      .catch(console.error);
  const onReject = (): Promise<void> =>
    rejectAuthRequest(authId)
      .then((): void => onAction())
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
        <div className='tab-info'>An application, self-identifying as <span className='tab-name'>{origin}</span> is requesting access from <span className='tab-url'>{url}</span>.</div>
      }
    >
      <ActionBar>
        <Link isDanger onClick={onReject}>Reject</Link>
      </ActionBar>
      {isFirst && (
        <>
          <Tip header='access' type='warn'>Only approve this request if you trust the application. Approving gives the application access to the addresses of your accounts.</Tip>
          <Button
            label='Yes, allow this application access'
            onClick={onApprove}
          />
        </>
      )}
    </IconBox>
  );
}

export default withOnAction(styled(Request)`
  .icon {
    background: ${defaults.btnBgDanger};
    color: ${defaults.btnColorDanger};
  }

  .tab-info {
    overflow: hidden;
  }

  .tab-name,
  .tab-url {
    color: ${defaults.linkColor};
    display: inline-block;
    max-width: 20rem;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: top;
  }
`);
