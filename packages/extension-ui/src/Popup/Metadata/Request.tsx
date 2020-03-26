// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MetadataDef } from '@polkadot/extension-inject/types';

import React, { useContext } from 'react';
import styled from 'styled-components';

import { ActionBar, ActionContext, Button, Link, Table, Warning } from '../../components';
import useMetadata from '../../hooks/useMetadata';
import { approveMetaRequest, rejectMetaRequest } from '../../messaging';
interface Props {
  className?: string;
  request: MetadataDef;
  metaId: string;
  url: string;
}

function Request ({ className, metaId, request, url }: Props): React.ReactElement<Props> {
  const chain = useMetadata(request.genesisHash);
  const onAction = useContext(ActionContext);
  const _onApprove = (): Promise<void> =>
    approveMetaRequest(metaId)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));
  const _onReject = (): Promise<void> =>
    rejectMetaRequest(metaId)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));

  return (
    <div className={className}>
      <Table>
        <tr>
          <td className='label'>from</td>
          <td className='data'>{url}</td>
        </tr>
        <tr>
          <td className='label'>chain</td>
          <td className='data'>{request.chain}</td>
        </tr>
        <tr>
          <td className='label'>icon</td>
          <td className='data'>{request.icon}</td>
        </tr>
        <tr>
          <td className='label'>decimals</td>
          <td className='data'>{request.tokenDecimals}</td>
        </tr>
        <tr>
          <td className='label'>symbol</td>
          <td className='data'>{request.tokenSymbol}</td>
        </tr>
        <tr>
          <td className='label'>upgrade</td>
          <td className='data'>{chain ? chain.specVersion : 'unknown'} -&gt; {request.specVersion}</td>
        </tr>
      </Table>
      <RequestInfo>
        <RequestWarning>This approval will add the metadata to your extension instance, allowing future requests to be decoded using this metadata.</RequestWarning>
        <AcceptButton onClick={_onApprove}>Yes, do this metadata update</AcceptButton>
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
  .icon {
    background: ${({ theme }): string => theme.buttonBackgroundDanger};
    color: white;
    min-width: 18px;
    width: 14px;
    height: 18px;
    font-size: 10px;
    line-height: 20px;
    margin: 16px 15px 0 1.35rem;
    font-weight: 800;
    padding-left: 0.5px;
  }

  .tab-info {
    overflow: hidden;
    margin: 0.75rem 20px 0 0;
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
