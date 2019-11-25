// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { RequestAuthorizeTab } from '@polkadot/extension/background/types';

import React, { useContext } from 'react';
import styled from 'styled-components';

import { ActionBar, ActionContext, Button, Icon, Link, Warning } from '../../components';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';

interface Props {
  authId: string;
  className?: string;
  isFirst: boolean;
  request: RequestAuthorizeTab;
  url: string;
}

function Request ({ authId, className, isFirst, request: { origin }, url }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const _onApprove = (): Promise<void> =>
    approveAuthRequest(authId)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));
  const _onReject = (): Promise<void> =>
    rejectAuthRequest(authId)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));

  return (
    <div className={className}>
      <RequestInfo>
        <Info>
          <Icon icon='X' onClick={_onReject} />
          <div className='tab-info'>
            An application, self-identifying as <span className='tab-name'>{origin}</span> is requesting access from{' '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className='tab-url'>{url}</span>
            </a>.
          </div>
        </Info>
        {isFirst && (
          <>
            <RequestWarning>Only approve this request if you trust the application. Approving gives the application access to the addresses of your accounts.</RequestWarning>
            <AcceptButton onClick={_onApprove}>Yes, allow this application access</AcceptButton>
          </>
        )}
        <RejectButton>
          <Link isDanger onClick={_onReject}>Reject</Link>
        </RejectButton>
      </RequestInfo>
    </div>
  );
}

const RequestInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  background: ${({ theme }): string => theme.highlightedAreaBackground};
`;

const Info = styled.div`
  display: flex;
  flex-direction: row;
`;

const AcceptButton = styled(Button)`
  width: 90%;
  margin: 25px auto 0;
`;

const RequestWarning = styled(Warning)`
  margin: 24px 24px 0 1.45rem;
`;

AcceptButton.displayName = 'AcceptButton';

const RejectButton = styled(ActionBar)`
  margin: 8px 0 15px 0;
  text-decoration: underline;
`;

export default styled(Request)`
  height: 100%;

  .icon {
    background: ${({ theme }): string => theme.buttonBackgroundDanger};
    color: ${({ theme }): string => theme.textColor};
    min-width: 18px;
    width: 18px;
    height: 18px;
    font-size: 14px;
    line-height: 20px;
    margin: 24px 15px 0 1.35rem;
  }

  .tab-info {
    overflow: hidden;
    margin: 0.75rem 0 0 0;
  }

  .tab-name,
  .tab-url {
    color: ${({ theme }): string => theme.textColor};
    display: inline-block;
    max-width: 20rem;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: top;
    cursor: pointer;
    text-decoration: underline;
  }
`;
